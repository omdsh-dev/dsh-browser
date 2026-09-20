import type { Endpoint, EndpointParameters, EndpointV2, Logger, Provider, UrlParser } from "@smithy/types";
import type { GetEndpointFromConfig } from "./adaptors/getEndpointFromInstructions";
/**
 * Endpoint config interfaces and resolver for Endpoint v2. They live in separate package to allow per-service onboarding.
 * When all services onboard Endpoint v2, the resolver in config-resolver package can be removed.
 * This interface includes all the endpoint parameters with built-in bindings of "AWS::*" and "SDK::*"
 *
 * @public
 */
export interface EndpointInputConfig<T extends EndpointParameters = EndpointParameters> {
    /**
     * The fully qualified endpoint of the webservice. This is only for using
     * a custom endpoint (for example, when using a local version of S3).
     *
     * Endpoint transformations such as S3 applying a bucket to the hostname are
     * still applicable to this custom endpoint.
     */
    endpoint?: string | Endpoint | Provider<Endpoint> | EndpointV2 | Provider<EndpointV2>;
    /**
     * Providing a custom endpointProvider will override
     * built-in transformations of the endpoint such as S3 adding the bucket
     * name to the hostname, since they are part of the default endpointProvider.
     */
    endpointProvider?: (params: T, context?: {
        logger?: Logger;
    }) => EndpointV2;
    /**
     * Whether TLS is enabled for requests.
     * @deprecated
     */
    tls?: boolean;
    /**
     * Enables IPv6/IPv4 dualstack endpoint.
     */
    useDualstackEndpoint?: boolean | Provider<boolean | undefined>;
    /**
     * Enables FIPS compatible endpoints.
     */
    useFipsEndpoint?: boolean | Provider<boolean | undefined>;
    /**
     * When true, endpoint URLs from environment variables and the shared
     * configuration file are not used. Does not affect endpoints set
     * via code (e.g. client constructor endpoint option).
     *
     * Default false.
     */
    ignoreConfiguredEndpointUrls?: boolean;
    /**
     * This field is used internally so you should not fill any value to this field.
     *
     * @internal
     */
    serviceConfiguredEndpoint?: never;
}
/**
 * @internal
 */
export interface PreviouslyResolved<T extends EndpointParameters = EndpointParameters> {
    urlParser: UrlParser;
    endpointProvider: (params: T, context?: {
        logger?: Logger;
    }) => EndpointV2;
    logger?: Logger;
    serviceId?: string;
}
/**
 * This supersedes the similarly named EndpointsResolvedConfig (no parametric types)
 * from resolveEndpointsConfig.ts in \@smithy/config-resolver.
 *
 * @internal
 */
export interface EndpointResolvedConfig<T extends EndpointParameters = EndpointParameters> {
    /**
     * Custom endpoint provided by the user.
     * This is normalized to a single interface from the various acceptable types.
     * This field will be undefined if a custom endpoint is not provided.
     */
    endpoint?: Provider<Endpoint>;
    endpointProvider: (params: T, context?: {
        logger?: Logger;
    }) => EndpointV2;
    /**
     * Whether TLS is enabled for requests.
     * @deprecated
     */
    tls: boolean;
    /**
     * Whether the endpoint is specified by caller.
     * This should be used over checking the existence of `endpoint`, since
     * that may have been set by other means, such as the default regional
     * endpoint provider function.
     *
     * @internal
     */
    isCustomEndpoint?: boolean;
    /**
     * Resolved value for input {@link EndpointsInputConfig.useDualstackEndpoint}
     */
    useDualstackEndpoint: Provider<boolean>;
    /**
     * Resolved value for input {@link EndpointsInputConfig.useFipsEndpoint}
     */
    useFipsEndpoint: Provider<boolean>;
    /**
     * Unique service identifier.
     * @internal
     */
    serviceId?: string;
    /**
     * Whether configured endpoint URLs should be ignored.
     */
    ignoreConfiguredEndpointUrls: boolean;
    /**
     * A configured endpoint global or specific to the service from ENV or AWS SDK configuration files.
     * @internal
     */
    serviceConfiguredEndpoint?: Provider<string | undefined>;
}
/**
 * @internal
 */
export declare function bindResolveEndpointConfig(getEndpointFromConfig: GetEndpointFromConfig): <T, P extends EndpointParameters = EndpointParameters>(input: T & EndpointInputConfig<P> & PreviouslyResolved<P>) => T & EndpointResolvedConfig<P>;
