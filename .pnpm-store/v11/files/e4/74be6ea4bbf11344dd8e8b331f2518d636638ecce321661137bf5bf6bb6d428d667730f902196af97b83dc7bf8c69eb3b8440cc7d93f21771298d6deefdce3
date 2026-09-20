import type { BaseAnthropic } from "../client.js";
import type { Fetch } from "../internal/builtin-types.js";
import type { FinalRequestOptions } from "../internal/request-options.js";
import { type Logger } from "../internal/utils/log.js";
import type { APIRequest } from "./api.js";
/**
 * Invokes the rest of the middleware chain, ending with the underlying `fetch`.
 *
 * This function can be invoked multiple times.
 */
export type MiddlewareNext = (request: APIRequest) => Promise<Response>;
/**
 * Helpers passed to each middleware alongside `next`, scoped to the request
 * in flight (one context is shared by every middleware in the chain).
 */
export interface MiddlewareContext {
    /**
     * The SDK request options the API call in flight was made with: `method`,
     * `path`, the pre-encoded `body`, `stream`, etc.
     *
     * `undefined` when the chain isn't running for an SDK API request, i.e.
     * for credential token-exchange requests.
     */
    readonly options?: FinalRequestOptions | undefined;
    /**
     * The client's logger, pre-filtered to the client's configured log level
     * (the `logLevel` client option or the `ANTHROPIC_LOG` environment
     * variable). Calls below the active level are no-ops, so it's always safe
     * to call; with no logger configured it writes to the global `console`.
     *
     * Values are logged as-is — when logging request or response headers,
     * redact credentials (`authorization`, `x-api-key`, `cookie`) the way the
     * SDK's own logs do.
     *
     * @example
     * ```ts
     * const mw: Middleware = async (request, next, ctx) => {
     *   ctx.logger.debug('->', request.method, request.url);
     *   return next(request);
     * };
     * ```
     */
    readonly logger: Logger;
    /**
     * Parse a response body the way the SDK would for the request in flight:
     *
     * - JSON responses are decoded, with the non-enumerable `_request_id`
     *   property attached like SDK return values, and anything else resolves
     *   to the body text.
     * - For streaming requests ({@link options}`.stream`), resolves immediately
     *   with a {@link Stream} reading an independent copy of the response body —
     *   iterating it doesn't consume the client's events, and aborting or
     *   `break`ing out of it doesn't cancel the underlying request. Each call
     *   returns a fresh `Stream` (streams are single-consumer, so they aren't
     *   cached). Error (non-2xx) responses parse as JSON/text rather than as a
     *   stream, mirroring the SDK's own handling.
     * - For binary requests, resolves with the `Response` itself, unconsumed.
     *
     * Reads through an internal `response.clone()`, so the response stays
     * readable: the client (and any other middleware) can still consume the
     * body afterwards. Non-stream results are cached per `Response` and shared
     * across the middleware chain, so repeated calls cost a single read.
     *
     * @example
     * ```ts
     * const mw: Middleware = async (request, next, ctx) => {
     *   const response = await next(request);
     *   const data = await ctx.parse<Message>(response);
     *   if (data.type === 'message') console.log(data.usage);
     *   return response;
     * };
     * ```
     */
    parse<T = unknown>(response: Response): Promise<T>;
}
/**
 * A function that wraps each HTTP request made by the client.
 *
 * Middleware may observe or modify the request before calling `next`, observe
 * or replace the response, short-circuit by returning a `Response` without
 * calling `next`, or call `next` multiple times to implement custom retries.
 *
 * Middleware always observes the canonical Anthropic-shaped request — e.g.
 * `POST .../v1/messages` with `model` and `stream` in the JSON body and
 * `anthropic-beta` as a header — with the client's logical credentials
 * (`x-api-key` / `Authorization`) applied. On clients for third-party
 * backends (Bedrock, Vertex, Foundry), the backend adaptation — URL and body
 * rewriting, request signing (e.g. AWS SigV4), and response normalization
 * (e.g. AWS EventStream to SSE) — runs *inside* `next`, so middleware behaves
 * identically on every backend: mutating the request is safe (signing covers
 * the final body), and streaming responses are observed as SSE. Each `next()`
 * call re-runs the adaptation, so custom retries re-sign from scratch. To
 * observe the literal wire traffic instead, provide a custom `fetch`.
 *
 * Middleware must not consume the body of the `Response` it returns - the
 * client still needs to read it. To inspect the body, use
 * `await ctx.parse(response)` (cached, leaves the body readable) or read a
 * clone (`await response.clone().text()`); to transform it, return a
 * replacement, e.g. `new Response(body, response)`.
 *
 * Middleware runs per HTTP attempt, inside the SDK's retry loop; the attempt
 * number is available via the `X-Stainless-Retry-Count` request header. An
 * error thrown from middleware propagates to the caller as-is.
 *
 * Middleware errors are **not** retried apart from connection-level errors:
 * timeout/abort errors, errors thrown by `fetch()`, and `APIConnectionError`s
 * or `RetryableError`s — thrown directly or present anywhere in an error's
 * `cause` chain. Retryable middleware errors still propagate to the caller
 * as-is once retries are exhausted.
 *
 * @example
 * ```ts
 * const logger: Middleware = async (request, next, ctx) => {
 *   ctx.logger.debug('->', request.method, request.url);
 *   const response = await next(request);
 *   ctx.logger.debug('<-', response.status, request.url);
 *   return response;
 * };
 *
 * const client = new Anthropic({ middleware: [logger] });
 * ```
 */
export type Middleware = (request: APIRequest, next: MiddlewareNext, ctx: MiddlewareContext) => Promise<Response>;
/** Whether `err` was thrown by the underlying `fetch` rather than by a middleware. */
export declare function isFetchOriginError(err: unknown): boolean;
/**
 * Whether an error thrown by middleware should stay on the SDK's
 * connection-error retry policy: fetch-origin, abort, `APIConnectionError`, or
 * `RetryableError` — checked through the error's `cause` chain.
 */
export declare function isRetryableError(err: unknown): boolean;
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
export declare function wrapFetchWithMiddleware(fetchFn: Fetch, middleware: readonly Middleware[], options?: FinalRequestOptions | undefined, client?: BaseAnthropic | undefined): Fetch;
/**
 * Composes `middleware` around `fetchFn` and returns the entry point of the chain.
 */
export declare function applyMiddleware(fetchFn: Fetch, middleware: readonly Middleware[], options?: FinalRequestOptions | undefined, client?: BaseAnthropic | undefined): MiddlewareNext;
//# sourceMappingURL=middleware.d.ts.map