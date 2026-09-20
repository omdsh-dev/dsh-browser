/**
 * A deferred: a `Promise` together with its `resolve` / `reject` functions.
 * This is `Promise.withResolvers()`, which is not available in all supported
 * runtimes.
 */
export function promiseWithResolvers() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}
//# sourceMappingURL=promise.mjs.map