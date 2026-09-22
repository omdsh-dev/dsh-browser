import type { Anthropic } from "../../client.js";
import type { BetaRunnableTool } from "../tools/BetaRunnableTool.js";
import type { BetaToolRunnerRequestOptions } from "../tools/BetaToolRunner.js";
import type { AgentToolContext, MemoryDeleteMode } from "../../tools/agent-toolset/node.js";
/**
 * Either a fixed tool array or a factory invoked once per claimed session with
 * that session's {@link AgentToolContext} — use the factory form to bind
 * `betaAgentToolset20260401` (or any tool that needs the workdir / session
 * id) to the right session.
 */
export type EnvironmentWorkerTools = Array<BetaRunnableTool> | ((ctx: AgentToolContext) => Array<BetaRunnableTool>);
export interface EnvironmentWorkerOptions {
    client: Anthropic;
    /**
     * The self-hosted environment to poll for work. Required by
     * {@link EnvironmentWorker.run}; not used by {@link EnvironmentWorker.handleItem}.
     */
    environmentId?: string;
    /**
     * The environment key — the worker's standing credential: polling always
     * uses it, and per-session calls fall back to it when a claimed item's
     * `secret` doesn't yield a sessions token. Required by
     * {@link EnvironmentWorker.run}; falls back to `ANTHROPIC_ENVIRONMENT_KEY` in
     * {@link EnvironmentWorker.handleItem}.
     */
    environmentKey?: string;
    /**
     * Tools to expose to each claimed session. Defaults to
     * `betaAgentToolset20260401(ctx)` (the standard `agent_toolset_20260401` set
     * bound to the per-session {@link AgentToolContext}).
     *
     * A `run` that blocks the event loop synchronously also stalls the lease
     * heartbeat, and the worker can lose the lease; keep tools non-blocking (see
     * {@link BetaRunnableTool.run}).
     */
    tools?: EnvironmentWorkerTools;
    /** Base directory for the per-session {@link AgentToolContext}. Defaults to `process.cwd()`. */
    workdir?: string;
    /**
     * @deprecated No longer accepted: the file tools are always confined to
     * `workdir` plus `allowedRoots`, which is neither behavior this flag used to
     * select, so passing either value throws. Remove it; list extra directories
     * in {@link AgentToolContext.allowedRoots}. The property is removed in a
     * future release.
     */
    unrestrictedPaths?: boolean;
    /** Forwarded to the per-session {@link AgentToolContext} (`maxFileBytes`). */
    maxFileBytes?: number | null;
    /** Forwarded to {@link SessionToolRunner} (`maxIdleMs`). */
    maxIdleMs?: number;
    /**
     * How often (milliseconds) to sync the session's attached memory stores back
     * while it runs — checked after each dispatched tool call, plus one final
     * sync when the session ends cleanly. Defaults to
     * `DEFAULT_MEMORY_SYNC_INTERVAL_MS` (15s); the constructor throws for
     * values below `MIN_MEMORY_SYNC_INTERVAL_MS` (5s). Every teardown also runs
     * a push-only flush of changed files; that flush and the final sync are
     * each bounded by `MEMORY_FLUSH_TIMEOUT_MS`, and a warning is logged when
     * either bound cuts work off. `null` disables memory download and sync
     * entirely. Memory stores are only touched for work items whose `secret`
     * carries a `sessions_token`; while sync is enabled, an item without one
     * fails when its session has memory stores attached, because those stores
     * cannot be mounted without the token. With `null` the same item runs,
     * without memory, and nothing is logged — turning sync off is the
     * operator's explicit choice.
     */
    memorySyncIntervalMs?: number | null;
    /**
     * Whether local file deletions may delete on the server — see
     * {@link MemoryDeleteMode}. Uploads and pulls are unaffected.
     * Defaults to `"enabled"`.
     */
    memorySyncDeletions?: MemoryDeleteMode;
    /** Forwarded to the {@link WorkPoller}. */
    workerId?: string;
    /** External abort signal; aborting it ends the run. */
    signal?: AbortSignal;
    /**
     * Extra per-request options merged into every call this worker issues — the
     * work poll/ack/heartbeat/stop control-plane calls and the per-session
     * SessionToolRunner's stream/list/send. Mirrors what
     * `client.beta.messages.toolRunner` accepts: custom `headers` (e.g. a proxy's
     * auth/routing headers) reach all of them. The worker owns the abort signals,
     * so a `signal` here is ignored — use {@link EnvironmentWorkerOptions.signal}.
     */
    requestOptions?: BetaToolRunnerRequestOptions;
}
/**
 * Options for {@link EnvironmentWorker.handleItem}. Every field falls back to the
 * matching `ANTHROPIC_*` environment variable — the ones the
 * `ant worker poll --on-work` command sets for the process it spawns — when not
 * passed explicitly.
 */
export interface HandleItemOptions {
    /** Work item id. Falls back to `ANTHROPIC_WORK_ID`. */
    workId?: string;
    /** Self-hosted environment id. Falls back to `ANTHROPIC_ENVIRONMENT_ID`. */
    environmentId?: string;
    /** Session id. Falls back to `ANTHROPIC_SESSION_ID`. */
    sessionId?: string;
    /**
     * The environment key used to authenticate every per-session call. Resolution
     * order: this option, then the worker's own `environmentKey`, then
     * `ANTHROPIC_ENVIRONMENT_KEY`.
     */
    environmentKey?: string;
    /**
     * The work item's per-item `secret` payload from the poll response. Falls
     * back to `ANTHROPIC_WORK_SECRET`. Unlike the others it is optional — when
     * present, the sessions token extracted from it is preferred as the Bearer
     * credential for this item's heartbeat / force-stop / skill-download /
     * session calls; when absent (or undecodable) those calls use the
     * environment key.
     */
    workSecret?: string;
    /** External abort signal; aborting it ends the run. Defaults to the constructor's signal. */
    signal?: AbortSignal;
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
export declare function sessionsTokenFromSecret(secret: string | null | undefined): string | null;
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
export declare class EnvironmentWorker {
    #private;
    readonly client: Anthropic;
    readonly environmentId: string | undefined;
    readonly environmentKey: string | undefined;
    readonly tools: EnvironmentWorkerTools | undefined;
    readonly workdir: string;
    /** @deprecated Never set; see {@link EnvironmentWorkerOptions.unrestrictedPaths}. */
    readonly unrestrictedPaths: boolean | undefined;
    readonly maxFileBytes: number | null | undefined;
    readonly maxIdleMs: number | undefined;
    readonly memorySyncIntervalMs: number | null | undefined;
    readonly memorySyncDeletions: MemoryDeleteMode;
    readonly workerId: string | undefined;
    readonly requestOptions: BetaToolRunnerRequestOptions | undefined;
    constructor(opts: Omit<EnvironmentWorkerOptions, 'unrestrictedPaths'>);
    /** @deprecated `unrestrictedPaths` is no longer accepted — see {@link EnvironmentWorkerOptions.unrestrictedPaths}. */
    constructor(opts: Omit<EnvironmentWorkerOptions, 'unrestrictedPaths'> & {
        unrestrictedPaths: boolean;
    });
    /**
     * Poll the environment and service each claimed session until the supplied
     * signal (or the one passed to the constructor) aborts. Throws if
     * `environmentId` / `environmentKey` were not provided to the constructor.
     */
    run(signal?: AbortSignal): Promise<void>;
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
    handleItem(opts?: HandleItemOptions): Promise<void>;
}
//# sourceMappingURL=worker.d.ts.map