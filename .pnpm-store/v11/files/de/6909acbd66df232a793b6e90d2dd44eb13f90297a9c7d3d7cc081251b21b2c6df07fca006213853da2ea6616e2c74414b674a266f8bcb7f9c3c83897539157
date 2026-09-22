"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntimeConfig = void 0;
const httpAuthSchemes_1 = require("@aws-sdk/core/httpAuthSchemes");
const protocols_1 = require("@aws-sdk/core/protocols");
const core_1 = require("@smithy/core");
const client_1 = require("@smithy/core/client");
const protocols_2 = require("@smithy/core/protocols");
const serde_1 = require("@smithy/core/serde");
const httpAuthSchemeProvider_1 = require("./auth/httpAuthSchemeProvider");
const endpointResolver_1 = require("./endpoint/endpointResolver");
const schemas_0_1 = require("./schemas/schemas_0");
const getRuntimeConfig = (config) => {
    return {
        apiVersion: "2023-09-30",
        base64Decoder: config?.base64Decoder ?? serde_1.fromBase64,
        base64Encoder: config?.base64Encoder ?? serde_1.toBase64,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? endpointResolver_1.defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? httpAuthSchemeProvider_1.defaultBedrockRuntimeHttpAuthSchemeProvider,
        httpAuthSchemes: config?.httpAuthSchemes ?? [
            {
                schemeId: "aws.auth#sigv4",
                identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
                signer: new httpAuthSchemes_1.AwsSdkSigV4Signer(),
            },
            {
                schemeId: "smithy.api#httpBearerAuth",
                identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#httpBearerAuth"),
                signer: new core_1.HttpBearerAuthSigner(),
            },
        ],
        logger: config?.logger ?? new client_1.NoOpLogger(),
        protocol: config?.protocol ?? protocols_1.AwsRestJsonProtocol,
        protocolSettings: config?.protocolSettings ?? {
            defaultNamespace: "com.amazonaws.bedrockruntime",
            errorTypeRegistries: schemas_0_1.errorTypeRegistries,
            version: "2023-09-30",
            serviceTarget: "AmazonBedrockFrontendService",
        },
        serviceId: config?.serviceId ?? "Bedrock Runtime",
        urlParser: config?.urlParser ?? protocols_2.parseUrl,
        utf8Decoder: config?.utf8Decoder ?? serde_1.fromUtf8,
        utf8Encoder: config?.utf8Encoder ?? serde_1.toUtf8,
    };
};
exports.getRuntimeConfig = getRuntimeConfig;
