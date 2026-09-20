"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Organization = void 0;
const tslib_1 = require("../../../internal/tslib.js");
const resource_1 = require("../../../core/resource.js");
const APIKeysAPI = tslib_1.__importStar(require("./api-keys.js"));
const api_keys_1 = require("./api-keys.js");
const ComplianceSettingsAPI = tslib_1.__importStar(require("./compliance-settings.js"));
const compliance_settings_1 = require("./compliance-settings.js");
const ExternalKeysAPI = tslib_1.__importStar(require("./external-keys.js"));
const external_keys_1 = require("./external-keys.js");
const InvitesAPI = tslib_1.__importStar(require("./invites.js"));
const invites_1 = require("./invites.js");
const RateLimitsAPI = tslib_1.__importStar(require("./rate-limits.js"));
const rate_limits_1 = require("./rate-limits.js");
const UsersAPI = tslib_1.__importStar(require("./users.js"));
const users_1 = require("./users.js");
const FederationAPI = tslib_1.__importStar(require("./federation/federation.js"));
const federation_1 = require("./federation/federation.js");
const ServiceAccountsAPI = tslib_1.__importStar(require("./service-accounts/service-accounts.js"));
const service_accounts_1 = require("./service-accounts/service-accounts.js");
const WorkspacesAPI = tslib_1.__importStar(require("./workspaces/workspaces.js"));
const workspaces_1 = require("./workspaces/workspaces.js");
class Organization extends resource_1.APIResource {
    constructor() {
        super(...arguments);
        this.apiKeys = new APIKeysAPI.APIKeys(this._client);
        this.externalKeys = new ExternalKeysAPI.ExternalKeys(this._client);
        this.federation = new FederationAPI.Federation(this._client);
        this.invites = new InvitesAPI.Invites(this._client);
        this.serviceAccounts = new ServiceAccountsAPI.ServiceAccounts(this._client);
        this.users = new UsersAPI.Users(this._client);
        this.workspaces = new WorkspacesAPI.Workspaces(this._client);
        this.rateLimits = new RateLimitsAPI.RateLimits(this._client);
        this.complianceSettings = new ComplianceSettingsAPI.ComplianceSettings(this._client);
    }
    /**
     * Retrieve information about the organization associated with the authenticated
     * API key.
     *
     * @example
     * ```ts
     * const betaOrganization =
     *   await client.beta.organization.retrieve();
     * ```
     */
    retrieve(options) {
        return this._client.get('/v1/organizations/me?beta=true', options);
    }
}
exports.Organization = Organization;
Organization.APIKeys = api_keys_1.APIKeys;
Organization.ExternalKeys = external_keys_1.ExternalKeys;
Organization.Federation = federation_1.Federation;
Organization.Invites = invites_1.Invites;
Organization.ServiceAccounts = service_accounts_1.ServiceAccounts;
Organization.Users = users_1.Users;
Organization.Workspaces = workspaces_1.Workspaces;
Organization.RateLimits = rate_limits_1.RateLimits;
Organization.ComplianceSettings = compliance_settings_1.ComplianceSettings;
//# sourceMappingURL=organization.js.map