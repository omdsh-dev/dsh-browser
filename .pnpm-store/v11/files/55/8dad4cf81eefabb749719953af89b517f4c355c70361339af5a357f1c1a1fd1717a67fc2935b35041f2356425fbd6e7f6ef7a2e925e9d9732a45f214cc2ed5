"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSON_BUF_PROPERTY = void 0;
exports.withLazyInput = withLazyInput;
const parser_1 = require("../_vendor/partial-json-parser/parser.js");
exports.JSON_BUF_PROPERTY = '__json_buf';
/**
 * Copies a tool-use block with an updated `__json_buf`, installing `.input` as
 * a memoized getter so the partial-JSON parse happens on first read instead of
 * on every delta.
 */
function withLazyInput(prev, jsonBuf) {
    const next = {};
    for (const key of Object.keys(prev)) {
        if (key !== 'input')
            next[key] = prev[key];
    }
    Object.defineProperty(next, exports.JSON_BUF_PROPERTY, { value: jsonBuf, enumerable: false, writable: true });
    let input;
    let parsed = false;
    Object.defineProperty(next, 'input', {
        enumerable: true,
        configurable: true,
        get() {
            if (!parsed) {
                input = jsonBuf ? (0, parser_1.partialParse)(jsonBuf) : {};
                parsed = true;
            }
            return input;
        },
    });
    return next;
}
//# sourceMappingURL=message-stream-utils.js.map