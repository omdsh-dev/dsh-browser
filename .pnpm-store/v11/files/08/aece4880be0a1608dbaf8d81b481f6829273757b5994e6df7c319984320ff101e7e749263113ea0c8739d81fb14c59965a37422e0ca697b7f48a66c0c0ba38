import { AnthropicError } from "../../core/error.mjs";
/**
 * Reads a JWT from a file on every call. Supports automatic rotation
 * (e.g. Kubernetes projected service-account tokens).
 */
export function identityTokenFromFile(path) {
    if (!path) {
        throw new AnthropicError('Identity token file path is empty');
    }
    return async () => {
        const { fs } = await import("../../internal/node.mjs");
        let content;
        try {
            content = await fs.promises.readFile(path, 'utf-8');
        }
        catch (err) {
            throw new AnthropicError(`Failed to read identity token file at ${path}: ${err}`);
        }
        const token = content.trim();
        if (!token) {
            throw new AnthropicError(`Identity token file at ${path} is empty`);
        }
        return token;
    };
}
/**
 * Wraps a static JWT string as an {@link IdentityTokenProvider}.
 */
export function identityTokenFromValue(token) {
    if (!token) {
        throw new AnthropicError('Identity token value is empty');
    }
    return () => token;
}
//# sourceMappingURL=identity-token.mjs.map