import { resolveParamsForS3 } from "../service-customizations";
import { createConfigValueProvider } from "./createConfigValueProvider";
import { toEndpointV1 } from "./toEndpointV1";
export function bindGetEndpointFromInstructions(getEndpointFromConfig) {
    return async (commandInput, instructionsSupplier, clientConfig, context) => {
        if (!clientConfig.isCustomEndpoint && !clientConfig.ignoreConfiguredEndpointUrls) {
            let endpointFromConfig;
            if (clientConfig.serviceConfiguredEndpoint) {
                endpointFromConfig = await clientConfig.serviceConfiguredEndpoint();
            }
            else {
                endpointFromConfig = await getEndpointFromConfig(clientConfig.serviceId);
            }
            if (endpointFromConfig) {
                clientConfig.endpoint = () => Promise.resolve(toEndpointV1(endpointFromConfig));
                clientConfig.isCustomEndpoint = true;
                context?.logger?.debug?.(`@smithy/core/endpoints - resolved endpoint from config: ${endpointFromConfig}`);
            }
        }
        const endpointParams = await resolveParams(commandInput, instructionsSupplier, clientConfig);
        if (typeof clientConfig.endpointProvider !== "function") {
            throw new Error("config.endpointProvider is not set.");
        }
        const endpoint = clientConfig.endpointProvider(endpointParams, context);
        if (clientConfig.isCustomEndpoint && clientConfig.endpoint) {
            const customEndpoint = await clientConfig.endpoint();
            if (customEndpoint?.headers) {
                endpoint.headers ??= {};
                for (const [name, value] of Object.entries(customEndpoint.headers)) {
                    endpoint.headers[name] = Array.isArray(value) ? value : [value];
                }
            }
        }
        return endpoint;
    };
}
export const resolveParams = async (commandInput, instructionsSupplier, clientConfig) => {
    const endpointParams = {};
    const instructions = instructionsSupplier?.getEndpointParameterInstructions?.() || {};
    for (const [name, instruction] of Object.entries(instructions)) {
        switch (instruction.type) {
            case "staticContextParams":
                endpointParams[name] = instruction.value;
                break;
            case "contextParams":
                endpointParams[name] = commandInput[instruction.name];
                break;
            case "clientContextParams":
            case "builtInParams":
                endpointParams[name] = await createConfigValueProvider(instruction.name, name, clientConfig, instruction.type !== "builtInParams")();
                break;
            case "operationContextParams":
                endpointParams[name] = instruction.get(commandInput);
                break;
            default:
                throw new Error("Unrecognized endpoint parameter instruction: " + JSON.stringify(instruction));
        }
    }
    if (Object.keys(instructions).length === 0) {
        Object.assign(endpointParams, clientConfig);
    }
    if (String(clientConfig.serviceId).toLowerCase() === "s3") {
        await resolveParamsForS3(endpointParams);
    }
    return endpointParams;
};
