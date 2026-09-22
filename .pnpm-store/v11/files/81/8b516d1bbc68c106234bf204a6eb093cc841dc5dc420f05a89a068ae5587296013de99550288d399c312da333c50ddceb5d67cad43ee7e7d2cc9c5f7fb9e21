"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Webhooks = void 0;
const resource_1 = require("../../core/resource.js");
const standardwebhooks_1 = require("standardwebhooks");
class Webhooks extends resource_1.APIResource {
    /**
     * Parses a webhook payload into an event without verifying its signature. Prefer
     * `unwrap()` unless you have already verified the signature yourself.
     */
    parseUnverified(body) {
        return JSON.parse(body);
    }
    /**
     * Verifies the webhook signature from the `webhook-id`, `webhook-timestamp` and
     * `webhook-signature` headers using your webhook signing key, then parses the
     * payload into an event. Fails if the signature is missing or invalid.
     */
    unwrap(body, options) {
        const headers = options?.headers;
        if (headers == null)
            throw new Error('Webhook headers are required in order to verify the signature');
        const keyStr = options.key === undefined ? this._client.webhookKey : options.key;
        if (!keyStr)
            throw new Error('Webhook key must not be null or empty in order to unwrap');
        const wh = new standardwebhooks_1.Webhook(keyStr);
        wh.verify(body, headers);
        return JSON.parse(body);
    }
}
exports.Webhooks = Webhooks;
//# sourceMappingURL=webhooks.js.map