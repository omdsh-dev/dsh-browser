import { normalizeProvider } from "@smithy/core/transport";
import { toEndpointV1 } from "./adaptors/toEndpointV1";
export function bindResolveEndpointConfig(getEndpointFromConfig) {
    return (input) => {
        const tls = input.tls ?? true;
        const { endpoint, useDualstackEndpoint, useFipsEndpoint } = input;
        const customEndpointProvider = endpoint != null ? async () => toEndpointV1(await normalizeProvider(endpoint)()) : undefined;
        const isCustomEndpoint = !!endpoint;
        const resolvedConfig = Object.assign(input, {
            endpoint: customEndpointProvider,
            tls,
            isCustomEndpoint,
            useDualstackEndpoint: normalizeProvider(useDualstackEndpoint ?? false),
            useFipsEndpoint: normalizeProvider(useFipsEndpoint ?? false),
            ignoreConfiguredEndpointUrls: !!input.ignoreConfiguredEndpointUrls,
        });
        let configuredEndpointPromise = undefined;
        resolvedConfig.serviceConfiguredEndpoint = async () => {
            if (input.serviceId && !configuredEndpointPromise) {
                configuredEndpointPromise = getEndpointFromConfig(input.serviceId);
            }
            return configuredEndpointPromise;
        };
        return resolvedConfig;
    };
}
