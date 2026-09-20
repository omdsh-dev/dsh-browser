"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Members = void 0;
const resource_1 = require("../../../../core/resource.js");
const pagination_1 = require("../../../../core/pagination.js");
const path_1 = require("../../../../internal/utils/path.js");
class Members extends resource_1.APIResource {
    /**
     * Get Workspace Member
     *
     * @example
     * ```ts
     * const betaWorkspaceMember =
     *   await client.beta.organization.workspaces.members.retrieve(
     *     'user_id',
     *     { workspace_id: 'workspace_id' },
     *   );
     * ```
     */
    retrieve(userID, params, options) {
        const { workspace_id } = params;
        return this._client.get((0, path_1.path) `/v1/organizations/workspaces/${workspace_id}/members/${userID}?beta=true`, options);
    }
    /**
     * Update Workspace Member
     *
     * @example
     * ```ts
     * const betaWorkspaceMember =
     *   await client.beta.organization.workspaces.members.update(
     *     'user_id',
     *     {
     *       workspace_id: 'workspace_id',
     *       workspace_role: 'workspace_admin',
     *     },
     *   );
     * ```
     */
    update(userID, params, options) {
        const { workspace_id, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/organizations/workspaces/${workspace_id}/members/${userID}?beta=true`, {
            body,
            ...options,
        });
    }
    /**
     * List Workspace Members
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaWorkspaceMember of client.beta.organization.workspaces.members.list(
     *   'workspace_id',
     * )) {
     *   // ...
     * }
     * ```
     */
    list(workspaceID, query = {}, options) {
        return this._client.getAPIList((0, path_1.path) `/v1/organizations/workspaces/${workspaceID}/members?beta=true`, (pagination_1.Page), { query, ...options });
    }
    /**
     * Create Workspace Member
     *
     * @example
     * ```ts
     * const betaWorkspaceMember =
     *   await client.beta.organization.workspaces.members.add(
     *     'workspace_id',
     *     {
     *       user_id: 'user_01WCz1FkmYMm4gnmykNKUu3Q',
     *       workspace_role: 'workspace_admin',
     *     },
     *   );
     * ```
     */
    add(workspaceID, body, options) {
        return this._client.post((0, path_1.path) `/v1/organizations/workspaces/${workspaceID}/members?beta=true`, {
            body,
            ...options,
        });
    }
    /**
     * Delete Workspace Member
     *
     * @example
     * ```ts
     * const member =
     *   await client.beta.organization.workspaces.members.remove(
     *     'user_id',
     *     { workspace_id: 'workspace_id' },
     *   );
     * ```
     */
    remove(userID, params, options) {
        const { workspace_id } = params;
        return this._client.delete((0, path_1.path) `/v1/organizations/workspaces/${workspace_id}/members/${userID}?beta=true`, options);
    }
}
exports.Members = Members;
//# sourceMappingURL=members.js.map