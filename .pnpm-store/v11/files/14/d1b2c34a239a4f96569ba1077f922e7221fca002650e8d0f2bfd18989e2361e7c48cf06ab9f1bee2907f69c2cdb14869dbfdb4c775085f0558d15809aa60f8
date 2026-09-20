import { parseUrl } from "./parseUrl";
export const toEndpointV1 = (endpoint) => {
    if (typeof endpoint === "object") {
        if ("url" in endpoint) {
            const v1Endpoint = parseUrl(endpoint.url);
            if (endpoint.headers) {
                v1Endpoint.headers = {};
                for (const name in endpoint.headers) {
                    v1Endpoint.headers[name.toLowerCase()] = endpoint.headers[name].join(", ");
                }
            }
            return v1Endpoint;
        }
        return endpoint;
    }
    return parseUrl(endpoint);
};
