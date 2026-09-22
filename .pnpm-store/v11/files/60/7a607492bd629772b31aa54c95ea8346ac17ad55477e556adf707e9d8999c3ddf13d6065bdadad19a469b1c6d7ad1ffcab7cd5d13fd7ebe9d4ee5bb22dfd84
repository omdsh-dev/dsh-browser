import type { EndpointParameterInstructions, EndpointParameters, Pluggable, RelativeMiddlewareOptions, SerializeHandlerOptions } from "@smithy/types";
import type { GetEndpointFromConfig } from "./adaptors/getEndpointFromInstructions";
import type { EndpointResolvedConfig } from "./resolveEndpointConfig";
/**
 * @internal
 */
export declare const endpointMiddlewareOptions: SerializeHandlerOptions & RelativeMiddlewareOptions;
/**
 * @internal
 */
export declare function bindGetEndpointPlugin(getEndpointFromConfig: GetEndpointFromConfig): <T extends EndpointParameters>(config: EndpointResolvedConfig<T>, instructions: EndpointParameterInstructions) => Pluggable<any, any>;
