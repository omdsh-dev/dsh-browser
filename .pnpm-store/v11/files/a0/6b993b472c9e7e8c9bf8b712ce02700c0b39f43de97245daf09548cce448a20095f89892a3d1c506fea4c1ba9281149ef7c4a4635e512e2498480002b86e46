"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfiles = void 0;
const resource_1 = require("../../core/resource.js");
const pagination_1 = require("../../core/pagination.js");
const headers_1 = require("../../internal/headers.js");
const path_1 = require("../../internal/utils/path.js");
class UserProfiles extends resource_1.APIResource {
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
            headers: (0, headers_1.buildHeaders)([
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
        return this._client.get((0, path_1.path) `/v1/user_profiles/${userProfileID}?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
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
        return this._client.post((0, path_1.path) `/v1/user_profiles/${userProfileID}?beta=true`, {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
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
        return this._client.getAPIList('/v1/user_profiles?beta=true', (pagination_1.PageCursor), {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
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
        return this._client.post((0, path_1.path) `/v1/user_profiles/${userProfileID}/enrollment_url?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { 'anthropic-beta': [...(betas ?? []), 'user-profiles-2026-08-18'].toString() },
                options?.headers,
            ]),
        });
    }
}
exports.UserProfiles = UserProfiles;
//# sourceMappingURL=user-profiles.js.map