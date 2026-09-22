// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../core/resource.mjs";
import { PageCursor } from "../../core/pagination.mjs";
import { buildHeaders } from "../../internal/headers.mjs";
import { path } from "../../internal/utils/path.mjs";
export class Dreams extends APIResource {
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
            headers: buildHeaders([
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
        return this._client.get(path `/v1/dreams/${dreamID}?beta=true`, {
            ...options,
            headers: buildHeaders([
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
        return this._client.getAPIList('/v1/dreams?beta=true', (PageCursor), {
            query,
            ...options,
            headers: buildHeaders([
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
        return this._client.post(path `/v1/dreams/${dreamID}/archive?beta=true`, {
            ...options,
            headers: buildHeaders([
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
        return this._client.post(path `/v1/dreams/${dreamID}/cancel?beta=true`, {
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'dreaming-2026-04-21'].toString() },
                options?.headers,
            ]),
        });
    }
}
//# sourceMappingURL=dreams.mjs.map