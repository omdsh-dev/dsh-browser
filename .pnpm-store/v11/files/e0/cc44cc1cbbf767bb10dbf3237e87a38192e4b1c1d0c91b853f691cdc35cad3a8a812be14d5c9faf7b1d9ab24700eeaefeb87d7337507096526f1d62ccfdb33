import { booleanSelector, SelectorType } from "@smithy/core/config";
export const ENV_IGNORE_CONFIGURED_ENDPOINT_URLS = "AWS_IGNORE_CONFIGURED_ENDPOINT_URLS";
export const CONFIG_IGNORE_CONFIGURED_ENDPOINT_URLS = "ignore_configured_endpoint_urls";
export const ignoreConfiguredEndpointUrlsConfigSelectors = {
    environmentVariableSelector: (env) => booleanSelector(env, ENV_IGNORE_CONFIGURED_ENDPOINT_URLS, SelectorType.ENV),
    configFileSelector: (profile) => booleanSelector(profile, CONFIG_IGNORE_CONFIGURED_ENDPOINT_URLS, SelectorType.CONFIG),
    default: false,
};
