"use strict";
var _WorkPoller_runnerClient, _WorkPoller_consumed, _WorkPoller_controller, _WorkPoller_detachExternal, _WorkPoller_autoStop, _WorkPoller_drain, _WorkPoller_blockMs, _WorkPoller_reclaimOlderThanMs, _WorkPoller_requestOpts, _IdleLog_log, _IdleLog_environmentId, _IdleLog_idleSince, _IdleLog_lastReport;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkPoller = exports.POLL_BLOCK_MS = exports.jitter = exports.isStatus = exports.isFatal4xx = exports.is4xx = void 0;
exports.backoff = backoff;
const tslib_1 = require("../../internal/tslib.js");
const error_1 = require("../../core/error.js");
const log_1 = require("../../internal/utils/log.js");
const sleep_1 = require("../../internal/utils/sleep.js");
const uuid_1 = require("../../internal/utils/uuid.js");
const abort_1 = require("../../internal/utils/abort.js");
const headers_1 = require("../../internal/headers.js");
const backoff_1 = require("../../internal/utils/backoff.js");
const helper_client_1 = require("../helper-client.js");
var backoff_2 = require("../../internal/utils/backoff.js");
Object.defineProperty(exports, "is4xx", { enumerable: true, get: function () { return backoff_2.is4xx; } });
Object.defineProperty(exports, "isFatal4xx", { enumerable: true, get: function () { return backoff_2.isFatal4xx; } });
Object.defineProperty(exports, "isStatus", { enumerable: true, get: function () { return backoff_2.isStatus; } });
Object.defineProperty(exports, "jitter", { enumerable: true, get: function () { return backoff_2.jitter; } });
// API caps block_ms at 999; rely on client-side jitter between empty polls.
exports.POLL_BLOCK_MS = 999;
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
class WorkPoller {
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
        tslib_1.__classPrivateFieldSet(this, _WorkPoller_runnerClient, (0, helper_client_1.copyClientForHelper)(opts.client, {
            authToken: opts.environmentKey,
            helper: 'environments-work-poller',
        }), "f");
        tslib_1.__classPrivateFieldSet(this, _WorkPoller_autoStop, opts.autoStop ?? true, "f");
        tslib_1.__classPrivateFieldSet(this, _WorkPoller_drain, opts.drain ?? false, "f");
        // `undefined` => default to the API cap; an explicit `null` => omit
        // `block_ms` for a non-blocking poll.
        tslib_1.__classPrivateFieldSet(this, _WorkPoller_blockMs, opts.blockMs === undefined ? exports.POLL_BLOCK_MS : opts.blockMs, "f");
        tslib_1.__classPrivateFieldSet(this, _WorkPoller_reclaimOlderThanMs, opts.reclaimOlderThanMs ?? null, "f");
        tslib_1.__classPrivateFieldSet(this, _WorkPoller_requestOpts, opts.requestOptions, "f");
        tslib_1.__classPrivateFieldSet(this, _WorkPoller_controller, new AbortController(), "f");
        tslib_1.__classPrivateFieldSet(this, _WorkPoller_detachExternal, (0, abort_1.linkAbort)(opts.signal, tslib_1.__classPrivateFieldGet(this, _WorkPoller_controller, "f")), "f");
    }
    /** Read-only view of this iterator's abort signal. */
    get signal() {
        return tslib_1.__classPrivateFieldGet(this, _WorkPoller_controller, "f").signal;
    }
    /** Abort the iterator. The current `for await` will exit cleanly. */
    abort() {
        tslib_1.__classPrivateFieldGet(this, _WorkPoller_controller, "f").abort();
    }
    async *[(_WorkPoller_runnerClient = new WeakMap(), _WorkPoller_consumed = new WeakMap(), _WorkPoller_controller = new WeakMap(), _WorkPoller_detachExternal = new WeakMap(), _WorkPoller_autoStop = new WeakMap(), _WorkPoller_drain = new WeakMap(), _WorkPoller_blockMs = new WeakMap(), _WorkPoller_reclaimOlderThanMs = new WeakMap(), _WorkPoller_requestOpts = new WeakMap(), Symbol.asyncIterator)]() {
        if (tslib_1.__classPrivateFieldGet(this, _WorkPoller_consumed, "f")) {
            throw new error_1.AnthropicError('Cannot iterate over a consumed WorkPoller');
        }
        tslib_1.__classPrivateFieldSet(this, _WorkPoller_consumed, true, "f");
        const log = (0, log_1.loggerFor)(this.client);
        log.info('poller starting', {
            component: 'work-poller',
            environment_id: this.environmentId,
        });
        const idle = new IdleLog(log, this.environmentId);
        try {
            let attempt = 0;
            while (!tslib_1.__classPrivateFieldGet(this, _WorkPoller_controller, "f").signal.aborted) {
                let work;
                try {
                    work = await tslib_1.__classPrivateFieldGet(this, _WorkPoller_runnerClient, "f").beta.environments.work.poll(this.environmentId, {
                        'Anthropic-Worker-ID': this.workerId,
                        ...(tslib_1.__classPrivateFieldGet(this, _WorkPoller_blockMs, "f") !== null ? { block_ms: tslib_1.__classPrivateFieldGet(this, _WorkPoller_blockMs, "f") } : {}),
                        ...(tslib_1.__classPrivateFieldGet(this, _WorkPoller_reclaimOlderThanMs, "f") !== null ?
                            { reclaim_older_than_ms: tslib_1.__classPrivateFieldGet(this, _WorkPoller_reclaimOlderThanMs, "f") }
                            : {}),
                    }, { headers: (0, headers_1.buildHeaders)([tslib_1.__classPrivateFieldGet(this, _WorkPoller_requestOpts, "f")?.headers]), signal: tslib_1.__classPrivateFieldGet(this, _WorkPoller_controller, "f").signal });
                }
                catch (e) {
                    if (tslib_1.__classPrivateFieldGet(this, _WorkPoller_controller, "f").signal.aborted)
                        return;
                    // A bad environment key / missing environment never recovers — surface
                    // it instead of spinning forever at the backoff cap.
                    if ((0, backoff_1.isFatal4xx)(e)) {
                        log.error('poll failed permanently, stopping poller', { error: String(e) });
                        throw e;
                    }
                    // Jittered exponential backoff so a fleet of pollers doesn't retry in
                    // lockstep after a shared outage.
                    const wait = (0, backoff_1.applyJitter)(backoff(attempt));
                    log.warn('poll failed, backing off', { error: String(e), backoff_ms: wait });
                    attempt++;
                    await (0, sleep_1.sleep)(wait, tslib_1.__classPrivateFieldGet(this, _WorkPoller_controller, "f").signal);
                    continue;
                }
                attempt = 0;
                if (work == null) {
                    // Queue empty: either return now (drain) or wait and poll again.
                    if (tslib_1.__classPrivateFieldGet(this, _WorkPoller_drain, "f"))
                        return;
                    idle.onEmptyPoll();
                    await (0, sleep_1.sleep)((0, backoff_1.jitter)(1000, 3000), tslib_1.__classPrivateFieldGet(this, _WorkPoller_controller, "f").signal);
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
                    await tslib_1.__classPrivateFieldGet(this, _WorkPoller_runnerClient, "f").beta.environments.work.ack(work.id, { environment_id: work.environment_id }, { headers: (0, headers_1.buildHeaders)([tslib_1.__classPrivateFieldGet(this, _WorkPoller_requestOpts, "f")?.headers]), signal: tslib_1.__classPrivateFieldGet(this, _WorkPoller_controller, "f").signal });
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
                    if (tslib_1.__classPrivateFieldGet(this, _WorkPoller_autoStop, "f")) {
                        try {
                            await tslib_1.__classPrivateFieldGet(this, _WorkPoller_runnerClient, "f").beta.environments.work.stop(work.id, { environment_id: work.environment_id }, { headers: (0, headers_1.buildHeaders)([tslib_1.__classPrivateFieldGet(this, _WorkPoller_requestOpts, "f")?.headers]) });
                        }
                        catch (e) {
                            if (!(0, backoff_1.isStatus)(e, 409))
                                log.warn('stop failed', { work_id: work.id, error: String(e) });
                        }
                    }
                }
            }
        }
        finally {
            // Detach from the external signal so the consumer can drop their
            // signal reference without leaking this iterator instance.
            tslib_1.__classPrivateFieldGet(this, _WorkPoller_detachExternal, "f").call(this);
        }
    }
}
exports.WorkPoller = WorkPoller;
/** Exponential poll backoff: 1s, 2s, 4s … clamped to a 60s cap. */
function backoff(attempt) {
    return (0, backoff_1.backoff)(attempt, POLL_BACKOFF_BASE_MS, POLL_BACKOFF_CAP_MS);
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
        tslib_1.__classPrivateFieldSet(this, _IdleLog_log, log, "f");
        tslib_1.__classPrivateFieldSet(this, _IdleLog_environmentId, environmentId, "f");
    }
    onEmptyPoll() {
        const now = Date.now();
        const fields = { component: 'work-poller', environment_id: tslib_1.__classPrivateFieldGet(this, _IdleLog_environmentId, "f") };
        if (tslib_1.__classPrivateFieldGet(this, _IdleLog_idleSince, "f") === undefined) {
            tslib_1.__classPrivateFieldSet(this, _IdleLog_idleSince, tslib_1.__classPrivateFieldSet(this, _IdleLog_lastReport, now, "f"), "f");
            tslib_1.__classPrivateFieldGet(this, _IdleLog_log, "f").info('idle; polling for work', fields);
        }
        else if (now - tslib_1.__classPrivateFieldGet(this, _IdleLog_lastReport, "f") >= IDLE_REPORT_INTERVAL_MS) {
            tslib_1.__classPrivateFieldSet(this, _IdleLog_lastReport, now, "f");
            tslib_1.__classPrivateFieldGet(this, _IdleLog_log, "f").info(`still polling; idle for ${Math.round((now - tslib_1.__classPrivateFieldGet(this, _IdleLog_idleSince, "f")) / 1000)}s`, fields);
        }
        else {
            tslib_1.__classPrivateFieldGet(this, _IdleLog_log, "f").debug('poll returned no work', fields);
        }
    }
    onClaim() {
        tslib_1.__classPrivateFieldSet(this, _IdleLog_idleSince, undefined, "f");
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
    return host ? `${host}-${(0, uuid_1.uuid4)()}` : (0, uuid_1.uuid4)();
}
//# sourceMappingURL=poller.js.map