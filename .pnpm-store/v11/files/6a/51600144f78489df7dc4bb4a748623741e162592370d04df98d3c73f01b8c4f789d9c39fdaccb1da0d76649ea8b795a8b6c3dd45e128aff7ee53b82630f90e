/**
 * Tracks the removal of the per-request abort listener that
 * `fetchWithTimeout` attaches to a caller-provided signal, so the listener's
 * lifetime matches the request instead of the signal.
 *
 * Without removal, a long-lived signal (e.g. one AbortController reused for
 * a whole session) accumulates one `{ once: true }` listener plus its bound
 * AbortController per HTTP attempt until the signal fires or is collected,
 * and Node warns at the 11th listener. The listener must survive until the
 * response body is settled - removing it when fetch resolves (headers) would
 * break aborting an in-flight body read - so the code that finishes the body
 * (response parsing, stream teardown, retry/error handling) calls
 * `releaseRequestSignal` with the request's controller.
 */
const cleanups = new WeakMap();
const registry = typeof globalThis.FinalizationRegistry === 'function' ?
    new globalThis.FinalizationRegistry((controller) => releaseRequestSignal(controller))
    : null;
// Module-scope factory so the cleanup closure captures exactly the signal and
// the listener - built at the `fetchWithTimeout` call site it would share that
// scope's context and retain the request body for as long as the cleanup is
// held (same reason `_makeAbort` exists in client.ts).
function makeCleanup(signal, listener) {
    return () => signal.removeEventListener('abort', listener);
}
export function registerRequestSignalCleanup(controller, signal, listener) {
    cleanups.set(controller, makeCleanup(signal, listener));
}
// The registered target is the response BODY, not the Response: a caller can
// keep a reader on the body and drop the Response wrapper (`.asResponse()`),
// and the listener must survive for as long as anything can still read - the
// body is what a live read keeps alive.
export function armAbandonmentBackstop(body, controller) {
    if (cleanups.has(controller))
        registry?.register(body, controller, controller);
}
export function releaseRequestSignal(controller) {
    const cleanup = cleanups.get(controller);
    if (cleanup) {
        cleanups.delete(controller);
        registry?.unregister(controller);
        cleanup();
    }
}
//# sourceMappingURL=request-signal.mjs.map