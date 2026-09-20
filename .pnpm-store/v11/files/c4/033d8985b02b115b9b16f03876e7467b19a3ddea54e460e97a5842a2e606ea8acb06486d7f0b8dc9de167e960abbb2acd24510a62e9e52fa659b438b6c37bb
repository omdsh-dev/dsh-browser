import { bindEndpointMiddleware } from "./endpointMiddleware";
const serializerMiddlewareOption = {
    name: "serializerMiddleware",
    step: "serialize",
    tags: ["SERIALIZER"],
    override: true,
};
export const endpointMiddlewareOptions = {
    step: "serialize",
    tags: ["ENDPOINT_PARAMETERS", "ENDPOINT_V2", "ENDPOINT"],
    name: "endpointV2Middleware",
    override: true,
    relation: "before",
    toMiddleware: serializerMiddlewareOption.name,
};
export function bindGetEndpointPlugin(getEndpointFromConfig) {
    const endpointMiddleware = bindEndpointMiddleware(getEndpointFromConfig);
    return (config, instructions) => ({
        applyToStack: (clientStack) => {
            clientStack.addRelativeTo(endpointMiddleware({
                config,
                instructions,
            }), endpointMiddlewareOptions);
        },
    });
}
