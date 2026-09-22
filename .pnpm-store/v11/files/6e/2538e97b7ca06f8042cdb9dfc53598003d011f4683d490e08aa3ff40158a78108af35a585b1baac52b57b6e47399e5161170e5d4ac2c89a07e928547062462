"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Issuers = void 0;
const resource_1 = require("../../../../core/resource.js");
const pagination_1 = require("../../../../core/pagination.js");
const headers_1 = require("../../../../internal/headers.js");
const path_1 = require("../../../../internal/utils/path.js");
class Issuers extends resource_1.APIResource {
    /**
     * **Requires an OAuth access token with the `org:admin` scope**, from
     * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
     * API keys are not accepted. See
     * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
     *
     * Register an OIDC issuer that Anthropic will trust for workload identity
     * federation in your organization.
     *
     * The `jwks` field controls how the issuer's signing keys are obtained and takes
     * one of three shapes selected by `type`: `discovery` (resolve keys through OIDC
     * discovery), `explicit_url` (fetch keys from a fixed JWKS URL), or `inline`
     * (provide a static key set). When `jwks.type` is `discovery` and no
     * `discovery_base` is set, the issuer URL must be publicly reachable over HTTPS so
     * Anthropic can fetch the discovery document; for `explicit_url` and `inline`
     * modes the issuer URL is only matched as the JWT's `iss` claim and is not
     * fetched.
     *
     * @example
     * ```ts
     * const betaFederationIssuer =
     *   await client.beta.organization.federation.issuers.create({
     *     issuer_url: 'x',
     *     name: 'x',
     *   });
     * ```
     */
    create(params, options) {
        const { betas, ...body } = params;
        return this._client.post('/v1/organizations/federation_issuers?beta=true', {
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
     * Retrieve a federation issuer by its ID (`fdis_...`).
     *
     * @example
     * ```ts
     * const betaFederationIssuer =
     *   await client.beta.organization.federation.issuers.retrieve(
     *     'federation_issuer_id',
     *   );
     * ```
     */
    retrieve(federationIssuerID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get((0, path_1.path) `/v1/organizations/federation_issuers/${federationIssuerID}?beta=true`, {
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
     * Partially update a federation issuer.
     *
     * Setting `jwks` replaces the full JWKS shape at once. Archived issuers cannot be
     * updated; this returns 400. Create a new issuer instead.
     *
     * Updating an issuer that backs a rule with a scope outside `workspace:developer`
     * or `workspace:inference` requires a Console session.
     *
     * @example
     * ```ts
     * const betaFederationIssuer =
     *   await client.beta.organization.federation.issuers.update(
     *     'federation_issuer_id',
     *   );
     * ```
     */
    update(federationIssuerID, params, options) {
        const { betas, ...body } = params;
        return this._client.post((0, path_1.path) `/v1/organizations/federation_issuers/${federationIssuerID}?beta=true`, {
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
     * List federation issuers in your organization.
     *
     * Archived issuers are excluded unless `include_archived=true`.
     *
     * @example
     * ```ts
     * // Automatically fetches more pages as needed.
     * for await (const betaFederationIssuer of client.beta.organization.federation.issuers.list()) {
     *   // ...
     * }
     * ```
     */
    list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList('/v1/organizations/federation_issuers?beta=true', (pagination_1.PageCursor), {
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
     * Archive a federation issuer.
     *
     * Idempotent; re-archiving returns the issuer with its original `archived_at`.
     * Rejected with 400 if any live (non-archived) federation rule still references
     * the issuer; archive those rules first (a rule's issuer cannot be changed), or
     * recreate them against another issuer.
     *
     * @example
     * ```ts
     * const betaFederationIssuer =
     *   await client.beta.organization.federation.issuers.archive(
     *     'federation_issuer_id',
     *   );
     * ```
     */
    archive(federationIssuerID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post((0, path_1.path) `/v1/organizations/federation_issuers/${federationIssuerID}/archive?beta=true`, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                { ...(betas?.toString() != null ? { 'anthropic-beta': betas?.toString() } : undefined) },
                options?.headers,
            ]),
        });
    }
}
exports.Issuers = Issuers;
//# sourceMappingURL=issuers.js.map