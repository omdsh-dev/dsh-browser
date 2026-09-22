import type { AccessTokenProvider } from "./types.js";
/**
 * Wraps an {@link AccessTokenProvider} with two-tier proactive refresh
 * and concurrent deduplication.
 *
 * Refresh policy on each {@link getToken} call:
 *
 * - No cached token → call provider (blocking), cache, return.
 * - Cached with `expiresAt == null` → return cached forever.
 * - More than 120s remaining → return cached.
 * - 30–120s remaining (advisory window) → return stale token immediately,
 *   kick off background refresh. On failure, log and keep stale.
 * - Less than 30s remaining or expired (mandatory) → block and refresh.
 *   On failure, throw.
 *
 * Concurrent mandatory callers coalesce into a single provider call.
 */
export declare class TokenCache {
    private provider;
    private cached;
    private pendingRefresh;
    private nextForce;
    private lastAdvisoryError;
    private onAdvisoryRefreshError;
    constructor(provider: AccessTokenProvider, onAdvisoryRefreshError?: (err: unknown) => void);
    getToken(): Promise<string>;
    /**
     * Clears the cached token and marks the next {@link getToken} as a forced
     * refresh, so the underlying provider bypasses any on-disk freshness check.
     * Called after a 401 — the server has just told us the token is bad even
     * if its `expires_at` still looks fresh.
     */
    invalidate(): void;
    /**
     * Mandatory refresh. Joins any in-flight refresh unless forced — a forced
     * refresh must not coalesce into a non-forced one that may re-serve the
     * same stale disk token.
     */
    private refresh;
    /**
     * Advisory background refresh. Shares the same in-flight promise as
     * mandatory refreshes for deduplication, but swallows errors so the
     * stale cached token keeps being served. Backs off for
     * {@link ADVISORY_REFRESH_BACKOFF_IN_SECONDS} after a failure so an
     * outage during the advisory window doesn't hammer the token endpoint.
     */
    private backgroundRefresh;
    /**
     * Core refresh. Sets {@link pendingRefresh} so concurrent callers
     * (both advisory and mandatory) coalesce into a single provider call.
     */
    private doRefresh;
}
//# sourceMappingURL=token-cache.d.ts.map