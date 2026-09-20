import { APIResource } from "../../../core/resource.js";
import * as APIKeysAPI from "./api-keys.js";
import { APIKeyListParams, APIKeyUpdateParams, APIKeys, BetaAPIKey, BetaAPIKeyCreatedBy, BetaAPIKeyOrganizationScope, BetaAPIKeyServiceAccountActor, BetaAPIKeyUserActor, BetaAPIKeyWorkspaceScope, BetaAPIKeysPage } from "./api-keys.js";
import * as ComplianceSettingsAPI from "./compliance-settings.js";
import { BetaComplianceSettings, BetaComplianceSettingsStateDisabled, BetaComplianceSettingsStateDisabledParam, BetaComplianceSettingsStateEnabled, BetaComplianceSettingsStateEnabledParam, ComplianceSettingUpdateParams, ComplianceSettings } from "./compliance-settings.js";
import * as ExternalKeysAPI from "./external-keys.js";
import { BetaAWSExternalKeyConfig, BetaAzureExternalKeyConfig, BetaAzureExternalKeyConfigParam, BetaExternalKey, BetaExternalKeyAttachedAttachment, BetaExternalKeyUnattachedAttachment, BetaExternalKeysPageCursor, BetaGCPExternalKeyConfig, ExternalKeyCreateParams, ExternalKeyDeleteResponse, ExternalKeyListParams, ExternalKeyUpdateParams, ExternalKeyValidateResponse, ExternalKeys } from "./external-keys.js";
import * as InvitesAPI from "./invites.js";
import { BetaOrganizationInvite, BetaOrganizationInvitesPage, InviteCreateParams, InviteDeleteResponse, InviteListParams, Invites } from "./invites.js";
import * as RateLimitsAPI from "./rate-limits.js";
import { BetaOrganizationRateLimit, BetaOrganizationRateLimitValue, BetaOrganizationRateLimitsPageCursor, RateLimitListParams, RateLimits } from "./rate-limits.js";
import * as UsersAPI from "./users.js";
import { BetaOrganizationUser, BetaOrganizationUsersPage, UserListParams, UserRemoveResponse, UserUpdateParams, Users } from "./users.js";
import * as FederationAPI from "./federation/federation.js";
import { Federation } from "./federation/federation.js";
import * as ServiceAccountsAPI from "./service-accounts/service-accounts.js";
import { BetaServiceAccount, BetaServiceAccountWorkspaceMember, BetaServiceAccountsPageCursor, ServiceAccountArchiveParams, ServiceAccountCreateParams, ServiceAccountListParams, ServiceAccountRetrieveParams, ServiceAccountUpdateParams, ServiceAccounts } from "./service-accounts/service-accounts.js";
import * as WorkspacesAPI from "./workspaces/workspaces.js";
import { BetaAllowedInferenceGeo, BetaDataResidency, BetaDataResidencyCreateConfig, BetaDataResidencyUpdateConfig, BetaNoBillingWorkspaceRole, BetaWorkspace, BetaWorkspaceMember, BetaWorkspaceRole, BetaWorkspacesPage, WorkspaceCreateParams, WorkspaceListParams, WorkspaceUpdateParams, Workspaces } from "./workspaces/workspaces.js";
import { APIPromise } from "../../../core/api-promise.js";
import { RequestOptions } from "../../../internal/request-options.js";
export declare class Organization extends APIResource {
    apiKeys: APIKeysAPI.APIKeys;
    externalKeys: ExternalKeysAPI.ExternalKeys;
    federation: FederationAPI.Federation;
    invites: InvitesAPI.Invites;
    serviceAccounts: ServiceAccountsAPI.ServiceAccounts;
    users: UsersAPI.Users;
    workspaces: WorkspacesAPI.Workspaces;
    rateLimits: RateLimitsAPI.RateLimits;
    complianceSettings: ComplianceSettingsAPI.ComplianceSettings;
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
    retrieve(options?: RequestOptions): APIPromise<BetaOrganization>;
}
export interface BetaOrganization {
    /**
     * ID of the Organization.
     */
    id: string;
    /**
     * Name of the Organization.
     */
    name: string;
    /**
     * Object type.
     *
     * For Organizations, this is always `"organization"`.
     */
    type: 'organization';
}
export type BetaOrganizationRole = 'admin' | 'billing' | 'claude_code_user' | 'developer' | 'managed' | 'membership_admin' | 'owner' | 'primary_owner' | 'user';
export declare namespace Organization {
    export { type BetaOrganization as BetaOrganization, type BetaOrganizationRole as BetaOrganizationRole };
    export { APIKeys as APIKeys, type BetaAPIKey as BetaAPIKey, type BetaAPIKeyCreatedBy as BetaAPIKeyCreatedBy, type BetaAPIKeyOrganizationScope as BetaAPIKeyOrganizationScope, type BetaAPIKeyServiceAccountActor as BetaAPIKeyServiceAccountActor, type BetaAPIKeyUserActor as BetaAPIKeyUserActor, type BetaAPIKeyWorkspaceScope as BetaAPIKeyWorkspaceScope, type BetaAPIKeysPage as BetaAPIKeysPage, type APIKeyUpdateParams as APIKeyUpdateParams, type APIKeyListParams as APIKeyListParams, };
    export { ExternalKeys as ExternalKeys, type BetaAWSExternalKeyConfig as BetaAWSExternalKeyConfig, type BetaAzureExternalKeyConfig as BetaAzureExternalKeyConfig, type BetaAzureExternalKeyConfigParam as BetaAzureExternalKeyConfigParam, type BetaExternalKey as BetaExternalKey, type BetaExternalKeyAttachedAttachment as BetaExternalKeyAttachedAttachment, type BetaExternalKeyUnattachedAttachment as BetaExternalKeyUnattachedAttachment, type BetaGCPExternalKeyConfig as BetaGCPExternalKeyConfig, type ExternalKeyDeleteResponse as ExternalKeyDeleteResponse, type ExternalKeyValidateResponse as ExternalKeyValidateResponse, type BetaExternalKeysPageCursor as BetaExternalKeysPageCursor, type ExternalKeyCreateParams as ExternalKeyCreateParams, type ExternalKeyUpdateParams as ExternalKeyUpdateParams, type ExternalKeyListParams as ExternalKeyListParams, };
    export { Federation as Federation };
    export { Invites as Invites, type BetaOrganizationInvite as BetaOrganizationInvite, type InviteDeleteResponse as InviteDeleteResponse, type BetaOrganizationInvitesPage as BetaOrganizationInvitesPage, type InviteCreateParams as InviteCreateParams, type InviteListParams as InviteListParams, };
    export { ServiceAccounts as ServiceAccounts, type BetaServiceAccount as BetaServiceAccount, type BetaServiceAccountWorkspaceMember as BetaServiceAccountWorkspaceMember, type BetaServiceAccountsPageCursor as BetaServiceAccountsPageCursor, type ServiceAccountCreateParams as ServiceAccountCreateParams, type ServiceAccountRetrieveParams as ServiceAccountRetrieveParams, type ServiceAccountUpdateParams as ServiceAccountUpdateParams, type ServiceAccountListParams as ServiceAccountListParams, type ServiceAccountArchiveParams as ServiceAccountArchiveParams, };
    export { Users as Users, type BetaOrganizationUser as BetaOrganizationUser, type UserRemoveResponse as UserRemoveResponse, type BetaOrganizationUsersPage as BetaOrganizationUsersPage, type UserUpdateParams as UserUpdateParams, type UserListParams as UserListParams, };
    export { Workspaces as Workspaces, type BetaAllowedInferenceGeo as BetaAllowedInferenceGeo, type BetaDataResidency as BetaDataResidency, type BetaDataResidencyCreateConfig as BetaDataResidencyCreateConfig, type BetaDataResidencyUpdateConfig as BetaDataResidencyUpdateConfig, type BetaNoBillingWorkspaceRole as BetaNoBillingWorkspaceRole, type BetaWorkspace as BetaWorkspace, type BetaWorkspaceMember as BetaWorkspaceMember, type BetaWorkspaceRole as BetaWorkspaceRole, type BetaWorkspacesPage as BetaWorkspacesPage, type WorkspaceCreateParams as WorkspaceCreateParams, type WorkspaceUpdateParams as WorkspaceUpdateParams, type WorkspaceListParams as WorkspaceListParams, };
    export { RateLimits as RateLimits, type BetaOrganizationRateLimit as BetaOrganizationRateLimit, type BetaOrganizationRateLimitValue as BetaOrganizationRateLimitValue, type BetaOrganizationRateLimitsPageCursor as BetaOrganizationRateLimitsPageCursor, type RateLimitListParams as RateLimitListParams, };
    export { ComplianceSettings as ComplianceSettings, type BetaComplianceSettings as BetaComplianceSettings, type BetaComplianceSettingsStateDisabled as BetaComplianceSettingsStateDisabled, type BetaComplianceSettingsStateDisabledParam as BetaComplianceSettingsStateDisabledParam, type BetaComplianceSettingsStateEnabled as BetaComplianceSettingsStateEnabled, type BetaComplianceSettingsStateEnabledParam as BetaComplianceSettingsStateEnabledParam, type ComplianceSettingUpdateParams as ComplianceSettingUpdateParams, };
}
//# sourceMappingURL=organization.d.ts.map