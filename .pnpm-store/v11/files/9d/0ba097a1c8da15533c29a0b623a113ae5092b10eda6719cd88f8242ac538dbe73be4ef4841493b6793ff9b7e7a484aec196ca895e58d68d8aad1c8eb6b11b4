import { loadConfig } from "@smithy/core/config";
import { getEndpointUrlConfig } from "./getEndpointUrlConfig";
import { ignoreConfiguredEndpointUrlsConfigSelectors } from "./getIgnoreConfiguredEndpointUrls";
export const getEndpointFromConfig = async (serviceId) => {
    const ignore = await loadConfig(ignoreConfiguredEndpointUrlsConfigSelectors)();
    if (ignore) {
        return undefined;
    }
    return loadConfig(getEndpointUrlConfig(serviceId ?? ""))();
};
