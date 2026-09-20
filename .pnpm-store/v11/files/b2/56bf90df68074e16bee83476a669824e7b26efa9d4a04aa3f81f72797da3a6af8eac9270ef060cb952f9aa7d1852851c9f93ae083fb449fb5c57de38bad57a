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
exports.userOAuthProvider = userOAuthProvider;
const credentials_1 = require("../../core/credentials.js");
const types_1 = require("./types.js");
const time_1 = require("../../internal/utils/time.js");
const version_1 = require("../../version.js");
/**
 * Reads a user-oauth credential file. Returns the cached access token while
 * fresh; on expiry performs a `refresh_token` grant and writes the new
 * tokens back to the credentials file (atomic replace, fsync'd).
 *
 * If `clientId` is empty, the access token is treated as static — the
 * credentials file is read on every call but no refresh is attempted, and
 * an expired token without a `refresh_token` raises.
 */
function userOAuthProvider(config) {
    return async (opts) => {
        const { fs } = await Promise.resolve().then(() => __importStar(require("../../internal/node.js")));
        await (0, types_1.checkCredentialsFileSafety)(config.credentialsPath, config.onSafetyWarning);
        let raw;
        try {
            raw = await fs.promises.readFile(config.credentialsPath, 'utf-8');
        }
        catch (err) {
            throw new types_1.WorkloadIdentityError(`Credentials file not found at ${config.credentialsPath}: ${err}`);
        }
        let creds;
        try {
            creds = JSON.parse(raw);
        }
        catch (err) {
            throw new types_1.WorkloadIdentityError(`Credentials file at ${config.credentialsPath} is not valid JSON: ${err}`);
        }
        const accessToken = creds.access_token;
        if (!accessToken) {
            throw new types_1.WorkloadIdentityError(`Credentials file at ${config.credentialsPath} must include 'access_token'`);
        }
        // Return cached token if still fresh (or no expiry info), unless the
        // caller is forcing a refresh after a 401 — then go straight to refresh
        // even if the file's expires_at still looks valid.
        const expiresAt = creds.expires_at;
        if (!opts?.forceRefresh &&
            (expiresAt == null || (0, time_1.nowAsSeconds)() < expiresAt - types_1.MANDATORY_REFRESH_THRESHOLD_IN_SECONDS)) {
            return { token: accessToken, expiresAt: expiresAt ?? null };
        }
        const refreshToken = creds.refresh_token;
        if (!config.clientId || !refreshToken) {
            throw new types_1.WorkloadIdentityError(`Access token at ${config.credentialsPath} has expired and no refresh is available ` +
                `(client_id ${config.clientId ? 'set' : 'empty'}, refresh_token ${refreshToken ? 'set' : 'empty'})`);
        }
        (0, types_1.requireSecureTokenEndpoint)(config.baseURL);
        const body = {
            grant_type: types_1.GRANT_TYPE_REFRESH_TOKEN,
            refresh_token: refreshToken,
            client_id: config.clientId,
        };
        const url = `${config.baseURL}${types_1.TOKEN_ENDPOINT}`;
        let resp;
        try {
            resp = await config.fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'anthropic-beta': types_1.OAUTH_API_BETA_HEADER,
                    'User-Agent': config.userAgent || `anthropic-sdk-typescript/${version_1.VERSION} userOAuthProvider`,
                },
                body: JSON.stringify(body),
            });
        }
        catch (err) {
            throw new types_1.WorkloadIdentityError(`User OAuth refresh failed to reach token endpoint: ${err}`);
        }
        const requestId = resp.headers.get('Request-Id');
        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new types_1.WorkloadIdentityError(`User OAuth refresh failed (HTTP ${resp.status}): ${(0, types_1.redactSensitive)(text)}`, resp.status, (0, types_1.redactSensitive)(text), requestId);
        }
        const data = await (0, types_1.parseTokenResponse)(resp, requestId);
        const expiresIn = Number(data.expires_in);
        if (!Number.isFinite(expiresIn)) {
            throw new types_1.WorkloadIdentityError(`User OAuth refresh response missing or invalid expires_in: ${JSON.stringify((0, types_1.redactSensitive)(data))}`, resp.status, (0, types_1.redactSensitive)(data), requestId);
        }
        const newExpiresAt = (0, time_1.nowAsSeconds)() + expiresIn;
        const newRefreshToken = data.refresh_token || refreshToken;
        await (0, types_1.writeCredentialsFileAtomic)(config.credentialsPath, {
            ...creds,
            version: credentials_1.CREDENTIALS_FILE_VERSION,
            type: 'oauth_token',
            access_token: data.access_token,
            expires_at: newExpiresAt,
            refresh_token: newRefreshToken,
        });
        return { token: data.access_token, expiresAt: newExpiresAt };
    };
}
//# sourceMappingURL=user-oauth.js.map