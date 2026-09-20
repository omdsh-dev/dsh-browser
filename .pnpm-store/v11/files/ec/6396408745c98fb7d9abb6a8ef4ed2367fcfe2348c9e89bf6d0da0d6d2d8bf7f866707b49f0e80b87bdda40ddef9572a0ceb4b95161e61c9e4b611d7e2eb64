import { CONFIG_PREFIX_SEPARATOR } from "@smithy/core/config";
export const ENV_ENDPOINT_URL = "AWS_ENDPOINT_URL";
export const CONFIG_ENDPOINT_URL = "endpoint_url";
export const getEndpointUrlConfig = (serviceId) => ({
    environmentVariableSelector: (env) => {
        const serviceSuffixParts = serviceId.split(" ").map((w) => w.toUpperCase());
        const serviceEndpointUrl = env[[ENV_ENDPOINT_URL, ...serviceSuffixParts].join("_")];
        if (serviceEndpointUrl)
            return serviceEndpointUrl;
        const endpointUrl = env[ENV_ENDPOINT_URL];
        if (endpointUrl)
            return endpointUrl;
        return undefined;
    },
    configFileSelector: (profile, config) => {
        if (profile.services) {
            const servicesSectionKey = ["services", profile.services].join(CONFIG_PREFIX_SEPARATOR);
            if (!config || !config[servicesSectionKey]) {
                throw new Error(`The services section "${profile.services}" specified in the profile is not present in the shared configuration file.`);
            }
            const servicesSection = config[servicesSectionKey];
            const servicePrefixParts = serviceId.split(" ").map((w) => w.toLowerCase());
            const endpointUrl = servicesSection[[servicePrefixParts.join("_"), CONFIG_ENDPOINT_URL].join(CONFIG_PREFIX_SEPARATOR)];
            if (endpointUrl)
                return endpointUrl;
        }
        const endpointUrl = profile[CONFIG_ENDPOINT_URL];
        if (endpointUrl)
            return endpointUrl;
        return undefined;
    },
    default: undefined,
});
