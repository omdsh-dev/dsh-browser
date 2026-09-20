import { APIResource } from "../../../core/resource.mjs";
import * as OrganizationAPI from "./organization.mjs";
import { APIPromise } from "../../../core/api-promise.mjs";
import { Page, type PageParams, PagePromise } from "../../../core/pagination.mjs";
import { RequestOptions } from "../../../internal/request-options.mjs";
export declare class Users extends APIResource {
    /**
     * Retrieve a member of the organization by user ID.
     *
     * @example
     * ```ts
     * const betaOrganizationUser =
     *   await client.beta.organization.users.retrieve('user_id');
     * ```
     */
    retrieve(userID: string, options?: RequestOptions): APIPromise<BetaOrganizationUser>;
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
    update(userID: string, body: UserUpdateParams, options?: RequestOptions): APIPromise<BetaOrganizationUser>;
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
    list(query?: UserListParams | null | undefined, options?: RequestOptions): PagePromise<BetaOrganizationUsersPage, BetaOrganizationUser>;
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
    remove(userID: string, options?: RequestOptions): APIPromise<UserRemoveResponse>;
}
export type BetaOrganizationUsersPage = Page<BetaOrganizationUser>;
export interface BetaOrganizationUser {
    /**
     * ID of the User.
     */
    id: string;
    /**
     * RFC 3339 datetime string indicating when the User joined the Organization.
     */
    added_at: string;
    /**
     * Email of the User.
     */
    email: string;
    /**
     * Name of the User.
     */
    name: string;
    /**
     * Organization role of the User.
     */
    role: OrganizationAPI.BetaOrganizationRole;
    /**
     * Object type.
     *
     * For Users, this is always `"user"`.
     */
    type: 'user';
}
export interface UserRemoveResponse {
    /**
     * ID of the User.
     */
    id: string;
    /**
     * Deleted object type.
     *
     * For Users, this is always `"user_deleted"`.
     */
    type: 'user_deleted';
}
export interface UserUpdateParams {
    /**
     * New role for the User.
     *
     * The accepted values depend on the organization type. Console and API
     * organizations accept `user`, `developer`, `billing`, and `claude_code_user`;
     * `admin` cannot be assigned through the API. Claude Enterprise organizations
     * accept `user` and `managed`.
     */
    role: 'billing' | 'claude_code_user' | 'developer' | 'managed' | 'user';
}
export interface UserListParams extends PageParams {
    /**
     * Filter by user email.
     */
    email?: string;
    /**
     * Filter to items whose `role` equals one of the supplied values. Repeatable;
     * values are OR'ed together.
     *
     * Accepted values depend on the organization type: Console and API organizations
     * accept `user`, `developer`, `billing`, `admin`, and `claude_code_user`; Claude
     * Enterprise organizations accept `user`, `owner`, `primary_owner`,
     * `membership_admin`, and `managed`.
     */
    roles?: Array<string>;
}
export declare namespace Users {
    export { type BetaOrganizationUser as BetaOrganizationUser, type UserRemoveResponse as UserRemoveResponse, type BetaOrganizationUsersPage as BetaOrganizationUsersPage, type UserUpdateParams as UserUpdateParams, type UserListParams as UserListParams, };
}
//# sourceMappingURL=users.d.mts.map