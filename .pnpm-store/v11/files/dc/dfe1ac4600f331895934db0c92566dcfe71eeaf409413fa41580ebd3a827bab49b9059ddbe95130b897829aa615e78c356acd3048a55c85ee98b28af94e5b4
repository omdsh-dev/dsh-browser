// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../core/resource.mjs";
import { Page } from "../../../core/pagination.mjs";
import { path } from "../../../internal/utils/path.mjs";
export class APIKeys extends APIResource {
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
        return this._client.get(path `/v1/organizations/api_keys/${apiKeyID}?beta=true`, options);
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
        return this._client.post(path `/v1/organizations/api_keys/${apiKeyID}?beta=true`, { body, ...options });
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
        return this._client.getAPIList('/v1/organizations/api_keys?beta=true', (Page), {
            query,
            ...options,
        });
    }
}
//# sourceMappingURL=api-keys.mjs.map