// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../core/resource.mjs";
import { Page } from "../../../core/pagination.mjs";
import { path } from "../../../internal/utils/path.mjs";
export class Invites extends APIResource {
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
        return this._client.get(path `/v1/organizations/invites/${inviteID}?beta=true`, options);
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
        return this._client.getAPIList('/v1/organizations/invites?beta=true', (Page), {
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
        return this._client.delete(path `/v1/organizations/invites/${inviteID}?beta=true`, options);
    }
}
//# sourceMappingURL=invites.mjs.map