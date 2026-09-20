import { normalizeProvider } from "@smithy/core/client";
import { getEndpointFromRegion } from "./utils/getEndpointFromRegion";
export const resolveEndpointsConfig = (input) => {
    const useDualstackEndpoint = normalizeProvider(input.useDualstackEndpoint ?? false);
    const { endpoint, useFipsEndpoint, urlParser, tls } = input;
    return Object.assign(input, {
        tls: tls ?? true,
        endpoint: endpoint
            ? normalizeProvider(typeof endpoint === "string" ? urlParser(endpoint) : endpoint)
            : () => getEndpointFromRegion({ ...input, useDualstackEndpoint, useFipsEndpoint }),
        isCustomEndpoint: !!endpoint,
        useDualstackEndpoint,
    });
};
