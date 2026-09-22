"use strict";
var _EnvironmentWorker_instances, _EnvironmentWorker_signal, _EnvironmentWorker_handleItem, _Lease_ctrl, _Lease_endReason;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentWorker = void 0;
exports.sessionsTokenFromSecret = sessionsTokenFromSecret;
const tslib_1 = require("../../internal/tslib.js");
const error_1 = require("../../core/error.js");
const log_1 = require("../../internal/utils/log.js");
const base64_1 = require("../../internal/utils/base64.js");
const bytes_1 = require("../../internal/utils/bytes.js");
const env_1 = require("../../internal/utils/env.js");
const sleep_1 = require("../../internal/utils/sleep.js");
const backoff_1 = require("../../internal/utils/backoff.js");
const abort_1 = require("../../internal/utils/abort.js");
const values_1 = require("../../internal/utils/values.js");
const headers_1 = require("../../internal/headers.js");
const SessionToolRunner_1 = require("../tools/SessionToolRunner.js");
const poller_1 = require("./poller.js");
const helper_client_1 = require("../helper-client.js");
const sync_interval_1 = require("../../tools/agent-toolset/sync-interval.js");
const HEARTBEAT_DEFAULT_MS = 30000;
const HEARTBEAT_TTL_DEFAULT_MS = 90000;
const NO_HEARTBEAT_SENTINEL = 'NO_HEARTBEAT';
/** True when the session has at least one memory store attached. */
function hasMemoryStore(session) {
    return session.resources.some((r) => r.type === 'memory_store');
}
/**
 * Extract the per-item sessions token from a work item's `secret` payload.
 *
 * The `secret` the poll response populates is not itself a credential: it is a
 * URL-safe base64 JSON payload matching {@link BetaWorkSecret} — the
 * `sessions_token` (the bearer for this item's work lifecycle and
 * session-level calls) plus fields this worker does not consume. Returns the
 * sessions token, or `null` (meaning: fall back to the environment key) when
 * the payload is missing, doesn't decode, or carries no token. Never log the
 * payload or anything extracted from it.
 */
function sessionsTokenFromSecret(secret) {
    if (!secret)
        return null;
    let parsed;
    try {
        // The payload may arrive URL-safe and without base64 padding; normalize
        // both before decoding.
        const normalized = secret.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        parsed = JSON.parse((0, bytes_1.decodeUTF8)((0, base64_1.fromBase64)(padded)));
    }
    catch {
        return null;
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))
        return null;
    // The payload is untrusted input, so the token is still checked at runtime
    // rather than trusted to match the schema.
    const token = parsed.sessions_token;
    return typeof token === 'string' && token !== '' ? token : null;
}
/**
 * The self-hosted environment runner, composed from the control-plane
 * {@link WorkPoller} and the per-session {@link SessionToolRunner}.
 *
 * For each claimed `session` work item it: builds the per-session
 * {@link AgentToolContext}, downloads the session agent's skills
 * (`setupSkills`), then runs a {@link SessionToolRunner} for the session
 * while heartbeating the work-item lease on the same event loop; on exit it
 * force-stops the work item (unless the lease was lost, in which case the item
 * is left to whoever holds it now), cleans up the downloaded skills, and loops
 * to the next one. The lease heartbeat reports `state === "stopping"` / a lost
 * lease back into the run by aborting the session runner.
 *
 * The `environmentKey` is the worker's standing credential. When a claimed
 * work item carries a per-item `secret` (a short-lived payload the poll
 * response may populate), the sessions token extracted from it is preferred
 * over the environment key for that item's heartbeat / force-stop /
 * skill-download / session calls; polling itself always uses the environment
 * key, and items without a usable secret fall back to it entirely.
 *
 * Use {@link EnvironmentWorker.handleItem} if you already hold a claimed work
 * item (e.g. a `worker poll --on-work` script handed one to a fresh process) and
 * just want the per-item flow without the poll loop — with no arguments it reads
 * the `ANTHROPIC_*` env vars that command sets.
 *
 * Construct it via `client.beta.environments.work.worker({ ... })` (or
 * `new EnvironmentWorker({ client, ... })` directly).
 *
 * @example
 * ```ts
 * // Long-running daemon: poll for work, serve each session, loop.
 * await client.beta.environments.work
 *   .worker({ environmentId, environmentKey, workdir: '/workspace' })
 *   .run(AbortSignal.timeout(60 * 60_000));
 *
 * // Already-claimed item (e.g. inside `ant worker poll --on-work ...`):
 * await client.beta.environments.work.worker({ workdir: '/workspace' }).handleItem();
 * ```
 */
class EnvironmentWorker {
    constructor(opts) {
        _EnvironmentWorker_instances.add(this);
        _EnvironmentWorker_signal.set(this, void 0);
        if (opts.unrestrictedPaths !== undefined) {
            throw new error_1.AnthropicError('The `unrestrictedPaths` option you passed to EnvironmentWorker (or ' +
                'client.beta.environments.work.worker()) is no longer supported. ' +
                "The worker's file tools (read, write, edit, glob, grep) are now always confined to `workdir` " +
                "plus the session's memory folders. Remove `unrestrictedPaths` from your options; to let the " +
                'file tools reach any other directory, add it to `AgentToolContext.allowedRoots` from a ' +
                '`tools` factory.');
        }
        this.client = opts.client;
        this.environmentId = opts.environmentId;
        this.environmentKey = opts.environmentKey;
        this.tools = opts.tools;
        this.workdir = opts.workdir ?? process.cwd();
        this.maxFileBytes = opts.maxFileBytes;
        this.maxIdleMs = opts.maxIdleMs;
        if (opts.memorySyncIntervalMs != null) {
            (0, sync_interval_1.checkMemorySyncInterval)(opts.memorySyncIntervalMs, 'memorySyncIntervalMs');
        }
        this.memorySyncIntervalMs = opts.memorySyncIntervalMs;
        this.memorySyncDeletions = opts.memorySyncDeletions ?? 'enabled';
        this.workerId = opts.workerId;
        this.requestOptions = opts.requestOptions;
        tslib_1.__classPrivateFieldSet(this, _EnvironmentWorker_signal, opts.signal, "f");
    }
    /**
     * Poll the environment and service each claimed session until the supplied
     * signal (or the one passed to the constructor) aborts. Throws if
     * `environmentId` / `environmentKey` were not provided to the constructor.
     */
    async run(signal) {
        const { environmentId, environmentKey } = this;
        if (environmentId === undefined || environmentKey === undefined) {
            throw new error_1.AnthropicError('EnvironmentWorker.run: environmentId and environmentKey are required to poll for work');
        }
        const externalSignal = signal ?? tslib_1.__classPrivateFieldGet(this, _EnvironmentWorker_signal, "f");
        const poller = new poller_1.WorkPoller({
            client: this.client,
            environmentId,
            environmentKey,
            ...(this.workerId !== undefined ? { workerId: this.workerId } : {}),
            ...(externalSignal ? { signal: externalSignal } : {}),
            ...(this.requestOptions !== undefined ? { requestOptions: this.requestOptions } : {}),
            // The per-item handler stops or releases every work item on exit; let it
            // be the single owner of `work.stop` rather than double-posting from the
            // poller.
            autoStop: false,
        });
        for await (const work of poller) {
            try {
                await tslib_1.__classPrivateFieldGet(this, _EnvironmentWorker_instances, "m", _EnvironmentWorker_handleItem).call(this, work, environmentKey, poller.signal);
            }
            catch (e) {
                // One bad item fails that item, not the worker: the handler's teardown
                // already stopped or released it, so the next poll claims the next
                // item. A store directory left behind by a killed worker would
                // otherwise crashloop this process forever.
                if (poller.signal?.aborted)
                    throw e;
                (0, log_1.loggerFor)(this.client).error('work item failed', { work_id: work.id, error: String(e) });
            }
        }
    }
    /**
     * Service a single, already-claimed work item without the poll loop: build the
     * per-session {@link AgentToolContext} (workdir from this worker's options),
     * download the session agent's skills (`setupSkills`), run a
     * {@link SessionToolRunner} for the session while heartbeating the work-item
     * lease, and force-stop the work item on exit (whether the runner finishes
     * normally, throws, or the control plane signals shutdown). The one
     * exception is a lost lease: the item then belongs to the queue or another
     * worker and is left alone.
     *
     * Use this when something else does the claiming — e.g. a `worker poll
     * --on-work` script that hands an already-claimed item to a fresh process. The
     * work id / environment id / session id each fall back to `ANTHROPIC_WORK_ID` /
     * `ANTHROPIC_ENVIRONMENT_ID` / `ANTHROPIC_SESSION_ID` (the env vars that
     * command sets) when not passed; the environment key resolves from this
     * option, then the worker's own `environmentKey`, then
     * `ANTHROPIC_ENVIRONMENT_KEY`. With no arguments inside that command it just
     * works. Throws a clear error naming the first of the four required values
     * still missing after resolution. Throws `SessionMemoryError` when the
     * session has memory stores attached but they cannot be mounted — the work
     * item carried no sessions token (unless `memorySyncIntervalMs` turned
     * memory off), or a store failed to download.
     *
     * `workSecret` is the work item's per-item `secret` payload from the poll
     * response, falling back to `ANTHROPIC_WORK_SECRET`; unlike the others it is
     * optional — when present, the sessions token extracted from it is preferred
     * as the Bearer credential for this item's heartbeat / force-stop / session
     * calls; when absent (or undecodable) those calls use the environment key.
     */
    async handleItem(opts) {
        const workId = opts?.workId ?? (0, env_1.readEnv)('ANTHROPIC_WORK_ID');
        const environmentId = opts?.environmentId ?? (0, env_1.readEnv)('ANTHROPIC_ENVIRONMENT_ID');
        const sessionId = opts?.sessionId ?? (0, env_1.readEnv)('ANTHROPIC_SESSION_ID');
        const environmentKey = opts?.environmentKey ?? this.environmentKey ?? (0, env_1.readEnv)('ANTHROPIC_ENVIRONMENT_KEY');
        // `||` rather than `??` so an empty option still falls through to the env
        // var and then to null (matching how `readEnv` treats empty values).
        const workSecret = opts?.workSecret || (0, env_1.readEnv)('ANTHROPIC_WORK_SECRET') || null;
        if (!workId) {
            throw new error_1.AnthropicError('handleItem: workId is required — pass it or set ANTHROPIC_WORK_ID');
        }
        if (!environmentId) {
            throw new error_1.AnthropicError('handleItem: environmentId is required — pass it or set ANTHROPIC_ENVIRONMENT_ID');
        }
        if (!sessionId) {
            throw new error_1.AnthropicError('handleItem: sessionId is required — pass it or set ANTHROPIC_SESSION_ID');
        }
        if (!environmentKey) {
            throw new error_1.AnthropicError('handleItem: environmentKey is required — pass it, construct the worker with it, or set ANTHROPIC_ENVIRONMENT_KEY');
        }
        const work = {
            id: workId,
            environment_id: environmentId,
            secret: workSecret,
            data: { type: 'session', id: sessionId },
        };
        await tslib_1.__classPrivateFieldGet(this, _EnvironmentWorker_instances, "m", _EnvironmentWorker_handleItem).call(this, work, environmentKey, opts?.signal ?? tslib_1.__classPrivateFieldGet(this, _EnvironmentWorker_signal, "f"));
    }
}
exports.EnvironmentWorker = EnvironmentWorker;
_EnvironmentWorker_signal = new WeakMap(), _EnvironmentWorker_instances = new WeakSet(), _EnvironmentWorker_handleItem = 
/**
 * The per-item body shared by {@link EnvironmentWorker.run}'s poll loop and
 * {@link EnvironmentWorker.handleItem}: run a {@link SessionToolRunner} for the
 * work item's session while heartbeating its lease, force-stopping on exit
 * unless the lease was lost. Non-session work items are ignored.
 *
 * When the poll response carried a per-item `secret` (a short-lived payload
 * scoped to this work item), the sessions token extracted from it is
 * preferred over `environmentKey` as the Bearer credential for those
 * per-item calls; a missing/undecodable secret falls back to
 * `environmentKey` unchanged.
 */
async function _EnvironmentWorker_handleItem(work, environmentKey, externalSignal) {
    const log = (0, log_1.loggerFor)(this.client);
    // The per-item credential: the sessions token carried inside the work
    // item's secret payload when the server issued one, otherwise the
    // environment key. Never log this value.
    const sessionsToken = sessionsTokenFromSecret(work.secret);
    if (work.secret && sessionsToken === null) {
        log.warn('work item carried a secret payload but no sessions token could be extracted; ' +
            'falling back to the environment key', { work_id: work.id });
    }
    const itemCredential = sessionsToken ?? environmentKey;
    // Every per-session call — the SessionToolRunner event stream/list/send, the
    // lease heartbeat, the skill download, and the work force-stop —
    // authenticates with the per-item credential. Scope a client to it once and
    // thread that through. `copyClientForHelper` also clears the parent's
    // `apiKey`, so the sub-client emits *only* the bearer credential on the
    // wire (a plain `withOptions({authToken})` would leave `X-Api-Key` set as
    // well).
    const sessionClient = (0, helper_client_1.copyClientForHelper)(this.client, {
        authToken: itemCredential,
        helper: 'environments-worker',
    });
    // The poller runs with `autoStop: false`, so the per-item handler is the
    // single owner of `work.stop` for every claimed item.
    const sessionId = work.data.id;
    // A per-session controller: aborts when the supplied signal aborts, when the
    // session runner finishes, or when the lease heartbeat says to stop.
    const ctrl = new AbortController();
    const detachExternal = (0, abort_1.linkAbort)(externalSignal, ctrl);
    const lease = new Lease(ctrl);
    // Lazily load the Node-only toolset module — see the import note at the top.
    const agentToolset = await Promise.resolve().then(() => tslib_1.__importStar(require("../../tools/agent-toolset/node.js")));
    // Start the lease heartbeat BEFORE the session fetch and the skill /
    // memory downloads: those can take longer than the lease TTL, and an
    // unheartbeated lease lapsing mid-download would let another worker
    // reclaim the item and serve the same session (split-brain).
    //
    // Each heartbeat reports the lease TTL the server is enforcing; it becomes
    // the runner's tool-result send retry window so a send keeps retrying
    // exactly as long as the lease could still be live. The runner is only
    // built after the downloads, so hold the latest TTL until then.
    let leaseTtlMs;
    let runner;
    const heartbeatPromise = heartbeatLoop(sessionClient, work, lease, log, this.requestOptions, (ttlMs) => {
        leaseTtlMs = ttlMs;
        runner?._setSendRetryWindow(ttlMs);
    }).catch((e) => {
        if (!ctrl.signal.aborted)
            log.error('heartbeat loop failed', { work_id: work.id, error: String(e) });
        ctrl.abort();
    });
    let cleanupSkills = async () => { };
    let stores;
    let cleanEnd = false;
    try {
        if (work.data.type !== 'session') {
            log.debug('skipping non-session work item', { work_id: work.id, type: work.data.type });
            return;
        }
        // One session fetch, shared by the skills download and the memory-store
        // download — two fetches could disagree about the attached resources.
        // A failed fetch fails the work item (the teardown below still stops
        // or releases it).
        const session = await sessionClient.beta.sessions.retrieve(sessionId);
        // Only with the session in hand can we tell one that simply has no
        // memory from one whose memory we cannot mount. Turning memory off
        // with the interval knob is a deliberate opt-out and stays quiet.
        if (sessionsToken === null && this.memorySyncIntervalMs !== null && hasMemoryStore(session)) {
            throw new agentToolset.SessionMemoryError(`cannot mount the session's memories: the work item carried no sessions token ` +
                `(work_id=${work.id}, session_id=${sessionId}); ` +
                'the memory endpoints reject the environment key, so the poller must issue a per-item ' +
                '`secret` carrying `sessions_token`, or set `memorySyncIntervalMs: null` to run without memory');
        }
        const ctx = {
            workdir: this.workdir,
            // The scoped sub-client, not the parent: the skill download
            // `setupSkills` performs for this session rides the same per-item
            // credential as every other per-item call.
            client: sessionClient,
            session,
            ...(this.maxFileBytes !== undefined ? { maxFileBytes: this.maxFileBytes } : {}),
        };
        try {
            cleanupSkills = await agentToolset.setupSkills(ctx);
        }
        catch (e) {
            log.warn('skill setup failed', { session_id: sessionId, work_id: work.id, error: String(e) });
        }
        // Memory stores: the memory_stores endpoints accept the per-item sessions
        // token but reject the environment key, so download and sync only run when
        // the item carried a usable secret (and the interval is set).
        // `sessionClient` is already scoped to that token then, so the memory
        // calls ride the same sub-client. A store that cannot be materialised
        // throws `SessionMemoryError` out of `download` and fails the item.
        if (sessionsToken !== null && this.memorySyncIntervalMs !== null) {
            stores = new agentToolset.SessionMemoryStores(sessionClient, {
                workdir: this.workdir,
                ...(this.memorySyncIntervalMs !== undefined ? { syncIntervalMs: this.memorySyncIntervalMs } : {}),
                syncDeletions: this.memorySyncDeletions,
            });
            await stores.download(session);
            // A store mounted outside the workdir must stay reachable by the file
            // tools; read-only stores still refuse writes.
            ctx.allowedRoots = stores.roots;
            ctx.readOnlyRoots = stores.readOnlyRoots;
        }
        else {
            log.debug('memory stores disabled for this item', { work_id: work.id });
        }
        const tools = typeof this.tools === 'function' ?
            this.tools(ctx)
            : this.tools ?? agentToolset.betaAgentToolset20260401(ctx);
        runner = new SessionToolRunner_1.SessionToolRunner(sessionId, {
            client: sessionClient,
            tools,
            ...(this.maxIdleMs !== undefined ? { maxIdleMs: this.maxIdleMs } : {}),
            ...(this.requestOptions !== undefined ? { requestOptions: this.requestOptions } : {}),
            signal: ctrl.signal,
        });
        if (leaseTtlMs !== undefined)
            runner._setSendRetryWindow(leaseTtlMs);
        for await (const _ of runner) {
            // Drive the runner to completion; per-call observability is not part
            // of this composition's surface — use `SessionToolRunner` directly
            // (via `client.beta.sessions.events.toolRunner`) if you want it.
            if (stores)
                await stores.syncIfDue();
        }
        // Only a clean stream end earns the last full sync; it runs in the
        // teardown below.
        cleanEnd = !ctrl.signal.aborted;
    }
    finally {
        // The heartbeat keeps the lease alive until this teardown is done.
        try {
            // cleanupSkills first, so its failure cannot skip the memory flush.
            await cleanupSkills().catch((e) => {
                log.warn('skill cleanup failed', { session_id: sessionId, work_id: work.id, error: String(e) });
            });
        }
        finally {
            if (stores) {
                const boundMs = agentToolset.MEMORY_FLUSH_TIMEOUT_MS;
                if (cleanEnd) {
                    const finishCutOff = await withTimeout(stores.finish(), boundMs);
                    if (finishCutOff) {
                        log.warn(`final memory sync cut off after ${boundMs}ms; the flush that follows still uploads changed files`, { session_id: sessionId, work_id: work.id });
                    }
                }
                // Also after finish(): it swallows its own failures, and a
                // clean flush is a no-op.
                const flushBound = new AbortController();
                const flushCutOff = await withTimeout(stores.flushWrites(flushBound.signal), boundMs);
                if (flushCutOff) {
                    flushBound.abort();
                    log.warn(`memory flush cut off after ${boundMs}ms; changed files it had not uploaded yet are not saved`, { session_id: sessionId, work_id: work.id });
                }
                await stores.dispose().catch((e) => {
                    log.warn('memory store cleanup failed', {
                        session_id: sessionId,
                        work_id: work.id,
                        error: String(e),
                    });
                });
            }
        }
        lease.finish('runner_done');
        detachExternal();
        await heartbeatPromise;
        // Stop only an item this worker still holds — after a lost lease it
        // belongs to the queue or another worker.
        if (lease.lost) {
            log.info('lease lost; released without stopping it', { session_id: sessionId, work_id: work.id });
        }
        else {
            await forceStop(sessionClient, work, log, this.requestOptions);
        }
    }
};
/**
 * Resolve when `p` settles or `ms` elapses — `true` when `ms` elapsed
 * first. A timed-out `p` keeps running — JS cannot cancel a promise.
 */
async function withTimeout(p, ms) {
    let timer;
    try {
        return await Promise.race([
            p.then(() => false, () => false),
            new Promise((resolve) => {
                timer = setTimeout(() => resolve(true), ms);
            }),
        ]);
    }
    finally {
        if (timer !== undefined)
            clearTimeout(timer);
    }
}
/** Force-stop a claimed work item, swallowing the 409 that means it's already stopped. */
async function forceStop(client, work, log, requestOptions) {
    try {
        await client.beta.environments.work.stop(work.id, { environment_id: work.environment_id, force: true }, 
        // Caller's headers pass through; the helper-tag header is on the scoped
        // sub-client's default_headers via copyClientForHelper, so no per-call
        // re-stamping needed.
        { ...requestOptions, headers: (0, headers_1.buildHeaders)([requestOptions?.headers]) });
    }
    catch (e) {
        if (!(0, backoff_1.isStatus)(e, 409)) {
            log.error('force-stop on exit failed', { work_id: work.id, error: String(e) });
        }
    }
}
/**
 * This worker's view of one work-item lease: the per-item abort signal plus
 * why heartbeating ended. The first recorded reason wins, so a run aborted
 * *because* the lease was lost still reads as lost afterwards; an abort with
 * no recorded reason (the external signal) is not lost.
 */
class Lease {
    constructor(ctrl) {
        _Lease_ctrl.set(this, void 0);
        _Lease_endReason.set(this, void 0);
        tslib_1.__classPrivateFieldSet(this, _Lease_ctrl, ctrl, "f");
    }
    get signal() {
        return tslib_1.__classPrivateFieldGet(this, _Lease_ctrl, "f").signal;
    }
    finish(reason) {
        tslib_1.__classPrivateFieldSet(this, _Lease_endReason, tslib_1.__classPrivateFieldGet(this, _Lease_endReason, "f") ?? reason, "f");
        tslib_1.__classPrivateFieldGet(this, _Lease_ctrl, "f").abort();
    }
    /** True once the item belongs to the queue or another worker. */
    get lost() {
        return tslib_1.__classPrivateFieldGet(this, _Lease_endReason, "f") === 'lease_lost' || tslib_1.__classPrivateFieldGet(this, _Lease_endReason, "f") === 'assumed_lost';
    }
}
_Lease_ctrl = new WeakMap(), _Lease_endReason = new WeakMap();
/** The server's view of the lease carried by a 412 heartbeat response, or empty if absent. */
function serverLeaseState(e) {
    let node = e instanceof error_1.APIError ? e.error : undefined;
    for (const key of ['error', 'details', 'current_state']) {
        if (!(0, values_1.isObj)(node))
            return {};
        node = node[key];
    }
    return (0, values_1.isObj)(node) ? node : {};
}
/**
 * Keep the work-item lease alive while a session is being served. Runs until
 * `lease` ends, and ends it itself when the control plane reports the work is
 * `stopping`/`stopped` or no longer extends the lease, when a heartbeat is
 * rejected (a 412 means the lease already belongs to someone else), or when no
 * heartbeat has succeeded for longer than the lease ttl (the lease is assumed
 * lost, so two runners don't end up serving the same work). Each heartbeat
 * call is cut off after the current beat interval so a hung request cannot
 * outlive the lease it is meant to renew.
 */
async function heartbeatLoop(client, work, lease, logger, requestOptions, 
/** Called with the server-reported lease TTL after every successful beat. */
onLeaseTtl) {
    let intervalMs = HEARTBEAT_DEFAULT_MS;
    let ttlMs = HEARTBEAT_TTL_DEFAULT_MS;
    let lastSuccessMs = Date.now();
    let last = NO_HEARTBEAT_SENTINEL;
    const beat = async () => {
        // Not the request `timeout` option: the core client retries timeouts, so
        // it would not bound the call as a whole.
        const beatCtrl = new AbortController();
        const detach = (0, abort_1.linkAbort)(lease.signal, beatCtrl);
        const cutoff = setTimeout(() => beatCtrl.abort(), intervalMs);
        try {
            const resp = await client.beta.environments.work.heartbeat(work.id, { environment_id: work.environment_id, expected_last_heartbeat: last }, { ...requestOptions, headers: (0, headers_1.buildHeaders)([requestOptions?.headers]), signal: beatCtrl.signal });
            lastSuccessMs = Date.now();
            last = resp.last_heartbeat;
            if (resp.ttl_seconds > 0) {
                ttlMs = resp.ttl_seconds * 1000;
                intervalMs = Math.max(1000, Math.min(ttlMs / 2, HEARTBEAT_DEFAULT_MS));
                onLeaseTtl?.(ttlMs);
            }
            if (resp.state === 'stopping' || resp.state === 'stopped') {
                logger.info('heartbeat signals shutdown', { work_id: work.id, state: resp.state });
                lease.finish('control_plane_stop');
            }
            if (!resp.lease_extended) {
                logger.warn('lease not extended, shutting down', { work_id: work.id });
                lease.finish('control_plane_stop');
            }
        }
        catch (e) {
            // An abort throws to unwind the caller (the `heartbeatLoop(...).catch`
            // in `#handleItem`) rather than returning early.
            lease.signal.throwIfAborted();
            if ((0, backoff_1.isStatus)(e, 412)) {
                const server = serverLeaseState(e);
                logger.error('lease lost: heartbeat precondition failed', {
                    work_id: work.id,
                    server_state: server['state'],
                    server_ttl_seconds: server['ttl_seconds'],
                    server_last_heartbeat: server['last_heartbeat'],
                });
                lease.finish('lease_lost');
                return;
            }
            if ((0, backoff_1.isFatal4xx)(e)) {
                logger.error('permanent heartbeat failure', { work_id: work.id, error: String(e) });
                lease.finish('heartbeat_rejected');
                throw e;
            }
            if (Date.now() - lastSuccessMs > ttlMs) {
                logger.error('lease assumed lost: no successful heartbeat in ttl', {
                    work_id: work.id,
                    ttl_ms: ttlMs,
                    error: String(e),
                });
                lease.finish('assumed_lost');
                return;
            }
            logger.warn('transient heartbeat failure', { work_id: work.id, error: String(e) });
        }
        finally {
            clearTimeout(cutoff);
            detach();
        }
    };
    await beat();
    while (!lease.signal.aborted) {
        await (0, sleep_1.sleep)(intervalMs, lease.signal);
        lease.signal.throwIfAborted();
        await beat();
    }
}
//# sourceMappingURL=worker.js.map