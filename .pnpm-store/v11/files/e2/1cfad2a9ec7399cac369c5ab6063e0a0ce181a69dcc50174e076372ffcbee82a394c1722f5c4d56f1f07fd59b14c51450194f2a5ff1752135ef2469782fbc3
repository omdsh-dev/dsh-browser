"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Credentials = void 0;
const resource_1 = require("../../../core/resource.js");
const pagination_1 = require("../../../core/pagination.js");
const headers_1 = require("../../../internal/headers.js");
const path_1 = require("../../../internal/utils/path.js");
class Credentials extends resource_1.APIResource {
    /**
     * Create Credential
     *
     * @example
     * ```ts
     * const betaManagedAgentsCredential =
     *   await client.beta.vaults.credentials.create(
     *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
     *     {
     *       auth: {
     *         token: 'bearer_exampletoken',
     *         mcp_server_url:
     *           'https://example-server.modelcontextprotocol.io/sse',
     *         type: 'static_bearer',
     *       },
     *     },
     *   );
     * ```
     */
    create(vaultID, params, options) {
        const { betas, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/vaults/${vaultID}/credentials?beta=true`, {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Get Credential
     *
     * @example
     * ```ts
     * const betaManagedAgentsCredential =
     *   await client.beta.vaults.credentials.retrieve(
     *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
     *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
     *   );
     * ```
     */
    retrieve(credentialID, params, options) {
        const { vault_id, betas } = params;
        return this._client.get((0, path_1.path) `/v1/vaults/${vault_id}/credentials/${credentialID}?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Update Credential
     *
     * @example
     * ```ts
     * const betaManagedAgentsCredential =
     *   await client.beta.vaults.credentials.update(
     *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
     *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
     *   );
     * ```
     */
    update(credentialID, params, options) {
        const { vault_id, betas, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/vaults/${vault_id}/credentials/${credentialID}?beta=true`, {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * List Credentials
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaManagedAgentsCredential of client.beta.vaults.credentials.list(
     *   'vlt_011CZkZDLs7fYzm1hXNPeRjv',
     * )) {
     *   // ...
     * }
     * ```
     */
    list(vaultID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList((0, path_1.path) `/v1/vaults/${vaultID}/credentials?beta=true`, (pagination_1.PageCursor), {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Delete Credential
     *
     * @example
     * ```ts
     * const betaManagedAgentsDeletedCredential =
     *   await client.beta.vaults.credentials.delete(
     *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
     *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
     *   );
     * ```
     */
    delete(credentialID, params, options) {
        const { vault_id, betas } = params;
        return this._client.delete((0, path_1.path) `/v1/vaults/${vault_id}/credentials/${credentialID}?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Archive Credential
     *
     * @example
     * ```ts
     * const betaManagedAgentsCredential =
     *   await client.beta.vaults.credentials.archive(
     *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
     *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
     *   );
     * ```
     */
    archive(credentialID, params, options) {
        const { vault_id, betas } = params;
        return this._client.post((0, path_1.path) `/v1/vaults/${vault_id}/credentials/${credentialID}/archive?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Validate Credential
     *
     * @example
     * ```ts
     * const betaManagedAgentsCredentialValidation =
     *   await client.beta.vaults.credentials.mcpOAuthValidate(
     *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
     *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
     *   );
     * ```
     */
    mcpOAuthValidate(credentialID, params, options) {
        const { vault_id, betas } = params;
        return this._client.post((0, path_1.path) `/v1/vaults/${vault_id}/credentials/${credentialID}/mcp_oauth_validate?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'managed-agents-2026-04-01'].toString() },
                options?.headers,
            ]),
        });
    }
}
exports.Credentials = Credentials;
//# sourceMappingURL=credentials.js.map