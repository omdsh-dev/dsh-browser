"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntimeConfig = void 0;
const tslib_1 = require("tslib");
const package_json_1 = tslib_1.__importDefault(require("../package.json"));
const client_1 = require("@aws-sdk/core/client");
const httpAuthSchemes_1 = require("@aws-sdk/core/httpAuthSchemes");
const credential_provider_node_1 = require("@aws-sdk/credential-provider-node");
const eventstream_handler_node_1 = require("@aws-sdk/eventstream-handler-node");
const token_providers_1 = require("@aws-sdk/token-providers");
const core_1 = require("@smithy/core");
const client_2 = require("@smithy/core/client");
const config_1 = require("@smithy/core/config");
const event_streams_1 = require("@smithy/core/event-streams");
const retry_1 = require("@smithy/core/retry");
const serde_1 = require("@smithy/core/serde");
const node_http_handler_1 = require("@smithy/node-http-handler");
const runtimeConfig_shared_1 = require("./runtimeConfig.shared");
const getRuntimeConfig = (config) => {
    (0, client_2.emitWarningIfUnsupportedVersion)(process.version);
    const defaultsMode = (0, config_1.resolveDefaultsModeConfig)(config);
    const defaultConfigProvider = () => defaultsMode().then(client_2.loadConfigsForDefaultMode);
    const clientSharedValues = (0, runtimeConfig_shared_1.getRuntimeConfig)(config);
    (0, client_1.emitWarningIfUnsupportedVersion)(process.version);
    const loaderConfig = {
        profile: config?.profile,
        logger: clientSharedValues.logger,
        signingName: "bedrock",
    };
    return {
        ...clientSharedValues,
        ...config,
        runtime: "node",
        defaultsMode,
        authSchemePreference: config?.authSchemePreference ?? (0, config_1.loadConfig)(httpAuthSchemes_1.NODE_AUTH_SCHEME_PREFERENCE_OPTIONS, loaderConfig),
        bodyLengthChecker: config?.bodyLengthChecker ?? serde_1.calculateBodyLength,
        credentialDefaultProvider: config?.credentialDefaultProvider ?? credential_provider_node_1.defaultProvider,
        defaultUserAgentProvider: config?.defaultUserAgentProvider ?? (0, client_1.createDefaultUserAgentProvider)({ serviceId: clientSharedValues.serviceId, clientVersion: package_json_1.default.version }),
        eventStreamPayloadHandlerProvider: config?.eventStreamPayloadHandlerProvider ?? eventstream_handler_node_1.eventStreamPayloadHandlerProvider,
        eventStreamSerdeProvider: config?.eventStreamSerdeProvider ?? event_streams_1.eventStreamSerdeProvider,
        httpAuthSchemes: config?.httpAuthSchemes ?? [
            {
                schemeId: "aws.auth#sigv4",
                identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
                signer: new httpAuthSchemes_1.AwsSdkSigV4Signer(),
            },
            {
                schemeId: "smithy.api#httpBearerAuth",
                identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#httpBearerAuth") || (async (idProps) => {
                    try {
                        return await (0, token_providers_1.fromEnvSigningName)({ signingName: "bedrock" })();
                    }
                    catch (error) {
                        return await (0, token_providers_1.nodeProvider)(idProps)(idProps);
                    }
                }),
                signer: new core_1.HttpBearerAuthSigner(),
            },
        ],
        maxAttempts: config?.maxAttempts ?? (0, config_1.loadConfig)(retry_1.NODE_MAX_ATTEMPT_CONFIG_OPTIONS, config),
        region: config?.region ?? (0, config_1.loadConfig)(config_1.NODE_REGION_CONFIG_OPTIONS, { ...config_1.NODE_REGION_CONFIG_FILE_OPTIONS, ...loaderConfig }),
        requestHandler: node_http_handler_1.NodeHttp2Handler.create(config?.requestHandler ?? (async () => ({
            ...await defaultConfigProvider(),
            disableConcurrentStreams: true
        }))),
        retryMode: config?.retryMode ??
            (0, config_1.loadConfig)({
                ...retry_1.NODE_RETRY_MODE_CONFIG_OPTIONS,
                default: async () => (await defaultConfigProvider()).retryMode || retry_1.DEFAULT_RETRY_MODE,
            }, config),
        sha256: config?.sha256 ?? serde_1.Hash.bind(null, "sha256"),
        streamCollector: config?.streamCollector ?? node_http_handler_1.streamCollector,
        useDualstackEndpoint: config?.useDualstackEndpoint ?? (0, config_1.loadConfig)(config_1.NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
        useFipsEndpoint: config?.useFipsEndpoint ?? (0, config_1.loadConfig)(config_1.NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
        userAgentAppId: config?.userAgentAppId ?? (0, config_1.loadConfig)(client_1.NODE_APP_ID_CONFIG_OPTIONS, loaderConfig),
    };
};
exports.getRuntimeConfig = getRuntimeConfig;
