"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackEncoder = exports.BetaFallbackState = void 0;
/**
 * Tracks which fallback a sequence of requests is pinned to.
 *
 * Create one (`new BetaFallbackState()`) and pass it via the `fallbackState`
 * request option on every request that should share the pin — the turns of one
 * conversation, or any wider scope the stickiness should apply to;
 * `betaRefusalFallbackMiddleware` mutates it in place when a model refuses.
 */
class BetaFallbackState {
}
exports.BetaFallbackState = BetaFallbackState;
const FallbackEncoder = ({ headers, body }) => {
    return {
        bodyHeaders: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(body),
    };
};
exports.FallbackEncoder = FallbackEncoder;
//# sourceMappingURL=request-options.js.map