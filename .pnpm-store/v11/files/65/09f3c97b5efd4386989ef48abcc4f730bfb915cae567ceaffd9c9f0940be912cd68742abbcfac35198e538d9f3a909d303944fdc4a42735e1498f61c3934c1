"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.util = exports.stream = exports.path = exports.os = exports.fs = exports.crypto = exports.child_process = void 0;
const error_1 = require("../core/error.js");
/** Substituted for `./node` by the package.json `browser` field; every property access throws. */
function unavailable(module) {
    return new Proxy({}, {
        get(_target, property) {
            if (typeof property === 'symbol')
                return undefined;
            throw new error_1.AnthropicError(`\`${module}.${property}\` is not available in this environment; it needs a Node.js-compatible runtime`);
        },
    });
}
exports.child_process = unavailable('child_process');
exports.crypto = unavailable('crypto');
exports.fs = unavailable('fs');
exports.os = unavailable('os');
exports.path = unavailable('path');
exports.stream = unavailable('stream');
exports.util = unavailable('util');
//# sourceMappingURL=node.browser.js.map