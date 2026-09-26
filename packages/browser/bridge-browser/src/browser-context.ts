/**
 * Model-facing browser page context injected after an explicit tab handoff.
 *
 * The extension captures the page immediately after the user chooses to
 * follow it. A live Agent receives that snapshot at once; a deferred session
 * keeps only its newest snapshot until `agent/session-start` publishes the
 * Agent. Live inboxes also keep only the newest unclaimed browser snapshot.
 * Injection deliberately does not wake an idle Agent — the snapshot is
 * claimed together with the user's next message.
 *
 * @module
 */

import type { Agent, AgentRegistry } from '@deepseek-ai/dsh-agent'
import { createUserMessage, type UserMessage } from '@deepseek-ai/dsh-llm'

/**
 * DSH 0.1.7 moved injected messages to producer-owned source kinds: the v4
 * session format rejects the retired `kind: 'plugin'` wrapper
 * ("format v4 message requires a producer-owned source kind"). The bridge's
 * own kind mirrors the canonical v3→v4 migration mapping
 * (`plugin:<package>`), and the extension declares it on
 * {@link import('@deepseek-ai/dsh-llm').MessageSourceMap} so the merge-
 * extensible source union stays type-safe.
 */
declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    'plugin:@yuxianglin/dsh-bridge-browser': {
      kind: 'plugin:@yuxianglin/dsh-bridge-browser'
      plugin: string
      form: 'snapshot'
      sections: readonly import('@deepseek-ai/dsh-llm').ContextSnapshotSection[]
    }
  }
}

/** Provenance key used for snapshot supersession and transcript presentation. */
export const BROWSER_CONTEXT_PLUGIN = '@yuxianglin/dsh-bridge-browser'

/** Bound orphaned provisional sessions while retaining normal recent tabs. */
const DEFAULT_MAX_PENDING = 32

/** Build one immutable context message from a captured browser snapshot. */
export function createBrowserSnapshotMessage(snapshot: string): UserMessage {
  const text = [
    'The user chose to follow the newly active browser tab. The browser page context was refreshed immediately after that choice.',
    'The following is an already completed browser_snapshot of the current page. Use its stable indices directly for the next request; do not take an immediate duplicate snapshot unless required context is missing.',
    snapshot,
  ].join('\n\n')
  return createUserMessage({
    content: [{ type: 'text', text }],
    source: {
      kind: 'plugin:@yuxianglin/dsh-bridge-browser',
      plugin: BROWSER_CONTEXT_PLUGIN,
      form: 'snapshot',
      sections: [{ name: 'browser-page', text }],
    },
  })
}

/** Supersede pending tab context through the durable Inbox command surface. */
function injectLatestSnapshot(agent: Agent, snapshot: string): void {
  for (const message of agent.inbox.nextStep) {
    if ((message.source.kind === 'plugin' || message.source.kind === 'plugin:@yuxianglin/dsh-bridge-browser')
      && message.source.plugin === BROWSER_CONTEXT_PLUGIN
      && message.source.form === 'snapshot') {
      agent.inbox.remove(message.id)
    }
  }
  agent.inject(createBrowserSnapshotMessage(snapshot))
}

/** Deliver followed-page snapshots to live or not-yet-materialized Agents. */
export class BrowserContextInjector {
  private readonly pending = new Map<string, string>()

  constructor(
    private readonly agents: Pick<AgentRegistry, 'get'>,
    private readonly maxPending = DEFAULT_MAX_PENDING,
  ) {
    if (!Number.isInteger(maxPending) || maxPending < 1) {
      throw new Error('browser context maxPending must be a positive integer')
    }
  }

  /** Inject now when possible; otherwise retain the newest snapshot per session. */
  inject(sessionId: string, snapshot: string): 'injected' | 'queued' {
    const agent = this.agents.get(sessionId as Parameters<AgentRegistry['get']>[0])
    if (agent !== undefined) {
      this.pending.delete(sessionId)
      injectLatestSnapshot(agent, snapshot)
      return 'injected'
    }

    // Refresh insertion order when the same provisional session follows again.
    this.pending.delete(sessionId)
    while (this.pending.size >= this.maxPending) {
      const oldest = this.pending.keys().next().value as string | undefined
      if (oldest === undefined) break
      this.pending.delete(oldest)
    }
    this.pending.set(sessionId, snapshot)
    return 'queued'
  }

  /** Flush one provisional session at the supported Agent startup boundary. */
  activate(agent: Agent): boolean {
    const sessionId = String(agent.id)
    const snapshot = this.pending.get(sessionId)
    if (snapshot === undefined) return false
    injectLatestSnapshot(agent, snapshot)
    this.pending.delete(sessionId)
    return true
  }
}
