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
export { betaMemoryTool } from "../../helpers/beta/memory.mjs";
import { AnthropicError } from "../../core/error.mjs";
function nodeOnly(name) {
    throw new AnthropicError(`${name} requires Node.js or a Node-compatible runtime`);
}
export class BetaLocalFilesystemMemoryTool {
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
//# sourceMappingURL=node.browser.mjs.map