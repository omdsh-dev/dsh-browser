/** Current schema version written to `configs/<profile>.json`. Absent on read ⇒ "1.0". */
export declare const CONFIG_FILE_VERSION = "1.0";
/** Current schema version written to `credentials/<profile>.json`. Absent on read ⇒ "1.0". */
export declare const CREDENTIALS_FILE_VERSION = "1.0";
/**
 * Authentication-mode-specific configuration. On the wire (configs/<profile>.json)
 * this is a flat JSON object under the top-level `authentication` key — `type`,
 * `credentials_path`, and the variant-specific fields all sit at the same level.
 *
 * Unknown fields are silently ignored for forward compatibility. Unknown
 * authentication types are rejected because the SDK has no way to resolve
 * credentials for them.
 */
export type AuthenticationInfo = {
    /**
     * Filesystem path to the credentials JSON that stores access/refresh tokens.
     * Defaults to `<config_dir>/credentials/<profile>.json` when omitted.
     */
    credentials_path?: string | undefined;
} & ({
    type: 'oidc_federation';
    /** Tagged ID (`fdrl_...`) of the federation rule. Required. */
    federation_rule_id: string;
    /** Optional `svac_...` expected-target check. */
    service_account_id?: string | undefined;
    identity_token?: {
        source: 'file';
        path: string;
    } | undefined;
    /** Display-only; the SDK does not send this on the jwt-bearer exchange. */
    scope?: string | undefined;
} | {
    type: 'user_oauth';
    /** OAuth client ID for refresh. Empty → access token is treated as static. */
    client_id?: string | undefined;
    /** Display-only; the SDK does not send this on refresh. */
    scope?: string | undefined;
    /** Console URL the profile was created against. Display-only. */
    console_url?: string | undefined;
});
export type AnthropicConfig = {
    version?: string;
    authentication: AuthenticationInfo;
    base_url?: string | undefined;
    organization_id?: string | undefined;
    workspace_id?: string | undefined;
};
export type AnthropicCredentials = {
    version?: string;
    type: 'oauth_token';
    access_token: string;
    expires_at?: number;
    refresh_token?: string;
    scope?: string;
    organization_uuid?: string;
    organization_name?: string;
    account_email?: string;
};
/**
 * Loads the Anthropic configuration for the given (or active) profile.
 *
 * Returns `null` when running in a browser or no configuration can be resolved.
 * Otherwise, returns the configuration based on the config file and environment variables.
 *
 * **Profile resolution** (first match wins):
 *   1. Explicit `profile` argument
 *   2. `ANTHROPIC_PROFILE` environment variable
 *   3. Contents of `<config_dir>/active_config` file
 *   4. `"default"`
 *
 * **Config resolution:**
 *   - If `<config_dir>/configs/<profile>.json` exists, it is loaded and
 *     missing fields are filled from environment variables. Values present
 *     in the file take precedence — env vars only fill gaps:
 *       - `ANTHROPIC_BASE_URL` → `base_url`
 *       - `ANTHROPIC_ORGANIZATION_ID` → `organization_id`
 *       - `ANTHROPIC_WORKSPACE_ID` → `workspace_id`
 *       - `ANTHROPIC_SCOPE` → `authentication.scope`
 *       - `ANTHROPIC_FEDERATION_RULE_ID` → `authentication.federation_rule_id` (oidc_federation)
 *       - `ANTHROPIC_IDENTITY_TOKEN_FILE` → `authentication.identity_token` (oidc_federation)
 *       - `ANTHROPIC_SERVICE_ACCOUNT_ID` → `authentication.service_account_id` (oidc_federation)
 *   - If no config file exists, an `oidc_federation` config is synthesized
 *     entirely from environment variables when both `ANTHROPIC_FEDERATION_RULE_ID`
 *     and `ANTHROPIC_ORGANIZATION_ID` are set.
 */
export declare const loadConfig: (profile?: string) => Promise<AnthropicConfig | null>;
/**
 * Source-tagged result of {@link loadConfigWithSource}. `fromFile` is `true`
 * when `<config_dir>/configs/<profile>.json` exists on disk; `false` when the
 * config was synthesized purely from environment variables.
 *
 * The credential chain uses this distinction to decide whether to back the
 * federation exchange with a disk cache: file-backed profiles get a cache at
 * `<config_dir>/credentials/<profile>.json`, env-only configs do not.
 */
export type LoadedConfig = {
    config: AnthropicConfig;
    fromFile: boolean;
};
/**
 * Same as {@link loadConfig}, but also reports whether the config was loaded
 * from a profile file on disk (`fromFile: true`) or synthesized entirely from
 * environment variables (`fromFile: false`).
 */
export declare const loadConfigWithSource: (profile?: string) => Promise<LoadedConfig | null>;
/**
 * Loads the credential material for the active profile.
 *
 * Returns the parsed credentials or `null` when running in a browser or
 * no credentials file can be found.
 *
 * **Profile resolution** (first match wins):
 *   1. `ANTHROPIC_PROFILE` environment variable
 *   2. Contents of `<config_dir>/active_config` file
 *   3. `"default"`
 *
 * **Credentials path resolution** (first match wins):
 *   1. `authentication.credentials_path` from the active profile's config (via {@link loadConfig})
 *   2. `<config_dir>/credentials/<profile>.json`
 */
export declare const loadCredentials: () => Promise<AnthropicCredentials | null>;
/**
 * Resolves the credentials file path for the given config.
 *
 * Uses `authentication.credentials_path` from the config if set, otherwise
 * falls back to `<config_dir>/credentials/<profile>.json`.
 *
 * Returns `null` when running in a browser or the path cannot be resolved.
 */
export declare const getCredentialsPath: (config: AnthropicConfig | null, profile?: string) => Promise<string | null>;
//# sourceMappingURL=credentials.d.mts.map