import { getPlatformHeaders } from "../internal/detect-platform.mjs";
import { readEnv } from "../internal/utils.mjs";
/** Current schema version written to `configs/<profile>.json`. Absent on read ⇒ "1.0". */
export const CONFIG_FILE_VERSION = '1.0';
/** Current schema version written to `credentials/<profile>.json`. Absent on read ⇒ "1.0". */
export const CREDENTIALS_FILE_VERSION = '1.0';
const PROFILE_NAME_PATTERN = /^[A-Za-z0-9_.-]+$/;
function validateProfileName(name) {
    if (!name) {
        throw new Error('profile name is empty');
    }
    if (name === '.' || name === '..') {
        throw new Error(`profile name "${name}" is not allowed`);
    }
    if (name.includes('/') || name.includes('\\')) {
        throw new Error(`profile name "${name}" must not contain path separators`);
    }
    if (!PROFILE_NAME_PATTERN.test(name)) {
        throw new Error(`profile name "${name}" contains disallowed characters (allowed: letters, digits, '_', '.', '-')`);
    }
}
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
export const loadConfig = async (profile) => {
    return (await loadConfigWithSource(profile))?.config ?? null;
};
/**
 * Same as {@link loadConfig}, but also reports whether the config was loaded
 * from a profile file on disk (`fromFile: true`) or synthesized entirely from
 * environment variables (`fromFile: false`).
 */
export const loadConfigWithSource = async (profile) => {
    var _a, _b;
    const rootConfigPath = await getRootConfigPath();
    if (rootConfigPath === null) {
        return null;
    }
    const profileName = profile ?? (await getActiveProfileName());
    if (profileName === null) {
        return null;
    }
    validateProfileName(profileName);
    const { fs, path } = await import("../internal/node.mjs");
    const configPath = path.join(rootConfigPath, 'configs', `${profileName}.json`);
    let configRaw;
    try {
        configRaw = await fs.promises.readFile(configPath, 'utf-8');
    }
    catch (err) {
        if (err?.code !== 'ENOENT') {
            throw new Error(`failed to read config file ${configPath}: ${err}`);
        }
        configRaw = null;
    }
    if (configRaw === null) {
        const organizationId = readEnv('ANTHROPIC_ORGANIZATION_ID');
        const identityTokenFile = readEnv('ANTHROPIC_IDENTITY_TOKEN_FILE');
        const federationRuleId = readEnv('ANTHROPIC_FEDERATION_RULE_ID');
        if (federationRuleId && organizationId) {
            return {
                fromFile: false,
                config: {
                    organization_id: organizationId,
                    // A defaulted-but-empty CI variable (`ANTHROPIC_WORKSPACE_ID=""`) is
                    // treated as unset — readEnv coerces empty to undefined, and the body
                    // builder's truthy check skips it — so `"workspace_id": ""` never goes
                    // on the wire.
                    workspace_id: readEnv('ANTHROPIC_WORKSPACE_ID'),
                    base_url: readEnv('ANTHROPIC_BASE_URL'),
                    authentication: {
                        type: 'oidc_federation',
                        federation_rule_id: federationRuleId,
                        service_account_id: readEnv('ANTHROPIC_SERVICE_ACCOUNT_ID'),
                        identity_token: identityTokenFile ? { source: 'file', path: identityTokenFile } : undefined,
                        scope: readEnv('ANTHROPIC_SCOPE'),
                    },
                },
            };
        }
        return null;
    }
    let config;
    try {
        config = JSON.parse(configRaw);
    }
    catch (err) {
        throw new Error(`failed to parse config file ${configPath}: ${err}`);
    }
    if (!config.authentication) {
        throw new Error(`config file ${configPath} is missing "authentication"`);
    }
    const authType = config.authentication.type;
    if (authType !== 'oidc_federation' && authType !== 'user_oauth') {
        throw new Error(`authentication.type "${authType}" is not a known authentication type`);
    }
    // File values are authoritative; env vars only fill fields the file left unset.
    config.organization_id ?? (config.organization_id = readEnv('ANTHROPIC_ORGANIZATION_ID'));
    config.workspace_id ?? (config.workspace_id = readEnv('ANTHROPIC_WORKSPACE_ID'));
    config.base_url ?? (config.base_url = readEnv('ANTHROPIC_BASE_URL'));
    (_a = config.authentication).scope ?? (_a.scope = readEnv('ANTHROPIC_SCOPE'));
    if (config.authentication.type === 'oidc_federation') {
        if (!config.authentication.identity_token) {
            const identityTokenFile = readEnv('ANTHROPIC_IDENTITY_TOKEN_FILE');
            if (identityTokenFile) {
                config.authentication.identity_token = {
                    source: 'file',
                    path: identityTokenFile,
                };
            }
        }
        // Unlike siblings using `??= readEnv()` (which leaves `undefined`), coerce
        // to '' so the type stays `string` (always set). The downstream required
        // check in credential-chain rejects empty, so semantics match but types are
        // cleaner.
        if (!config.authentication.federation_rule_id) {
            config.authentication.federation_rule_id = readEnv('ANTHROPIC_FEDERATION_RULE_ID') ?? '';
        }
        (_b = config.authentication).service_account_id ?? (_b.service_account_id = readEnv('ANTHROPIC_SERVICE_ACCOUNT_ID'));
    }
    return { config, fromFile: true };
};
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
export const loadCredentials = async () => {
    const config = await loadConfig();
    const credentialsPath = await getCredentialsPath(config);
    if (!credentialsPath) {
        return null;
    }
    const { fs } = await import("../internal/node.mjs");
    let raw;
    try {
        raw = await fs.promises.readFile(credentialsPath, 'utf-8');
    }
    catch (err) {
        if (err?.code !== 'ENOENT') {
            throw new Error(`failed to read credentials file ${credentialsPath}: ${err}`);
        }
        return null;
    }
    let creds;
    try {
        creds = JSON.parse(raw);
    }
    catch (err) {
        throw new Error(`failed to parse credentials file ${credentialsPath}: ${err}`);
    }
    if (creds.type && creds.type !== 'oauth_token') {
        throw new Error(`credentials file ${credentialsPath} has unsupported type "${creds.type}" (want "oauth_token")`);
    }
    return creds;
};
/**
 * Resolves the credentials file path for the given config.
 *
 * Uses `authentication.credentials_path` from the config if set, otherwise
 * falls back to `<config_dir>/credentials/<profile>.json`.
 *
 * Returns `null` when running in a browser or the path cannot be resolved.
 */
export const getCredentialsPath = async (config, profile) => {
    if (config?.authentication.credentials_path) {
        return config.authentication.credentials_path;
    }
    const rootConfigPath = await getRootConfigPath();
    if (!rootConfigPath) {
        return null;
    }
    const profileName = profile ?? (await getActiveProfileName());
    if (!profileName) {
        return null;
    }
    validateProfileName(profileName);
    const { path } = await import("../internal/node.mjs");
    return path.join(rootConfigPath, 'credentials', `${profileName}.json`);
};
const getRootConfigPath = async () => {
    if (!supportsLocalConfigFiles()) {
        return null;
    }
    const { path } = await import("../internal/node.mjs");
    // ANTHROPIC_CONFIG_DIR is treated as a trusted path: it is set by the
    // process operator, not by remote input, so it is not validated.
    const configDir = readEnv('ANTHROPIC_CONFIG_DIR');
    if (configDir) {
        return configDir;
    }
    const os = getPlatformHeaders()['X-Stainless-OS'];
    if (os === 'Windows') {
        const appData = readEnv('APPDATA');
        if (appData) {
            return path.join(appData, 'Anthropic');
        }
        const userProfile = readEnv('USERPROFILE');
        if (userProfile) {
            return path.join(userProfile, 'AppData', 'Roaming', 'Anthropic');
        }
        // No usable Windows config root — return null so callers fall through to
        // "no config available" rather than silently writing under C:\.
        return null;
    }
    const xdgConfigHome = readEnv('XDG_CONFIG_HOME');
    if (xdgConfigHome) {
        return path.join(xdgConfigHome, 'anthropic');
    }
    const home = readEnv('HOME');
    if (home) {
        return path.join(home, '.config', 'anthropic');
    }
    return null;
};
const supportsLocalConfigFiles = () => {
    const runtime = getPlatformHeaders()['X-Stainless-Runtime'];
    return runtime === 'node' || runtime === 'deno';
};
const getActiveProfileName = async () => {
    const rootConfigPath = await getRootConfigPath();
    if (!rootConfigPath) {
        return null;
    }
    const profileName = readEnv('ANTHROPIC_PROFILE');
    if (profileName) {
        return profileName;
    }
    const { fs, path } = await import("../internal/node.mjs");
    const filePath = path.join(rootConfigPath, 'active_config');
    try {
        return (await fs.promises.readFile(filePath, 'utf-8')).trim() || 'default';
    }
    catch (err) {
        if (err?.code !== 'ENOENT') {
            throw new Error(`failed to read ${filePath}: ${err}`);
        }
        return 'default';
    }
};
//# sourceMappingURL=credentials.mjs.map