/**
 * Shared debugger broker.
 *
 * A tab can have exactly one debugger attachment, but two features need it:
 * the developer-tools group (inspection, page JavaScript, network capture) and
 * trusted input (keyboard, text delivery, and file uploads). The broker owns
 * the per-tab session, counts the features that hold it, and decides when the
 * attachment can be dropped — immediately when the developer tools stop, and
 * after an idle window for input so a sequence of keystrokes does not re-attach
 * between every call.
 *
 * @module
 */

import {
  DebuggerSession,
  DevToolsError,
  debuggerApi,
  type CdpDomain,
  type DebuggerApi,
  type DevToolsSessionListeners,
} from './debugger-session.ts'

/** Feature that holds an attachment. */
export type DebuggerOwner = 'devtools' | 'input'

/** One feature's hold on a tab's debugger. */
export interface DebuggerLease {
  readonly session: DebuggerSession
  /** Drop this hold; the attachment follows the broker's idle policy. */
  release(options?: { immediate?: boolean }): Promise<void>
}

/** Attachment state the panel can report. */
export interface DebuggerBrokerState {
  attached: boolean
  tabId?: number
  owners: DebuggerOwner[]
}

/** What one acquire needs. */
export interface DebuggerAcquireOptions {
  domains?: readonly CdpDomain[]
  listeners?: DevToolsSessionListeners
}

/** Broker surface used by the features and the background entry point. */
export interface DebuggerBroker {
  /** Attach (or join an attachment) for one feature. */
  acquire(tabId: number, owner: DebuggerOwner, options?: DebuggerAcquireOptions): Promise<DebuggerLease>
  /** Re-attach after an external detach, without changing ownership. */
  reattach(tabId: number, owner: DebuggerOwner, domains?: readonly CdpDomain[]): Promise<DebuggerSession>
  /** The attached session for a tab, when one exists. */
  attachedSession(tabId: number): DebuggerSession | undefined
  /** Drop one feature's hold; the attachment survives while another owner needs it. */
  detachOwner(tabId: number, owner: DebuggerOwner): Promise<void>
  /** Drop every owner and detach (tab closed, settings revoked, worker shutdown). */
  detachTab(tabId: number): Promise<void>
  /** Drop every owner for every tab. */
  detachAll(): Promise<void>
  /** Current attachment state for the panel. */
  state(): DebuggerBrokerState
  /** Observe attachment changes (attach, detach, error). */
  onChange(listener: () => void): () => void
}

/** Broker construction options; the API is injectable for tests. */
export interface DebuggerBrokerOptions {
  api?: DebuggerApi
  commandTimeoutMs?: number
  /** How long an input-only attachment survives without calls. */
  idleDetachMs?: number
  /** Notified on every attachment change. */
  onStateChange?: () => void
}

/** Default idle window for an input-only attachment. */
export const DEFAULT_INPUT_IDLE_DETACH_MS = 20_000

interface BrokerEntry {
  tabId: number
  session: DebuggerSession
  owners: Map<DebuggerOwner, number>
  listeners: Map<DebuggerOwner, DevToolsSessionListeners>
  idleTimer?: ReturnType<typeof setTimeout>
  queue: Promise<void>
}

/** Create the broker. */
export function createDebuggerBroker(options: DebuggerBrokerOptions = {}): DebuggerBroker {
  const api = options.api ?? debuggerApi()
  const idleDetachMs = options.idleDetachMs ?? DEFAULT_INPUT_IDLE_DETACH_MS
  const entries = new Map<number, BrokerEntry>()
  const observers = new Set<() => void>()
  let lastTabId: number | undefined

  const notify = (): void => {
    for (const observer of observers) {
      try { observer() } catch { /* an observer must not break the broker */ }
    }
    options.onStateChange?.()
  }

  const clearIdle = (entry: BrokerEntry): void => {
    if (entry.idleTimer !== undefined) {
      clearTimeout(entry.idleTimer)
      entry.idleTimer = undefined
    }
  }

  /** Serialize attach/release per tab so concurrent calls cannot double-attach. */
  const enqueue = <T>(entry: BrokerEntry, task: () => Promise<T>): Promise<T> => {
    const run = entry.queue.catch(() => undefined).then(task)
    entry.queue = run.then(() => undefined, () => undefined)
    return run
  }

  const getEntry = (tabId: number): BrokerEntry => {
    const existing = entries.get(tabId)
    if (existing !== undefined) return existing
    if (api === undefined) {
      throw new DevToolsError('devtools-unavailable', 'This browser build cannot attach a debugger.')
    }
    // The session fans events out to whichever owners are registered, so the
    // entry can be created before those owners arrive.
    const entry: BrokerEntry = {
      tabId,
      owners: new Map(),
      listeners: new Map(),
      queue: Promise.resolve(),
      // Assigned immediately below; the closure only runs after creation.
      session: undefined as unknown as DebuggerSession,
    }
    entry.session = new DebuggerSession(
      tabId,
      api,
      {
        onCdpEvent: (method, params) => {
          for (const listener of entry.listeners.values()) listener.onCdpEvent?.(method, params)
        },
        onDetached: (reason) => {
          clearIdle(entry)
          for (const listener of entry.listeners.values()) listener.onDetached?.(reason)
          notify()
        },
      },
      options.commandTimeoutMs,
    )
    entries.set(tabId, entry)
    return entry
  }

  /** Attach, recovering from a stale attachment left by a worker restart. */
  const attachWithRecovery = async (session: DebuggerSession, domains: readonly CdpDomain[]): Promise<void> => {
    try {
      await session.attach(domains)
    } catch (error: unknown) {
      if (!(error instanceof DevToolsError) || error.code !== 'devtools-conflict' || api === undefined) throw error
      // After an MV3 worker restart the extension believes it is detached while
      // Chrome still holds the attachment. Drop it and retry once; a genuine
      // DevTools user keeps the tab and sees the actionable error.
      try {
        await api.detach({ tabId: session.tabId })
        await session.attach(domains)
      } catch {
        throw error
      }
    }
  }

  const detachEntry = async (entry: BrokerEntry): Promise<void> => {
    clearIdle(entry)
    entry.owners.clear()
    entry.listeners.clear()
    if (entry.session.isAttached) await entry.session.detach()
    notify()
  }

  const scheduleIdleDetach = (entry: BrokerEntry): void => {
    clearIdle(entry)
    if (idleDetachMs <= 0) {
      void enqueue(entry, async () => {
        if (entry.owners.size === 0) await detachEntry(entry)
      })
      return
    }
    entry.idleTimer = setTimeout(() => {
      entry.idleTimer = undefined
      void enqueue(entry, async () => {
        if (entry.owners.size === 0) await detachEntry(entry)
      })
    }, idleDetachMs)
  }

  const release = async (tabId: number, owner: DebuggerOwner, releaseOptions: { immediate?: boolean } = {}): Promise<void> => {
    const entry = entries.get(tabId)
    if (entry === undefined) return
    await enqueue(entry, async () => {
      const remaining = (entry.owners.get(owner) ?? 1) - 1
      if (remaining > 0) {
        entry.owners.set(owner, remaining)
        return
      }
      entry.owners.delete(owner)
      entry.listeners.delete(owner)
      if (entry.owners.size > 0) return
      if (releaseOptions.immediate === true) await detachEntry(entry)
      else scheduleIdleDetach(entry)
    })
  }

  return {
    acquire: async (tabId, owner, acquireOptions = {}) => {
      if (api === undefined) {
        throw new DevToolsError('devtools-unavailable', 'This browser build cannot attach a debugger.')
      }
      const entry = getEntry(tabId)
      return enqueue(entry, async () => {
        clearIdle(entry)
        if (acquireOptions.listeners !== undefined) entry.listeners.set(owner, acquireOptions.listeners)
        entry.owners.set(owner, (entry.owners.get(owner) ?? 0) + 1)
        try {
          if (entry.session.isAttached) await entry.session.enableDomains(acquireOptions.domains ?? [])
          else await attachWithRecovery(entry.session, acquireOptions.domains ?? [])
        } catch (error: unknown) {
          const remaining = (entry.owners.get(owner) ?? 1) - 1
          if (remaining > 0) entry.owners.set(owner, remaining)
          else {
            entry.owners.delete(owner)
            entry.listeners.delete(owner)
          }
          throw error
        }
        lastTabId = tabId
        notify()
        return {
          session: entry.session,
          release: (leaseOptions) => release(tabId, owner, leaseOptions),
        }
      })
    },

    reattach: async (tabId, owner, domains = []) => {
      const entry = entries.get(tabId)
      if (entry === undefined || !entry.owners.has(owner)) {
        throw new DevToolsError('devtools-detached', 'This feature no longer holds the tab debugger.')
      }
      return enqueue(entry, async () => {
        clearIdle(entry)
        await attachWithRecovery(entry.session, domains)
        lastTabId = tabId
        notify()
        return entry.session
      })
    },

    attachedSession: (tabId) => {
      const entry = entries.get(tabId)
      return entry?.session.isAttached === true ? entry.session : undefined
    },

    detachOwner: async (tabId, owner) => {
      const entry = entries.get(tabId)
      if (entry === undefined) return
      await enqueue(entry, async () => {
        if (!entry.owners.has(owner)) return
        entry.owners.delete(owner)
        entry.listeners.delete(owner)
        if (entry.owners.size === 0) await detachEntry(entry)
      })
    },

    detachTab: async (tabId) => {
      const entry = entries.get(tabId)
      if (entry === undefined) return
      entries.delete(tabId)
      await enqueue(entry, async () => { await detachEntry(entry) })
      if (lastTabId === tabId) lastTabId = undefined
      notify()
    },

    detachAll: async () => {
      const all = [...entries.values()]
      entries.clear()
      await Promise.all(all.map((entry) => enqueue(entry, async () => { await detachEntry(entry) })))
      lastTabId = undefined
      notify()
    },

    state: () => {
      const entry = lastTabId === undefined ? undefined : entries.get(lastTabId)
      if (entry === undefined) return { attached: false, owners: [] }
      return {
        attached: entry.session.isAttached,
        tabId: entry.tabId,
        owners: [...entry.owners.keys()],
      }
    },

    onChange: (listener) => {
      observers.add(listener)
      return () => { observers.delete(listener) }
    },
  }
}
