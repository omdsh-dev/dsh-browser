/**
 * dsh 0.2 Host adapter.
 *
 * Unary calls go directly through TypertGateway. Long-lived Session and
 * forwarded-event streams use the Gateway wire seam, while `$events/result`
 * goes through Connection because it is a Gateway-owned RPC endpoint rather
 * than a Typert Remote method.
 *
 * @module @yuxianglin/dsh-bridge-browser/src/remote-host-api
 */

import type {
  BrowserHostApi,
  HostEventFrame,
  HostRpcCall,
  HostRpcFailure,
  HostRpcResult,
} from './host-api.ts'
import { isRecord } from './host-api.ts'
import { ExtensionSessionRegistry } from './extension-sessions.ts'
import type { RespondResult } from './protocol.ts'

/** Structural subset of dsh 0.2.1's Host TypertGateway service. */
export interface TypertGatewayLike {
  readonly wireStream: {
    /**
     * dsh 0.2.1: `(endpoint, payload, uplink, peer, signal)`. The Peer is
     * required and never defaulted, so the bridge names the principal its
     * extension connection speaks for.
     */
    open(
      endpoint: string,
      payload: unknown,
      uplink: AsyncIterable<unknown>,
      peer: HostPeerLike,
      signal: AbortSignal,
    ): Promise<AsyncIterable<unknown>>
    failure(error: unknown): HostRpcFailure
  }
  invoke(request: {
    readonly namespace: string
    readonly method: string
    readonly args: Readonly<Record<string, unknown>>
    /** Caller identity every dispatch names explicitly since dsh 0.2.1. */
    readonly peer: HostPeerLike
    readonly signal?: AbortSignal
  }): Promise<unknown>
}

/**
 * Structural subset of dsh 0.2.1's PeerScope: the caller identity a Remote
 * call speaks for. Connection owns the instance; `signal` aborts when the
 * Peer is disposed, and streams that speak for it end with it.
 */
export interface HostPeerLike {
  readonly signal: AbortSignal
  dispose(): Promise<void>
}

/**
 * Empty Client→Host uplink for in-process Host wireStream.open calls.
 * Gateway-owned endpoints ($events) discard it immediately, and Remote streams
 * still need a valid AsyncIterable.
 */
const EMPTY_WIRE_UPLINK: AsyncIterable<unknown> = {
  async *[Symbol.asyncIterator]() { /* no uplink items */ },
}

/** Open one Host wire stream for the bridge's own Peer. */
function openWireStream(
  gateway: TypertGatewayLike,
  peer: HostPeerLike,
  endpoint: string,
  payload: unknown,
  signal: AbortSignal,
): Promise<AsyncIterable<unknown>> {
  return gateway.wireStream.open(endpoint, payload, EMPTY_WIRE_UPLINK, peer, signal)
}

/** Structural subset of dsh 0.2.1's Host Connection service. */
export interface HostConnectionLike {
  createSharedFetchHandler(channel: '/api'): {
    fetch(request: Request, peer: HostPeerLike): Promise<Response>
  }
  /**
   * Independent in-process Peer, disposed with the Context that read the
   * service. The bridge authenticates the extension with its own token, then
   * speaks for the local operator who owns this Host.
   */
  createPeer(options: {
    readonly principal: { readonly kind: 'owner' }
    readonly interactions?: 'answer' | 'none'
  }): HostPeerLike
}

interface InvokeTarget {
  readonly namespace: string
  readonly method: string
  readonly args: Readonly<Record<string, unknown>>
  readonly adapt?: (value: unknown) => unknown
}

interface SessionSnapshot {
  /** Inclusive Host log tip from session/follow. */
  readonly cursor: number
  readonly records: readonly unknown[]
  readonly hasMore: boolean
  readonly projections?: unknown
  readonly assistantStream?: unknown
  readonly snapshotId?: string
}

interface PendingQuestion {
  readonly sessionId: string
  settled: boolean
}

/** Build the dsh 0.2 Host implementation. */
export function createRemoteHostApi(
  gateway: TypertGatewayLike,
  connection: HostConnectionLike,
): BrowserHostApi {
  return new RemoteHostApi(gateway, connection)
}

class RemoteHostApi implements BrowserHostApi {
  private readonly fetchHandler: ReturnType<HostConnectionLike['createSharedFetchHandler']>
  /** One Peer speaks for every call and stream this extension connection opens. */
  private readonly peer: HostPeerLike
  private readonly extensionSessions = new ExtensionSessionRegistry()
  private activeEvents: EventGeneration | undefined

  constructor(
    private readonly gateway: TypertGatewayLike,
    connection: HostConnectionLike,
  ) {
    // Interactions default to `answer`; the bridge answers user-question
    // waterfalls for sessions it created, so it names that explicitly.
    this.peer = connection.createPeer({ principal: { kind: 'owner' }, interactions: 'answer' })
    this.fetchHandler = connection.createSharedFetchHandler('/api')
  }

  /**
   * Dispatch one Remote call as this connection's Peer. dsh 0.2.1 requires the
   * Peer on every carrier and in-process invocation; one helper keeps the
   * identity from drifting between call sites.
   */
  private invoke(request: {
    readonly namespace: string
    readonly method: string
    readonly args: Readonly<Record<string, unknown>>
    readonly signal?: AbortSignal
  }): Promise<unknown> {
    return this.gateway.invoke({ ...request, peer: this.peer })
  }

  async call(call: HostRpcCall): Promise<HostRpcResult> {
    if (call.method === 'session.history') return this.sessionHistory(call)
    if (call.method === 'session.models') return this.sessionModels(call)
    if (call.method === 'permission.catalog') return this.permissionCatalog(call)
    if (call.method === 'session.permissions') return this.sessionPermissions(call)
    if (call.method === 'session.setPermission') return this.sessionSetPermission(call)
    if (call.method === 'commands.list') return this.commandList(call)
    if (call.method === 'commands.execute') return this.commandExecute(call)
    if (call.method === 'skills.list') return this.skillList(call)
    if (call.method === 'workspace.list') return this.workspaceList(call)

    const target = invokeTarget(call)
    if ('error' in target) return { ok: false, error: target.error }

    try {
      // Deferred Sessions have no history call with which to establish the
      // follower. Open it after materialization and before prompt admission,
      // so the first user/turn events cannot race past the extension.
      if (call.method === 'session.prompt') {
        const sessionId = sessionIdOf(call.payload)
        if (sessionId !== undefined) await this.activeEvents?.ensureSessionFollow(sessionId, call.signal)
      }
      const value = await this.invoke({
        namespace: target.namespace,
        method: target.method,
        args: target.args,
        signal: call.signal,
      })
      // Only claim ownership after a successful create/prompt. A failed prompt
      // against a Desktop session must not steal later ask_user_question away
      // from the native waterfall.
      if (call.method === 'session.create' || call.method === 'session.prompt') {
        this.extensionSessions.note(sessionIdOf(call.payload))
        this.extensionSessions.note(sessionIdOf(value))
        if (typeof value === 'string') this.extensionSessions.note(value)
      }
      return { ok: true, value: target.adapt?.(value) ?? value }
    } catch (error: unknown) {
      return { ok: false, error: this.failure(error) }
    }
  }

  async *events(signal: AbortSignal): AsyncIterable<HostEventFrame> {
    const generation = new EventGeneration(
      this.gateway,
      this.peer,
      this.sendRemoteEventResult.bind(this),
      this.extensionSessions,
      signal,
    )
    const previous = this.activeEvents
    this.activeEvents = generation
    await previous?.dispose()
    generation.start()
    try {
      yield * generation.events()
    } finally {
      if (this.activeEvents === generation) this.activeEvents = undefined
      await generation.dispose()
    }
  }

  async respond(rpcId: string, result: RespondResult, signal: AbortSignal): Promise<unknown> {
    const generation = this.activeEvents
    if (generation === undefined) return { accepted: false, reason: 'not-pending' }
    return generation.respond(rpcId, result, signal)
  }

  private async sessionHistory(call: HostRpcCall): Promise<HostRpcResult> {
    const sessionId = sessionIdOf(call.payload)
    if (sessionId === undefined) return badRequest('session.history requires a non-empty sessionId')
    let beforeSeq: number | undefined
    let maxMessages: number | undefined
    try {
      beforeSeq = optionalNonNegativeInteger(call.payload, 'beforeSeq')
      maxMessages = optionalPositiveInteger(call.payload, 'maxMessages')
    } catch (error: unknown) {
      return badRequest(error instanceof Error ? error.message : 'session.history pagination is invalid')
    }
    try {
      if (beforeSeq !== undefined) {
        const page = await this.invoke({
          namespace: 'session',
          method: 'events',
          args: {
            request: {
              address: { kind: 'session', sessionId },
              beforeSeq,
              ...(maxMessages === undefined ? {} : { maxMessages }),
            },
          },
          signal: call.signal,
        })
        return { ok: true, value: historyPageValue(page) }
      }

      const snapshot = this.activeEvents === undefined
        ? await oneShotSessionSnapshot(this.gateway, this.peer, sessionId, call.signal, maxMessages)
        : await this.activeEvents.openSessionHistory(sessionId, call.signal, maxMessages)
      return { ok: true, value: historyValue(snapshot) }
    } catch (error: unknown) {
      return { ok: false, error: this.failure(error) }
    }
  }

  /** Combine the deployment catalog with the Session's durable next selection. */
  private async sessionModels(call: HostRpcCall): Promise<HostRpcResult> {
    if (!isRecord(call.payload)) return badRequest('session.models payload must be an object')
    const sessionId = sessionIdOf(call.payload)
    try {
      const catalog = await this.invoke({
        namespace: 'session', method: 'modelCatalog', args: {}, signal: call.signal,
      })
      // Provisional Sessions request only the catalog and overlay their pending choice.
      const projections = sessionId === undefined ? undefined : await this.invoke({
        namespace: 'session', method: 'projections', args: { request: { sessionId } }, signal: call.signal,
      })
      const values = isRecord(projections) ? projections.values : undefined
      const modelSelection = isRecord(values) ? values.modelSelection : undefined
      const next = isRecord(modelSelection) ? modelSelectionOf(modelSelection.next) : undefined
      return { ok: true, value: adaptModelCatalog(catalog, next) }
    } catch (error: unknown) {
      return { ok: false, error: this.failure(error) }
    }
  }

  /** One session's projection values, or undefined when the Host reports none. */
  private async sessionProjectionValues(
    sessionId: string,
    signal: AbortSignal,
  ): Promise<Record<string, unknown> | undefined> {
    const projections = await this.invoke({
      namespace: 'session', method: 'projections', args: { request: { sessionId } }, signal,
    })
    const values = isRecord(projections) ? projections.values : undefined
    return isRecord(values) ? values : undefined
  }

  /** Process-level permission preset directory: the panel's only source of preset names. */
  private async permissionCatalog(call: HostRpcCall): Promise<HostRpcResult> {
    try {
      const catalog = await this.invoke({
        namespace: 'permissionPresets', method: 'catalog', args: {}, signal: call.signal,
      })
      return { ok: true, value: adaptPermissionCatalog(catalog) }
    } catch (error: unknown) {
      return { ok: false, error: this.failure(error) }
    }
  }

  /**
   * Combine the process catalog with the Session's current preset.
   * A Session whose `permissions` projection is absent (Host without the
   * permission service) reports the default preset with `routable: false`
   * instead of failing, so the panel can hide the control.
   */
  private async sessionPermissions(call: HostRpcCall): Promise<HostRpcResult> {
    const sessionId = sessionIdOf(call.payload)
    if (sessionId === undefined) return badRequest('session.permissions requires a non-empty sessionId')
    try {
      const catalog = adaptPermissionCatalog(await this.invoke({
        namespace: 'permissionPresets', method: 'catalog', args: {}, signal: call.signal,
      }))
      const values = await this.sessionProjectionValues(sessionId, call.signal)
      const current = currentPermissionOf(values?.permissions)
      return {
        ok: true,
        value: {
          current: current ?? catalog.defaultPreset,
          routable: current !== undefined,
          provisional: false,
          options: catalog.options,
          defaultOptions: catalog.defaultOptions,
          defaultPreset: catalog.defaultPreset,
        },
      }
    } catch (error: unknown) {
      return { ok: false, error: this.failure(error) }
    }
  }

  /**
   * Switch the Session's permission preset through the Host's own
   * `/permission` command, so the preset selection and both knob events land
   * in the Session log exactly as a Web GUI selection would.
   */
  private async sessionSetPermission(call: HostRpcCall): Promise<HostRpcResult> {
    if (!isRecord(call.payload)) return badRequest('session.setPermission payload must be an object')
    const sessionId = sessionIdOf(call.payload)
    const preset = typeof call.payload.preset === 'string' ? call.payload.preset.trim() : ''
    if (sessionId === undefined) return badRequest('session.setPermission requires a non-empty sessionId')
    if (preset === '') return badRequest('session.setPermission requires a preset')
    try {
      const catalog = adaptPermissionCatalog(await this.invoke({
        namespace: 'permissionPresets', method: 'catalog', args: {}, signal: call.signal,
      }))
      if (!catalog.options.some((option) => option.value === preset)) {
        return badRequest(`unknown permission preset ${JSON.stringify(preset)}`)
      }
      const executed = await this.runCommand(sessionId, permissionSwitchLine(preset), call)
      if (!executed.ok) return executed
      return { ok: true, value: { preset, ...(executed.value as Record<string, unknown>) } }
    } catch (error: unknown) {
      return { ok: false, error: this.failure(error) }
    }
  }

  /** Host slash-command directory for one Session's agent scope. */
  private async commandList(call: HostRpcCall): Promise<HostRpcResult> {
    const sessionId = sessionIdOf(call.payload)
    if (sessionId === undefined) return badRequest('commands.list requires a non-empty sessionId')
    try {
      const value = await this.invoke({
        namespace: 'commands', method: 'list', args: { agentId: sessionId }, signal: call.signal,
      })
      return { ok: true, value: { commands: adaptCommandList(value), provisional: false } }
    } catch (error: unknown) {
      return { ok: false, error: this.failure(error) }
    }
  }

  /**
   * Run one Host slash command against the Session's agent.
   * Command output never becomes a model message; the panel renders the
   * settled result itself.
   */
  private async commandExecute(call: HostRpcCall): Promise<HostRpcResult> {
    if (!isRecord(call.payload)) return badRequest('commands.execute payload must be an object')
    const sessionId = sessionIdOf(call.payload)
    const line = typeof call.payload.line === 'string' ? call.payload.line : ''
    if (sessionId === undefined) return badRequest('commands.execute requires a non-empty sessionId')
    if (!isCommandLine(line)) return badRequest('commands.execute requires a slash command line')
    return this.runCommand(sessionId, line, call)
  }

  /** User-invocable skill directory for one Session composition. */
  private async skillList(call: HostRpcCall): Promise<HostRpcResult> {
    const sessionId = sessionIdOf(call.payload)
    if (sessionId === undefined) return badRequest('skills.list requires a non-empty sessionId')
    try {
      const value = await this.invoke({
        namespace: 'skills', method: 'list', args: { request: { sessionId } }, signal: call.signal,
      })
      return { ok: true, value: { skills: adaptSkillList(value), provisional: false } }
    } catch (error: unknown) {
      return { ok: false, error: this.failure(error) }
    }
  }

  /**
   * Dispatch one command line through `commands/execute`.
   * The Host answers `undefined` for syntactically valid but unknown commands,
   * which is a caller error rather than an empty success.
   */
  private async runCommand(sessionId: string, line: string, call: HostRpcCall): Promise<HostRpcResult> {
    try {
      const value = await this.invoke({
        namespace: 'commands',
        method: 'execute',
        args: { agentId: sessionId, line, submittedAttachments: [] },
        signal: call.signal,
      })
      const execution = adaptCommandExecution(value)
      if (execution === undefined) return badRequest(`unknown command line ${JSON.stringify(line)}`)
      return { ok: true, value: execution }
    } catch (error: unknown) {
      return { ok: false, error: this.failure(error) }
    }
  }

  private async workspaceList(call: HostRpcCall): Promise<HostRpcResult> {
    try {
      const controller = new AbortController()
      const signal = AbortSignal.any([call.signal, controller.signal])
      const source = await openWireStream(this.gateway, this.peer, 'workspace/follow', { args: {} }, signal)
      const iterator = source[Symbol.asyncIterator]()
      try {
        const first = await iterator.next()
        if (first.done || !isWorkspaceBaseline(first.value)) {
          throw new TypeError('workspace/follow did not begin with a baseline')
        }
        return { ok: true, value: first.value.value }
      } finally {
        controller.abort(new Error('workspace baseline received'))
        await iterator.return?.()
      }
    } catch (error: unknown) {
      return { ok: false, error: this.failure(error) }
    }
  }

  private failure(error: unknown): HostRpcFailure {
    return this.gateway.wireStream.failure(error)
  }

  private async sendRemoteEventResult(
    clientId: string,
    eventId: string,
    outcome: RemoteEventOutcome,
    signal: AbortSignal,
  ): Promise<void> {
    const rpcId = crypto.randomUUID()
    const request = new Request('http://dsh.internal/api/$events/result', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'client-request',
        rpcId,
        method: '$events/result',
        payload: { args: { clientId, eventId, outcome } },
      }),
      signal,
    })
    const response = await this.fetchHandler.fetch(request, this.peer)
    if (!response.ok) {
      throw new Error(`$events/result transport failed with HTTP ${String(response.status)}: ${await response.text()}`)
    }
    const envelope = await response.json() as unknown
    if (!isRecord(envelope) || envelope.type !== 'server-response' || envelope.rpcId !== rpcId
      || !isRecord(envelope.result) || typeof envelope.result.ok !== 'boolean') {
      throw new TypeError('$events/result returned an invalid server-response')
    }
    if (envelope.result.ok) return
    const error = isRecord(envelope.result.error) ? envelope.result.error : {}
    const failure = new Error(typeof error.message === 'string' ? error.message : '$events/result was rejected') as Error & {
      code?: string
      details?: unknown
    }
    if (typeof error.code === 'string') failure.code = error.code
    if (error.details !== undefined) failure.details = error.details
    throw failure
  }
}

type SendRemoteEventResult = (
  clientId: string,
  eventId: string,
  outcome: RemoteEventOutcome,
  signal: AbortSignal,
) => Promise<void>

type RemoteEventOutcome =
  | { readonly kind: 'next' }
  | { readonly kind: 'result'; readonly value?: unknown }
  | {
    readonly kind: 'rejected'
    readonly error: {
      readonly name: string
      readonly message: string
      readonly code?: string
      readonly details?: unknown
    }
  }

/** One authenticated extension connection's event streams and active Session follower. */
class EventGeneration {
  private readonly lifetime = new AbortController()
  private readonly signal: AbortSignal
  private readonly queue = new AsyncEventQueue()
  private readonly tasks = new Set<Promise<void>>()
  private readonly pendingQuestions = new Map<string, PendingQuestion>()
  private clientId: string | undefined
  private followAbort: AbortController | undefined
  private followOpening: Promise<SessionSnapshot> | undefined
  private followedSessionId: string | undefined
  private followRevision = 0
  private disposed = false

  constructor(
    private readonly gateway: TypertGatewayLike,
    private readonly peer: HostPeerLike,
    private readonly sendResult: SendRemoteEventResult,
    private readonly extensionSessions: ExtensionSessionRegistry,
    outerSignal: AbortSignal,
  ) {
    this.signal = AbortSignal.any([outerSignal, this.lifetime.signal, this.peer.signal])
  }

  start(): void {
    this.track(this.pumpRemoteEvents())
  }

  events(): AsyncIterable<HostEventFrame> {
    return this.queue.iterate(this.signal)
  }

  async openSessionHistory(
    sessionId: string,
    callSignal: AbortSignal,
    maxMessages?: number,
  ): Promise<SessionSnapshot> {
    const pending = this.openSessionFollow(sessionId, callSignal, maxMessages)
    this.followOpening = pending
    try {
      return await pending
    } finally {
      if (this.followOpening === pending) this.followOpening = undefined
    }
  }

  async ensureSessionFollow(sessionId: string, callSignal: AbortSignal): Promise<void> {
    if (this.followedSessionId === sessionId && this.followAbort?.signal.aborted === false) {
      await this.followOpening
      return
    }
    await this.openSessionHistory(sessionId, callSignal)
  }

  async respond(rpcId: string, result: RespondResult, signal: AbortSignal): Promise<unknown> {
    const pending = this.pendingQuestions.get(rpcId)
    const clientId = this.clientId
    if (pending === undefined || pending.settled || clientId === undefined) {
      return { accepted: false, reason: 'not-pending' }
    }
    pending.settled = true
    try {
      await this.sendResult(clientId, rpcId, respondOutcome(result), AbortSignal.any([this.signal, signal]))
      return { accepted: true }
    } catch (error: unknown) {
      pending.settled = false
      throw error
    }
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    this.followAbort?.abort(new Error('browser bridge event generation closed'))
    this.lifetime.abort(new Error('browser bridge event generation closed'))
    this.queue.end()
    await Promise.all(this.tasks)
  }

  private async openSessionFollow(
    sessionId: string,
    callSignal: AbortSignal,
    maxMessages?: number,
  ): Promise<SessionSnapshot> {
    const revision = ++this.followRevision
    this.followAbort?.abort(new Error('browser bridge Session follower replaced'))
    const controller = new AbortController()
    this.followAbort = controller
    this.followedSessionId = sessionId
    const signal = AbortSignal.any([this.signal, callSignal, controller.signal])
    const iterators: AsyncIterator<unknown>[] = []
    try {
      // 先建立投影订阅，再读取基线，保证打开期间的变化不会丢失。
      const projections = await openWireStream(this.gateway, this.peer, 'session/observeProjections', {
        args: { request: { sessionId } },
      }, signal)
      const projectionIterator = projections[Symbol.asyncIterator]()
      iterators.push(projectionIterator)
      const ready = await projectionIterator.next()
      if (ready.done || !isRecord(ready.value) || ready.value.type !== 'ready') {
        throw new TypeError('session/observeProjections did not begin with ready')
      }
      const source = await openWireStream(this.gateway,
        this.peer,
        'session/follow',
        {
          args: {
            request: {
              address: { kind: 'session', sessionId },
              activate: true,
              assistantStream: true,
              ...(maxMessages === undefined ? {} : { maxMessages }),
            },
          },
        },
        signal,
      )
      const iterator = source[Symbol.asyncIterator]()
      iterators.push(iterator)
      const first = await iterator.next()
      if (first.done || !isSessionSnapshot(first.value)) {
        throw new TypeError('session/follow did not begin with a snapshot')
      }
      if (revision !== this.followRevision || signal.aborted) {
        signal.throwIfAborted()
        throw new Error('browser bridge Session follower was replaced while opening')
      }
      const states = await openWireStream(this.gateway, this.peer, 'session/observeState', {
        args: { request: { sessionId } },
      }, signal)
      const stateIterator = states[Symbol.asyncIterator]()
      iterators.push(stateIterator)
      signal.throwIfAborted()
      if (revision !== this.followRevision) throw new Error('browser bridge Session follower was replaced while opening')
      const snapshotId = first.value.assistantStream === undefined ? undefined : crypto.randomUUID()
      // Publish the reconnect prefix before any suffix chunks. RPC responses
      // and pushed events can otherwise race, dropping the beginning of an
      // already-running attempt when the panel reopens its history.
      if (first.value.assistantStream !== undefined) {
        this.queue.push({
          rpcId: crypto.randomUUID(),
          method: 'session/assistant-stream',
          payload: {
            sessionId,
            snapshotId,
            frame: { type: 'snapshot', baseline: first.value.assistantStream },
          },
        })
      }
      const projectionSeq = isRecord(first.value.projections) && typeof first.value.projections.asOfSeq === 'number'
        ? first.value.projections.asOfSeq : first.value.cursor
      this.track(this.pumpSessionObserver(sessionId, revision, projectionIterator, signal, 'projection', projectionSeq))
      this.track(this.pumpSessionObserver(sessionId, revision, stateIterator, signal, 'state'))
      this.track(this.pumpSessionEvents(sessionId, revision, iterator, signal))
      return {
        cursor: first.value.cursor,
        records: first.value.records,
        hasMore: first.value.hasMore,
        ...(first.value.projections === undefined ? {} : { projections: first.value.projections }),
        ...(first.value.assistantStream === undefined ? {} : { assistantStream: first.value.assistantStream }),
        ...(snapshotId === undefined ? {} : { snapshotId }),
      }
    } catch (error: unknown) {
      controller.abort(error)
      await Promise.all(iterators.map(iterator => iterator.return?.()))
      if (revision === this.followRevision) {
        this.followedSessionId = undefined
        this.followAbort = undefined
      }
      throw error
    }
  }

  private async pumpSessionEvents(
    sessionId: string,
    revision: number,
    iterator: AsyncIterator<unknown>,
    signal: AbortSignal,
  ): Promise<void> {
    try {
      while (!signal.aborted) {
        const next = await iterator.next()
        // Abort is advisory to an AsyncIterator: a buffered frame may still
        // resolve after this follower was replaced. Never let that stale
        // generation update the extension's active/recent session state.
        if (signal.aborted || revision !== this.followRevision) break
        if (next.done) break
        if (isRecord(next.value) && next.value.type === 'assistant-stream' && isRecord(next.value.frame)) {
          this.queue.push({
            rpcId: crypto.randomUUID(),
            method: 'session/assistant-stream',
            payload: { sessionId, frame: next.value.frame },
          })
          continue
        }
        if (!isSessionEventEntry(next.value)) {
          throw new TypeError('session/follow emitted an invalid incremental frame')
        }
        this.queue.push({
          rpcId: crypto.randomUUID(),
          method: 'session/event',
          payload: { type: 'session/event', sessionId, event: next.value.event },
        })
      }
      if (!signal.aborted && revision === this.followRevision) {
        throw new Error('session/follow ended unexpectedly')
      }
    } catch (error: unknown) {
      if (!signal.aborted && revision === this.followRevision) this.queue.fail(error)
    } finally {
      await iterator.return?.()
      if (revision === this.followRevision) {
        this.followAbort?.abort(new Error('browser bridge Session follower ended'))
        this.followedSessionId = undefined
        this.followAbort = undefined
      }
    }
  }

  private async pumpSessionObserver(
    sessionId: string,
    revision: number,
    iterator: AsyncIterator<unknown>,
    signal: AbortSignal,
    kind: 'projection' | 'state',
    baselineSeq = -1,
  ): Promise<void> {
    try {
      while (!signal.aborted) {
        const next = await iterator.next()
        if (signal.aborted || revision !== this.followRevision) return
        if (next.done) throw new Error(`session ${kind} observation ended unexpectedly`)
        const value = next.value
        if (kind === 'projection') {
          if (!isRecord(value) || value.type !== 'projection' || !Number.isSafeInteger(value.seq)
            || !Array.isArray(value.changes)
            || !value.changes.every(change => isRecord(change) && typeof change.key === 'string' && 'val' in change)) {
            throw new TypeError('session/observeProjections emitted an invalid frame')
          }
          if ((value.seq as number) <= baselineSeq) continue
          baselineSeq = value.seq as number
          this.queue.push({ rpcId: crypto.randomUUID(), method: 'session/projection', payload: { sessionId, ...value } })
        } else {
          if (!isRecord(value) || !Number.isSafeInteger(value.cursor)
            || typeof value.active !== 'boolean' || typeof value.running !== 'boolean'
            || (value.queue !== null && !Array.isArray(value.queue)) || !Array.isArray(value.pendingInput)) {
            throw new TypeError('session/observeState emitted an invalid state')
          }
          this.queue.push({ rpcId: crypto.randomUUID(), method: 'session/state', payload: { sessionId, ...value } })
        }
      }
    } catch (error: unknown) {
      if (!signal.aborted && revision === this.followRevision) throw error
    } finally {
      await iterator.return?.()
    }
  }

  private async pumpRemoteEvents(): Promise<void> {
    try {
      const source = await openWireStream(this.gateway, this.peer, '$events', { args: {} }, this.signal)
      let ready = false
      for await (const value of source) {
        if (!ready) {
          if (!isRemoteEventReady(value)) throw new TypeError('$events did not begin with ready')
          this.clientId = value.clientId
          ready = true
          continue
        }
        await this.handleRemoteEvent(value)
      }
      if (!this.signal.aborted) throw new Error('$events ended unexpectedly')
    } catch (error: unknown) {
      if (!this.signal.aborted) this.queue.fail(error)
    }
  }

  private async handleRemoteEvent(value: unknown): Promise<void> {
    if (!isRecord(value) || typeof value.type !== 'string') {
      throw new TypeError('$events emitted an invalid frame')
    }
    if (value.type === 'emit') return
    if (value.type === 'cancel' && typeof value.eventId === 'string') {
      const pending = this.pendingQuestions.get(value.eventId)
      if (pending === undefined) return
      this.pendingQuestions.delete(value.eventId)
      this.queue.push({
        rpcId: crypto.randomUUID(),
        method: 'question/resolved',
        payload: {
          type: 'question/resolved',
          sessionId: pending.sessionId,
          questionRpcId: value.eventId,
        },
      })
      return
    }
    if (value.type !== 'waterfall'
      || typeof value.event !== 'string'
      || typeof value.eventId !== 'string'
      || typeof value.agentId !== 'string'
      || !isRecord(value.request)) {
      throw new TypeError('$events emitted an invalid waterfall frame')
    }
    if (value.event !== 'user-questions/request' || !Array.isArray(value.request.questions)) {
      const clientId = this.clientId
      if (clientId !== undefined) {
        await this.sendResult(clientId, value.eventId, { kind: 'next' }, this.signal)
      }
      return
    }
    // Desktop-owned sessions keep the native waterfall. Only forward questions
    // for sessions the extension successfully created or prompted.
    if (!this.extensionSessions.has(value.agentId)) {
      const clientId = this.clientId
      if (clientId !== undefined) {
        await this.sendResult(clientId, value.eventId, { kind: 'next' }, this.signal)
      }
      return
    }
    this.pendingQuestions.set(value.eventId, { sessionId: value.agentId, settled: false })
    this.queue.push({
      rpcId: value.eventId,
      method: 'question/requested',
      payload: {
        type: 'question/requested',
        sessionId: value.agentId,
        questions: value.request.questions,
      },
    })
  }

  private track(task: Promise<void>): void {
    const tracked = task.catch((error: unknown) => {
      if (!this.signal.aborted) this.queue.fail(error)
    })
    this.tasks.add(tracked)
    void tracked.finally(() => { this.tasks.delete(tracked) })
  }
}

class AsyncEventQueue {
  private readonly frames: HostEventFrame[] = []
  private wake: (() => void) | undefined
  private failure: unknown
  private closed = false

  push(frame: HostEventFrame): void {
    if (this.closed || this.failure !== undefined) return
    this.frames.push(frame)
    this.wake?.()
  }

  fail(error: unknown): void {
    if (this.closed || this.failure !== undefined) return
    this.failure = error
    this.wake?.()
  }

  end(): void {
    if (this.closed) return
    this.closed = true
    this.wake?.()
  }

  async *iterate(signal: AbortSignal): AsyncGenerator<HostEventFrame> {
    const onAbort = (): void => { this.wake?.() }
    signal.addEventListener('abort', onAbort, { once: true })
    try {
      while (true) {
        while (this.frames.length > 0) yield this.frames.shift() as HostEventFrame
        if (this.failure !== undefined) throw this.failure
        if (this.closed || signal.aborted) return
        await new Promise<void>((resolve) => { this.wake = resolve })
        this.wake = undefined
      }
    } finally {
      signal.removeEventListener('abort', onAbort)
    }
  }
}

function invokeTarget(call: HostRpcCall): InvokeTarget | { readonly error: HostRpcFailure } {
  if (!isRecord(call.payload)) return { error: badRequestFailure(`${call.method} payload must be an object`) }
  switch (call.method) {
    case 'session.list':
      return { namespace: 'session', method: 'list', args: { _request: call.payload } }
    case 'session.create':
    case 'session.selectModel':
    case 'session.attachment':
    case 'session.state':
    case 'session.cancel':
    case 'workspace.create':
    case 'workspace.archiveSession': {
      const [namespace, method] = call.method.split('.') as [string, string]
      return { namespace, method, args: { request: call.payload } }
    }
    case 'session.prompt':
      return {
        namespace: 'session',
        method: 'prompt',
        args: { request: { requestId: call.rpcId, ...call.payload } },
      }
    case 'settings.describe':
      return { namespace: 'settings', method: 'describe', args: {} }
    case 'settings.mutate':
      return { namespace: 'settings', method: 'mutate', args: call.payload }
    case 'credentials.describe':
      return {
        namespace: 'credentials',
        method: 'describe',
        args: call.payload,
        adapt: value => ({ credentials: value }),
      }
    case 'credentials.set':
    case 'credentials.unset': {
      const method = call.method.slice('credentials.'.length)
      return { namespace: 'credentials', method, args: call.payload, adapt: () => ({}) }
    }
    case 'llm.discoverModels': {
      const { settingsNs, ...request } = call.payload
      if (typeof settingsNs !== 'string' || settingsNs.length === 0) {
        return { error: badRequestFailure('llm.discoverModels requires settingsNs') }
      }
      return {
        namespace: 'llm',
        method: 'discoverModels',
        args: { settingsNs, request },
        adapt: value => ({ models: value }),
      }
    }
    default:
      return {
        error: {
          code: 'not-found',
          message: `browser bridge Host method ${JSON.stringify(call.method)} is unavailable`,
          details: {},
        },
      }
  }
}

async function oneShotSessionSnapshot(
  gateway: TypertGatewayLike,
  peer: HostPeerLike,
  sessionId: string,
  outerSignal: AbortSignal,
  maxMessages?: number,
): Promise<SessionSnapshot> {
  const controller = new AbortController()
  const signal = AbortSignal.any([outerSignal, controller.signal])
  const source = await openWireStream(gateway,
    peer,
    'session/follow',
    {
      args: {
        request: {
          address: { kind: 'session', sessionId },
          activate: false,
          assistantStream: true,
          ...(maxMessages === undefined ? {} : { maxMessages }),
        },
      },
    },
    signal,
  )
  const iterator = source[Symbol.asyncIterator]()
  try {
    const first = await iterator.next()
    if (first.done || !isSessionSnapshot(first.value)) {
      throw new TypeError('session/follow did not begin with a snapshot')
    }
    return {
      cursor: first.value.cursor,
      records: first.value.records,
      hasMore: first.value.hasMore,
      ...(first.value.projections === undefined ? {} : { projections: first.value.projections }),
      ...(first.value.assistantStream === undefined ? {} : { assistantStream: first.value.assistantStream }),
    }
  } finally {
    controller.abort(new Error('Session snapshot received'))
    await iterator.return?.()
  }
}

function historyValue(snapshot: SessionSnapshot): Record<string, unknown> {
  return {
    events: snapshot.records.map(record => {
      if (!isSessionEventEntry(record)) throw new TypeError('session history carried an invalid record')
      return { event: record.event }
    }),
    hasMore: snapshot.hasMore,
    ...(snapshot.projections === undefined ? {} : { projections: snapshot.projections }),
    ...(snapshot.assistantStream === undefined ? {} : { assistantStream: snapshot.assistantStream }),
    ...(snapshot.snapshotId === undefined ? {} : { snapshotId: snapshot.snapshotId }),
  }
}

function historyPageValue(page: unknown): Record<string, unknown> {
  if (!isRecord(page) || !Array.isArray(page.records) || typeof page.hasMore !== 'boolean') {
    throw new TypeError('session/events returned an invalid history page')
  }
  return historyValue({
    cursor: -1,
    records: page.records,
    hasMore: page.hasMore,
    ...(page.projections === undefined ? {} : { projections: page.projections }),
  })
}

function optionalNonNegativeInteger(
  payload: unknown,
  key: string,
): number | undefined {
  if (!isRecord(payload) || !(key in payload) || payload[key] === undefined) return undefined
  const value = payload[key]
  if (!Number.isSafeInteger(value) || (value as number) < 0 || Object.is(value, -0)) {
    throw new TypeError(`${key} must be a non-negative safe integer`)
  }
  return value as number
}

function optionalPositiveInteger(
  payload: unknown,
  key: string,
): number | undefined {
  if (!isRecord(payload) || !(key in payload) || payload[key] === undefined) return undefined
  const value = payload[key]
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new TypeError(`${key} must be a positive safe integer`)
  }
  return value as number
}

function respondOutcome(result: RespondResult): RemoteEventOutcome {
  if (result.ok) {
    const value = isRecord(result.value) && isRecord(result.value.answer)
      ? result.value.answer
      : result.value
    return value === undefined ? { kind: 'result' } : { kind: 'result', value }
  }
  return {
    kind: 'rejected',
    error: {
      name: 'Error',
      message: result.error.message,
      code: result.error.code,
      details: result.error.details,
    },
  }
}

function sessionIdOf(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined
  return typeof payload.sessionId === 'string' && payload.sessionId.length > 0
    ? payload.sessionId
    : undefined
}

/** Map Host ModelCatalog into the extension's session.models directory shape. */
function adaptModelCatalog(value: unknown, next?: ReturnType<typeof modelSelectionOf>): unknown {
  if (!isRecord(value)) return value
  const selection = next ?? modelSelectionOf(value.default)
  const groups = Array.isArray(value.groups) ? value.groups : []
  const failures = Array.isArray(value.failures) ? value.failures : []
  const routableProviders = Array.isArray(value.routableProviders)
    ? value.routableProviders.filter((entry): entry is string => typeof entry === 'string')
    : []
  const current = selection ?? { provider: 'none', model: 'none' }
  return {
    current,
    routable: selection !== undefined && routableProviders.includes(selection.provider),
    groups,
    failures,
  }
}

function modelSelectionOf(value: unknown): {
  provider: string
  model: string
  reasoningEffort?: string
} | undefined {
  if (!isRecord(value)) return undefined
  const provider = typeof value.provider === 'string' ? value.provider.trim() : ''
  const model = typeof value.model === 'string' ? value.model.trim() : ''
  if (provider === '' || model === '') return undefined
  const reasoningEffort = typeof value.reasoningEffort === 'string' && value.reasoningEffort.trim() !== ''
    ? value.reasoningEffort.trim()
    : undefined
  return {
    provider,
    model,
    ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
  }
}

/** One selectable permission preset as the Host advertises it. */
export interface PermissionCatalogOption {
  readonly value: string
  readonly name: string
  readonly description?: string
}

/** Process-level permission preset directory. */
export interface PermissionCatalog {
  readonly options: readonly PermissionCatalogOption[]
  readonly defaultOptions: readonly PermissionCatalogOption[]
  readonly defaultPreset: string
}

/** Host command line that switches one Session's permission preset. */
export function permissionSwitchLine(preset: string): string {
  return `/permission ${preset}`
}

/**
 * Host command syntax: byte 0 is `/`, then a lowercase name, then the end of
 * input or whitespace. Anything else is a prompt, never a command.
 * @param line - the exact composer line.
 * @returns true when the line claims the Host command grammar.
 */
export function isCommandLine(line: string): boolean {
  return /^\/[a-z0-9_-]+(?:[ \t]|$)/u.test(line)
}

function adaptPermissionCatalog(value: unknown): PermissionCatalog {
  if (!isRecord(value)) throw new TypeError('permissionPresets.catalog returned an invalid directory')
  const options = adaptPermissionOptions(value.options, 'permissionPresets.catalog options')
  const defaultOptions = adaptPermissionOptions(value.defaultOptions, 'permissionPresets.catalog defaultOptions')
  const defaultPreset = typeof value.defaultPreset === 'string' ? value.defaultPreset.trim() : ''
  if (defaultPreset === '') throw new TypeError('permissionPresets.catalog returned no default preset')
  return { options, defaultOptions, defaultPreset }
}

function adaptPermissionOptions(value: unknown, label: string): PermissionCatalogOption[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} are not an array`)
  return value.map((entry) => {
    if (!isRecord(entry)) throw new TypeError(`${label} carried an invalid entry`)
    const preset = typeof entry.value === 'string' ? entry.value.trim() : ''
    const name = typeof entry.name === 'string' ? entry.name.trim() : ''
    if (preset === '' || name === '') throw new TypeError(`${label} carried an invalid entry`)
    return {
      value: preset,
      name,
      ...(typeof entry.description === 'string' && entry.description !== ''
        ? { description: entry.description }
        : {}),
    }
  })
}

/** Read `permissions.currentValue` out of one Session projection payload. */
function currentPermissionOf(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  const current = typeof value.currentValue === 'string' ? value.currentValue.trim() : ''
  return current === '' ? undefined : current
}

/** Map the Host command directory into the panel's discovery shape. */
function adaptCommandList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) throw new TypeError('commands/list returned an invalid directory')
  return value.map((entry) => {
    if (!isRecord(entry)) throw new TypeError('commands/list carried an invalid entry')
    const name = typeof entry.name === 'string' ? entry.name.trim() : ''
    if (name === '') throw new TypeError('commands/list carried an unnamed command')
    const input = isRecord(entry.input) ? entry.input : undefined
    const hint = typeof input?.hint === 'string' ? input.hint : undefined
    return {
      name,
      description: typeof entry.description === 'string' ? entry.description : '',
      ...(hint === undefined ? {} : { hint }),
      ...(typeof entry.definitionId === 'string' ? { definitionId: entry.definitionId } : {}),
    }
  })
}

/** Settle the Host command execution envelope; undefined means "unknown command". */
function adaptCommandExecution(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value) || typeof value.commandId !== 'string') return undefined
  const result = value.result
  if (!isRecord(result) || (result.kind !== 'success' && result.kind !== 'error')) {
    throw new TypeError('commands/execute returned an invalid result')
  }
  const text = typeof result.text === 'string' ? result.text : undefined
  return {
    commandId: value.commandId,
    result: {
      kind: result.kind,
      ...(text === undefined ? {} : { text }),
      ...(Number.isSafeInteger(result.sourceEventSeq) ? { sourceEventSeq: result.sourceEventSeq } : {}),
    },
  }
}

/** Map the Host skill directory into the panel's discovery shape. */
function adaptSkillList(value: unknown): Array<Record<string, unknown>> {
  const raw = isRecord(value) ? value.skills : undefined
  if (!Array.isArray(raw)) throw new TypeError('skills/list returned an invalid directory')
  return raw.map((entry) => {
    if (!isRecord(entry)) throw new TypeError('skills/list carried an invalid entry')
    const name = typeof entry.name === 'string' ? entry.name.trim() : ''
    if (name === '') throw new TypeError('skills/list carried an unnamed skill')
    return {
      name,
      description: typeof entry.description === 'string' ? entry.description : '',
      ...(typeof entry.whenToUse === 'string' ? { whenToUse: entry.whenToUse } : {}),
      modelInvocable: entry.modelInvocable === true,
      ...(typeof entry.path === 'string' ? { path: entry.path } : {}),
    }
  })
}

function badRequest(message: string): HostRpcResult {
  return { ok: false, error: badRequestFailure(message) }
}

function badRequestFailure(message: string): HostRpcFailure {
  return { code: 'bad-request', message, details: {} }
}

function isWorkspaceBaseline(value: unknown): value is {
  readonly type: 'baseline'
  readonly value: Record<string, unknown>
} {
  return isRecord(value) && value.type === 'baseline' && isRecord(value.value)
}

function isSessionSnapshot(value: unknown): value is {
  readonly type: 'snapshot'
  readonly cursor: number
  readonly records: readonly unknown[]
  readonly hasMore: boolean
  readonly projections?: unknown
  readonly assistantStream?: unknown
} {
  return isRecord(value)
    && value.type === 'snapshot'
    && Number.isSafeInteger(value.cursor)
    && (value.cursor as number) >= -1
    && (value.cursor as number) !== Number.MAX_SAFE_INTEGER
    && Array.isArray(value.records)
    && typeof value.hasMore === 'boolean'
}

function isSessionEventEntry(value: unknown): value is {
  readonly type: 'event'
  readonly event: Record<string, unknown>
} {
  return isRecord(value) && value.type === 'event' && isRecord(value.event)
}

function isRemoteEventReady(value: unknown): value is {
  readonly type: 'ready'
  readonly clientId: string
} {
  return isRecord(value) && value.type === 'ready'
    && typeof value.clientId === 'string' && value.clientId.length > 0
}
