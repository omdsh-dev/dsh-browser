"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Users = void 0;
const resource_1 = require("../../../core/resource.js");
const pagination_1 = require("../../../core/pagination.js");
const path_1 = require("../../../internal/utils/path.js");
class Users extends resource_1.APIResource {
    /**
     * Retrieve a member of the organization by user ID.
     *
     * @example
     * ```ts
     * const betaOrganizationUser =
     *   await client.beta.organization.users.retrieve('user_id');
     * ```
     */
    retrieve(userID, options) {
        return this._client.get((0, path_1.path) `/v1/organizations/users/${userID}?beta=true`, options);
    }
    /**
     * Update a member's organization role.
     *
     * @example
     * ```ts
     * const betaOrganizationUser =
     *   await client.beta.organization.users.update('user_id', {
     *     role: 'user',
     *   });
     * ```
     */
    update(userID, body, options) {
        return this._client.post((0, path_1.path) `/v1/organizations/users/${userID}?beta=true`, { body, ...options });
    }
    /**
     * List the organization's members.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaOrganizationUser of client.beta.organization.users.list()) {
     *   // ...
     * }
     * ```
     */
    list(query = {}, options) {
        return this._client.getAPIList('/v1/organizations/users?beta=true', (pagination_1.Page), {
            query,
            ...options,
        });
    }
    /**
     * Remove a member from the organization.
     *
     * @example
     * ```ts
     * const user = await client.beta.organization.users.remove(
     *   'user_id',
     * );
     * ```
     */
    remove(userID, options) {
        return this._client.delete((0, path_1.path) `/v1/organizations/users/${userID}?beta=true`, options);
    }
}
exports.Users = Users;
//# sourceMappingURL=users.js.map