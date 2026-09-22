"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntimeConfig = void 0;
const tslib_1 = require("tslib");
const package_json_1 = tslib_1.__importDefault(require("../package.json"));
const sha256_browser_1 = require("@aws-crypto/sha256-browser");
const client_1 = require("@aws-sdk/core/client");
const middleware_websocket_1 = require("@aws-sdk/middleware-websocket");
const client_2 = require("@smithy/core/client");
const config_1 = require("@smithy/core/config");
const event_streams_1 = require("@smithy/core/event-streams");
const retry_1 = require("@smithy/core/retry");
const serde_1 = require("@smithy/core/serde");
const fetch_http_handler_1 = require("@smithy/fetch-http-handler");
const runtimeConfig_shared_1 = require("./runtimeConfig.shared");
const getRuntimeConfig = (config) => {
    const defaultsMode = (0, config_1.resolveDefaultsModeConfig)(config);
    const defaultConfigProvider = () => defaultsMode().then(client_2.loadConfigsForDefaultMode);
    const clientSharedValues = (0, runtimeConfig_shared_1.getRuntimeConfig)(config);
    return {
        ...clientSharedValues,
        ...config,
        runtime: "browser",
        defaultsMode,
        bodyLengthChecker: config?.bodyLengthChecker ?? serde_1.calculateBodyLength,
        credentialDefaultProvider: config?.credentialDefaultProvider ?? ((_) => () => Promise.reject(new Error("Credential is missing"))),
        defaultUserAgentProvider: config?.defaultUserAgentProvider ?? (0, client_1.createDefaultUserAgentProvider)({ serviceId: clientSharedValues.serviceId, clientVersion: package_json_1.default.version }),
        eventStreamPayloadHandlerProvider: config?.eventStreamPayloadHandlerProvider ?? middleware_websocket_1.eventStreamPayloadHandlerProvider,
        eventStreamSerdeProvider: config?.eventStreamSerdeProvider ?? event_streams_1.eventStreamSerdeProvider,
        maxAttempts: config?.maxAttempts ?? retry_1.DEFAULT_MAX_ATTEMPTS,
        region: config?.region ?? (0, client_2.invalidProvider)("Region is missing"),
        requestHandler: middleware_websocket_1.WebSocketFetchHandler.create(config?.requestHandler
            ?? defaultConfigProvider, fetch_http_handler_1.FetchHttpHandler.create(defaultConfigProvider)),
        retryMode: config?.retryMode ?? (async () => (await defaultConfigProvider()).retryMode || retry_1.DEFAULT_RETRY_MODE),
        sha256: config?.sha256 ?? sha256_browser_1.Sha256,
        streamCollector: config?.streamCollector ?? fetch_http_handler_1.streamCollector,
        useDualstackEndpoint: config?.useDualstackEndpoint ?? (() => Promise.resolve(config_1.DEFAULT_USE_DUALSTACK_ENDPOINT)),
        useFipsEndpoint: config?.useFipsEndpoint ?? (() => Promise.resolve(config_1.DEFAULT_USE_FIPS_ENDPOINT)),
    };
};
exports.getRuntimeConfig = getRuntimeConfig;
