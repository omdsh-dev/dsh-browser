const format = /^-?((0|[1-9]\d*)(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/;
export class NumericValue {
    string;
    type;
    constructor(string, type) {
        this.string = string;
        this.type = type;
        if (!format.test(string)) {
            throw new Error(`@smithy/core/serde - NumericValue string must conform to the Smithy bigDecimal format. Received: "${string}"`);
        }
    }
    toString() {
        return this.string;
    }
    static [Symbol.hasInstance](object) {
        if (!object || typeof object !== "object") {
            return false;
        }
        const _nv = object;
        return NumericValue.prototype.isPrototypeOf(object) || (_nv.type === "bigDecimal" && format.test(_nv.string));
    }
}
export function nv(input) {
    return new NumericValue(String(input), "bigDecimal");
}
