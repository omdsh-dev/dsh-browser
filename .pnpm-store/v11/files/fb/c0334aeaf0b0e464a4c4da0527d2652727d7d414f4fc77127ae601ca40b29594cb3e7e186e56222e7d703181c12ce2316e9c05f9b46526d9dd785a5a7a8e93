"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalKeys = void 0;
const resource_1 = require("../../../core/resource.js");
const pagination_1 = require("../../../core/pagination.js");
const path_1 = require("../../../internal/utils/path.js");
class ExternalKeys extends resource_1.APIResource {
    /**
     * Create an external key config owned by the caller's organization.
     *
     * @example
     * ```ts
     * const betaExternalKey =
     *   await client.beta.organization.externalKeys.create({
     *     provider_config: {
     *       kms_arn:
     *         'arn:aws:kms:us-east-1:111122223333:key/abcd1234-5678-90ab-cdef-000011112222',
     *       type: 'aws',
     *     },
     *   });
     * ```
     */
    create(body, options) {
        return this._client.post('/v1/organizations/external_keys?beta=true', { body, ...options });
    }
    /**
     * Retrieve a single external key config in the caller's organization by ID.
     *
     * @example
     * ```ts
     * const betaExternalKey =
     *   await client.beta.organization.externalKeys.retrieve(
     *     'external_key_id',
     *   );
     * ```
     */
    retrieve(externalKeyID, options) {
        return this._client.get((0, path_1.path) `/v1/organizations/external_keys/${externalKeyID}?beta=true`, options);
    }
    /**
     * Partially update an external key config. Omitted fields are left unchanged.
     *
     * `display_name` is always editable. `geo` and `provider_config` cannot be changed
     * once any workspace references this config, because previously encrypted data
     * requires the original key identity to decrypt.
     *
     * @example
     * ```ts
     * const betaExternalKey =
     *   await client.beta.organization.externalKeys.update(
     *     'external_key_id',
     *   );
     * ```
     */
    update(externalKeyID, body, options) {
        return this._client.post((0, path_1.path) `/v1/organizations/external_keys/${externalKeyID}?beta=true`, {
            body,
            ...options,
        });
    }
    /**
     * List external key configs in the caller's organization.
     *
     * Results are ordered by creation time (newest first). Use the `next_page` cursor
     * from the response to fetch subsequent pages.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaExternalKey of client.beta.organization.externalKeys.list()) {
     *   // ...
     * }
     * ```
     */
    list(query = {}, options) {
        return this._client.getAPIList('/v1/organizations/external_keys?beta=true', (pagination_1.PageCursor), {
            query,
            ...options,
        });
    }
    /**
     * Delete an external key config.
     *
     * The request is rejected if any workspace still references this config.
     *
     * @example
     * ```ts
     * const externalKey =
     *   await client.beta.organization.externalKeys.delete(
     *     'external_key_id',
     *   );
     * ```
     */
    delete(externalKeyID, options) {
        return this._client.delete((0, path_1.path) `/v1/organizations/external_keys/${externalKeyID}?beta=true`, options);
    }
    /**
     * Validate an external key config against the customer's KMS.
     *
     * Anthropic performs an encrypt/decrypt roundtrip against the configured KMS key
     * and waits up to 30 seconds for the result. The response status is `success` if
     * the roundtrip succeeded, or `failure` with an error message if it failed or
     * timed out.
     *
     * @example
     * ```ts
     * const response =
     *   await client.beta.organization.externalKeys.validate(
     *     'external_key_id',
     *   );
     * ```
     */
    validate(externalKeyID, options) {
        return this._client.post((0, path_1.path) `/v1/organizations/external_keys/${externalKeyID}/validate?beta=true`, options);
    }
}
exports.ExternalKeys = ExternalKeys;
//# sourceMappingURL=external-keys.js.map