import { castToError, isAbortError } from "../internal/errors.mjs";
import { addResponseIDs } from "../internal/parse.mjs";
import { defaultLogger, loggerFor } from "../internal/utils/log.mjs";
import { AnthropicError, APIConnectionError, RetryableError } from "./error.mjs";
import { Stream } from "./streaming.mjs";
/**
 * Errors thrown by the underlying `fetch`, as opposed to by a middleware.
 *
 * Tracked so the client can apply its connection-error retry policy to
 * transport failures while letting errors thrown by middleware propagate to
 * the caller untouched.
 */
const fetchOriginErrors = new WeakSet();
/** Whether `err` was thrown by the underlying `fetch` rather than by a middleware. */
export function isFetchOriginError(err) {
    return typeof err === 'object' && err !== null && fetchOriginErrors.has(err);
}
/**
 * Whether an error thrown by middleware should stay on the SDK's
 * connection-error retry policy: fetch-origin, abort, `APIConnectionError`, or
 * `RetryableError` — checked through the error's `cause` chain.
 */
export function isRetryableError(err) {
    const seen = new Set(); // guard against `cause` cycles
    while (typeof err === 'object' && err !== null && !seen.has(err)) {
        seen.add(err);
        if (isFetchOriginError(err) ||
            isAbortError(err) ||
            err instanceof APIConnectionError ||
            err instanceof RetryableError) {
            return true;
        }
        err = err.cause;
    }
    return false;
}
/**
 * Wraps `fetchFn` so each call runs through `middleware`, keeping the same
 * call signature as `fetch` itself.
 *
 * With no middleware, calls are passed straight through to `fetchFn`.
 * Otherwise the arguments are normalized into an {@link APIRequest} (headers
 * coerced to a `Headers` instance, URL stringified) before entering the
 * chain. The chain is composed per call, so mutations of a `middleware`
 * array are picked up by later requests.
 *
 * `options` — the SDK request options behind this call, when there are any —
 * is surfaced to middleware as `ctx.options` and drives `ctx.parse`.
 *
 * `client` supplies `ctx.logger` (the client's level-filtered logger);
 * without it, `ctx.logger` falls back to the client defaults: `console`,
 * filtered to `ANTHROPIC_LOG` or `'warn'`.
 */
export function wrapFetchWithMiddleware(fetchFn, middleware, options, client) {
    return async (url, init = {}) => {
        if (middleware.length === 0) {
            // use undefined this binding; fetch errors if bound to something else in browser/cloudflare
            return fetchFn.call(undefined, url, init);
        }
        const headers = init.headers instanceof Headers ? init.headers : new Headers(init.headers);
        const response = await applyMiddleware(fetchFn, middleware, options, client)({
            ...init,
            headers,
            url: typeof url === 'string' ? url
                : url instanceof URL ? url.href
                    : url.url,
        });
        // Catch a footgun before the client tries to read the body itself and
        // fails with a confusing low-level stream error.
        if (response.bodyUsed || response.body?.locked) {
            throw new AnthropicError('middleware consumed the response body; use response.clone() to inspect it, ' +
                'or return new Response(body, response) to consume and replace it');
        }
        return response;
    };
}
/**
 * Creates the {@link MiddlewareContext} shared by every middleware in one chain.
 */
function createMiddlewareContext(options, client) {
    // Keyed on the Response so each `next()` call's response (e.g. with custom
    // retries, or a middleware swapping in a replacement) parses independently,
    // while several middleware parsing the same response share a single read.
    const cache = new WeakMap();
    return {
        options,
        // Resolved per chain, so changes to the client's `logLevel`/`logger`
        // apply to subsequent requests.
        logger: client ? loggerFor(client) : defaultLogger(),
        parse(response) {
            // Streams are single-consumer, so caching one would hand later callers
            // an already-consumed stream; every call gets a fresh clone-backed one.
            if (options?.stream && response.ok) {
                return parseMiddlewareResponse(response, options, client);
            }
            let parsed = cache.get(response);
            if (!parsed) {
                parsed = parseMiddlewareResponse(response, options, client);
                cache.set(response, parsed);
            }
            return parsed;
        },
    };
}
/**
 * Mirrors the client's own response parsing (`defaultParseResponse` in
 * `internal/parse.ts`), reading through a clone so the body stays available
 * to the rest of the chain and the client itself.
 */
async function parseMiddlewareResponse(response, options, client) {
    if (response.bodyUsed || response.body?.locked) {
        throw new AnthropicError('cannot ctx.parse() a response whose body was already consumed; ' +
            'call ctx.parse() instead of reading the body, or read via response.clone()');
    }
    // Error responses parse as JSON/text below — the SDK only stream-parses
    // successful responses, and middleware typically wants the error body.
    if (options?.stream && response.ok) {
        // A fresh controller rather than the request's own: aborting (or
        // `break`ing out of) the middleware's stream must not cancel the
        // in-flight request the client is still reading.
        return Stream.fromSSEResponse(response.clone(), new AbortController(), client);
    }
    // fetch refuses to read the body when the status code is 204.
    if (response.status === 204) {
        return null;
    }
    if (options?.__binaryResponse) {
        return response;
    }
    const contentType = response.headers.get('content-type');
    const mediaType = contentType?.split(';')[0]?.trim();
    const isJSON = mediaType?.includes('application/json') || mediaType?.endsWith('+json');
    if (isJSON) {
        if (response.headers.get('content-length') === '0') {
            // if there is no content we can't do anything
            return undefined;
        }
        return addResponseIDs(await response.clone().json(), response);
    }
    return await response.clone().text();
}
/**
 * Composes `middleware` around `fetchFn` and returns the entry point of the chain.
 */
export function applyMiddleware(fetchFn, middleware, options, client) {
    // use undefined this binding; fetch errors if bound to something else in browser/cloudflare
    let next = async ({ url, ...init }) => {
        try {
            return await fetchFn.call(undefined, url, init);
        }
        catch (err) {
            // Brand the error as fetch-origin, normalizing with `castToError` first since a
            // WeakSet can't hold primitives and the brand must be on the same object the
            // client's own `castToError` will later pass through.
            const error = castToError(err);
            fetchOriginErrors.add(error);
            throw error;
        }
    };
    const ctx = createMiddlewareContext(options, client);
    for (let i = middleware.length - 1; i >= 0; i--) {
        const mw = middleware[i];
        const nextInner = next;
        next = async (request) => mw(request, nextInner, ctx);
    }
    return next;
}
//# sourceMappingURL=middleware.mjs.map