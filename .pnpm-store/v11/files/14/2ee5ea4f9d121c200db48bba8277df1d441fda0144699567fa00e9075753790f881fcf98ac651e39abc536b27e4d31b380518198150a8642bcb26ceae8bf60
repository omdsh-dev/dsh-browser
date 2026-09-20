"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invites = void 0;
const resource_1 = require("../../../core/resource.js");
const pagination_1 = require("../../../core/pagination.js");
const path_1 = require("../../../internal/utils/path.js");
class Invites extends resource_1.APIResource {
    /**
     * Invite a user to join the organization by email.
     *
     * On plans that draw members from a finite pool of purchased seats, the invite
     * automatically consumes a seat from the lowest tier with availability; there is
     * no seat-tier parameter. When no seat is free the request fails with a 400 error
     * rather than purchasing a seat.
     *
     * @example
     * ```ts
     * const betaOrganizationInvite =
     *   await client.beta.organization.invites.create({
     *     email: 'user@emaildomain.com',
     *     role: 'user',
     *   });
     * ```
     */
    create(body, options) {
        return this._client.post('/v1/organizations/invites?beta=true', { body, ...options });
    }
    /**
     * Retrieve an invite by ID.
     *
     * @example
     * ```ts
     * const betaOrganizationInvite =
     *   await client.beta.organization.invites.retrieve(
     *     'invite_id',
     *   );
     * ```
     */
    retrieve(inviteID, options) {
        return this._client.get((0, path_1.path) `/v1/organizations/invites/${inviteID}?beta=true`, options);
    }
    /**
     * List the organization's invites.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaOrganizationInvite of client.beta.organization.invites.list()) {
     *   // ...
     * }
     * ```
     */
    list(query = {}, options) {
        return this._client.getAPIList('/v1/organizations/invites?beta=true', (pagination_1.Page), {
            query,
            ...options,
        });
    }
    /**
     * Delete a pending invite.
     *
     * @example
     * ```ts
     * const invite =
     *   await client.beta.organization.invites.delete(
     *     'invite_id',
     *   );
     * ```
     */
    delete(inviteID, options) {
        return this._client.delete((0, path_1.path) `/v1/organizations/invites/${inviteID}?beta=true`, options);
    }
}
exports.Invites = Invites;
//# sourceMappingURL=invites.js.map