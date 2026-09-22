import type { Fetch } from "../../internal/builtin-types.mjs";
import type { AccessTokenProvider } from "./types.mjs";
export type UserOAuthConfig = {
    credentialsPath: string;
    clientId?: string | undefined;
    baseURL: string;
    fetch: Fetch;
    userAgent?: string | undefined;
    onSafetyWarning?: ((msg: string) => void) | undefined;
};
/**
 * Reads a user-oauth credential file. Returns the cached access token while
 * fresh; on expiry performs a `refresh_token` grant and writes the new
 * tokens back to the credentials file (atomic replace, fsync'd).
 *
 * If `clientId` is empty, the access token is treated as static — the
 * credentials file is read on every call but no refresh is attempted, and
 * an expired token without a `refresh_token` raises.
 */
export declare function userOAuthProvider(config: UserOAuthConfig): AccessTokenProvider;
//# sourceMappingURL=user-oauth.d.mts.map