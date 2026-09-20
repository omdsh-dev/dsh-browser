// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../core/resource.mjs";
import { Page } from "../../../core/pagination.mjs";
import { path } from "../../../internal/utils/path.mjs";
export class Users extends APIResource {
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
        return this._client.get(path `/v1/organizations/users/${userID}?beta=true`, options);
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
        return this._client.post(path `/v1/organizations/users/${userID}?beta=true`, { body, ...options });
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
        return this._client.getAPIList('/v1/organizations/users?beta=true', (Page), {
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
        return this._client.delete(path `/v1/organizations/users/${userID}?beta=true`, options);
    }
}
//# sourceMappingURL=users.mjs.map