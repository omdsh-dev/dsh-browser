import { AnthropicError } from "../core/error.mjs";
/** Substituted for `./node` by the package.json `browser` field; every property access throws. */
function unavailable(module) {
    return new Proxy({}, {
        get(_target, property) {
            if (typeof property === 'symbol')
                return undefined;
            throw new AnthropicError(`\`${module}.${property}\` is not available in this environment; it needs a Node.js-compatible runtime`);
        },
    });
}
export const child_process = unavailable('child_process');
export const crypto = unavailable('crypto');
export const fs = unavailable('fs');
export const os = unavailable('os');
export const path = unavailable('path');
export const stream = unavailable('stream');
export const util = unavailable('util');
//# sourceMappingURL=node.browser.mjs.map