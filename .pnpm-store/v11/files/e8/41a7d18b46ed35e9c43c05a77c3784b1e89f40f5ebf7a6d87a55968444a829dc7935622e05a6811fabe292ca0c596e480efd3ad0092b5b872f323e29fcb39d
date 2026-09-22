// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../../core/resource.mjs";
import * as MembersAPI from "./members.mjs";
import { Members, } from "./members.mjs";
import * as RateLimitsAPI from "./rate-limits.mjs";
import { RateLimits, } from "./rate-limits.mjs";
import * as ServiceAccountsAPI from "./service-accounts.mjs";
import { ServiceAccounts, } from "./service-accounts.mjs";
import { Page } from "../../../../core/pagination.mjs";
import { buildHeaders } from "../../../../internal/headers.mjs";
import { path } from "../../../../internal/utils/path.mjs";
export class Workspaces extends APIResource {
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
            headers: buildHeaders([
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
        return this._client.get(path `/v1/organizations/workspaces/${workspaceID}?beta=true`, options);
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
        return this._client.post(path `/v1/organizations/workspaces/${workspaceID}?beta=true`, {
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
        return this._client.getAPIList('/v1/organizations/workspaces?beta=true', (Page), {
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
        return this._client.post(path `/v1/organizations/workspaces/${workspaceID}/archive?beta=true`, options);
    }
}
Workspaces.RateLimits = RateLimits;
Workspaces.Members = Members;
Workspaces.ServiceAccounts = ServiceAccounts;
//# sourceMappingURL=workspaces.mjs.map