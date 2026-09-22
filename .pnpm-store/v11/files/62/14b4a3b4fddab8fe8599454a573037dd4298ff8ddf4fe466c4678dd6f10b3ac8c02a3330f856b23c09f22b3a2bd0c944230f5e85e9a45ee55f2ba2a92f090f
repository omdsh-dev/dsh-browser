import {
  AwsSdkSigV4AAuthInputConfig,
  AwsSdkSigV4AAuthResolvedConfig,
  AwsSdkSigV4APreviouslyResolved,
  AwsSdkSigV4AuthInputConfig,
  AwsSdkSigV4AuthResolvedConfig,
  AwsSdkSigV4PreviouslyResolved,
} from "@aws-sdk/core/httpAuthSchemes";
import {
  HandlerExecutionContext,
  HttpAuthScheme,
  HttpAuthSchemeParameters,
  HttpAuthSchemeParametersProvider,
  HttpAuthSchemeProvider,
  Provider,
} from "@smithy/types";
import { EndpointParameters } from "../endpoint/EndpointParameters";
import { STSClientResolvedConfig } from "../STSClient";
interface _STSHttpAuthSchemeParameters extends HttpAuthSchemeParameters {
  region?: string;
}
export interface STSHttpAuthSchemeParameters
  extends _STSHttpAuthSchemeParameters, EndpointParameters {
  region?: string;
}
export interface STSHttpAuthSchemeParametersProvider extends HttpAuthSchemeParametersProvider<
  STSClientResolvedConfig,
  HandlerExecutionContext,
  STSHttpAuthSchemeParameters,
  object
> {}
export declare const defaultSTSHttpAuthSchemeParametersProvider: STSHttpAuthSchemeParametersProvider;
export interface STSHttpAuthSchemeProvider extends HttpAuthSchemeProvider<STSHttpAuthSchemeParameters> {}
export declare const defaultSTSHttpAuthSchemeProvider: STSHttpAuthSchemeProvider;
export interface HttpAuthSchemeInputConfig
  extends AwsSdkSigV4AuthInputConfig, AwsSdkSigV4AAuthInputConfig {
  authSchemePreference?: string[] | Provider<string[]>;
  httpAuthSchemes?: HttpAuthScheme[];
  httpAuthSchemeProvider?: STSHttpAuthSchemeProvider;
}
export interface HttpAuthSchemeResolvedConfig
  extends AwsSdkSigV4AuthResolvedConfig, AwsSdkSigV4AAuthResolvedConfig {
  readonly authSchemePreference: Provider<string[]>;
  readonly httpAuthSchemes: HttpAuthScheme[];
  readonly httpAuthSchemeProvider: STSHttpAuthSchemeProvider;
}
export declare const resolveHttpAuthSchemeConfig: <T>(
  config: T &
    HttpAuthSchemeInputConfig &
    AwsSdkSigV4PreviouslyResolved &
    AwsSdkSigV4APreviouslyResolved,
) => T & HttpAuthSchemeResolvedConfig;
export {};
