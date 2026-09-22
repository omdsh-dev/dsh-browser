"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
/**
 * Resolve after `ms`, or immediately when `signal` aborts.
 *
 * When a `signal` is passed the abort listener is always removed so repeated
 * calls do not accumulate listeners on a long-lived signal. Resolves (rather
 * than rejects) on abort — callers treat abort as "wake up early," not as a
 * failure; callers that want to unwind should check the signal themselves.
 */
const sleep = (ms, signal) => new Promise((resolve) => {
    if (signal?.aborted)
        return resolve();
    const onAbort = () => {
        clearTimeout(timer);
        resolve();
    };
    const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
    }, ms);
    // `{ once: true }` auto-removes the listener if abort fires first,
    // so we only need an explicit remove on the timer-wins path above.
    signal?.addEventListener('abort', onAbort, { once: true });
});
exports.sleep = sleep;
//# sourceMappingURL=sleep.js.map