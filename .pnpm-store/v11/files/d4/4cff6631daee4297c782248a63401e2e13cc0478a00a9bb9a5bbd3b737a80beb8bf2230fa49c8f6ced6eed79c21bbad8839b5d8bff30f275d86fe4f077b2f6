"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dreams = void 0;
const resource_1 = require("../../core/resource.js");
const pagination_1 = require("../../core/pagination.js");
const headers_1 = require("../../internal/headers.js");
const path_1 = require("../../internal/utils/path.js");
class Dreams extends resource_1.APIResource {
    /**
     * Create a Dream
     *
     * @example
     * ```ts
     * const betaDream = await client.beta.dreams.create({
     *   inputs: [{ memory_store_id: 'x', type: 'memory_store' }],
     *   model: 'string',
     * });
     * ```
     */
    create(params, options) {
        const { betas, ...body } = params;
        return this._client.post('/v1/dreams?beta=true', {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'dreaming-2026-04-21'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Get a Dream
     *
     * @example
     * ```ts
     * const betaDream = await client.beta.dreams.retrieve(
     *   'dream_id',
     * );
     * ```
     */
    retrieve(dreamID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get((0, path_1.path) `/v1/dreams/${dreamID}?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'dreaming-2026-04-21'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * List Dreams
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaDream of client.beta.dreams.list()) {
     *   // ...
     * }
     * ```
     */
    list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList('/v1/dreams?beta=true', (pagination_1.PageCursor), {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'dreaming-2026-04-21'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Archive a Dream
     *
     * @example
     * ```ts
     * const betaDream = await client.beta.dreams.archive(
     *   'dream_id',
     * );
     * ```
     */
    archive(dreamID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post((0, path_1.path) `/v1/dreams/${dreamID}/archive?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'dreaming-2026-04-21'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Cancel a Dream
     *
     * @example
     * ```ts
     * const betaDream = await client.beta.dreams.cancel(
     *   'dream_id',
     * );
     * ```
     */
    cancel(dreamID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post((0, path_1.path) `/v1/dreams/${dreamID}/cancel?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'dreaming-2026-04-21'].toString() },
                options?.headers,
            ]),
        });
    }
}
exports.Dreams = Dreams;
//# sourceMappingURL=dreams.js.map