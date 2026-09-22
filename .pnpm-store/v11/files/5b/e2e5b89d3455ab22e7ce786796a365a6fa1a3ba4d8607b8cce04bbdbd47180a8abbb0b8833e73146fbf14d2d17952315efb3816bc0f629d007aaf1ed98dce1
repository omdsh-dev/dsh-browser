export const getHttpHandlerExtensionConfiguration = (runtimeConfig) => {
    if (runtimeConfig.logger && runtimeConfig.logger.constructor?.name !== "NoOpLogger") {
        runtimeConfig.requestHandler?.updateHttpClientConfig?.(Symbol.for("logger"), runtimeConfig.logger);
    }
    return {
        setHttpHandler(handler) {
            runtimeConfig.requestHandler = handler;
        },
        httpHandler() {
            return runtimeConfig.requestHandler;
        },
        updateHttpClientConfig(key, value) {
            runtimeConfig.requestHandler?.updateHttpClientConfig(key, value);
        },
        httpHandlerConfigs() {
            return runtimeConfig.requestHandler.httpHandlerConfigs();
        },
    };
};
export const resolveHttpHandlerRuntimeConfig = (httpHandlerExtensionConfiguration) => {
    return {
        requestHandler: httpHandlerExtensionConfiguration.httpHandler(),
    };
};
