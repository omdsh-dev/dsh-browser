import type { Fetch } from "../../internal/builtin-types.mjs";
import type { AccessTokenProvider, IdentityTokenProvider } from "./types.mjs";
export type OIDCFederationConfig = {
    identityTokenProvider: IdentityTokenProvider;
    federationRuleId: string;
    organizationId: string;
    serviceAccountId?: string | undefined;
    /**
     * Optional `wrkspc_*` tagged ID, or the literal `"default"` to scope the
     * token to the organization's default workspace. When omitted the server
     * picks the rule's sole enabled workspace, else the org default if the rule
     * covers it. Required when the rule enables more than one non-default
     * workspace, or to target a specific workspace other than the one the
     * server would pick. The minted token is workspace-scoped: per-request
     * workspace selection (the `anthropic-workspace-id` header) is not supported
     * for federation tokens — switching workspaces requires a new token exchange
     * with a different `workspaceId`.
     */
    workspaceId?: string | undefined;
    baseURL: string;
    fetch: Fetch;
    /**
     * Overrides the outgoing User-Agent header on the token exchange. When
     * empty, sends an SDK-identified UA so the token endpoint's access logs
     * identify the caller.
     */
    userAgent?: string | undefined;
};
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
export declare function oidcFederationProvider(config: OIDCFederationConfig): AccessTokenProvider;
//# sourceMappingURL=oidc-federation.d.mts.map