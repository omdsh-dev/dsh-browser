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
exports.resolveCredentialsFromConfig = resolveCredentialsFromConfig;
exports.defaultCredentials = defaultCredentials;
const env_1 = require("../../internal/utils/env.js");
const credentials_1 = require("../../core/credentials.js");
const types_1 = require("./types.js");
const time_1 = require("../../internal/utils/time.js");
const identity_token_1 = require("./identity-token.js");
const oidc_federation_1 = require("./oidc-federation.js");
const user_oauth_1 = require("./user-oauth.js");
function resolveCredentialsFromConfig(config, options) {
    const credentialsPath = config.authentication.credentials_path ?? null;
    const effectiveBaseURL = (config.base_url || options.baseURL).replace(/\/+$/, '');
    const provider = buildProvider(config, credentialsPath, effectiveBaseURL, options);
    const extraHeaders = {};
    // For federation profiles workspace_id is sent in the jwt-bearer exchange
    // body, not as a request header (the minted token is already
    // workspace-scoped, so the header would be ignored).
    if (config.workspace_id && config.authentication.type === 'user_oauth') {
        extraHeaders['anthropic-workspace-id'] = config.workspace_id;
    }
    // Surface the profile's own base_url (not the options.baseURL fallback) so
    // the client can adopt it for outbound API requests when the caller didn't
    // pin one explicitly. Echoing options.baseURL back would defeat precedence.
    return { provider, extraHeaders, baseURL: config.base_url || undefined };
}
/**
 * Resolves a {@link CredentialResult} from the environment. Returns `null`
 * when no credentials can be resolved.
 *
 * Resolution order:
 *
 *   1. Config file for the active profile (or the explicit `profile` argument)
 *      → dispatch on `authentication.type` (`oidc_federation`, `user_oauth`)
 *   2. Environment variables `ANTHROPIC_FEDERATION_RULE_ID` +
 *      `ANTHROPIC_ORGANIZATION_ID` (+ identity token) → OIDC federation
 *   3. Nothing matches → `null`
 *
 * Passing `profile` selects `<config_dir>/configs/<profile>.json` directly,
 * skipping `ANTHROPIC_PROFILE` / `active_config` resolution.
 */
async function defaultCredentials(options, profile) {
    const loaded = await (0, credentials_1.loadConfigWithSource)(profile);
    if (!loaded) {
        return null;
    }
    const { config, fromFile } = loaded;
    // For file-loaded configs, default credentials_path to the per-profile
    // location so user_oauth and federation caching work. Shallow-clone first
    // so callers that retain a reference to the loaded config don't observe the
    // patched-in default.
    //
    // Env-only credentials (no profile file on disk) skip the disk cache —
    // matching the other SDKs. A disk cache keyed by profile path would
    // re-serve a stale token after a change to ANTHROPIC_WORKSPACE_ID (or
    // ANTHROPIC_ORGANIZATION_ID / ANTHROPIC_FEDERATION_RULE_ID) until the
    // cached token expired, so the env-only chain stays in-memory only.
    const withPath = config.authentication.credentials_path || !fromFile ?
        config
        : {
            ...config,
            authentication: {
                ...config.authentication,
                credentials_path: (await (0, credentials_1.getCredentialsPath)(config, profile)) ?? undefined,
            },
        };
    return resolveCredentialsFromConfig(withPath, options);
}
function buildProvider(config, credentialsPath, baseURL, options) {
    switch (config.authentication.type) {
        case 'oidc_federation': {
            const auth = config.authentication;
            const identityProvider = resolveIdentityTokenProvider(auth);
            if (!identityProvider) {
                throw new types_1.WorkloadIdentityError('oidc_federation config requires an identity token (set authentication.identity_token, ' +
                    'ANTHROPIC_IDENTITY_TOKEN_FILE, or ANTHROPIC_IDENTITY_TOKEN)');
            }
            if (!auth.federation_rule_id) {
                throw new types_1.WorkloadIdentityError("oidc_federation config requires 'federation_rule_id'. Set it in authentication.federation_rule_id in your profile, or via ANTHROPIC_FEDERATION_RULE_ID (profile takes precedence).");
            }
            if (!config.organization_id) {
                throw new types_1.WorkloadIdentityError('oidc_federation config requires organization_id (set ANTHROPIC_ORGANIZATION_ID or config.organization_id)');
            }
            const exchange = (0, oidc_federation_1.oidcFederationProvider)({
                identityTokenProvider: identityProvider,
                federationRuleId: auth.federation_rule_id,
                organizationId: config.organization_id,
                serviceAccountId: auth.service_account_id,
                workspaceId: config.workspace_id,
                baseURL,
                fetch: options.fetch,
                userAgent: options.userAgent,
            });
            // If there's a credentials file path, wrap the exchange with file caching
            // (check file for fresh token before exchanging, write back after).
            if (credentialsPath) {
                return cachedExchangeProvider(exchange, credentialsPath, options.onCacheWriteError, options.onSafetyWarning);
            }
            return exchange;
        }
        case 'user_oauth': {
            if (!credentialsPath) {
                throw new types_1.WorkloadIdentityError('user_oauth config requires authentication.credentials_path ' +
                    '(or load via a profile so it defaults to <config_dir>/credentials/<profile>.json)');
            }
            return (0, user_oauth_1.userOAuthProvider)({
                credentialsPath,
                clientId: config.authentication.client_id,
                baseURL,
                fetch: options.fetch,
                userAgent: options.userAgent,
                onSafetyWarning: options.onSafetyWarning,
            });
        }
        default: {
            const t = config.authentication.type;
            throw new types_1.WorkloadIdentityError(`authentication.type "${t}" is not a known authentication type`);
        }
    }
}
/**
 * Resolves the identity token provider from config fields or environment variables.
 *
 * Resolution order:
 *   1. `identity_token.path` from the config (source: "file")
 *   2. `ANTHROPIC_IDENTITY_TOKEN_FILE` env var
 *   3. `ANTHROPIC_IDENTITY_TOKEN` env var (static value)
 */
function resolveIdentityTokenProvider(auth) {
    if (auth.identity_token) {
        // Cast needed to stringify an unknown source value for the error message:
        // the on-disk JSON may contain a source this SDK version doesn't know about.
        const source = auth.identity_token.source;
        if (source !== 'file') {
            throw new types_1.WorkloadIdentityError(`identity_token.source "${source}" is not supported by this SDK version (only "file")`);
        }
        if (!auth.identity_token.path) {
            throw new types_1.WorkloadIdentityError(`identity_token.source "file" requires a non-empty path`);
        }
        return (0, identity_token_1.identityTokenFromFile)(auth.identity_token.path);
    }
    const tokenFile = (0, env_1.readEnv)('ANTHROPIC_IDENTITY_TOKEN_FILE');
    if (tokenFile) {
        return (0, identity_token_1.identityTokenFromFile)(tokenFile);
    }
    const tokenValue = (0, env_1.readEnv)('ANTHROPIC_IDENTITY_TOKEN');
    if (tokenValue) {
        return (0, identity_token_1.identityTokenFromValue)(tokenValue);
    }
    return null;
}
/**
 * Wraps a federation exchange provider with credential file caching.
 * Checks the file for a fresh token before exchanging, and writes the
 * result back after a successful exchange (best-effort, atomic replace).
 *
 * Note: this is not cross-process serialized — two SDK instances that
 * miss the cache simultaneously will both perform a full exchange and
 * the last writer wins. That is acceptable: federation exchanges are
 * idempotent and the cache is an optimization, not a correctness gate.
 */
function cachedExchangeProvider(exchange, credentialsPath, onCacheWriteError, onSafetyWarning) {
    return async (opts) => {
        const { fs } = await Promise.resolve().then(() => __importStar(require("../../internal/node.js")));
        await (0, types_1.checkCredentialsFileSafety)(credentialsPath, onSafetyWarning);
        // Try cached credentials file
        let existing;
        try {
            const raw = await fs.promises.readFile(credentialsPath, 'utf-8');
            existing = JSON.parse(raw);
            const token = existing?.['access_token'];
            if (token && !opts?.forceRefresh) {
                const expiresAt = existing?.['expires_at'];
                if (expiresAt == null || (0, time_1.nowAsSeconds)() < expiresAt - types_1.MANDATORY_REFRESH_THRESHOLD_IN_SECONDS) {
                    return { token, expiresAt: expiresAt ?? null };
                }
            }
        }
        catch (err) {
            // ENOENT or invalid-JSON → no usable cache, exchange fresh. Other
            // errors (EACCES, EISDIR, …) indicate a broken cache path; surface to
            // the optional hook so they're at least debuggable, then proceed.
            const code = err?.code;
            if (code !== 'ENOENT' && !(err instanceof SyntaxError)) {
                onCacheWriteError?.(err);
            }
        }
        // Exchange for a new token
        const result = await exchange(opts);
        // Write cache back (best-effort). Preserve any unknown keys from the
        // existing file (notably refresh_token, in the unlikely case this path
        // is shared with a user_oauth profile) so the federation cache writer
        // doesn't clobber material it didn't own.
        try {
            await (0, types_1.writeCredentialsFileAtomic)(credentialsPath, {
                ...(existing ?? {}),
                version: credentials_1.CREDENTIALS_FILE_VERSION,
                type: 'oauth_token',
                access_token: result.token,
                expires_at: result.expiresAt,
            });
        }
        catch (err) {
            // Best-effort caching: surface to the optional hook but never fail
            // the exchange itself.
            onCacheWriteError?.(err);
        }
        return result;
    };
}
//# sourceMappingURL=credential-chain.js.map