import { AnthropicError } from "../../core/error.mjs";
export type AccessToken = {
    token: string;
    /** Unix epoch seconds. `null` means no expiry (cache forever). */
    expiresAt: number | null;
};
/**
 * Mints or returns a cached access token.
 *
 * The optional `opts.forceRefresh` flag, set by {@link TokenCache.invalidate}
 * after a 401, tells providers with on-disk caches (user_oauth, cachedExchange)
 * to bypass their freshness short-circuit and always fetch fresh. Providers
 * without a cache can ignore it.
 */
export type AccessTokenProvider = (opts?: {
    forceRefresh?: boolean;
}) => Promise<AccessToken>;
export type IdentityTokenProvider = () => string | Promise<string>;
export type CredentialResult = {
    provider: AccessTokenProvider;
    extraHeaders: Record<string, string>;
    /**
     * The `base_url` from the resolved config/profile, if any. The client
     * applies this to outbound API requests when no explicit `baseURL` (constructor
     * option or `ANTHROPIC_BASE_URL` env) was given, so a profile pointing at a
     * non-default API host both mints its token against that host AND sends
     * subsequent API requests there.
     */
    baseURL?: string | undefined;
};
/** Response body from `POST /v1/oauth/token`. */
export type TokenEndpointResponse = {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
};
export declare const GRANT_TYPE_JWT_BEARER = "urn:ietf:params:oauth:grant-type:jwt-bearer";
export declare const GRANT_TYPE_REFRESH_TOKEN = "refresh_token";
export declare const TOKEN_ENDPOINT = "/v1/oauth/token";
/**
 * `anthropic-beta` value required on authenticated API requests using an
 * OAuth bearer token, and on `refresh_token` grants against the token endpoint.
 */
export declare const OAUTH_API_BETA_HEADER = "oauth-2025-04-20";
/**
 * `anthropic-beta` value required on jwt-bearer exchanges against the token
 * endpoint. It routes the request to the federation service; it must NOT be
 * sent on `refresh_token` grants, which are handled by a different backend.
 */
export declare const FEDERATION_BETA_HEADER = "oidc-federation-2026-04-01";
export declare const ADVISORY_REFRESH_THRESHOLD_IN_SECONDS = 120;
export declare const MANDATORY_REFRESH_THRESHOLD_IN_SECONDS = 30;
export declare const ADVISORY_REFRESH_BACKOFF_IN_SECONDS = 5;
/**
 * Rejects base URLs that would cause a JWT assertion or refresh token to be
 * sent over cleartext HTTP. Loopback hosts are allowed for local development.
 */
export declare function requireSecureTokenEndpoint(baseURL: string): void;
/**
 * Reads the response body as text, parses it as a token-endpoint JSON
 * response, validates `access_token` is present, and rejects a non-Bearer
 * `token_type` when one is provided. Reads at most
 * {@link MAX_TOKEN_RESPONSE_BYTES} from the body stream.
 */
export declare function parseTokenResponse(resp: Response, requestId: string | null): Promise<TokenEndpointResponse & {
    access_token: string;
}>;
/**
 * Returns a redacted copy of a token-endpoint error body for safe inclusion
 * in an exception. Strings are truncated; objects keep only the RFC 6749
 * §5.2 error fields.
 */
export declare function redactSensitive(body: unknown): unknown;
/**
 * Best-effort safety check on a credentials file before reading it.
 *
 * On POSIX: resolves symlinks (so containerized deployments that mount the
 * credential as a symlink to a tmpfs-backed file keep working), then rejects
 * the resolved target if it is group- or world- readable or writable. A uid
 * mismatch on the resolved target is surfaced via `onWarn` since
 * root-written/app-read is common in init-container setups. No-op on Windows.
 */
export declare function checkCredentialsFileSafety(path: string, onWarn?: (msg: string) => void): Promise<void>;
/**
 * Atomically writes JSON to `targetPath` via a `.tmp` sibling + rename,
 * with fsync on the file and (best-effort) on the parent directory.
 * Creates the parent directory with mode 0700 and the file with mode 0600.
 */
export declare function writeCredentialsFileAtomic(targetPath: string, data: unknown): Promise<void>;
export declare class WorkloadIdentityError extends AnthropicError {
    readonly statusCode: number | null;
    readonly body: unknown;
    readonly requestId: string | null;
    constructor(message: string, statusCode?: number | null, body?: unknown, requestId?: string | null);
}
//# sourceMappingURL=types.d.mts.map