import { fromValue } from "../property-provider/fromValue";
const isFunction = (func) => typeof func === "function";
export const fromStatic = (defaultValue) => isFunction(defaultValue) ? async () => await defaultValue() : fromValue(defaultValue);
