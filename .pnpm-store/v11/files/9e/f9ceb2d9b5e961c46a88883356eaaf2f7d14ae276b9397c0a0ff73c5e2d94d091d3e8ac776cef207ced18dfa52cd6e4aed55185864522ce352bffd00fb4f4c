import { FEDERATION_BETA_HEADER, GRANT_TYPE_JWT_BEARER, OAUTH_API_BETA_HEADER, TOKEN_ENDPOINT, WorkloadIdentityError, parseTokenResponse, redactSensitive, requireSecureTokenEndpoint, } from "./types.mjs";
import { nowAsSeconds } from "../../internal/utils/time.mjs";
import { VERSION } from "../../version.mjs";
/**
 * Exchanges an external OIDC JWT for an Anthropic access token via the
 * RFC 7523 jwt-bearer grant.
 *
 * Each invocation performs a fresh token exchange. Wrap in a
 * {@link TokenCache} to avoid exchanging on every request.
 *
 * Federation grants do not return a refresh token — callers re-exchange
 * their assertion on expiry.
 */
export function oidcFederationProvider(config) {
    return async () => {
        requireSecureTokenEndpoint(config.baseURL);
        const jwt = await config.identityTokenProvider();
        // The token endpoint enforces a 16 KiB assertion limit; surface a clear
        // client-side error so misconfigured projected-token sources are
        // diagnosable without a server round-trip.
        if (jwt.length > 16 * 1024) {
            throw new WorkloadIdentityError(`Identity token is ${Math.ceil(jwt.length / 1024)} KiB, exceeds the 16 KiB assertion limit`);
        }
        const body = {
            grant_type: GRANT_TYPE_JWT_BEARER,
            assertion: jwt,
            federation_rule_id: config.federationRuleId,
            organization_id: config.organizationId,
        };
        if (config.serviceAccountId) {
            body['service_account_id'] = config.serviceAccountId;
        }
        if (config.workspaceId) {
            body['workspace_id'] = config.workspaceId;
        }
        const url = `${config.baseURL}${TOKEN_ENDPOINT}`;
        let resp;
        try {
            resp = await config.fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'anthropic-beta': `${OAUTH_API_BETA_HEADER},${FEDERATION_BETA_HEADER}`,
                    'User-Agent': config.userAgent || `anthropic-sdk-typescript/${VERSION} oidcFederationProvider`,
                },
                body: JSON.stringify(body),
            });
        }
        catch (err) {
            throw new WorkloadIdentityError(`Failed to reach token endpoint ${url}: ${err}`);
        }
        const requestId = resp.headers.get('Request-Id');
        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            const redacted = redactSensitive(text);
            // A 401 is hard to debug from the status code alone, so surface
            // guidance: check the federation rule, optionally set a workspace ID
            // (the most common fix when no workspaceId is configured), and point at
            // the Workload identity page in Claude Console for the server-side
            // authentication event log. Other statuses (5xx, 400, ...) get no hint.
            let hint = '';
            if (resp.status === 401) {
                const hintMiddle = config.workspaceId ? '' : ("If your federation rule is scoped to multiple workspaces, set the ANTHROPIC_WORKSPACE_ID environment variable, the 'workspace_id' config key, or the `workspaceId` option. ");
                hint = ` Ensure your federation rule matches your identity token. ${hintMiddle}View your authentication events in the Workload identity page of Claude Console for more details.`;
            }
            throw new WorkloadIdentityError(`Token exchange failed with status ${resp.status}${requestId ? ` (request-id ${requestId})` : ''}: ${redacted}${hint}`, resp.status, redacted, requestId);
        }
        const data = await parseTokenResponse(resp, requestId);
        const expiresIn = Number(data.expires_in);
        if (!Number.isFinite(expiresIn)) {
            throw new WorkloadIdentityError(`Token endpoint response missing required fields: ${JSON.stringify(redactSensitive(data))}`, resp.status, redactSensitive(data), requestId);
        }
        return {
            token: data.access_token,
            expiresAt: nowAsSeconds() + expiresIn,
        };
    };
}
//# sourceMappingURL=oidc-federation.mjs.map