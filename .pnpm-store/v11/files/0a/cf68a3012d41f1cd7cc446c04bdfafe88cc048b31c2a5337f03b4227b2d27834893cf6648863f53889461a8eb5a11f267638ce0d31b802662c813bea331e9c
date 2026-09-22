import type { Logger } from "@smithy/types";
import type { HttpHandler } from "../httpHandler";
/**
 * @internal
 */
export interface HttpHandlerExtensionConfiguration<HandlerConfig extends object = {}> {
    setHttpHandler(handler: HttpHandler<HandlerConfig>): void;
    httpHandler(): HttpHandler<HandlerConfig>;
    updateHttpClientConfig(key: keyof HandlerConfig, value: HandlerConfig[typeof key]): void;
    httpHandlerConfigs(): HandlerConfig;
}
/**
 * @internal
 */
export type HttpHandlerExtensionConfigType<HandlerConfig extends object = {}> = Partial<{
    requestHandler: HttpHandler<HandlerConfig>;
}>;
/**
 * Helper function to resolve default extension configuration from runtime config
 *
 * @internal
 */
export declare const getHttpHandlerExtensionConfiguration: <HandlerConfig extends {
    logger?: Logger;
}>(runtimeConfig: HttpHandlerExtensionConfigType<HandlerConfig> & {
    logger?: Logger;
}) => {
    setHttpHandler(handler: HttpHandler<HandlerConfig>): void;
    httpHandler(): HttpHandler<HandlerConfig>;
    updateHttpClientConfig(key: keyof HandlerConfig, value: HandlerConfig[typeof key]): void;
    httpHandlerConfigs(): HandlerConfig;
};
/**
 * Helper function to resolve runtime config from default extension configuration
 *
 * @internal
 */
export declare const resolveHttpHandlerRuntimeConfig: <HandlerConfig extends object = {}>(httpHandlerExtensionConfiguration: HttpHandlerExtensionConfiguration<HandlerConfig>) => HttpHandlerExtensionConfigType<HandlerConfig>;
