import { debugId, toDebugString } from "../debug";
import { EndpointError } from "../types";
import { callFunction } from "./callFunction";
export const evaluateCondition = (condition, options) => {
    const { assign } = condition;
    if (assign && assign in options.referenceRecord) {
        throw new EndpointError(`'${assign}' is already defined in Reference Record.`);
    }
    const value = callFunction(condition, options);
    options.logger?.debug?.(`${debugId} evaluateCondition: ${toDebugString(condition)} = ${toDebugString(value)}`);
    const result = value === "" ? true : !!value;
    if (assign != null) {
        return { result, toAssign: { name: assign, value } };
    }
    return { result };
};
