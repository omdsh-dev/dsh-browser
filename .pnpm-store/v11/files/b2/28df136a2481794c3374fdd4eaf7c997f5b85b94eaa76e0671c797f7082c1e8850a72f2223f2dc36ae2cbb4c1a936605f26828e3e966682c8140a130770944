// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../../core/resource.mjs";
import * as WorkspacesAPI from "./workspaces.mjs";
import { Workspaces, } from "./workspaces.mjs";
import { PageCursor } from "../../../../core/pagination.mjs";
import { buildHeaders } from "../../../../internal/headers.mjs";
import { path } from "../../../../internal/utils/path.mjs";
export class ServiceAccounts extends APIResource {
    constructor() {
        super(...arguments);
        this.workspaces = new WorkspacesAPI.Workspaces(this._client);
    }
    /**
     * **Requires an OAuth access token with the `org:admin` scope**, from
     * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
     * API keys are not accepted. See
     * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
     *
     * Create a service account.
     *
     * A service account is a named workload identity that federation rules target.
     * `organization_role` is `developer` (default) or `admin`; a rule may only be
     * created or retargeted to grant `org:admin` scope when the target's
     * `organization_role` is `admin`. Creating an `admin`-role service account
     * requires an interactive credential (a user OAuth token or a Console session) — a
     * workload may only create `developer`-role service accounts.
     *
     * @example
     * ```ts
     * const betaServiceAccount =
     *   await client.beta.organization.serviceAccounts.create({
     *     name: 'ci-deploy-bot',
     *   });
     * ```
     */
    create(params, options) {
        const { betas, ...body } = params;
        return this._client.post('/v1/organizations/service_accounts?beta=true', {
            body,
            ...options,
            headers: buildHeaders([
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
     * Retrieve a service account by its ID (`svac_...`).
     *
     * @example
     * ```ts
     * const betaServiceAccount =
     *   await client.beta.organization.serviceAccounts.retrieve(
     *     'service_account_id',
     *   );
     * ```
     */
    retrieve(serviceAccountID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path `/v1/organizations/service_accounts/${serviceAccountID}?beta=true`, {
            ...options,
            headers: buildHeaders([
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
     * Update a service account.
     *
     * Only `description` and `organization_role` are mutable; `name` cannot be
     * changed. Archived service accounts cannot be updated; this returns 400. Setting
     * `organization_role` to `admin` (even when unchanged) requires an interactive
     * credential (a user OAuth token or a Console session).
     *
     * @example
     * ```ts
     * const betaServiceAccount =
     *   await client.beta.organization.serviceAccounts.update(
     *     'service_account_id',
     *   );
     * ```
     */
    update(serviceAccountID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path `/v1/organizations/service_accounts/${serviceAccountID}?beta=true`, {
            body,
            ...options,
            headers: buildHeaders([
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
     * List service accounts in the caller's organization.
     *
     * Results are ordered by creation time, newest first. Use `limit` and the
     * `next_page` cursor to paginate; set `include_archived=true` to include archived
     * service accounts.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaServiceAccount of client.beta.organization.serviceAccounts.list()) {
     *   // ...
     * }
     * ```
     */
    list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList('/v1/organizations/service_accounts?beta=true', (PageCursor), {
            query,
            ...options,
            headers: buildHeaders([
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
     * Archive a service account.
     *
     * Idempotent; re-archiving returns the service account with its original
     * `archived_at`. Rejected with 400 if any live (non-archived) federation rule
     * still targets this service account, same as issuer archival; archive those rules
     * first or change their target to another service account.
     *
     * @example
     * ```ts
     * const betaServiceAccount =
     *   await client.beta.organization.serviceAccounts.archive(
     *     'service_account_id',
     *   );
     * ```
     */
    archive(serviceAccountID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path `/v1/organizations/service_accounts/${serviceAccountID}/archive?beta=true`, {
            ...options,
            headers: buildHeaders([
                { ...(betas?.toString() != null ? { 'anthropic-beta': betas?.toString() } : undefined) },
                options?.headers,
            ]),
        });
    }
}
ServiceAccounts.Workspaces = Workspaces;
//# sourceMappingURL=service-accounts.mjs.map