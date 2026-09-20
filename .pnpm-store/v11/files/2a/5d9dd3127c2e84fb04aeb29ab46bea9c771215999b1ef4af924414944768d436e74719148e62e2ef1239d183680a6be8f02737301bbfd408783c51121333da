// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../core/resource.mjs";
import * as APIKeysAPI from "./api-keys.mjs";
import { APIKeys, } from "./api-keys.mjs";
import * as ComplianceSettingsAPI from "./compliance-settings.mjs";
import { ComplianceSettings, } from "./compliance-settings.mjs";
import * as ExternalKeysAPI from "./external-keys.mjs";
import { ExternalKeys, } from "./external-keys.mjs";
import * as InvitesAPI from "./invites.mjs";
import { Invites, } from "./invites.mjs";
import * as RateLimitsAPI from "./rate-limits.mjs";
import { RateLimits, } from "./rate-limits.mjs";
import * as UsersAPI from "./users.mjs";
import { Users, } from "./users.mjs";
import * as FederationAPI from "./federation/federation.mjs";
import { Federation } from "./federation/federation.mjs";
import * as ServiceAccountsAPI from "./service-accounts/service-accounts.mjs";
import { ServiceAccounts, } from "./service-accounts/service-accounts.mjs";
import * as WorkspacesAPI from "./workspaces/workspaces.mjs";
import { Workspaces, } from "./workspaces/workspaces.mjs";
export class Organization extends APIResource {
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
Organization.APIKeys = APIKeys;
Organization.ExternalKeys = ExternalKeys;
Organization.Federation = Federation;
Organization.Invites = Invites;
Organization.ServiceAccounts = ServiceAccounts;
Organization.Users = Users;
Organization.Workspaces = Workspaces;
Organization.RateLimits = RateLimits;
Organization.ComplianceSettings = ComplianceSettings;
//# sourceMappingURL=organization.mjs.map