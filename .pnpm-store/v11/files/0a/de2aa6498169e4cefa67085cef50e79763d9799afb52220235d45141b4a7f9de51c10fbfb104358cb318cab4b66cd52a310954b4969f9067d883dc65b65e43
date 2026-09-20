// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../core/resource.mjs";
export class ComplianceSettings extends APIResource {
    /**
     * Retrieve your organization's Compliance Settings.
     *
     * Compliance Settings is a singleton resource: there is exactly one per
     * organization, addressed without an identifier. The `state` field reflects
     * whether the Compliance API is enabled. An organization with a parent
     * organization reads the state inherited from the parent's configuration.
     *
     * @example
     * ```ts
     * const betaComplianceSettings =
     *   await client.beta.organization.complianceSettings.retrieve();
     * ```
     */
    retrieve(options) {
        return this._client.get('/v1/organizations/compliance_settings?beta=true', options);
    }
    /**
     * Update your organization's Compliance Settings.
     *
     * Setting `state` to `enabled` turns on the Compliance API and begins capturing
     * organization activity events. Setting it to `disabled` turns both off. `state`
     * reflects whether the Compliance API is enabled.
     *
     * A request that sets `state` to its current value succeeds and leaves the
     * resource unchanged. A `disabled` request stays in effect until a later `enabled`
     * request or the organization's next provisioning action that enables Access
     * Transparency: enabling Access Transparency also enables the Compliance API,
     * which serves its activity events, so such provisioning (including re-runs)
     * re-enables the Compliance API even after a `disabled` request. Automated
     * provisioning never disables compliance settings.
     *
     * @example
     * ```ts
     * const betaComplianceSettings =
     *   await client.beta.organization.complianceSettings.update({
     *     state: { type: 'enabled' },
     *   });
     * ```
     */
    update(body, options) {
        return this._client.post('/v1/organizations/compliance_settings?beta=true', { body, ...options });
    }
}
//# sourceMappingURL=compliance-settings.mjs.map