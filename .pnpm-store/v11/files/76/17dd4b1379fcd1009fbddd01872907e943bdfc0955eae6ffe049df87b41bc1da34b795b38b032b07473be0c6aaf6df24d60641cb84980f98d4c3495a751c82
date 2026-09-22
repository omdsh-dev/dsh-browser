// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../core/resource.mjs";
import { PageCursor } from "../../core/pagination.mjs";
import { buildHeaders } from "../../internal/headers.mjs";
import { path } from "../../internal/utils/path.mjs";
export class UserProfiles extends APIResource {
    /**
     * Create User Profile
     *
     * @example
     * ```ts
     * const betaUserProfile =
     *   await client.beta.userProfiles.create();
     * ```
     */
    create(params, options) {
        const { betas, ...body } = params;
        return this._client.post('/v1/user_profiles?beta=true', {
            body,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'user-profiles-2026-08-18'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Get User Profile
     *
     * @example
     * ```ts
     * const betaUserProfile =
     *   await client.beta.userProfiles.retrieve(
     *     'uprof_011CZkZCu8hGbp5mYRQgUmz9',
     *   );
     * ```
     */
    retrieve(userProfileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path `/v1/user_profiles/${userProfileID}?beta=true`, {
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'user-profiles-2026-08-18'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Update User Profile
     *
     * @example
     * ```ts
     * const betaUserProfile =
     *   await client.beta.userProfiles.update(
     *     'uprof_011CZkZCu8hGbp5mYRQgUmz9',
     *   );
     * ```
     */
    update(userProfileID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path `/v1/user_profiles/${userProfileID}?beta=true`, {
            body,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'user-profiles-2026-08-18'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * List User Profiles
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaUserProfile of client.beta.userProfiles.list()) {
     *   // ...
     * }
     * ```
     */
    list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList('/v1/user_profiles?beta=true', (PageCursor), {
            query,
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'user-profiles-2026-08-18'].toString() },
                options?.headers,
            ]),
        });
    }
    /**
     * Create Enrollment URL
     *
     * @example
     * ```ts
     * const betaUserProfileEnrollmentURL =
     *   await client.beta.userProfiles.createEnrollmentURL(
     *     'uprof_011CZkZCu8hGbp5mYRQgUmz9',
     *   );
     * ```
     */
    createEnrollmentURL(userProfileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path `/v1/user_profiles/${userProfileID}/enrollment_url?beta=true`, {
            ...options,
            headers: buildHeaders([
                { 'anthropic-beta': [...(betas ?? []), 'user-profiles-2026-08-18'].toString() },
                options?.headers,
            ]),
        });
    }
}
//# sourceMappingURL=user-profiles.mjs.map