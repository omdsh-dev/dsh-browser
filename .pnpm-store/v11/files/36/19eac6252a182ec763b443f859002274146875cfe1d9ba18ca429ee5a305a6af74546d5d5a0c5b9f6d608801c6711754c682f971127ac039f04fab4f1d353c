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
exports.identityTokenFromFile = identityTokenFromFile;
exports.identityTokenFromValue = identityTokenFromValue;
const error_1 = require("../../core/error.js");
/**
 * Reads a JWT from a file on every call. Supports automatic rotation
 * (e.g. Kubernetes projected service-account tokens).
 */
function identityTokenFromFile(path) {
    if (!path) {
        throw new error_1.AnthropicError('Identity token file path is empty');
    }
    return async () => {
        const { fs } = await Promise.resolve().then(() => __importStar(require("../../internal/node.js")));
        let content;
        try {
            content = await fs.promises.readFile(path, 'utf-8');
        }
        catch (err) {
            throw new error_1.AnthropicError(`Failed to read identity token file at ${path}: ${err}`);
        }
        const token = content.trim();
        if (!token) {
            throw new error_1.AnthropicError(`Identity token file at ${path} is empty`);
        }
        return token;
    };
}
/**
 * Wraps a static JWT string as an {@link IdentityTokenProvider}.
 */
function identityTokenFromValue(token) {
    if (!token) {
        throw new error_1.AnthropicError('Identity token value is empty');
    }
    return () => token;
}
//# sourceMappingURL=identity-token.js.map