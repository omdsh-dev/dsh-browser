"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceAccounts = void 0;
const resource_1 = require("../../../../core/resource.js");
const pagination_1 = require("../../../../core/pagination.js");
const headers_1 = require("../../../../internal/headers.js");
const path_1 = require("../../../../internal/utils/path.js");
class ServiceAccounts extends resource_1.APIResource {
    /**
     * **Requires an OAuth access token with the `org:admin` scope**, from
     * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
     * API keys are not accepted. See
     * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
     *
     * Retrieve a service account's membership in a workspace.
     *
     * Returns the membership record, including the service account's `workspace_role`
     * in this workspace. Archived workspaces return 400. For the default workspace,
     * returns the implicit (`implicit: true`) membership when no explicit membership
     * exists; an explicitly added membership is returned with its assigned role. An
     * archived service account returns 404.
     *
     * @example
     * ```ts
     * const betaServiceAccountWorkspaceMember =
     *   await client.beta.organization.workspaces.serviceAccounts.retrieve(
     *     'service_account_id',
     *     { workspace_id: 'workspace_id' },
     *   );
     * ```
     */
    retrieve(serviceAccountID, params, options) {
        const { workspace_id, betas } = params;
        return this._client.get((0, path_1.path) `/v1/organizations/workspaces/${workspace_id}/service_accounts/${serviceAccountID}?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { ...(betas?.toString() != null ? { 'anthropic-beta': betas?.toString() } : undefined) },
                options?.headers,
            ]),
        });
    }
    /**
     * **Requires an OAuth access token with the `org:admin` scope**, from
     * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
     * API keys are not accepted. See
     * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
     *
     * Change a service account's role in a workspace.
     *
     * The new `workspace_role` replaces the current one. Only explicit memberships can
     * be updated; to set a role on the implicit default-workspace membership, add the
     * service account explicitly with
     * `POST /workspaces/{workspace_id}/service_accounts`. Archived workspaces
     * return 400. Archived service accounts cannot be updated and are rejected.
     *
     * @example
     * ```ts
     * const betaServiceAccountWorkspaceMember =
     *   await client.beta.organization.workspaces.serviceAccounts.update(
     *     'service_account_id',
     *     {
     *       workspace_id: 'workspace_id',
     *       workspace_role: 'workspace_admin',
     *     },
     *   );
     * ```
     */
    update(serviceAccountID, params, options) {
        const { workspace_id, betas, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/organizations/workspaces/${workspace_id}/service_accounts/${serviceAccountID}?beta=true`, {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { ...(betas?.toString() != null ? { 'anthropic-beta': betas?.toString() } : undefined) },
                options?.headers,
            ]),
        });
    }
    /**
     * **Requires an OAuth access token with the `org:admin` scope**, from
     * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
     * API keys are not accepted. See
     * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
     *
     * List the service accounts that are members of a workspace.
     *
     * Each entry includes the service account's `workspace_role`. Use `limit` and the
     * `next_page` cursor to paginate. Archived workspaces return 400; use
     * `GET /service_accounts/{id}/workspaces` to audit memberships of an archived
     * workspace. The implicit default-workspace membership is not included in this
     * list. Memberships of archived service accounts are omitted from the results.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaServiceAccountWorkspaceMember of client.beta.organization.workspaces.serviceAccounts.list(
     *   'workspace_id',
     * )) {
     *   // ...
     * }
     * ```
     */
    list(workspaceID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList((0, path_1.path) `/v1/organizations/workspaces/${workspaceID}/service_accounts?beta=true`, (pagination_1.PageCursor), {
            query,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { ...(betas?.toString() != null ? { 'anthropic-beta': betas?.toString() } : undefined) },
                options?.headers,
            ]),
        });
    }
    /**
     * **Requires an OAuth access token with the `org:admin` scope**, from
     * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
     * API keys are not accepted. See
     * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
     *
     * Add a service account to a workspace with the given `workspace_role`.
     *
     * The role determines what the service account can do in the workspace and which
     * workspace-scoped permissions it can be granted when authenticating through
     * federation. Every service account is already an implicit `workspace_user` member
     * of the default workspace; adding it explicitly assigns a chosen role. If the
     * service account is already an explicit member of the workspace, its
     * `workspace_role` is replaced with the value supplied here. Archived workspaces
     * return 400. Archived service accounts cannot be added and are rejected.
     *
     * @example
     * ```ts
     * const betaServiceAccountWorkspaceMember =
     *   await client.beta.organization.workspaces.serviceAccounts.add(
     *     'workspace_id',
     *     {
     *       service_account_id: 'service_account_id',
     *       workspace_role: 'workspace_admin',
     *     },
     *   );
     * ```
     */
    add(workspaceID, params, options) {
        const { betas, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/organizations/workspaces/${workspaceID}/service_accounts?beta=true`, {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { ...(betas?.toString() != null ? { 'anthropic-beta': betas?.toString() } : undefined) },
                options?.headers,
            ]),
        });
    }
    /**
     * **Requires an OAuth access token with the `org:admin` scope**, from
     * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
     * API keys are not accepted. See
     * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
     *
     * Remove a service account from a workspace.
     *
     * Removal is idempotent (returns 200 even if the membership was already removed).
     * A DELETE against the implicit default-workspace membership returns 200 but is a
     * no-op and the membership persists; deleting an explicit default-workspace row
     * reverts to the implicit `workspace_user` membership. Archived workspaces
     * return 400.
     *
     * @example
     * ```ts
     * const serviceAccount =
     *   await client.beta.organization.workspaces.serviceAccounts.remove(
     *     'service_account_id',
     *     { workspace_id: 'workspace_id' },
     *   );
     * ```
     */
    remove(serviceAccountID, params, options) {
        const { workspace_id, betas } = params;
        return this._client.delete((0, path_1.path) `/v1/organizations/workspaces/${workspace_id}/service_accounts/${serviceAccountID}?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { ...(betas?.toString() != null ? { 'anthropic-beta': betas?.toString() } : undefined) },
                options?.headers,
            ]),
        });
    }
}
exports.ServiceAccounts = ServiceAccounts;
//# sourceMappingURL=service-accounts.js.map