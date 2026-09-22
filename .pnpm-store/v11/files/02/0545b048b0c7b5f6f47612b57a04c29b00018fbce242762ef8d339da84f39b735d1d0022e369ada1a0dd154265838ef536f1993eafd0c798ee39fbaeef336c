"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStatus = isStatus;
exports.is4xx = is4xx;
exports.isFatal4xx = isFatal4xx;
exports.backoff = backoff;
exports.jitter = jitter;
exports.applyJitter = applyJitter;
const error_1 = require("../../core/error.js");
/** True when `e` is an {@link APIError} whose HTTP status equals `code`. */
function isStatus(e, code) {
    return e instanceof error_1.APIError && e.status === code;
}
/** True when `e` is an {@link APIError} with a 4xx status. */
function is4xx(e) {
    return e instanceof error_1.APIError && typeof e.status === 'number' && e.status >= 400 && e.status < 500;
}
/**
 * True for a 4xx that the core client's retry policy would *not* retry, i.e. a
 * permanent client error. 408 (request timeout), 409 (lock timeout) and 429
 * (rate limit) are retryable for the base client (`Anthropic.shouldRetry`), so
 * they are not treated as fatal here — keeping helper retry behaviour aligned
 * with the rest of the SDK.
 */
function isFatal4xx(e) {
    return is4xx(e) && !isStatus(e, 408) && !isStatus(e, 409) && !isStatus(e, 429);
}
/** Exponential backoff: `baseMs * 2 ** attempt`, clamped to `capMs`. */
function backoff(attempt, baseMs, capMs) {
    return Math.min(baseMs * 2 ** attempt, capMs);
}
/** Uniform random delay in the half-open interval `[lowMs, highMs)`. */
function jitter(lowMs, highMs) {
    return lowMs + Math.random() * (highMs - lowMs);
}
/**
 * Trim up to 25% off `ms` at random so a fleet of clients backing off after a
 * shared outage does not retry in lockstep — mirrors the jitter the core client
 * applies to its own retry timeout.
 */
function applyJitter(ms) {
    return ms * (1 - Math.random() * 0.25);
}
//# sourceMappingURL=backoff.js.map