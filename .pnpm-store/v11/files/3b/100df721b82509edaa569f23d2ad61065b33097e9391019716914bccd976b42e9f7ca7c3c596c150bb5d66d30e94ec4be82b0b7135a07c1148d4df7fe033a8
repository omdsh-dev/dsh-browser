import { EndpointParameterInstructions, EndpointParameters, SerializeMiddleware } from "@smithy/types";
import { GetEndpointFromConfig } from "./adaptors/getEndpointFromInstructions";
import { EndpointResolvedConfig } from "./resolveEndpointConfig";
/**
 * @internal
 */
export declare function bindEndpointMiddleware(getEndpointFromConfig: GetEndpointFromConfig): <T extends EndpointParameters>({ config, instructions, }: {
    config: EndpointResolvedConfig<T>;
    instructions: EndpointParameterInstructions;
}) => SerializeMiddleware<any, any>;
