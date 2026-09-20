import type { Anthropic } from "../../client.js";
import type { BetaSelfHostedWork } from "../../resources/beta/environments/work.js";
import type { BetaToolRunnerRequestOptions } from "../tools/BetaToolRunner.js";
export { is4xx, isFatal4xx, isStatus, jitter } from "../../internal/utils/backoff.js";
export declare const POLL_BLOCK_MS = 999;
export interface WorkPollerOptions {
    client: Anthropic;
    environmentId: string;
    /**
     * The environment key — the single credential for the self-hosted runner. It
     * authenticates the work-poll calls here and every per-session call the
     * consumer makes afterwards.
     */
    environmentKey: string;
    workerId?: string;
    /** External abort signal. Aborting it ends the iteration. */
    signal?: AbortSignal;
    /**
     * Whether the poller posts `work.stop` itself after the consumer's loop body
     * returns. Defaults to `true`. Set `false` when the consumer already owns the
     * stop (e.g. {@link EnvironmentWorker} force-stops every item) so the work
     * item is not stopped twice.
     *
     * Orthogonal to {@link WorkPollerOptions.drain}: `autoStop` is a per-item
     * lifecycle flag (does the poller `work.stop` each item), `drain` controls
     * loop termination (does the poller return when the queue is empty). They are
     * not two names for the same thing — `EnvironmentWorker.run` uses
     * `autoStop: false` with `drain` defaulting `false`.
     */
    autoStop?: boolean;
    /**
     * When `true`, the poller returns (ends iteration) as soon as the work queue
     * is empty instead of long-polling forever. Defaults to `false` (long-poll
     * until aborted). Pair with `blockMs: null` for a single non-blocking pass
     * over whatever is already queued.
     */
    drain?: boolean;
    /**
     * Block timeout in milliseconds passed through to `work.poll` — the server
     * long-polls up to this long for an item before returning empty. Defaults to
     * {@link POLL_BLOCK_MS} (the API cap, 999). Pass `null` to omit it entirely
     * for a non-blocking single poll (useful with {@link WorkPollerOptions.drain}).
     */
    blockMs?: number | null;
    /**
     * Reclaim unacknowledged work items older than this many milliseconds, passed
     * through to `work.poll`'s `reclaim_older_than_ms`. Defaults to `undefined`
     * (omitted — the server applies its own default).
     */
    reclaimOlderThanMs?: number | null;
    /**
     * Extra per-request options merged into the poll/ack/stop calls. Custom
     * `headers` (e.g. a proxy's auth/routing headers) are layered on top of the
     * environment-key auth + helper telemetry headers; the poller owns the abort
     * signal, so a `signal` here is ignored.
     */
    requestOptions?: BetaToolRunnerRequestOptions;
}
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
export declare class WorkPoller implements AsyncIterable<BetaSelfHostedWork> {
    #private;
    readonly client: Anthropic;
    readonly environmentId: string;
    readonly environmentKey: string;
    readonly workerId: string;
    constructor(opts: WorkPollerOptions);
    /** Read-only view of this iterator's abort signal. */
    get signal(): AbortSignal;
    /** Abort the iterator. The current `for await` will exit cleanly. */
    abort(): void;
    [Symbol.asyncIterator](): AsyncIterator<BetaSelfHostedWork>;
}
/** Exponential poll backoff: 1s, 2s, 4s … clamped to a 60s cap. */
export declare function backoff(attempt: number): number;
//# sourceMappingURL=poller.d.ts.map