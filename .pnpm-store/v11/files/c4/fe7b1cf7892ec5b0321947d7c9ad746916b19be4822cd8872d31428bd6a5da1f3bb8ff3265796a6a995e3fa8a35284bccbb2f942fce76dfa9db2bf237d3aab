"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rules = void 0;
const tslib_1 = require("../../../../../internal/tslib.js");
const resource_1 = require("../../../../../core/resource.js");
const WorkspacesAPI = tslib_1.__importStar(require("./workspaces.js"));
const workspaces_1 = require("./workspaces.js");
const pagination_1 = require("../../../../../core/pagination.js");
const headers_1 = require("../../../../../internal/headers.js");
const path_1 = require("../../../../../internal/utils/path.js");
class Rules extends resource_1.APIResource {
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
     * Create a federation rule owned by your organization.
     *
     * The referenced issuer and the target service account must already exist in the
     * same organization; invalid references are rejected with a 400 error. The
     * workspace reference is validated. Membership is not checked at rule creation:
     * token exchange resolves a single enabled workspace per call and is rejected
     * unless the target service account is a member of that workspace (it is
     * implicitly a member of the default workspace). Rules on well-known shared
     * issuers (GitHub Actions, GitLab, Buildkite, Terraform Cloud, Google) must
     * constrain tenant identity via an identity-bearing claim, a tenant-pinning
     * subject prefix (such as `repo:YOUR_ORG/...`), or a CEL condition referencing one
     * of those identity claims (e.g. `claims.repository_owner`). OAuth callers may
     * only manage rules whose `oauth_scope` is `workspace:developer` or
     * `workspace:inference`; other scopes require a Console session.
     *
     * @example
     * ```ts
     * const betaFederationRule =
     *   await client.beta.organization.federation.rules.create({
     *     issuer_id: 'issuer_id',
     *     match: {},
     *     name: 'x',
     *     oauth_scope: 'x',
     *     target: {
     *       service_account_id: 'svac_01SDCCSbTxrXDpWc1phhtcfK',
     *       type: 'service_account',
     *     },
     *   });
     * ```
     */
    create(params, options) {
        const { betas, ...body } = params;
        return this._client.post('/v1/organizations/federation_rules?beta=true', {
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
     * Retrieve a federation rule by its ID (`fdrl_...`).
     *
     * @example
     * ```ts
     * const betaFederationRule =
     *   await client.beta.organization.federation.rules.retrieve(
     *     'federation_rule_id',
     *   );
     * ```
     */
    retrieve(federationRuleID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get((0, path_1.path) `/v1/organizations/federation_rules/${federationRuleID}?beta=true`, {
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
     * Partially update a federation rule.
     *
     * `issuer_id` is immutable. `match` and `target` are replaced as whole objects
     * when set. Referenced service accounts and workspaces must exist in your
     * organization; invalid references are rejected with a 400 error. Archived rules
     * cannot be updated; this returns 400. Create a new rule instead. Rules on
     * well-known shared issuers (GitHub Actions, GitLab, Buildkite, Terraform Cloud,
     * Google) must constrain tenant identity via an identity-bearing claim, a
     * tenant-pinning subject prefix (such as `repo:YOUR_ORG/...`), or a CEL condition
     * referencing one of those identity claims (e.g. `claims.repository_owner`). On
     * these issuers the requirement is re-checked on every update; if an existing
     * rule's stored match does not yet constrain tenant identity, any update (even a
     * rename or description change) must also supply a conforming `match` in the same
     * request. OAuth callers may only manage rules whose `oauth_scope` is
     * `workspace:developer` or `workspace:inference`; other scopes require a Console
     * session.
     *
     * @example
     * ```ts
     * const betaFederationRule =
     *   await client.beta.organization.federation.rules.update(
     *     'federation_rule_id',
     *   );
     * ```
     */
    update(federationRuleID, params, options) {
        const { betas, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/organizations/federation_rules/${federationRuleID}?beta=true`, {
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
     * List federation rules in your organization.
     *
     * Optionally filter by issuer with `issuer_id`. Archived rules are excluded unless
     * `include_archived=true`.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaFederationRule of client.beta.organization.federation.rules.list()) {
     *   // ...
     * }
     * ```
     */
    list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList('/v1/organizations/federation_rules?beta=true', (pagination_1.PageCursor), {
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
     * Archive a federation rule.
     *
     * Token exchange through this rule stops immediately. Idempotent; re-archiving
     * returns the rule with its original `archived_at`. Archiving clears the rule's
     * workspace targeting (`workspace_id` and `workspace_ids` are emptied). Tokens
     * already minted before archive remain valid until they expire. OAuth callers may
     * only manage rules whose `oauth_scope` is `workspace:developer` or
     * `workspace:inference`; other scopes require a Console session.
     *
     * @example
     * ```ts
     * const betaFederationRule =
     *   await client.beta.organization.federation.rules.archive(
     *     'federation_rule_id',
     *   );
     * ```
     */
    archive(federationRuleID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post((0, path_1.path) `/v1/organizations/federation_rules/${federationRuleID}/archive?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { ...(betas?.toString() != null ? { 'anthropic-beta': betas?.toString() } : undefined) },
                options?.headers,
            ]),
        });
    }
}
exports.Rules = Rules;
Rules.Workspaces = workspaces_1.Workspaces;
//# sourceMappingURL=rules.js.map