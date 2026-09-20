"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Memories = void 0;
const resource_1 = require("../../../core/resource.js");
const pagination_1 = require("../../../core/pagination.js");
const headers_1 = require("../../../internal/headers.js");
const path_1 = require("../../../internal/utils/path.js");
class Memories extends resource_1.APIResource {
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
        return this._client.post((0, path_1.path) `/v1/memory_stores/${memoryStoreID}/memories?beta=true`, {
            query: { view },
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
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
        return this._client.get((0, path_1.path) `/v1/memory_stores/${memory_store_id}/memories/${memoryID}?beta=true`, {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
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
        return this._client.post((0, path_1.path) `/v1/memory_stores/${memory_store_id}/memories/${memoryID}?beta=true`, {
            query: { view },
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
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
        return this._client.getAPIList((0, path_1.path) `/v1/memory_stores/${memoryStoreID}/memories?beta=true`, (pagination_1.PageCursor), {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
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
        return this._client.delete((0, path_1.path) `/v1/memory_stores/${memory_store_id}/memories/${memoryID}?beta=true`, {
            query: { expected_content_sha256 },
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'agent-memory-2026-07-22'].toString() },
                options?.headers,
            ]),
        });
    }
}
exports.Memories = Memories;
//# sourceMappingURL=memories.js.map