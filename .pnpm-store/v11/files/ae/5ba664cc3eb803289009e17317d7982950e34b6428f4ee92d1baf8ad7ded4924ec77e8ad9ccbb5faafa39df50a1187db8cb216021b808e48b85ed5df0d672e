import { debugId, toDebugString } from "./debug";
import { EndpointError } from "./types";
import { evaluateRules } from "./utils";
export const resolveEndpoint = (ruleSetObject, options) => {
    const { endpointParams, logger } = options;
    const { parameters, rules } = ruleSetObject;
    options.logger?.debug?.(`${debugId} Initial EndpointParams: ${toDebugString(endpointParams)}`);
    for (const paramKey in parameters) {
        const parameter = parameters[paramKey];
        const endpointParam = endpointParams[paramKey];
        if (endpointParam == null && parameter.default != null) {
            endpointParams[paramKey] = parameter.default;
            continue;
        }
        if (parameter.required && endpointParam == null) {
            throw new EndpointError(`Missing required parameter: '${paramKey}'`);
        }
    }
    const endpoint = evaluateRules(rules, { endpointParams, logger, referenceRecord: {} });
    options.logger?.debug?.(`${debugId} Resolved endpoint: ${toDebugString(endpoint)}`);
    return endpoint;
};
