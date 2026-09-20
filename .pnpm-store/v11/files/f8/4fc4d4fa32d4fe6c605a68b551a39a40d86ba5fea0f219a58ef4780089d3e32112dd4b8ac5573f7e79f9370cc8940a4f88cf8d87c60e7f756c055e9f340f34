"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workspaces = void 0;
const tslib_1 = require("../../../../internal/tslib.js");
const resource_1 = require("../../../../core/resource.js");
const MembersAPI = tslib_1.__importStar(require("./members.js"));
const members_1 = require("./members.js");
const RateLimitsAPI = tslib_1.__importStar(require("./rate-limits.js"));
const rate_limits_1 = require("./rate-limits.js");
const ServiceAccountsAPI = tslib_1.__importStar(require("./service-accounts.js"));
const service_accounts_1 = require("./service-accounts.js");
const pagination_1 = require("../../../../core/pagination.js");
const headers_1 = require("../../../../internal/headers.js");
const path_1 = require("../../../../internal/utils/path.js");
class Workspaces extends resource_1.APIResource {
    constructor() {
        super(...arguments);
        this.rateLimits = new RateLimitsAPI.RateLimits(this._client);
        this.members = new MembersAPI.Members(this._client);
        this.serviceAccounts = new ServiceAccountsAPI.ServiceAccounts(this._client);
    }
    /**
     * Create Workspace
     *
     * @example
     * ```ts
     * const betaWorkspace =
     *   await client.beta.organization.workspaces.create({
     *     name: 'x',
     *   });
     * ```
     */
    create(params, options) {
        const { betas, ...body } = params;
        return this._client.post('/v1/organizations/workspaces?beta=true', {
            body,
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { ...(betas?.toString() != null ? { 'anthropic-beta': betas?.toString() } : undefined) },
                options?.headers,
            ]),
        });
    }
    /**
     * Get Workspace
     *
     * @example
     * ```ts
     * const betaWorkspace =
     *   await client.beta.organization.workspaces.retrieve(
     *     'workspace_id',
     *   );
     * ```
     */
    retrieve(workspaceID, options) {
        return this._client.get((0, path_1.path) `/v1/organizations/workspaces/${workspaceID}?beta=true`, options);
    }
    /**
     * Update Workspace
     *
     * @example
     * ```ts
     * const betaWorkspace =
     *   await client.beta.organization.workspaces.update(
     *     'workspace_id',
     *   );
     * ```
     */
    update(workspaceID, body, options) {
        return this._client.post((0, path_1.path) `/v1/organizations/workspaces/${workspaceID}?beta=true`, {
            body,
            ...options,
        });
    }
    /**
     * List Workspaces
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaWorkspace of client.beta.organization.workspaces.list()) {
     *   // ...
     * }
     * ```
     */
    list(query = {}, options) {
        return this._client.getAPIList('/v1/organizations/workspaces?beta=true', (pagination_1.Page), {
            query,
            ...options,
        });
    }
    /**
     * Archive Workspace
     *
     * @example
     * ```ts
     * const betaWorkspace =
     *   await client.beta.organization.workspaces.archive(
     *     'workspace_id',
     *   );
     * ```
     */
    archive(workspaceID, options) {
        return this._client.post((0, path_1.path) `/v1/organizations/workspaces/${workspaceID}/archive?beta=true`, options);
    }
}
exports.Workspaces = Workspaces;
Workspaces.RateLimits = rate_limits_1.RateLimits;
Workspaces.Members = members_1.Members;
Workspaces.ServiceAccounts = service_accounts_1.ServiceAccounts;
//# sourceMappingURL=workspaces.js.map