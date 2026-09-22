import type { DefaultExtensionConfiguration } from "@smithy/types";
import { type PartialChecksumRuntimeConfigType } from "./checksum";
import { type PartialRetryRuntimeConfigType } from "./retry";
/**
 * @internal
 */
export type DefaultExtensionRuntimeConfigType = PartialRetryRuntimeConfigType & PartialChecksumRuntimeConfigType;
/**
 * Helper function to resolve default extension configuration from runtime config
 *
 * @internal
 */
export declare const getDefaultExtensionConfiguration: (runtimeConfig: DefaultExtensionRuntimeConfigType) => {
    addChecksumAlgorithm(algo: import("@smithy/types").ChecksumAlgorithm): void;
    checksumAlgorithms(): import("@smithy/types").ChecksumAlgorithm[];
} & {
    setRetryStrategy(retryStrategy: import("@smithy/types").Provider<import("@smithy/types").RetryStrategyV2 | import("@smithy/types").RetryStrategy>): void;
    retryStrategy(): import("@smithy/types").Provider<import("@smithy/types").RetryStrategyV2 | import("@smithy/types").RetryStrategy>;
};
/**
 * Helper function to resolve default extension configuration from runtime config
 *
 * @internal
 * @deprecated use getDefaultExtensionConfiguration
 */
export declare const getDefaultClientConfiguration: typeof getDefaultExtensionConfiguration;
/**
 * Helper function to resolve runtime config from default extension configuration
 *
 * @internal
 */
export declare const resolveDefaultRuntimeConfig: (config: DefaultExtensionConfiguration) => DefaultExtensionRuntimeConfigType;
