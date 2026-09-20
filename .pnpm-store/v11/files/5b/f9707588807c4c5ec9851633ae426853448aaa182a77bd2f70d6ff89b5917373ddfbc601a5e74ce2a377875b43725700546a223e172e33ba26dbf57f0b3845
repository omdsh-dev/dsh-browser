var _IdleClock_maxIdleMs, _IdleClock_onExpire, _IdleClock_blockers, _IdleClock_armPending, _IdleClock_timer, _SessionToolRunner_instances, _SessionToolRunner_consumed, _SessionToolRunner_controller, _SessionToolRunner_detachExternal, _SessionToolRunner_requestOpts, _SessionToolRunner_toolByName, _SessionToolRunner_logger, _SessionToolRunner_seen, _SessionToolRunner_answered, _SessionToolRunner_confirmationVerdicts, _SessionToolRunner_awaitingConfirmation, _SessionToolRunner_results, _SessionToolRunner_inFlightCount, _SessionToolRunner_sendRetryWindowMs, _SessionToolRunner_onIdle, _SessionToolRunner_idleClock, _SessionToolRunner_requestOptions, _SessionToolRunner_streamLoop, _SessionToolRunner_reconcile, _SessionToolRunner_ingestHistory, _SessionToolRunner_handleStreamEvent, _SessionToolRunner_routeToolEvent, _SessionToolRunner_noteConfirmation, _SessionToolRunner_applyVerdict, _SessionToolRunner_surfaceCall, _SessionToolRunner_execute, _SessionToolRunner_sendResult, _SessionToolRunner_drain;
import { __classPrivateFieldGet, __classPrivateFieldSet } from "../../internal/tslib.mjs";
import { AnthropicError } from "../../core/error.mjs";
import { loggerFor } from "../../internal/utils/log.mjs";
import { sleep } from "../../internal/utils/sleep.mjs";
import { applyJitter, backoff, isFatal4xx } from "../../internal/utils/backoff.mjs";
import { linkAbort } from "../../internal/utils/abort.mjs";
import { AsyncQueue } from "../../internal/utils/async-queue.mjs";
import { buildHeaders } from "../../internal/headers.mjs";
import { helperHeader } from "../../internal/stainless-helper-header.mjs";
import { runRunnableTool, toolName } from "./BetaRunnableTool.mjs";
/** Beta header for the managed-agents API. */
export const MANAGED_AGENTS_BETA = 'managed-agents-2026-04-01';
const STREAM_BACKOFF_START_MS = 500;
const STREAM_BACKOFF_CAP_MS = 10000;
const TOOL_TIMEOUT_MS = 120000;
const DRAIN_TIMEOUT_MS = 30000;
const SEND_BACKOFF_START_MS = 1000;
const SEND_BACKOFF_CAP_MS = 30000;
/**
 * How long a transiently failing tool-result send keeps retrying when the
 * runner is used on its own: the server's default work-item lease TTL.
 * `EnvironmentWorker` overrides it with the live TTL from each lease heartbeat
 * (`_setSendRetryWindow`), so a send is only abandoned once the lease can no
 * longer be ours.
 */
const SEND_RETRY_WINDOW_MS = 5 * 60000;
/** Default {@link SessionToolRunnerOptions.maxIdleMs}: 60 seconds. */
export const DEFAULT_MAX_IDLE_MS = 60000;
/** Returns true if `ev` is a `session.status_idle` with `stop_reason` `end_turn`. */
function isEndTurnIdle(ev) {
    return ev.type === 'session.status_idle' && ev.stop_reason?.type === 'end_turn';
}
/**
 * The `maxIdleMs` stop-countdown, including its deferral. {@link noteEvent}
 * arms on `session.status_idle` with `stop_reason: end_turn` and disarms on
 * anything else. Gated tool work registered via {@link block} — a call held for
 * user confirmation, or a user-approved call still dispatching — keeps
 * {@link arm} pending until {@link unblock} retires the last blocker, at which
 * point the countdown starts. Event-driven — there is no polling watchdog.
 */
class IdleClock {
    constructor(maxIdleMs, onExpire) {
        _IdleClock_maxIdleMs.set(this, void 0);
        _IdleClock_onExpire.set(this, void 0);
        _IdleClock_blockers.set(this, new Set());
        // Set when arm() found blockers outstanding; the unblock that retires the
        // last blocker applies it. Cleared by any disarm.
        _IdleClock_armPending.set(this, false);
        _IdleClock_timer.set(this, void 0);
        __classPrivateFieldSet(this, _IdleClock_maxIdleMs, maxIdleMs, "f");
        __classPrivateFieldSet(this, _IdleClock_onExpire, onExpire, "f");
    }
    /**
     * Arm on `status_idle{end_turn}`; disarm otherwise. `user.tool_confirmation`
     * is neutral: it signals neither agent activity nor an idle, and its effect
     * on the clock flows through {@link block} / {@link unblock} instead —
     * disarming here would discard the pending arm the verdict is about to
     * settle.
     */
    noteEvent(ev) {
        if (ev.type === 'user.tool_confirmation')
            return;
        if (isEndTurnIdle(ev))
            this.arm();
        else
            this.disarm();
    }
    /** Register gated work that must resolve before an idle countdown starts. */
    block(toolUseId) {
        __classPrivateFieldGet(this, _IdleClock_blockers, "f").add(toolUseId);
        if (__classPrivateFieldGet(this, _IdleClock_timer, "f") !== undefined) {
            // Defensive: every caller disarms first (any event that routes a tool
            // call is itself a disarming event), but a countdown running when gated
            // work appears is stale evidence — the session is not idly waiting to
            // stop. Convert it into a pending arm rather than let it fire over the
            // gated call.
            __classPrivateFieldSet(this, _IdleClock_armPending, true, "f");
            clearTimeout(__classPrivateFieldGet(this, _IdleClock_timer, "f"));
            __classPrivateFieldSet(this, _IdleClock_timer, undefined, "f");
        }
    }
    /**
     * Retire gated work (a no-op for ids never blocked); applies a pending arm —
     * with a fresh full `maxIdleMs` window — once the last blocker retires.
     */
    unblock(toolUseId) {
        __classPrivateFieldGet(this, _IdleClock_blockers, "f").delete(toolUseId);
        if (__classPrivateFieldGet(this, _IdleClock_blockers, "f").size === 0 && __classPrivateFieldGet(this, _IdleClock_armPending, "f"))
            this.arm();
    }
    /**
     * (Re)start the idle countdown — or, while blockers are outstanding, hold
     * the arm pending instead. Stopping then would drop a held call when its
     * verdict later arrives, or cut the runner off before a released call's
     * result can drive the next turn.
     */
    arm() {
        if (__classPrivateFieldGet(this, _IdleClock_maxIdleMs, "f") <= 0)
            return;
        if (__classPrivateFieldGet(this, _IdleClock_blockers, "f").size > 0) {
            __classPrivateFieldSet(this, _IdleClock_armPending, true, "f");
            return;
        }
        __classPrivateFieldSet(this, _IdleClock_armPending, false, "f");
        if (__classPrivateFieldGet(this, _IdleClock_timer, "f") !== undefined)
            clearTimeout(__classPrivateFieldGet(this, _IdleClock_timer, "f"));
        __classPrivateFieldSet(this, _IdleClock_timer, setTimeout(__classPrivateFieldGet(this, _IdleClock_onExpire, "f"), __classPrivateFieldGet(this, _IdleClock_maxIdleMs, "f")), "f");
    }
    /**
     * Cancel the idle countdown and any pending arm. Blockers persist — they
     * track real outstanding work, retired only by {@link unblock}.
     */
    disarm() {
        __classPrivateFieldSet(this, _IdleClock_armPending, false, "f");
        if (__classPrivateFieldGet(this, _IdleClock_timer, "f") !== undefined) {
            clearTimeout(__classPrivateFieldGet(this, _IdleClock_timer, "f"));
            __classPrivateFieldSet(this, _IdleClock_timer, undefined, "f");
        }
    }
}
_IdleClock_maxIdleMs = new WeakMap(), _IdleClock_onExpire = new WeakMap(), _IdleClock_blockers = new WeakMap(), _IdleClock_armPending = new WeakMap(), _IdleClock_timer = new WeakMap();
/**
 * The sessions-side counterpart to `client.beta.messages.toolRunner`: an
 * async-iterable that attaches to a managed-agents session, executes every
 * incoming `agent.tool_use` and `agent.custom_tool_use` event against a local
 * tool registry, posts the matching result back (`user.tool_result` for the
 * former, `user.custom_tool_result` for the latter), and yields one
 * {@link DispatchedToolCall} per completed call. Server-side `agent.mcp_tool_use`
 * calls are not dispatched. Internally drives event-stream reconnect and result
 * posting.
 *
 * A call the server gated with `evaluated_permission: "ask"` (the `always_ask`
 * policy — or any value this SDK doesn't recognize, which fails closed) is held
 * until its `user.tool_confirmation` arrives: only an explicit `allow` runs it;
 * `deny` — or any verdict this SDK doesn't recognize, failing closed — is never
 * executed and posts nothing (the denial resolves the call server-side), but is
 * still yielded (`confirmation="deny"`, `posted=false`, `result=undefined`) so
 * the consumer can observe it. A held call — and a user-approved one still
 * dispatching — defers the `maxIdleMs` countdown, so an `end_turn` idle
 * observed in the meantime cannot stop the runner: it waits until the verdict
 * arrives, the session terminates, or the abort signal fires — pass
 * `AbortSignal.timeout(...)` for a wall-clock bound.
 *
 * Iteration ends when the session terminates (`session.status_terminated` /
 * `session.deleted`), when the consumer `break`s out of the loop or aborts the
 * supplied signal, or — once the session has gone idle with
 * `stop_reason.type === "end_turn"` — when `maxIdleMs` elapses with no new
 * event (any new event resets that countdown; it re-arms on the next `end_turn`
 * idle; `maxIdleMs <= 0` disables it). The `finally` branch drains any in-flight
 * tool calls and runs each tool's `close()` cleanup hook. It does *not* touch
 * the work-item lease — wrap it in an `EnvironmentWorker` if you need
 * heartbeating / force-stop.
 *
 * @example
 * ```ts
 * import { betaAgentToolset20260401 } from '@anthropic-ai/sdk/tools/agent-toolset/node';
 *
 * for await (const call of client.beta.sessions.events.toolRunner(work.data.id, {
 *   tools: [...betaAgentToolset20260401({ workdir }), myTool],
 * })) {
 *   console.log(`${call.name} -> ${call.isError ? 'error' : 'ok'}`);
 * }
 * ```
 */
export class SessionToolRunner {
    constructor(sessionId, opts) {
        _SessionToolRunner_instances.add(this);
        _SessionToolRunner_consumed.set(this, false);
        _SessionToolRunner_controller.set(this, void 0);
        _SessionToolRunner_detachExternal.set(this, void 0);
        _SessionToolRunner_requestOpts.set(this, void 0);
        _SessionToolRunner_toolByName.set(this, void 0);
        _SessionToolRunner_logger.set(this, void 0);
        _SessionToolRunner_seen.set(this, new Set());
        _SessionToolRunner_answered.set(this, new Set());
        // Confirmation gating (`always_ask` tools): `#confirmationVerdicts` records
        // every `user.tool_confirmation` verdict by `tool_use_id`;
        // `#awaitingConfirmation` holds the tool-call events whose
        // `evaluated_permission` is `ask` and whose verdict has not arrived —
        // released (or resolved as denied) by `#noteConfirmation` / the next
        // reconcile pass. Like `#seen` and `#answered`, `#confirmationVerdicts` is
        // per-session O(tool calls): recorded verdicts persist for the life of the run.
        _SessionToolRunner_confirmationVerdicts.set(this, new Map());
        _SessionToolRunner_awaitingConfirmation.set(this, new Map());
        _SessionToolRunner_results.set(this, new AsyncQueue());
        _SessionToolRunner_inFlightCount.set(this, 0);
        _SessionToolRunner_sendRetryWindowMs.set(this, SEND_RETRY_WINDOW_MS);
        _SessionToolRunner_onIdle.set(this, null);
        _SessionToolRunner_idleClock.set(this, void 0);
        this.client = opts.client;
        this.sessionId = sessionId;
        this.tools = opts.tools;
        this.maxIdleMs = opts.maxIdleMs ?? DEFAULT_MAX_IDLE_MS;
        __classPrivateFieldSet(this, _SessionToolRunner_logger, loggerFor(opts.client), "f");
        __classPrivateFieldSet(this, _SessionToolRunner_toolByName, new Map(opts.tools.map((t) => [toolName(t), t])), "f");
        __classPrivateFieldSet(this, _SessionToolRunner_controller, new AbortController(), "f");
        __classPrivateFieldSet(this, _SessionToolRunner_detachExternal, linkAbort(opts.signal, __classPrivateFieldGet(this, _SessionToolRunner_controller, "f")), "f");
        __classPrivateFieldSet(this, _SessionToolRunner_requestOpts, opts.requestOptions, "f");
        __classPrivateFieldSet(this, _SessionToolRunner_idleClock, new IdleClock(this.maxIdleMs, () => {
            __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info('session idle after end_turn; stopping', {
                component: 'session-tool-runner',
                session_id: this.sessionId,
                max_idle_ms: this.maxIdleMs,
            });
            __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
        }), "f");
    }
    /** Read-only view of this runner's abort signal. */
    get signal() {
        return __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal;
    }
    /** Abort the runner. Background tasks will wind down and `for await` will exit cleanly. */
    abort() {
        __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
    }
    /**
     * @internal
     * `EnvironmentWorker` keeps this equal to the lease TTL each heartbeat
     * reports; applies to a send already retrying.
     */
    _setSendRetryWindow(ms) {
        __classPrivateFieldSet(this, _SessionToolRunner_sendRetryWindowMs, ms, "f");
    }
    async *[(_SessionToolRunner_consumed = new WeakMap(), _SessionToolRunner_controller = new WeakMap(), _SessionToolRunner_detachExternal = new WeakMap(), _SessionToolRunner_requestOpts = new WeakMap(), _SessionToolRunner_toolByName = new WeakMap(), _SessionToolRunner_logger = new WeakMap(), _SessionToolRunner_seen = new WeakMap(), _SessionToolRunner_answered = new WeakMap(), _SessionToolRunner_confirmationVerdicts = new WeakMap(), _SessionToolRunner_awaitingConfirmation = new WeakMap(), _SessionToolRunner_results = new WeakMap(), _SessionToolRunner_inFlightCount = new WeakMap(), _SessionToolRunner_sendRetryWindowMs = new WeakMap(), _SessionToolRunner_onIdle = new WeakMap(), _SessionToolRunner_idleClock = new WeakMap(), _SessionToolRunner_instances = new WeakSet(), Symbol.asyncIterator)]() {
        if (__classPrivateFieldGet(this, _SessionToolRunner_consumed, "f")) {
            throw new AnthropicError('Cannot iterate over a consumed SessionToolRunner');
        }
        __classPrivateFieldSet(this, _SessionToolRunner_consumed, true, "f");
        __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info('session tool runner starting', {
            component: 'session-tool-runner',
            session_id: this.sessionId,
        });
        // The one background promise: drives the event stream and dispatches tools.
        // Its `.catch` aborts the controller so the main loop unwinds.
        const streamPromise = __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_streamLoop).call(this).catch((e) => {
            if (!__classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal.aborted) {
                __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").error('stream loop failed', { error: String(e) });
            }
            __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
        });
        try {
            // Phase 1: yield results as they arrive. `next(signal)` resolves
            // `done: true` when the controller aborts — cancellation is handled in
            // the queue read, no outer `Promise.race` needed.
            while (true) {
                const next = await __classPrivateFieldGet(this, _SessionToolRunner_results, "f").next(__classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal);
                if (next.done)
                    break;
                yield next.value;
            }
            // Phase 2: let the stream loop settle (and push any final results), then
            // drain whatever is still queued before closing.
            await streamPromise;
            let pending;
            while ((pending = __classPrivateFieldGet(this, _SessionToolRunner_results, "f").tryShift()) !== undefined) {
                yield pending;
            }
        }
        finally {
            __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
            __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").disarm();
            // Re-await defensively in case the consumer broke out of phase 1 before
            // phase 2 ran — a no-op if it already settled.
            await streamPromise;
            try {
                await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_drain).call(this);
            }
            catch (e) {
                __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn('drain failed', { error: String(e) });
            }
            __classPrivateFieldGet(this, _SessionToolRunner_results, "f").close();
            for (const t of this.tools) {
                try {
                    // `close` is typed `() => Promisable<void>`, so a single `await`
                    // covers both the sync and async return.
                    await t.close?.();
                }
                catch (e) {
                    __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn('tool.close failed', { tool: toolName(t), error: String(e) });
                }
            }
            // Detach from the external signal so the consumer can drop their signal
            // reference without leaking this iterator instance.
            __classPrivateFieldGet(this, _SessionToolRunner_detachExternal, "f").call(this);
        }
    }
}
_SessionToolRunner_requestOptions = function _SessionToolRunner_requestOptions() {
    return {
        ...__classPrivateFieldGet(this, _SessionToolRunner_requestOpts, "f"),
        headers: buildHeaders([helperHeader('session-tool-runner'), __classPrivateFieldGet(this, _SessionToolRunner_requestOpts, "f")?.headers]),
        signal: __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal,
    };
}, _SessionToolRunner_streamLoop = 
// ===== event stream =====
async function _SessionToolRunner_streamLoop() {
    const ctrl = __classPrivateFieldGet(this, _SessionToolRunner_controller, "f");
    let backoff = STREAM_BACKOFF_START_MS;
    while (!ctrl.signal.aborted) {
        try {
            // Establish the event stream *before* reconciling history, so an event
            // emitted in the gap between listing and attaching is buffered on the
            // stream rather than lost. `seen`/`answered` dedup any event that shows
            // up both in the reconcile pass and on the live stream.
            const stream = await this.client.beta.sessions.events.stream(this.sessionId, {}, __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_requestOptions).call(this));
            await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_reconcile).call(this);
            for await (const ev of stream) {
                backoff = STREAM_BACKOFF_START_MS;
                if (await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_handleStreamEvent).call(this, ev))
                    return;
            }
        }
        catch (e) {
            // An abort throws to unwind the caller (the iterator's `streamPromise`
            // `.catch`) rather than returning early and letting it carry on.
            ctrl.signal.throwIfAborted();
            if (isFatal4xx(e)) {
                __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").error('permanent stream failure, shutting down', { error: String(e) });
                ctrl.abort();
                throw e;
            }
            __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn('stream disconnected, reconnecting', {
                error: String(e),
                backoff_ms: backoff,
            });
        }
        ctrl.signal.throwIfAborted();
        await sleep(backoff, ctrl.signal);
        backoff = Math.min(backoff * 2, STREAM_BACKOFF_CAP_MS);
    }
}, _SessionToolRunner_reconcile = 
/**
 * Read full history before dispatching so a `tool_use` whose result appears
 * later in the same history is not re-executed. Runs after the live stream is
 * already attached (see {@link SessionToolRunner.#streamLoop}).
 */
async function _SessionToolRunner_reconcile() {
    const ctrl = __classPrivateFieldGet(this, _SessionToolRunner_controller, "f");
    const pending = [];
    let lastWasEndTurn = false;
    try {
        for await (const ev of this.client.beta.sessions.events.list(this.sessionId, { limit: 1000 }, __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_requestOptions).call(this))) {
            __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_ingestHistory).call(this, ev, pending);
            lastWasEndTurn = isEndTurnIdle(ev);
        }
    }
    catch (e) {
        // An abort throws to unwind the caller; a real list failure is
        // non-fatal — undo the speculative `seen` entries and let `#streamLoop`
        // carry on with the live stream.
        ctrl.signal.throwIfAborted();
        __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn('reconcile list failed', { error: String(e) });
        // If list itself failed, undo the speculative `seen` entries so the next
        // reconcile pass (or the live stream) can pick them up. Leave the idle
        // timer untouched — the history we read may be incomplete.
        for (const ev of pending)
            __classPrivateFieldGet(this, _SessionToolRunner_seen, "f").delete(ev.id);
        return;
    }
    const unanswered = pending.filter((ev) => !__classPrivateFieldGet(this, _SessionToolRunner_answered, "f").has(ev.id));
    // Disarm before routing: `#execute` runs inline here, so a timer left armed
    // from before the reconnect could fire over an in-flight tool.
    __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").disarm();
    for (const ev of unanswered)
        await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_routeToolEvent).call(this, ev);
    // A held call's verdict is normally applied by the routing pass above; if
    // its tool_use fell outside the listed window the pass never saw it, so
    // apply the verdict to the held copy here.
    for (const held of [...__classPrivateFieldGet(this, _SessionToolRunner_awaitingConfirmation, "f").values()]) {
        const verdict = __classPrivateFieldGet(this, _SessionToolRunner_confirmationVerdicts, "f").get(held.id);
        if (verdict !== undefined)
            await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_applyVerdict).call(this, held, verdict);
    }
    // Routing resolves denied calls in place (marking them answered) and holds
    // ask-gated calls for their `user.tool_confirmation`. If the most recent
    // event in history is an `end_turn` idle and no tool work is outstanding,
    // the session is done — arm the idle clock so the runner stops even if that
    // `end_turn` arrived during a disconnect. A held call is not outstanding
    // here: it blocks the clock, so this arm stays pending until the verdict
    // (and, for an allow, the dispatch it releases) resolves it.
    const outstanding = unanswered.filter((ev) => !__classPrivateFieldGet(this, _SessionToolRunner_answered, "f").has(ev.id) && !__classPrivateFieldGet(this, _SessionToolRunner_awaitingConfirmation, "f").has(ev.id));
    if (lastWasEndTurn && outstanding.length === 0)
        __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").arm();
    else
        __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").disarm();
}, _SessionToolRunner_ingestHistory = function _SessionToolRunner_ingestHistory(ev, pending) {
    if (ev.type === 'agent.tool_use' || ev.type === 'agent.custom_tool_use') {
        // Mark the event seen so a replay on the live stream is not dispatched
        // twice, but decide whether it still needs executing from `answered`, not
        // `seen`: a call whose result post failed is seen-but-unanswered, and must
        // be retried on the next reconcile pass rather than silently dropped.
        __classPrivateFieldGet(this, _SessionToolRunner_seen, "f").add(ev.id);
        if (!__classPrivateFieldGet(this, _SessionToolRunner_answered, "f").has(ev.id))
            pending.push(ev);
    }
    else if (ev.type === 'user.tool_result') {
        __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.tool_use_id);
    }
    else if (ev.type === 'user.custom_tool_result') {
        __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.custom_tool_use_id);
    }
    else if (ev.type === 'user.tool_confirmation') {
        // Record the verdict only, before the pending pass, so a call whose
        // confirmation appears later in the same history routes with its verdict
        // already known. Releasing a held call here as well would dispatch it a
        // second time when the routing pass reaches its tool_use event.
        if (!__classPrivateFieldGet(this, _SessionToolRunner_answered, "f").has(ev.tool_use_id))
            __classPrivateFieldGet(this, _SessionToolRunner_confirmationVerdicts, "f").set(ev.tool_use_id, ev.result);
    }
}, _SessionToolRunner_handleStreamEvent = 
/** Returns true when the runner should exit. */
async function _SessionToolRunner_handleStreamEvent(ev) {
    __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").noteEvent(ev);
    switch (ev.type) {
        case 'agent.tool_use':
        case 'agent.custom_tool_use':
            if (!__classPrivateFieldGet(this, _SessionToolRunner_seen, "f").has(ev.id)) {
                __classPrivateFieldGet(this, _SessionToolRunner_seen, "f").add(ev.id);
                await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_routeToolEvent).call(this, ev);
            }
            return false;
        case 'user.tool_confirmation':
            await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_noteConfirmation).call(this, ev);
            return false;
        case 'user.tool_result':
            __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.tool_use_id);
            return false;
        case 'user.custom_tool_result':
            __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.custom_tool_use_id);
            return false;
        case 'session.status_terminated':
        case 'session.deleted':
            __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info('session terminated', {
                component: 'session-tool-runner',
                session_id: this.sessionId,
            });
            __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
            return true;
        default:
            return false;
    }
}, _SessionToolRunner_routeToolEvent = 
// ===== confirmation gating (always_ask tools) =====
/**
 * Dispatch `ev`, honoring its evaluated permission. A call the server gated
 * (`evaluated_permission == "ask"`) is held until its `user.tool_confirmation`
 * arrives. Fails closed: only an explicit `allow` verdict releases a gated
 * call; a server-side `deny` overrides any recorded verdict; an unrecognized
 * permission is held like `ask` and an unrecognized verdict is denied.
 */
async function _SessionToolRunner_routeToolEvent(ev) {
    // `getattr`-style read: today only `agent.tool_use` carries
    // `evaluated_permission`, but if it ever lands on `agent.custom_tool_use`
    // the gate must keep failing closed rather than dispatch by event type.
    const permission = ev.evaluated_permission;
    // A server-side `deny` overrides any (stray) recorded verdict.
    const verdict = permission === 'deny' ? 'deny' : __classPrivateFieldGet(this, _SessionToolRunner_confirmationVerdicts, "f").get(ev.id);
    if (verdict === undefined) {
        if (permission === undefined || permission === 'allow') {
            await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_execute).call(this, ev, undefined);
        }
        else if (!__classPrivateFieldGet(this, _SessionToolRunner_awaitingConfirmation, "f").has(ev.id)) {
            // "ask" — or a permission this SDK does not recognize, which must not
            // dispatch unconfirmed — waits for the user's verdict. (Already-held: a
            // reconcile after reconnect re-routes the call; keep the existing hold.)
            __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info('tool call awaiting confirmation; holding', {
                component: 'session-tool-runner',
                session_id: this.sessionId,
                tool: ev.name,
                tool_use_id: ev.id,
            });
            __classPrivateFieldGet(this, _SessionToolRunner_awaitingConfirmation, "f").set(ev.id, ev);
            __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").block(ev.id);
        }
        return;
    }
    await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_applyVerdict).call(this, ev, verdict);
}, _SessionToolRunner_noteConfirmation = 
/** Record an allow/deny verdict and release the held call it gates, if any. */
async function _SessionToolRunner_noteConfirmation(ev) {
    __classPrivateFieldGet(this, _SessionToolRunner_confirmationVerdicts, "f").set(ev.tool_use_id, ev.result);
    const held = __classPrivateFieldGet(this, _SessionToolRunner_awaitingConfirmation, "f").get(ev.tool_use_id);
    // Nothing held: the verdict gates a call this runner has not seen yet (or
    // one it never gates, e.g. an `agent.mcp_tool_use`). Keeping it in
    // `#confirmationVerdicts` lets a later route of that call resolve instantly.
    if (held === undefined)
        return;
    await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_applyVerdict).call(this, held, ev.result);
}, _SessionToolRunner_applyVerdict = 
/**
 * Dispatch or resolve a gated call according to its verdict.
 *
 * The idle-clock blocker accounting lives here: a denial retires the held
 * call's blocker, while an allow keeps one on the call — taking it now if the
 * verdict was already known when the call was routed, so it was never held —
 * until `#execute` has finished with it. The countdown must not run over
 * gated work that is still in flight.
 */
async function _SessionToolRunner_applyVerdict(ev, verdict) {
    const wasHeld = __classPrivateFieldGet(this, _SessionToolRunner_awaitingConfirmation, "f").delete(ev.id);
    if (verdict === 'allow') {
        __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info('tool call confirmed', {
            component: 'session-tool-runner',
            session_id: this.sessionId,
            tool: ev.name,
            tool_use_id: ev.id,
        });
        if (!wasHeld)
            __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").block(ev.id);
        try {
            await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_execute).call(this, ev, 'allow');
        }
        finally {
            // The approved call is fully disposed of (executed, or moot because it
            // was answered elsewhere) — the sole place an allow's blocker retires.
            __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").unblock(ev.id);
        }
        return;
    }
    // "deny" — or any value other than an explicit "allow" (fail closed). The
    // denial resolves the call server-side, so mark it answered and yield it
    // (nothing ran, nothing posted).
    if (wasHeld)
        __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").unblock(ev.id);
    __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.id);
    __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info('tool call denied; not executing', {
        component: 'session-tool-runner',
        session_id: this.sessionId,
        tool: ev.name,
        tool_use_id: ev.id,
    });
    __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_surfaceCall).call(this, {
        event: ev,
        toolUseId: ev.id,
        name: ev.name,
        isError: false,
        posted: false,
        confirmation: 'deny',
    });
}, _SessionToolRunner_surfaceCall = function _SessionToolRunner_surfaceCall(call) {
    __classPrivateFieldGet(this, _SessionToolRunner_results, "f").push(call);
}, _SessionToolRunner_execute = 
// ===== tool execution =====
async function _SessionToolRunner_execute(ev, confirmation) {
    var _a, _b;
    if (__classPrivateFieldGet(this, _SessionToolRunner_answered, "f").has(ev.id))
        return;
    __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info('executing tool', {
        component: 'session-tool-runner',
        session_id: this.sessionId,
        tool: ev.name,
        tool_use_id: ev.id,
    });
    __classPrivateFieldSet(this, _SessionToolRunner_inFlightCount, (_a = __classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f"), _a++, _a), "f");
    try {
        const tool = __classPrivateFieldGet(this, _SessionToolRunner_toolByName, "f").get(ev.name);
        if (!tool) {
            // Skip (split-client partial fulfilment): a name this runner
            // is not registered for belongs to the other client servicing this
            // session (typically the customer's app backend handling custom tools).
            // Post NO result, do not mark it answered, and leave the tool_use_id
            // pending for its owner — claiming it would corrupt the conversation.
            // Still yield the call so the consumer can observe the unowned
            // dispatch; nothing was sent, so `posted`/`isError` stay false and no
            // `result` event is populated. The id stays unanswered, so reconcile
            // keeps it out of the idle/end-turn accounting and re-surfaces it after
            // a reconnect until its owner answers it.
            __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info('tool not owned by this runner; leaving the tool_use_id pending for its owner', {
                component: 'session-tool-runner',
                session_id: this.sessionId,
                tool: ev.name,
                tool_use_id: ev.id,
            });
            __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_surfaceCall).call(this, {
                event: ev,
                toolUseId: ev.id,
                name: ev.name,
                isError: false,
                posted: false,
                confirmation,
            });
            return;
        }
        let content;
        let isError;
        // Per-tool controller: aborts on the runner's own signal *or* the
        // per-tool timeout, so an in-flight tool stops promptly when the runner
        // is aborted instead of running until the timeout.
        const toolCtrl = new AbortController();
        const detachTool = linkAbort(__classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal, toolCtrl);
        const timer = setTimeout(() => toolCtrl.abort(), TOOL_TIMEOUT_MS);
        try {
            // Pass the source `agent.tool_use` / `agent.custom_tool_use` event
            // straight through as the run context's `toolUse` — it is a union
            // member of `BetaToolUse`, no Messages-block adapter needed.
            const outcome = await runRunnableTool(tool, ev.input, {
                toolUse: ev,
                toolUseBlock: ev,
                signal: toolCtrl.signal,
            });
            content = outcome.content;
            isError = outcome.isError;
        }
        finally {
            clearTimeout(timer);
            detachTool();
        }
        // Answer with the result event that matches the call kind: a
        // `user.tool_result` for an `agent.tool_use`, a `user.custom_tool_result`
        // for an `agent.custom_tool_use`. Posting the wrong one leaves the call
        // unanswered and the session stuck.
        const result = buildResultEvent(ev, isError, toSessionContent(content));
        const posted = await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_sendResult).call(this, result, ev.id);
        __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_surfaceCall).call(this, {
            event: ev,
            result,
            toolUseId: ev.id,
            name: ev.name,
            isError,
            posted,
            confirmation,
        });
    }
    finally {
        __classPrivateFieldSet(this, _SessionToolRunner_inFlightCount, (_b = __classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f"), _b--, _b), "f");
        if (__classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f") === 0)
            __classPrivateFieldGet(this, _SessionToolRunner_onIdle, "f")?.call(this);
    }
}, _SessionToolRunner_sendResult = async function _SessionToolRunner_sendResult(result, toolUseId) {
    const ctrl = __classPrivateFieldGet(this, _SessionToolRunner_controller, "f");
    const start = Date.now();
    let lastErr;
    let attempt = 0;
    while (true) {
        attempt++;
        // An abort throws to unwind the caller rather than returning a
        // `posted: false` result the iterator would carry on past.
        ctrl.signal.throwIfAborted();
        try {
            await this.client.beta.sessions.events.send(this.sessionId, { events: [result] }, __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_requestOptions).call(this));
            __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(toolUseId);
            return true;
        }
        catch (e) {
            lastErr = e;
            // Only short-circuit on a permanent 4xx; 408/409/429 deserve the
            // remaining retries (aligned with the core client's retry policy).
            if (isFatal4xx(e))
                break;
            const remainingMs = __classPrivateFieldGet(this, _SessionToolRunner_sendRetryWindowMs, "f") - (Date.now() - start);
            if (remainingMs <= 0)
                break;
            const waitMs = Math.min(applyJitter(backoff(attempt - 1, SEND_BACKOFF_START_MS, SEND_BACKOFF_CAP_MS)), remainingMs);
            __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn('tool result send failed; retrying', {
                tool_use_id: toolUseId,
                attempt,
                backoff_ms: waitMs,
                error: String(e),
            });
            await sleep(waitMs, ctrl.signal);
        }
    }
    __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").error('failed to send tool result', {
        tool_use_id: toolUseId,
        attempts: attempt,
        error: String(lastErr),
    });
    return false;
}, _SessionToolRunner_drain = 
/** Wait (bounded) for in-flight tool executions to finish during teardown. */
async function _SessionToolRunner_drain() {
    if (__classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f") === 0)
        return;
    await Promise.race([new Promise((r) => (__classPrivateFieldSet(this, _SessionToolRunner_onIdle, r, "f"))), sleep(DRAIN_TIMEOUT_MS)]);
    __classPrivateFieldSet(this, _SessionToolRunner_onIdle, null, "f");
    if (__classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f") > 0) {
        __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn('drain timeout exceeded');
    }
};
/**
 * Build the result event that answers `ev`: a `user.tool_result` for a builtin
 * `agent.tool_use`, a `user.custom_tool_result` for a custom
 * `agent.custom_tool_use`. The two `(use, result)` pairs are distinct API event
 * types and must be matched exactly — a `user.tool_result` does not answer a
 * custom tool call.
 */
function buildResultEvent(ev, isError, content) {
    if (ev.type === 'agent.custom_tool_use') {
        return { type: 'user.custom_tool_result', custom_tool_use_id: ev.id, is_error: isError, content };
    }
    return { type: 'user.tool_result', tool_use_id: ev.id, is_error: isError, content };
}
// The Messages-API tool-result block union is wider than the Sessions-API
// tool_result content union; pass through text/image/document and stringify
// anything else so a BetaRunnableTool authored for toolRunner still works here.
function toSessionContent(content) {
    if (typeof content === 'string')
        return [{ type: 'text', text: content || '(no output)' }];
    const out = content.map((b) => {
        if (b.type === 'text')
            return { type: 'text', text: b.text || '(no output)' };
        if (b.type === 'image' || b.type === 'document')
            return b;
        if (b.type === 'search_result') {
            // The Messages `search_result` block param maps field-for-field onto the
            // Sessions `BetaManagedAgentsSearchResultBlock`; map it explicitly rather
            // than letting it fall through to the JSON.stringify branch (which would
            // bury a structured result inside a text block). `citations` is required
            // on the Sessions side and optional on the Messages side — default the
            // flag to `false` when the producer left it unset.
            return {
                type: 'search_result',
                source: b.source,
                title: b.title,
                content: b.content.map((c) => ({ type: 'text', text: c.text })),
                citations: { enabled: b.citations?.enabled ?? false },
            };
        }
        return { type: 'text', text: JSON.stringify(b) };
    });
    return out.length > 0 ? out : [{ type: 'text', text: '(no output)' }];
}
//# sourceMappingURL=SessionToolRunner.mjs.map