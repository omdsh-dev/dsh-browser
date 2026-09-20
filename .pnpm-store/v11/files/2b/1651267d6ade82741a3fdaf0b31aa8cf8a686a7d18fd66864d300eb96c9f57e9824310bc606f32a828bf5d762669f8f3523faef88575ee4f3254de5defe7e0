"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCredentialsPath = exports.loadCredentials = exports.loadConfigWithSource = exports.loadConfig = exports.CREDENTIALS_FILE_VERSION = exports.CONFIG_FILE_VERSION = void 0;
const detect_platform_1 = require("../internal/detect-platform.js");
const utils_1 = require("../internal/utils.js");
/** Current schema version written to `configs/<profile>.json`. Absent on read ⇒ "1.0". */
exports.CONFIG_FILE_VERSION = '1.0';
/** Current schema version written to `credentials/<profile>.json`. Absent on read ⇒ "1.0". */
exports.CREDENTIALS_FILE_VERSION = '1.0';
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
const loadConfig = async (profile) => {
    return (await (0, exports.loadConfigWithSource)(profile))?.config ?? null;
};
exports.loadConfig = loadConfig;
/**
 * Same as {@link loadConfig}, but also reports whether the config was loaded
 * from a profile file on disk (`fromFile: true`) or synthesized entirely from
 * environment variables (`fromFile: false`).
 */
const loadConfigWithSource = async (profile) => {
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
    const { fs, path } = await Promise.resolve().then(() => __importStar(require("../internal/node.js")));
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
        const organizationId = (0, utils_1.readEnv)('ANTHROPIC_ORGANIZATION_ID');
        const identityTokenFile = (0, utils_1.readEnv)('ANTHROPIC_IDENTITY_TOKEN_FILE');
        const federationRuleId = (0, utils_1.readEnv)('ANTHROPIC_FEDERATION_RULE_ID');
        if (federationRuleId && organizationId) {
            return {
                fromFile: false,
                config: {
                    organization_id: organizationId,
                    // A defaulted-but-empty CI variable (`ANTHROPIC_WORKSPACE_ID=""`) is
                    // treated as unset — readEnv coerces empty to undefined, and the body
                    // builder's truthy check skips it — so `"workspace_id": ""` never goes
                    // on the wire.
                    workspace_id: (0, utils_1.readEnv)('ANTHROPIC_WORKSPACE_ID'),
                    base_url: (0, utils_1.readEnv)('ANTHROPIC_BASE_URL'),
                    authentication: {
                        type: 'oidc_federation',
                        federation_rule_id: federationRuleId,
                        service_account_id: (0, utils_1.readEnv)('ANTHROPIC_SERVICE_ACCOUNT_ID'),
                        identity_token: identityTokenFile ? { source: 'file', path: identityTokenFile } : undefined,
                        scope: (0, utils_1.readEnv)('ANTHROPIC_SCOPE'),
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
    config.organization_id ?? (config.organization_id = (0, utils_1.readEnv)('ANTHROPIC_ORGANIZATION_ID'));
    config.workspace_id ?? (config.workspace_id = (0, utils_1.readEnv)('ANTHROPIC_WORKSPACE_ID'));
    config.base_url ?? (config.base_url = (0, utils_1.readEnv)('ANTHROPIC_BASE_URL'));
    (_a = config.authentication).scope ?? (_a.scope = (0, utils_1.readEnv)('ANTHROPIC_SCOPE'));
    if (config.authentication.type === 'oidc_federation') {
        if (!config.authentication.identity_token) {
            const identityTokenFile = (0, utils_1.readEnv)('ANTHROPIC_IDENTITY_TOKEN_FILE');
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
            config.authentication.federation_rule_id = (0, utils_1.readEnv)('ANTHROPIC_FEDERATION_RULE_ID') ?? '';
        }
        (_b = config.authentication).service_account_id ?? (_b.service_account_id = (0, utils_1.readEnv)('ANTHROPIC_SERVICE_ACCOUNT_ID'));
    }
    return { config, fromFile: true };
};
exports.loadConfigWithSource = loadConfigWithSource;
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
const loadCredentials = async () => {
    const config = await (0, exports.loadConfig)();
    const credentialsPath = await (0, exports.getCredentialsPath)(config);
    if (!credentialsPath) {
        return null;
    }
    const { fs } = await Promise.resolve().then(() => __importStar(require("../internal/node.js")));
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
exports.loadCredentials = loadCredentials;
/**
 * Resolves the credentials file path for the given config.
 *
 * Uses `authentication.credentials_path` from the config if set, otherwise
 * falls back to `<config_dir>/credentials/<profile>.json`.
 *
 * Returns `null` when running in a browser or the path cannot be resolved.
 */
const getCredentialsPath = async (config, profile) => {
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
    const { path } = await Promise.resolve().then(() => __importStar(require("../internal/node.js")));
    return path.join(rootConfigPath, 'credentials', `${profileName}.json`);
};
exports.getCredentialsPath = getCredentialsPath;
const getRootConfigPath = async () => {
    if (!supportsLocalConfigFiles()) {
        return null;
    }
    const { path } = await Promise.resolve().then(() => __importStar(require("../internal/node.js")));
    // ANTHROPIC_CONFIG_DIR is treated as a trusted path: it is set by the
    // process operator, not by remote input, so it is not validated.
    const configDir = (0, utils_1.readEnv)('ANTHROPIC_CONFIG_DIR');
    if (configDir) {
        return configDir;
    }
    const os = (0, detect_platform_1.getPlatformHeaders)()['X-Stainless-OS'];
    if (os === 'Windows') {
        const appData = (0, utils_1.readEnv)('APPDATA');
        if (appData) {
            return path.join(appData, 'Anthropic');
        }
        const userProfile = (0, utils_1.readEnv)('USERPROFILE');
        if (userProfile) {
            return path.join(userProfile, 'AppData', 'Roaming', 'Anthropic');
        }
        // No usable Windows config root — return null so callers fall through to
        // "no config available" rather than silently writing under C:\.
        return null;
    }
    const xdgConfigHome = (0, utils_1.readEnv)('XDG_CONFIG_HOME');
    if (xdgConfigHome) {
        return path.join(xdgConfigHome, 'anthropic');
    }
    const home = (0, utils_1.readEnv)('HOME');
    if (home) {
        return path.join(home, '.config', 'anthropic');
    }
    return null;
};
const supportsLocalConfigFiles = () => {
    const runtime = (0, detect_platform_1.getPlatformHeaders)()['X-Stainless-Runtime'];
    return runtime === 'node' || runtime === 'deno';
};
const getActiveProfileName = async () => {
    const rootConfigPath = await getRootConfigPath();
    if (!rootConfigPath) {
        return null;
    }
    const profileName = (0, utils_1.readEnv)('ANTHROPIC_PROFILE');
    if (profileName) {
        return profileName;
    }
    const { fs, path } = await Promise.resolve().then(() => __importStar(require("../internal/node.js")));
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
//# sourceMappingURL=credentials.js.map