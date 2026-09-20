// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../core/resource.mjs";
import { PageCursor } from "../../../core/pagination.mjs";
import { buildHeaders } from "../../../internal/headers.mjs";
import { path } from "../../../internal/utils/path.mjs";
export class Memories extends APIResource {
    /**
     * Create a memory
     *
     * @example
     * ```ts
     * const betaManagedAgentsMemory =
     *   await client.beta.memoryStores.memories.create(
     *     'memory_store_id',
     *     { content: 'content', path: 'xx' },
     *   );
     * ```
     */
    create(memoryStoreID, params, options) {
        const { view, betas, ...body } = params;
        return this._client.post(path `/v1/memory_stores/${memoryStoreID}/memories?beta=true`, {
            query: { view },
            body,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'agent-memory-2026-07-22'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Retrieve a memory
     *
     * @example
     * ```ts
     * const betaManagedAgentsMemory =
     *   await client.beta.memoryStores.memories.retrieve(
     *     'memory_id',
     *     { memory_store_id: 'memory_store_id' },
     *   );
     * ```
     */
    retrieve(memoryID, params, options) {
        const { memory_store_id, betas, ...query } = params;
        return this._client.get(path `/v1/memory_stores/${memory_store_id}/memories/${memoryID}?beta=true`, {
            query,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'agent-memory-2026-07-22'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Update a memory
     *
     * @example
     * ```ts
     * const betaManagedAgentsMemory =
     *   await client.beta.memoryStores.memories.update(
     *     'memory_id',
     *     { memory_store_id: 'memory_store_id' },
     *   );
     * ```
     */
    update(memoryID, params, options) {
        const { memory_store_id, view, betas, ...body } = params;
        return this._client.post(path `/v1/memory_stores/${memory_store_id}/memories/${memoryID}?beta=true`, {
            query: { view },
            body,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'agent-memory-2026-07-22'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * List memories
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaManagedAgentsMemoryListItem of client.beta.memoryStores.memories.list(
     *   'memory_store_id',
     * )) {
     *   // ...
     * }
     * ```
     */
    list(memoryStoreID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path `/v1/memory_stores/${memoryStoreID}/memories?beta=true`, (PageCursor), {
            query,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'agent-memory-2026-07-22'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Delete a memory
     *
     * @example
     * ```ts
     * const betaManagedAgentsDeletedMemory =
     *   await client.beta.memoryStores.memories.delete(
     *     'memory_id',
     *     { memory_store_id: 'memory_store_id' },
     *   );
     * ```
     */
    delete(memoryID, params, options) {
        const { memory_store_id, expected_content_sha256, betas } = params;
        return this._client.delete(path `/v1/memory_stores/${memory_store_id}/memories/${memoryID}?beta=true`, {
            query: { expected_content_sha256 },
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'agent-memory-2026-07-22'].toString() },
                options?.headers,
            ]),
        });
    }
}
//# sourceMappingURL=memories.mjs.map