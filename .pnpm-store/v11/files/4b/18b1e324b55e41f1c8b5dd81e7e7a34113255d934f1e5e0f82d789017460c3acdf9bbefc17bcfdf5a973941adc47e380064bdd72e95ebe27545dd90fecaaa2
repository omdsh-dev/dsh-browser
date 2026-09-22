var _WorkPoller_runnerClient, _WorkPoller_consumed, _WorkPoller_controller, _WorkPoller_detachExternal, _WorkPoller_autoStop, _WorkPoller_drain, _WorkPoller_blockMs, _WorkPoller_reclaimOlderThanMs, _WorkPoller_requestOpts, _IdleLog_log, _IdleLog_environmentId, _IdleLog_idleSince, _IdleLog_lastReport;
import { __classPrivateFieldGet, __classPrivateFieldSet } from "../../internal/tslib.mjs";
import { AnthropicError } from "../../core/error.mjs";
import { loggerFor } from "../../internal/utils/log.mjs";
import { sleep } from "../../internal/utils/sleep.mjs";
import { uuid4 } from "../../internal/utils/uuid.mjs";
import { linkAbort } from "../../internal/utils/abort.mjs";
import { buildHeaders } from "../../internal/headers.mjs";
import { applyJitter, backoff as expBackoff, isFatal4xx, isStatus, jitter, } from "../../internal/utils/backoff.mjs";
import { copyClientForHelper } from "../helper-client.mjs";
export { is4xx, isFatal4xx, isStatus, jitter } from "../../internal/utils/backoff.mjs";
// API caps block_ms at 999; rely on client-side jitter between empty polls.
export const POLL_BLOCK_MS = 999;
const POLL_BACKOFF_BASE_MS = 1000;
const POLL_BACKOFF_CAP_MS = 60000;
const IDLE_REPORT_INTERVAL_MS = 300000;
/**
 * Async-iterable that long-polls a self-hosted environment for work, ack's
 * each item, yields the {@link BetaSelfHostedWork} item, and posts `stop` after
 * the consumer's loop body returns (or when the consumer `break`s).
 *
 * A yielded item may carry a per-item `secret` payload (populated only by the
 * poll response); the poller passes it through untouched — consumers such as
 * {@link EnvironmentWorker} extract the sessions token it carries and prefer
 * that over the environment key for the item's downstream calls. Treat it as
 * opaque and never log it.
 *
 * @example
 * ```ts
 * for await (const work of client.beta.environments.work.poller({
 *   environmentId,
 *   environmentKey,
 * })) {
 *   // ...service the work...
 * }
 * ```
 */
export class WorkPoller {
    constructor(opts) {
        // Sub-client scoped to the environment key. Every poll / ack / stop call
        // is routed through this so the parent's `X-Api-Key` never lands on the
        // wire alongside the bearer credential. The helper-telemetry header is
        // attached as a default on this client; per-call plumbing is unnecessary.
        _WorkPoller_runnerClient.set(this, void 0);
        _WorkPoller_consumed.set(this, false);
        _WorkPoller_controller.set(this, void 0);
        _WorkPoller_detachExternal.set(this, void 0);
        _WorkPoller_autoStop.set(this, void 0);
        _WorkPoller_drain.set(this, void 0);
        _WorkPoller_blockMs.set(this, void 0);
        _WorkPoller_reclaimOlderThanMs.set(this, void 0);
        _WorkPoller_requestOpts.set(this, void 0);
        this.client = opts.client;
        this.environmentId = opts.environmentId;
        this.environmentKey = opts.environmentKey;
        this.workerId = opts.workerId ?? defaultWorkerId();
        __classPrivateFieldSet(this, _WorkPoller_runnerClient, copyClientForHelper(opts.client, {
            authToken: opts.environmentKey,
            helper: 'environments-work-poller',
        }), "f");
        __classPrivateFieldSet(this, _WorkPoller_autoStop, opts.autoStop ?? true, "f");
        __classPrivateFieldSet(this, _WorkPoller_drain, opts.drain ?? false, "f");
        // `undefined` => default to the API cap; an explicit `null` => omit
        // `block_ms` for a non-blocking poll.
        __classPrivateFieldSet(this, _WorkPoller_blockMs, opts.blockMs === undefined ? POLL_BLOCK_MS : opts.blockMs, "f");
        __classPrivateFieldSet(this, _WorkPoller_reclaimOlderThanMs, opts.reclaimOlderThanMs ?? null, "f");
        __classPrivateFieldSet(this, _WorkPoller_requestOpts, opts.requestOptions, "f");
        __classPrivateFieldSet(this, _WorkPoller_controller, new AbortController(), "f");
        __classPrivateFieldSet(this, _WorkPoller_detachExternal, linkAbort(opts.signal, __classPrivateFieldGet(this, _WorkPoller_controller, "f")), "f");
    }
    /** Read-only view of this iterator's abort signal. */
    get signal() {
        return __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal;
    }
    /** Abort the iterator. The current `for await` will exit cleanly. */
    abort() {
        __classPrivateFieldGet(this, _WorkPoller_controller, "f").abort();
    }
    async *[(_WorkPoller_runnerClient = new WeakMap(), _WorkPoller_consumed = new WeakMap(), _WorkPoller_controller = new WeakMap(), _WorkPoller_detachExternal = new WeakMap(), _WorkPoller_autoStop = new WeakMap(), _WorkPoller_drain = new WeakMap(), _WorkPoller_blockMs = new WeakMap(), _WorkPoller_reclaimOlderThanMs = new WeakMap(), _WorkPoller_requestOpts = new WeakMap(), Symbol.asyncIterator)]() {
        if (__classPrivateFieldGet(this, _WorkPoller_consumed, "f")) {
            throw new AnthropicError('Cannot iterate over a consumed WorkPoller');
        }
        __classPrivateFieldSet(this, _WorkPoller_consumed, true, "f");
        const log = loggerFor(this.client);
        log.info('poller starting', {
            component: 'work-poller',
            environment_id: this.environmentId,
        });
        const idle = new IdleLog(log, this.environmentId);
        try {
            let attempt = 0;
            while (!__classPrivateFieldGet(this, _WorkPoller_controller, "f").signal.aborted) {
                let work;
                try {
                    work = await __classPrivateFieldGet(this, _WorkPoller_runnerClient, "f").beta.environments.work.poll(this.environmentId, {
                        'Anthropic-Worker-ID': this.workerId,
                        ...(__classPrivateFieldGet(this, _WorkPoller_blockMs, "f") !== null ? { block_ms: __classPrivateFieldGet(this, _WorkPoller_blockMs, "f") } : {}),
                        ...(__classPrivateFieldGet(this, _WorkPoller_reclaimOlderThanMs, "f") !== null ?
                            { reclaim_older_than_ms: __classPrivateFieldGet(this, _WorkPoller_reclaimOlderThanMs, "f") }
                            : {}),
                    }, { headers: buildHeaders([__classPrivateFieldGet(this, _WorkPoller_requestOpts, "f")?.headers]), signal: __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal });
                }
                catch (e) {
                    if (__classPrivateFieldGet(this, _WorkPoller_controller, "f").signal.aborted)
                        return;
                    // A bad environment key / missing environment never recovers — surface
                    // it instead of spinning forever at the backoff cap.
                    if (isFatal4xx(e)) {
                        log.error('poll failed permanently, stopping poller', { error: String(e) });
                        throw e;
                    }
                    // Jittered exponential backoff so a fleet of pollers doesn't retry in
                    // lockstep after a shared outage.
                    const wait = applyJitter(backoff(attempt));
                    log.warn('poll failed, backing off', { error: String(e), backoff_ms: wait });
                    attempt++;
                    await sleep(wait, __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal);
                    continue;
                }
                attempt = 0;
                if (work == null) {
                    // Queue empty: either return now (drain) or wait and poll again.
                    if (__classPrivateFieldGet(this, _WorkPoller_drain, "f"))
                        return;
                    idle.onEmptyPoll();
                    await sleep(jitter(1000, 3000), __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal);
                    continue;
                }
                idle.onClaim();
                log.info('claimed work', {
                    component: 'work-poller',
                    environment_id: this.environmentId,
                    work_id: work.id,
                    work_type: work.data.type,
                });
                try {
                    await __classPrivateFieldGet(this, _WorkPoller_runnerClient, "f").beta.environments.work.ack(work.id, { environment_id: work.environment_id }, { headers: buildHeaders([__classPrivateFieldGet(this, _WorkPoller_requestOpts, "f")?.headers]), signal: __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal });
                }
                catch (e) {
                    log.error('ack failed', { work_id: work.id, error: String(e) });
                    continue;
                }
                try {
                    yield work;
                }
                finally {
                    // Post-handler stop. Runs whether the consumer body returned
                    // normally, threw, or `break`d out of the loop — unless the consumer
                    // owns the stop itself (`autoStop: false`).
                    if (__classPrivateFieldGet(this, _WorkPoller_autoStop, "f")) {
                        try {
                            await __classPrivateFieldGet(this, _WorkPoller_runnerClient, "f").beta.environments.work.stop(work.id, { environment_id: work.environment_id }, { headers: buildHeaders([__classPrivateFieldGet(this, _WorkPoller_requestOpts, "f")?.headers]) });
                        }
                        catch (e) {
                            if (!isStatus(e, 409))
                                log.warn('stop failed', { work_id: work.id, error: String(e) });
                        }
                    }
                }
            }
        }
        finally {
            // Detach from the external signal so the consumer can drop their
            // signal reference without leaking this iterator instance.
            __classPrivateFieldGet(this, _WorkPoller_detachExternal, "f").call(this);
        }
    }
}
/** Exponential poll backoff: 1s, 2s, 4s … clamped to a 60s cap. */
export function backoff(attempt) {
    return expBackoff(attempt, POLL_BACKOFF_BASE_MS, POLL_BACKOFF_CAP_MS);
}
/**
 * Keeps an idle poll loop visible in the logs without an INFO line per poll:
 * the first empty poll after start-up or after a claim logs at INFO and later
 * ones at DEBUG, with an INFO reminder every `IDLE_REPORT_INTERVAL_MS` while
 * the loop stays idle.
 */
class IdleLog {
    constructor(log, environmentId) {
        _IdleLog_log.set(this, void 0);
        _IdleLog_environmentId.set(this, void 0);
        _IdleLog_idleSince.set(this, void 0);
        _IdleLog_lastReport.set(this, 0);
        __classPrivateFieldSet(this, _IdleLog_log, log, "f");
        __classPrivateFieldSet(this, _IdleLog_environmentId, environmentId, "f");
    }
    onEmptyPoll() {
        const now = Date.now();
        const fields = { component: 'work-poller', environment_id: __classPrivateFieldGet(this, _IdleLog_environmentId, "f") };
        if (__classPrivateFieldGet(this, _IdleLog_idleSince, "f") === undefined) {
            __classPrivateFieldSet(this, _IdleLog_idleSince, __classPrivateFieldSet(this, _IdleLog_lastReport, now, "f"), "f");
            __classPrivateFieldGet(this, _IdleLog_log, "f").info('idle; polling for work', fields);
        }
        else if (now - __classPrivateFieldGet(this, _IdleLog_lastReport, "f") >= IDLE_REPORT_INTERVAL_MS) {
            __classPrivateFieldSet(this, _IdleLog_lastReport, now, "f");
            __classPrivateFieldGet(this, _IdleLog_log, "f").info(`still polling; idle for ${Math.round((now - __classPrivateFieldGet(this, _IdleLog_idleSince, "f")) / 1000)}s`, fields);
        }
        else {
            __classPrivateFieldGet(this, _IdleLog_log, "f").debug('poll returned no work', fields);
        }
    }
    onClaim() {
        __classPrivateFieldSet(this, _IdleLog_idleSince, undefined, "f");
    }
}
_IdleLog_log = new WeakMap(), _IdleLog_environmentId = new WeakMap(), _IdleLog_idleSince = new WeakMap(), _IdleLog_lastReport = new WeakMap();
function defaultWorkerId() {
    // The API documents the worker id as a *unique* identifier for Redis consumer
    // groups, so the fallback must be unique even when several pollers share a
    // host. Prefix with the hostname when one is exposed for readability, but rely
    // on the uuid for uniqueness.
    const env = globalThis.process?.env;
    const host = env?.['HOSTNAME'];
    return host ? `${host}-${uuid4()}` : uuid4();
}
//# sourceMappingURL=poller.mjs.map