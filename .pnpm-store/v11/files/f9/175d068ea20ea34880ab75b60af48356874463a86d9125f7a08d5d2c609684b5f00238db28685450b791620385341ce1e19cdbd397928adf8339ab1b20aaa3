// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../../../core/resource.mjs";
import { PageCursor } from "../../../../../core/pagination.mjs";
import { buildHeaders } from "../../../../../internal/headers.mjs";
import { path } from "../../../../../internal/utils/path.mjs";
export class Workspaces extends APIResource {
    /**
     * **Requires an OAuth access token with the `org:admin` scope**, from
     * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
     * API keys are not accepted. See
     * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
     *
     * List workspaces where this federation rule is enabled.
     *
     * Returns all workspace enablements in a single response; the `limit` and `page`
     * parameters are accepted but have no effect, and `next_page` is always `null`.
     * Returns explicit per-workspace enablements only; for rules with
     * `applies_to_all_workspaces` or a legacy single `workspace_id`, check those
     * fields on the rule itself.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaFederationRuleWorkspace of client.beta.organization.federation.rules.workspaces.list(
     *   'federation_rule_id',
     * )) {
     *   // ...
     * }
     * ```
     */
    list(federationRuleID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path `/v1/organizations/federation_rules/${federationRuleID}/workspaces?beta=true`, (PageCursor), {
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
     * Enable a federation rule for a workspace.
     *
     * Idempotent; re-enabling returns the existing enablement. The rule and workspace
     * must both belong to your organization. Membership of the rule's target service
     * account in this workspace is not checked at enablement: token exchange into this
     * workspace is rejected unless the target is a member (it is implicitly a member
     * of the default workspace). Archived rules are rejected with 400. OAuth callers
     * may only manage rules whose `oauth_scope` is `workspace:developer` or
     * `workspace:inference`; other scopes require a Console session.
     *
     * @example
     * ```ts
     * const betaFederationRuleWorkspace =
     *   await client.beta.organization.federation.rules.workspaces.add(
     *     'federation_rule_id',
     *     { workspace_id: 'workspace_id' },
     *   );
     * ```
     */
    add(federationRuleID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path `/v1/organizations/federation_rules/${federationRuleID}/workspaces?beta=true`, {
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
     * Disable a federation rule for a workspace.
     *
     * Idempotent; succeeds even if the enablement was already removed. OAuth callers
     * may only manage rules whose `oauth_scope` is `workspace:developer` or
     * `workspace:inference`; other scopes require a Console session.
     *
     * @example
     * ```ts
     * const workspace =
     *   await client.beta.organization.federation.rules.workspaces.remove(
     *     'workspace_id',
     *     { federation_rule_id: 'federation_rule_id' },
     *   );
     * ```
     */
    remove(workspaceID, params, options) {
        const { federation_rule_id, betas } = params;
        return this._client.delete(path `/v1/organizations/federation_rules/${federation_rule_id}/workspaces/${workspaceID}?beta=true`, {
            ...options,
            headers: buildHeaders([
                { ...(betas?.toString() != null ? { 'anthropic-beta': betas?.toString() } : undefined) },
                options?.headers,
            ]),
        });
    }
}
//# sourceMappingURL=workspaces.mjs.map