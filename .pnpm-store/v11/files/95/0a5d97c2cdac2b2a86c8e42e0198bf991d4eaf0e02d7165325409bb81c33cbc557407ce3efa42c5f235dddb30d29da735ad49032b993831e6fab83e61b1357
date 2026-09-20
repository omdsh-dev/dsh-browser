import type { Fetch } from "../../internal/builtin-types.mjs";
import { type AnthropicConfig } from "../../core/credentials.mjs";
import type { CredentialResult } from "./types.mjs";
/**
 * Builds a {@link CredentialResult} from an explicit {@link AnthropicConfig}.
 *
 * Use this when constructing a client from an in-memory config object rather
 * than from profile files or environment variables.
 *
 * For `oidc_federation`, `authentication.credentials_path` is optional —
 * if omitted, every call performs a fresh exchange with no on-disk cache.
 * For `user_oauth`, `authentication.credentials_path` is required (it is
 * where the access/refresh tokens live).
 */
export type ResolverOptions = {
    baseURL: string;
    fetch: Fetch;
    userAgent?: string | undefined;
    onCacheWriteError?: ((err: unknown) => void) | undefined;
    onSafetyWarning?: ((msg: string) => void) | undefined;
};
export declare function resolveCredentialsFromConfig(config: AnthropicConfig, options: ResolverOptions): CredentialResult;
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
export declare function defaultCredentials(options: ResolverOptions, profile?: string): Promise<CredentialResult | null>;
//# sourceMappingURL=credential-chain.d.mts.map