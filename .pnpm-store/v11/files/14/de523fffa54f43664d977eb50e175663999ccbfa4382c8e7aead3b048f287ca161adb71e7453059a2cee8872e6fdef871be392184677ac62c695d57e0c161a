"use strict";
/**
 * Browser stub for `tools/memory/node`.
 *
 * The real module's {@link BetaLocalFilesystemMemoryTool} is implemented on top
 * of Node built-ins (`fs/promises`, `path`, `crypto`), which browser bundlers
 * cannot resolve. The `browser` field in `package.json` substitutes this stub
 * in browser builds; Node runtimes and node-target bundles ignore the mapping
 * and load the real implementation.
 *
 * `betaMemoryTool` is runtime-agnostic and is re-exported for real here; only
 * the filesystem-backed handlers throw.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetaLocalFilesystemMemoryTool = exports.betaMemoryTool = void 0;
var memory_1 = require("../../helpers/beta/memory.js");
Object.defineProperty(exports, "betaMemoryTool", { enumerable: true, get: function () { return memory_1.betaMemoryTool; } });
const error_1 = require("../../core/error.js");
function nodeOnly(name) {
    throw new error_1.AnthropicError(`${name} requires Node.js or a Node-compatible runtime`);
}
class BetaLocalFilesystemMemoryTool {
    constructor(_basePath = './memory') {
        nodeOnly('BetaLocalFilesystemMemoryTool');
    }
    static init(_basePath = './memory') {
        return nodeOnly('BetaLocalFilesystemMemoryTool.init');
    }
    view(_command) {
        return nodeOnly('BetaLocalFilesystemMemoryTool');
    }
    create(_command) {
        return nodeOnly('BetaLocalFilesystemMemoryTool');
    }
    str_replace(_command) {
        return nodeOnly('BetaLocalFilesystemMemoryTool');
    }
    insert(_command) {
        return nodeOnly('BetaLocalFilesystemMemoryTool');
    }
    delete(_command) {
        return nodeOnly('BetaLocalFilesystemMemoryTool');
    }
    rename(_command) {
        return nodeOnly('BetaLocalFilesystemMemoryTool');
    }
}
exports.BetaLocalFilesystemMemoryTool = BetaLocalFilesystemMemoryTool;
//# sourceMappingURL=node.browser.js.map