import type { EndpointParameterInstructions, EndpointParameters, SerializeMiddleware } from "@smithy/types";
import { type GetEndpointFromConfig } from "./adaptors/getEndpointFromInstructions";
import type { EndpointResolvedConfig } from "./resolveEndpointConfig";
/**
 * @internal
 */
export declare function bindEndpointMiddleware(getEndpointFromConfig: GetEndpointFromConfig): <T extends EndpointParameters>({ config, instructions, }: {
    config: EndpointResolvedConfig<T>;
    instructions: EndpointParameterInstructions;
}) => SerializeMiddleware<any, any>;
