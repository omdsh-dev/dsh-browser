import { EndpointParameterInstructions, Logger, MetadataBearer, OptionalParameter, Pluggable, RequestHandler, StaticOperationSchema } from "@smithy/types";
import { CommandImpl } from "./command";
/**
 * Higher order factory for Command builders specific to a client.
 * Produces a command factory that creates Command classes with
 * pre-configured endpoint params, middleware, and schema.
 *
 * @param common - common endpoint params.
 * @param service - service shape name.
 * @param name - SDK Client Name.
 * @param ep - endpoint plugin provider.
 *
 * @internal
 */
export declare function makeBuilder<C extends {
    logger?: Logger;
    requestHandler: RequestHandler<any, any, any>;
}, SI extends object, SO extends MetadataBearer>(common: EndpointParameterInstructions, service: string, name: string, ep: (config: any, instructions: any) => Pluggable<any, any>): <I extends SI, O extends SO>(added: EndpointParameterInstructions, plugins: (CommandCtor: any, clientStack: any, config: any, options: any) => Pluggable<any, any>[], op: string, $: StaticOperationSchema, smithyContext?: Record<string, unknown>) => {
    new (input: I): CommandImpl<I, O, C, SI, SO>;
    new (...[input]: OptionalParameter<I>): CommandImpl<I, O, C, SI, SO>;
    getEndpointParameterInstructions(): EndpointParameterInstructions;
};
