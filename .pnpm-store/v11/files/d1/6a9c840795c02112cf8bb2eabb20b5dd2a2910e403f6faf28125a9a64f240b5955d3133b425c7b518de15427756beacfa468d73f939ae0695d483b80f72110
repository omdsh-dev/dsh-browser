// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../core/resource.mjs";
import { PageCursor } from "../../../core/pagination.mjs";
import { buildHeaders } from "../../../internal/headers.mjs";
import { path } from "../../../internal/utils/path.mjs";
export class MemoryVersions extends APIResource {
    /**
     * Retrieve a memory version
     *
     * @example
     * ```ts
     * const betaManagedAgentsMemoryVersion =
     *   await client.beta.memoryStores.memoryVersions.retrieve(
     *     'memory_version_id',
     *     { memory_store_id: 'memory_store_id' },
     *   );
     * ```
     */
    retrieve(memoryVersionID, params, options) {
        const { memory_store_id, betas, ...query } = params;
        return this._client.get(path `/v1/memory_stores/${memory_store_id}/memory_versions/${memoryVersionID}?beta=true`, {
            query,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'agent-memory-2026-07-22'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * List memory versions
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaManagedAgentsMemoryVersion of client.beta.memoryStores.memoryVersions.list(
     *   'memory_store_id',
     * )) {
     *   // ...
     * }
     * ```
     */
    list(memoryStoreID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path `/v1/memory_stores/${memoryStoreID}/memory_versions?beta=true`, (PageCursor), {
            query,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'agent-memory-2026-07-22'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Redact a memory version
     *
     * @example
     * ```ts
     * const betaManagedAgentsMemoryVersion =
     *   await client.beta.memoryStores.memoryVersions.redact(
     *     'memory_version_id',
     *     { memory_store_id: 'memory_store_id' },
     *   );
     * ```
     */
    redact(memoryVersionID, params, options) {
        const { memory_store_id, betas } = params;
        return this._client.post(path `/v1/memory_stores/${memory_store_id}/memory_versions/${memoryVersionID}/redact?beta=true`, {
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'agent-memory-2026-07-22'].toString() },
                options?.headers,
            ]),
        });
    }
}
//# sourceMappingURL=memory-versions.mjs.map