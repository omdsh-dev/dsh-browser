import type { Middleware } from "../core/middleware.mjs";
import type { AnthropicBeta } from "../resources/beta/beta.mjs";
import type { BetaFallbackParam, BetaRawMessageDeltaEvent } from "../resources/beta/messages/messages.mjs";
export { BetaFallbackState } from "../internal/request-options.mjs";
/** Why {@link BetaRefusalFallbackOptions.onError} fired. */
export type BetaRefusalFallbackError = {
    /** The refusal carries no `fallback_credit_token`, so it can't be retried. */
    kind: 'no_credit_token';
    message: string;
    /** The refusal `message_delta` event, verbatim. */
    event: BetaRawMessageDeltaEvent;
} | {
    /** The stream refused but every fallback entry has been used up. */
    kind: 'chain_exhausted';
    message: string;
    /** The refusal `message_delta` event, verbatim. */
    event: BetaRawMessageDeltaEvent;
} | {
    /** A streaming fallback request failed; the hop was skipped. */
    kind: 'request_failed';
    message: string;
    /** The fallback model whose request failed. */
    model: string;
    /** The HTTP status, or `null` when the request threw instead of resolving. */
    status: number | null;
    /** The parsed error body, or the thrown error when `status` is `null`. */
    detail: unknown;
};
export interface BetaRefusalFallbackOptions {
    /**
     * Betas added to the `anthropic-beta` header of every `/v1/messages`
     * request this middleware handles — the original request included, since
     * refusals only carry a `fallback_credit_token` when the beta is enabled.
     * Defaults to `['fallback-credit-2026-07-01']`; pass `[]` to send none.
     */
    betas?: readonly AnthropicBeta[] | undefined;
    /**
     * Called when a refusal is surfaced to the client rather than retried —
     * it carries no `fallback_credit_token`, no fallback entries remain, or a
     * streaming fallback request failed. Discriminate on `error.kind`.
     * Defaults to logging through the client logger.
     */
    onError?: ((error: BetaRefusalFallbackError) => void) | undefined;
}
/**
 * Middleware that retries refused `/v1/messages` requests down a fallback chain.
 *
 * Non-streaming: when a response comes back with `stop_reason: 'refusal'`, the
 * request is retried with each entry of `fallbacks` applied as a patch to the
 * original params (a set field overrides, an explicit `null` unsets, an absent
 * field keeps the original value; entries never patch each other's requests)
 * — passing along the refusal's `fallback_credit_token` — until a model
 * accepts or the chain is exhausted. A message served by a fallback carries a
 * `fallback` content block prepended at each model boundary — the same seam
 * block shape the server-side `fallbacks` param places in `content`, though
 * the rest of the envelope is the serving hop's as returned (see the
 * known-divergences note below); an exhausted chain surfaces the final
 * refusal verbatim.
 *
 * Streaming: when the stream ends in `stop_reason: 'refusal'`, a second
 * request is issued to the fallback model — carrying the refused model's
 * partial output as a trailing assistant prefill when the refusal grants one
 * (`fallback_has_prefill_claim`), plus the refusal's `fallback_credit_token`
 * — and the fallback's events are spliced onto the
 * still-open stream, so the client sees one continuous message in the
 * server-side `fallbacks` wire shape: a `fallback` content block at each model
 * boundary, monotonic block indices, and per-hop `usage.iterations` on the
 * final `message_delta`. Only `model` is honored from each entry on this path:
 * the credit token is redeemable only against the refused request's body, so
 * the other per-entry overrides (`max_tokens`, `thinking`, ...) would be
 * rejected.
 *
 * The fallback-credit beta the credit tokens require is sent by default on
 * every request the middleware handles; the `betas` option controls this.
 *
 * In both modes a fallback that itself refuses with a fresh credit token
 * continues down the chain. A streaming fallback whose prefill the server
 * rejects (HTTP 400) is retried once without it; a fallback whose request
 * fails outright is skipped — its token was never redeemed, so it carries to
 * the next entry.
 *
 * To keep later requests on the model that accepted, pass a
 * {@link BetaFallbackState} via the `fallbackState` request option; requests
 * sharing that state start directly at the pinned fallback. Reuse one state
 * across whatever scope the pin should apply to — typically a conversation.
 *
 * @example
 * ```ts
 * const client = new Anthropic({
 *   middleware: [betaRefusalFallbackMiddleware([{ model: 'claude-opus-4-8' }])],
 * });
 *
 * const fallbackState = new BetaFallbackState();
 * const message = await client.beta.messages.create(params, { fallbackState });
 * ```
 */
export declare function betaRefusalFallbackMiddleware(fallbacks: readonly BetaFallbackParam[], options?: BetaRefusalFallbackOptions): Middleware;
//# sourceMappingURL=middleware.d.mts.map