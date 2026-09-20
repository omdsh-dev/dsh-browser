/** True when `e` is an {@link APIError} whose HTTP status equals `code`. */
export declare function isStatus(e: unknown, code: number): boolean;
/** True when `e` is an {@link APIError} with a 4xx status. */
export declare function is4xx(e: unknown): boolean;
/**
 * True for a 4xx that the core client's retry policy would *not* retry, i.e. a
 * permanent client error. 408 (request timeout), 409 (lock timeout) and 429
 * (rate limit) are retryable for the base client (`Anthropic.shouldRetry`), so
 * they are not treated as fatal here — keeping helper retry behaviour aligned
 * with the rest of the SDK.
 */
export declare function isFatal4xx(e: unknown): boolean;
/** Exponential backoff: `baseMs * 2 ** attempt`, clamped to `capMs`. */
export declare function backoff(attempt: number, baseMs: number, capMs: number): number;
/** Uniform random delay in the half-open interval `[lowMs, highMs)`. */
export declare function jitter(lowMs: number, highMs: number): number;
/**
 * Trim up to 25% off `ms` at random so a fleet of clients backing off after a
 * shared outage does not retry in lockstep — mirrors the jitter the core client
 * applies to its own retry timeout.
 */
export declare function applyJitter(ms: number): number;
//# sourceMappingURL=backoff.d.ts.map