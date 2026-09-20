import { NodeHttpHandler as RequestHandler } from "@smithy/node-http-handler";
import { SSOClientConfig } from "./SSOClient";
export declare const getRuntimeConfig: (config: SSOClientConfig) => {
  cacheMiddleware?: boolean;
  customUserAgent?: string | import("@smithy/types").UserAgent;
  endpoint?:
    | ((
        | string
        | import("@smithy/types").Endpoint
        | import("@smithy/types").EndpointV2
        | import("@smithy/types").Provider<import("@smithy/types").Endpoint>
        | import("@smithy/types").Provider<import("@smithy/types").EndpointV2>
      ) &
        (
          | string
          | import("@smithy/types").Endpoint
          | import("@smithy/types").EndpointV2
          | import("@smithy/types").Provider<string>
          | import("@smithy/types").Provider<import("@smithy/types").Endpoint>
          | import("@smithy/types").Provider<import("@smithy/types").EndpointV2>
        ))
    | undefined;
  tls?: boolean;
  ignoreConfiguredEndpointUrls?: boolean;
  serviceConfiguredEndpoint?: never;
  retryStrategy?: import("@smithy/types").RetryStrategy | import("@smithy/types").RetryStrategyV2;
  credentials?:
    | import("@smithy/types").AwsCredentialIdentity
    | import("@smithy/types").AwsCredentialIdentityProvider;
  signer?:
    | import("@smithy/types").RequestSigner
    | ((
        authScheme?: import("@smithy/types").AuthScheme,
      ) => Promise<import("@smithy/types").RequestSigner>);
  signingEscapePath?: boolean;
  systemClockOffset?: number;
  signingRegion?: string;
  signerConstructor?: new (
    options: import("@smithy/signature-v4").SignatureV4Init &
      import("@smithy/signature-v4").SignatureV4CryptoInit,
  ) => import("@smithy/types").RequestSigner;
  disableClockSkewCorrection?: boolean | import("@smithy/types").Provider<boolean>;
  apiVersion: string;
  base64Decoder: import("@smithy/types").Decoder;
  base64Encoder: (_input: Uint8Array | string) => string;
  disableHostPrefix: boolean;
  endpointProvider: (
    params: import("./endpoint/EndpointParameters").EndpointParameters,
    context?: {
      logger?: import("@smithy/types").Logger;
    },
  ) => import("@smithy/types").EndpointV2;
  extensions: import("./runtimeExtensions").RuntimeExtension[];
  httpAuthSchemeProvider: import("./auth/httpAuthSchemeProvider").SSOHttpAuthSchemeProvider;
  httpAuthSchemes:
    | import("@smithy/types").HttpAuthScheme[]
    | (
        | {
            schemeId: string;
            identityProvider: (
              ipc: import("@smithy/types").IdentityProviderConfig,
            ) =>
              | import("@smithy/types").IdentityProvider<import("@smithy/types").Identity>
              | undefined;
            signer: import("@aws-sdk/core/httpAuthSchemes").AwsSdkSigV4Signer;
          }
        | {
            schemeId: string;
            identityProvider: (
              ipc: import("@smithy/types").IdentityProviderConfig,
            ) =>
              | import("@smithy/types").IdentityProvider<import("@smithy/types").Identity>
              | (() => Promise<{}>);
            signer: import("@smithy/core").NoAuthSigner;
          }
      )[];
  logger: import("@smithy/types").Logger;
  protocol:
    | import("@smithy/types").$ClientProtocol<any, any>
    | import("@smithy/types").$ClientProtocolCtor<any, any>
    | typeof import("@aws-sdk/core/protocols").AwsRestJsonProtocol;
  protocolSettings: {
    [setting: string]: unknown;
    defaultNamespace?: string;
  };
  serviceId: string;
  sha256: import("@smithy/types").HashConstructor;
  urlParser: import("@smithy/types").UrlParser;
  utf8Decoder: import("@smithy/types").Decoder;
  utf8Encoder: (input: Uint8Array | string) => string;
  runtime: string;
  defaultsMode: import("@smithy/types").Provider<
    import("@smithy/core/client").ResolvedDefaultsMode
  >;
  authSchemePreference: string[] | import("@smithy/types").Provider<string[]>;
  bodyLengthChecker: import("@smithy/types").BodyLengthCalculator;
  defaultUserAgentProvider: (
    config?: import("@aws-sdk/core/client").PreviouslyResolved,
  ) => Promise<import("@smithy/types").UserAgent>;
  maxAttempts: number | import("@smithy/types").Provider<number>;
  region: string | import("@smithy/types").Provider<string>;
  requestHandler: RequestHandler | import("@smithy/core/protocols").HttpHandler<any>;
  retryMode: string | import("@smithy/types").Provider<string>;
  streamCollector: (
    stream: import("stream").Readable | import("stream/web").ReadableStream | ReadableStream | Blob,
  ) => Promise<Uint8Array>;
  useDualstackEndpoint: boolean | import("@smithy/types").Provider<boolean>;
  useFipsEndpoint: boolean | import("@smithy/types").Provider<boolean>;
  userAgentAppId: string | import("@smithy/types").Provider<string | undefined>;
  profile?: string;
};
