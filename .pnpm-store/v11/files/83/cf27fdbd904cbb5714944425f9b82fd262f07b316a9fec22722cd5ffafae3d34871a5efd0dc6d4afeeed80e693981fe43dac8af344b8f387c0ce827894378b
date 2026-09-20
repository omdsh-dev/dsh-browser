import { EndpointError, } from "../types";
import { customEndpointFunctions } from "./customEndpointFunctions";
import { endpointFunctions } from "./endpointFunctions";
import { evaluateTemplate } from "./evaluateTemplate";
import { getReferenceValue } from "./getReferenceValue";
export const evaluateExpression = (obj, keyName, options) => {
    if (typeof obj === "string") {
        return evaluateTemplate(obj, options);
    }
    else if (obj["fn"]) {
        return group.callFunction(obj, options);
    }
    else if (obj["ref"]) {
        return getReferenceValue(obj, options);
    }
    throw new EndpointError(`'${keyName}': ${String(obj)} is not a string, function or reference.`);
};
export const callFunction = ({ fn, argv }, options) => {
    const evaluatedArgs = Array(argv.length);
    for (let i = 0; i < evaluatedArgs.length; ++i) {
        const arg = argv[i];
        if (typeof arg === "boolean" || typeof arg === "number") {
            evaluatedArgs[i] = arg;
        }
        else {
            evaluatedArgs[i] = group.evaluateExpression(arg, "arg", options);
        }
    }
    const namespaceSeparatorIndex = fn.indexOf(".");
    if (namespaceSeparatorIndex !== -1) {
        const namespaceFunctions = customEndpointFunctions[fn.slice(0, namespaceSeparatorIndex)];
        const customFunction = namespaceFunctions?.[fn.slice(namespaceSeparatorIndex + 1)];
        if (typeof customFunction === "function") {
            return customFunction(...evaluatedArgs);
        }
    }
    const callable = endpointFunctions[fn];
    if (typeof callable === "function") {
        return callable(...evaluatedArgs);
    }
    throw new Error(`function ${fn} not loaded in endpointFunctions.`);
};
export const group = {
    evaluateExpression,
    callFunction,
};
