"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenCache = void 0;
const types_1 = require("./types.js");
const time_1 = require("../../internal/utils/time.js");
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
class TokenCache {
    constructor(provider, onAdvisoryRefreshError) {
        this.cached = null;
        this.pendingRefresh = null;
        this.nextForce = false;
        this.lastAdvisoryError = 0;
        this.provider = provider;
        this.onAdvisoryRefreshError = onAdvisoryRefreshError;
    }
    async getToken() {
        const force = this.nextForce;
        this.nextForce = false;
        const cached = this.cached;
        if (force || cached == null) {
            const token = await this.refresh(force);
            return token.token;
        }
        if (cached.expiresAt == null) {
            return cached.token;
        }
        const remaining = cached.expiresAt - (0, time_1.nowAsSeconds)();
        if (remaining > types_1.ADVISORY_REFRESH_THRESHOLD_IN_SECONDS) {
            return cached.token;
        }
        if (remaining > types_1.MANDATORY_REFRESH_THRESHOLD_IN_SECONDS) {
            this.backgroundRefresh();
            return cached.token;
        }
        const token = await this.refresh();
        return token.token;
    }
    /**
     * Clears the cached token and marks the next {@link getToken} as a forced
     * refresh, so the underlying provider bypasses any on-disk freshness check.
     * Called after a 401 — the server has just told us the token is bad even
     * if its `expires_at` still looks fresh.
     */
    invalidate() {
        this.cached = null;
        this.nextForce = true;
    }
    /**
     * Mandatory refresh. Joins any in-flight refresh unless forced — a forced
     * refresh must not coalesce into a non-forced one that may re-serve the
     * same stale disk token.
     */
    refresh(force = false) {
        if (this.pendingRefresh && !force) {
            return this.pendingRefresh;
        }
        return this.doRefresh(force);
    }
    /**
     * Advisory background refresh. Shares the same in-flight promise as
     * mandatory refreshes for deduplication, but swallows errors so the
     * stale cached token keeps being served. Backs off for
     * {@link ADVISORY_REFRESH_BACKOFF_IN_SECONDS} after a failure so an
     * outage during the advisory window doesn't hammer the token endpoint.
     */
    backgroundRefresh() {
        if (this.pendingRefresh) {
            return;
        }
        if ((0, time_1.nowAsSeconds)() - this.lastAdvisoryError < types_1.ADVISORY_REFRESH_BACKOFF_IN_SECONDS) {
            return;
        }
        this.doRefresh().catch((err) => {
            this.lastAdvisoryError = (0, time_1.nowAsSeconds)();
            // Advisory failure: keep serving the stale cached token, but surface
            // the error to the caller-provided hook so it can be logged.
            this.onAdvisoryRefreshError?.(err);
        });
    }
    /**
     * Core refresh. Sets {@link pendingRefresh} so concurrent callers
     * (both advisory and mandatory) coalesce into a single provider call.
     */
    doRefresh(force = false) {
        this.pendingRefresh = this.provider(force ? { forceRefresh: true } : undefined).then((token) => {
            this.cached = token;
            this.pendingRefresh = null;
            return token;
        }, (err) => {
            this.pendingRefresh = null;
            throw err;
        });
        return this.pendingRefresh;
    }
}
exports.TokenCache = TokenCache;
//# sourceMappingURL=token-cache.js.map