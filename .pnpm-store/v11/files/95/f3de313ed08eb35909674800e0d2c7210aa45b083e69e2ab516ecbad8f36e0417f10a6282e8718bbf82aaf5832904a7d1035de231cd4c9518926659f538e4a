"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIKeys = void 0;
const resource_1 = require("../../../core/resource.js");
const pagination_1 = require("../../../core/pagination.js");
const path_1 = require("../../../internal/utils/path.js");
class APIKeys extends resource_1.APIResource {
    /**
     * Get API Key
     *
     * @example
     * ```ts
     * const betaAPIKey =
     *   await client.beta.organization.apiKeys.retrieve(
     *     'api_key_id',
     *   );
     * ```
     */
    retrieve(apiKeyID, options) {
        return this._client.get((0, path_1.path) `/v1/organizations/api_keys/${apiKeyID}?beta=true`, options);
    }
    /**
     * Update API Key
     *
     * @example
     * ```ts
     * const betaAPIKey =
     *   await client.beta.organization.apiKeys.update(
     *     'api_key_id',
     *   );
     * ```
     */
    update(apiKeyID, body, options) {
        return this._client.post((0, path_1.path) `/v1/organizations/api_keys/${apiKeyID}?beta=true`, { body, ...options });
    }
    /**
     * List API Keys
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaAPIKey of client.beta.organization.apiKeys.list()) {
     *   // ...
     * }
     * ```
     */
    list(query = {}, options) {
        return this._client.getAPIList('/v1/organizations/api_keys?beta=true', (pagination_1.Page), {
            query,
            ...options,
        });
    }
}
exports.APIKeys = APIKeys;
//# sourceMappingURL=api-keys.js.map