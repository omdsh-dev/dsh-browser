import { getHostHeaderPlugin, getLoggerPlugin, getRecursionDetectionPlugin, getUserAgentPlugin, resolveHostHeaderConfig, resolveUserAgentConfig, } from "@aws-sdk/core/client";
import { resolveEventStreamConfig, } from "@aws-sdk/middleware-eventstream";
import { resolveWebSocketConfig, } from "@aws-sdk/middleware-websocket";
import { DefaultIdentityProviderConfig, getHttpAuthSchemeEndpointRuleSetPlugin, getHttpSigningPlugin, } from "@smithy/core";
import { Client as __Client, } from "@smithy/core/client";
import { resolveRegionConfig } from "@smithy/core/config";
import { resolveEndpointConfig } from "@smithy/core/endpoints";
import { resolveEventStreamSerdeConfig, } from "@smithy/core/event-streams";
import { getContentLengthPlugin } from "@smithy/core/protocols";
import { getRetryPlugin, resolveRetryConfig, } from "@smithy/core/retry";
import { getSchemaSerdePlugin } from "@smithy/core/schema";
import { defaultBedrockRuntimeHttpAuthSchemeParametersProvider, resolveHttpAuthSchemeConfig, } from "./auth/httpAuthSchemeProvider";
import { resolveClientEndpointParameters, } from "./endpoint/EndpointParameters";
import { getRuntimeConfig as __getRuntimeConfig } from "./runtimeConfig";
import { resolveRuntimeExtensions } from "./runtimeExtensions";
export { __Client };
export class BedrockRuntimeClient extends __Client {
    config;
    constructor(...[configuration]) {
        const _config_0 = __getRuntimeConfig(configuration || {});
        super(_config_0);
        this.initConfig = _config_0;
        const _config_1 = resolveClientEndpointParameters(_config_0);
        const _config_2 = resolveUserAgentConfig(_config_1);
        const _config_3 = resolveRetryConfig(_config_2);
        const _config_4 = resolveRegionConfig(_config_3);
        const _config_5 = resolveHostHeaderConfig(_config_4);
        const _config_6 = resolveEndpointConfig(_config_5);
        const _config_7 = resolveEventStreamSerdeConfig(_config_6);
        const _config_8 = resolveHttpAuthSchemeConfig(_config_7);
        const _config_9 = resolveEventStreamConfig(_config_8);
        const _config_10 = resolveWebSocketConfig(_config_9);
        const _config_11 = resolveRuntimeExtensions(_config_10, configuration?.extensions || []);
        this.config = _config_11;
        this.middlewareStack.use(getSchemaSerdePlugin(this.config));
        this.middlewareStack.use(getUserAgentPlugin(this.config));
        this.middlewareStack.use(getRetryPlugin(this.config));
        this.middlewareStack.use(getContentLengthPlugin(this.config));
        this.middlewareStack.use(getHostHeaderPlugin(this.config));
        this.middlewareStack.use(getLoggerPlugin(this.config));
        this.middlewareStack.use(getRecursionDetectionPlugin(this.config));
        this.middlewareStack.use(getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
            httpAuthSchemeParametersProvider: defaultBedrockRuntimeHttpAuthSchemeParametersProvider,
            identityProviderConfigProvider: async (config) => new DefaultIdentityProviderConfig({
                "aws.auth#sigv4": config.credentials,
                "smithy.api#httpBearerAuth": config.token,
            }),
        }));
        this.middlewareStack.use(getHttpSigningPlugin(this.config));
    }
    destroy() {
        super.destroy();
    }
}
