/**
 * File-level removal of one session's durable storage under the dsh home.
 *
 * The gateway exposes no session.delete, so the bridge performs the removal
 * itself: this module archives the session under exclusive write ownership,
 * then removes its durable data while retaining the kernel lock's pathname.
 * Session ids are validated against the persisted shape, only data within
 * exact-name directories two levels below the sessions root is removed, and
 * running sessions are refused before anything touches the disk.
 *
 * @module @yuxianglin/dsh-bridge-browser/src/session-purge
 */

import { lstat, readdir, rm } from 'node:fs/promises'
import path from 'node:path'

/** Stable failure codes surfaced to the panel. Open set: callers must tolerate growth. */
export type SessionPurgeErrorCode = 'not-found' | 'running' | 'invalid-id' | 'internal'

/** Error thrown by {@link purgeSessionFiles}; the server turns it into a wire error. */
export class SessionPurgeError extends Error {
  constructor(
    readonly code: SessionPurgeErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'SessionPurgeError'
  }
}

/** Persisted session ids are `session-` plus one lowercase UUID. */
const SESSION_ID_PATTERN = /^session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u
/** POSIX flock is attached to this inode; unlinking it defeats exclusion. */
const SESSION_LOCK_FILENAME = 'session.lock'

/** Dependencies purging needs from the plugin. */
export interface SessionPurgeDeps {
  /** The dsh sessions root (`dshHomePath('sessions')`). */
  sessionsRoot: string
  /** Session ids currently running; purging any of these is refused. */
  runningSessionIds: ReadonlySet<string>
  /**
   * Claim the runtime's exclusive write ownership (including its kernel lock).
   * The returned handle must remain held until removal finishes. Opening a
   * read handle, checking for a lock file, or checking only Agent status does
   * not provide exclusion: idle Agents and other processes can own the log.
   */
  acquireOwnership(sessionId: string): Promise<{ close(): Promise<void> }>
  /** 归档后返回恢复原有归档状态的操作，供清理失败时使用。 */
  archiveSession(sessionId: string): Promise<void | (() => Promise<void>)>
  /** 等待宿主完成归档触发的 worktree 清理，再移除会话日志。 */
  waitForArchiveCleanup?(sessionId: string): Promise<void>
}

/**
 * Validate one session id against the persisted shape. Rejects everything
 * that could escape the sessions root (separators, dot segments) before any
 * filesystem call sees it.
 * @param sessionId - untrusted id from the panel.
 * @returns the id when well-formed.
 * @throws SessionPurgeError with code `invalid-id` otherwise.
 */
export function assertPurgeableSessionId(sessionId: string): string {
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    throw new SessionPurgeError('invalid-id', `session id "${sessionId}" does not match the persisted shape`)
  }
  return sessionId
}

/**
 * Permanently delete a session's data, keeping its directory and lock inode.
 * The runtime refuses ambiguous duplicate session identities across workspaces.
 * @param deps - root and running-set inputs.
 * @param sessionId - validated session id.
 * @returns nothing; throws {@link SessionPurgeError} on refusal or failure.
 */
export async function purgeSessionFiles(deps: SessionPurgeDeps, sessionId: string): Promise<void> {
  assertPurgeableSessionId(sessionId)
  if (deps.runningSessionIds.has(sessionId)) {
    throw new SessionPurgeError('running', 'refusing to purge a running session; cancel it first')
  }

  let workspaces: string[]
  try {
    workspaces = await readdir(deps.sessionsRoot, { withFileTypes: true })
      .then((entries) => entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name))
  } catch (error: unknown) {
    throw new SessionPurgeError('internal', `could not read the sessions root "${deps.sessionsRoot}": ${String(error)}`)
  }

  const targets: string[] = []
  for (const workspace of workspaces) {
    // path.join is safe here: the id pattern above excludes separators and
    // dot segments, so the joined segment cannot escape the workspace dir.
    const candidate = path.join(deps.sessionsRoot, workspace, sessionId)
    try {
      if (!(await lstat(candidate)).isDirectory()) continue
      const entries = await readdir(candidate)
      if (entries.some(entry => entry !== SESSION_LOCK_FILENAME)) targets.push(candidate)
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new SessionPurgeError('internal', `could not inspect "${candidate}": ${String(error)}`, { cause: error })
      }
    }
  }

  if (targets.length === 0) {
    throw new SessionPurgeError('not-found', `no durable storage found for session "${sessionId}"`)
  }
  let ownership: { close(): Promise<void> }
  try {
    ownership = await deps.acquireOwnership(sessionId)
  } catch (error: unknown) {
    // Match the public error identity across independently loaded runtime
    // copies without depending on a private JSONL lock implementation.
    if (error instanceof Error && error.name === 'SessionAlreadyOwnedError') {
      throw new SessionPurgeError(
        'running',
        'session is still owned by a runtime; release the session or restart that runtime, then retry deletion',
      )
    }
    throw new SessionPurgeError('internal', `could not acquire exclusive session ownership: ${String(error)}`)
  }
  let failure: unknown
  let archived = false
  let restoreArchive: void | (() => Promise<void>) = undefined
  let removing = false
  try {
    // The public archive API checks existence. Calling it after deletion
    // succeeds only accidentally when its header cache already knows this id.
    restoreArchive = await deps.archiveSession(sessionId)
    archived = true
    await deps.waitForArchiveCleanup?.(sessionId)
    removing = true
    for (const target of targets) {
      if (!(await lstat(target)).isDirectory()) throw new Error(`session directory changed: ${target}`)
      // Re-scan after write-open: opening an old log may materialize V3.
      for (const entry of await readdir(target)) {
        if (entry === SESSION_LOCK_FILENAME) continue
        await rm(path.join(target, entry), { recursive: true, force: true })
      }
    }
  } catch (error: unknown) {
    let cause = error
    if (!removing && restoreArchive !== undefined) {
      try {
        await restoreArchive()
        archived = false
      } catch (restoreError: unknown) {
        cause = new AggregateError([error, restoreError], 'worktree cleanup and archive restoration failed')
      }
    }
    failure = new SessionPurgeError('internal', archived
      ? `session was archived, but durable cleanup failed: ${String(cause)}`
      : `session cleanup failed: ${String(cause)}`, { cause })
  } finally {
    try {
      await ownership.close()
    } catch (error: unknown) {
      failure = failure === undefined
        ? new SessionPurgeError('internal', `session was archived and cleared, but ownership release failed: ${String(error)}`, { cause: error })
        : new SessionPurgeError('internal', `${String(failure)}; ownership release also failed: ${String(error)}`, {
          cause: new AggregateError([failure, error], 'session purge and ownership release failed'),
        })
    }
  }
  if (failure !== undefined) throw failure
}
