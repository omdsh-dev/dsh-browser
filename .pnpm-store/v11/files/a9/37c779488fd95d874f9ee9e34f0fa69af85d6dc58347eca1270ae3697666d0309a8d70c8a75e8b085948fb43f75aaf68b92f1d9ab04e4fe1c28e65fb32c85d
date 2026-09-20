import { getSmithyContext, toEndpointV1 } from "@smithy/core/transport";
import { operation } from "../schemas/operation";
export const schemaSerializationMiddleware = (config) => (next, context) => async (args) => {
    const { operationSchema } = getSmithyContext(context);
    const [, ns, n, t, i, o] = operationSchema ?? [];
    const endpoint = context.endpointV2
        ? async () => toEndpointV1(context.endpointV2)
        : config.endpoint;
    const request = await config.protocol.serializeRequest(operation(ns, n, t, i, o), args.input, {
        ...config,
        ...context,
        endpoint,
    });
    return next({
        ...args,
        request,
    });
};
