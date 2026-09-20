import { normalizeProvider } from "@smithy/core/client";
import { AdaptiveRetryStrategy } from "../util-retry/AdaptiveRetryStrategy";
import { StandardRetryStrategy } from "../util-retry/StandardRetryStrategy";
import { DEFAULT_MAX_ATTEMPTS, DEFAULT_RETRY_MODE, RETRY_MODES } from "../util-retry/config";
import { Retry } from "../util-retry/retries-2026-config";
export const ENV_MAX_ATTEMPTS = "AWS_MAX_ATTEMPTS";
export const CONFIG_MAX_ATTEMPTS = "max_attempts";
export const NODE_MAX_ATTEMPT_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => {
        const value = env[ENV_MAX_ATTEMPTS];
        if (!value)
            return undefined;
        const maxAttempt = parseInt(value);
        if (Number.isNaN(maxAttempt)) {
            throw new Error(`Environment variable ${ENV_MAX_ATTEMPTS} mast be a number, got "${value}"`);
        }
        return maxAttempt;
    },
    configFileSelector: (profile) => {
        const value = profile[CONFIG_MAX_ATTEMPTS];
        if (!value)
            return undefined;
        const maxAttempt = parseInt(value);
        if (Number.isNaN(maxAttempt)) {
            throw new Error(`Shared config file entry ${CONFIG_MAX_ATTEMPTS} mast be a number, got "${value}"`);
        }
        return maxAttempt;
    },
    default: DEFAULT_MAX_ATTEMPTS,
};
export const resolveRetryConfig = (input, defaults) => {
    const { retryStrategy, retryMode } = input;
    const { defaultMaxAttempts = DEFAULT_MAX_ATTEMPTS, defaultBaseDelay = Retry.delay() } = defaults ?? {};
    const maxAttemptsProvider = normalizeProvider(input.maxAttempts ?? defaultMaxAttempts);
    let controller = retryStrategy
        ? Promise.resolve(retryStrategy)
        : undefined;
    const getDefault = async () => {
        const maxAttempts = await maxAttemptsProvider();
        const adaptive = (await normalizeProvider(retryMode)()) === RETRY_MODES.ADAPTIVE;
        if (adaptive) {
            return new AdaptiveRetryStrategy(maxAttemptsProvider, {
                maxAttempts,
                baseDelay: defaultBaseDelay,
            });
        }
        return new StandardRetryStrategy({
            maxAttempts,
            baseDelay: defaultBaseDelay,
        });
    };
    return Object.assign(input, {
        maxAttempts: maxAttemptsProvider,
        retryStrategy: () => (controller ??= getDefault()),
    });
};
export const ENV_RETRY_MODE = "AWS_RETRY_MODE";
export const CONFIG_RETRY_MODE = "retry_mode";
export const NODE_RETRY_MODE_CONFIG_OPTIONS = {
    environmentVariableSelector: (env) => env[ENV_RETRY_MODE],
    configFileSelector: (profile) => profile[CONFIG_RETRY_MODE],
    default: DEFAULT_RETRY_MODE,
};
