import { EndpointError } from "../types";
import { getAttrPathList } from "./getAttrPathList";
export const getAttr = (value, path) => getAttrPathList(path).reduce((acc, index) => {
    if (typeof acc !== "object") {
        throw new EndpointError(`Index '${index}' in '${path}' not found in '${JSON.stringify(value)}'`);
    }
    else if (Array.isArray(acc)) {
        const i = parseInt(index);
        return acc[i < 0 ? acc.length + i : i];
    }
    return acc[index];
}, value);
