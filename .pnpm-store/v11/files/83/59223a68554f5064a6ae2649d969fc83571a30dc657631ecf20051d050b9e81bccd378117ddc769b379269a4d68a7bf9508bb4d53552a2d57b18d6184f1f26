/**
 * Browser stub for `tools/agent-toolset/node`.
 *
 * The real module implements the `agent_toolset_20260401` tools on top of Node
 * built-ins (`node:child_process`, `node:fs`, …), which browser bundlers cannot
 * resolve. The `browser` field in `package.json` substitutes this stub in
 * browser builds so the SDK bundles cleanly for web targets; Node runtimes and
 * node-target bundles ignore the mapping and load the real implementation.
 *
 * Every value export here throws an {@link AnthropicError} when used — the
 * agent toolset only works in Node.js or a Node-compatible runtime. Type
 * exports are re-exported from the real module (erased at build time), so
 * type-level usage is unaffected.
 */
import { AnthropicError } from "../../core/error.mjs";
function nodeOnly(name) {
    throw new AnthropicError(`${name} requires Node.js or a Node-compatible runtime`);
}
// `./sync-interval` is runtime-agnostic, so these re-export directly.
export { DEFAULT_MEMORY_SYNC_INTERVAL_MS, MIN_MEMORY_SYNC_INTERVAL_MS } from "./sync-interval.mjs";
/**
 * Duplicated literal, not a re-export: importing the value from `./memories`
 * would pull that module's Node built-ins into browser bundles. The stub test
 * pins it to the real module's value.
 */
export const MEMORY_FLUSH_TIMEOUT_MS = 30000;
export const MARKER_PATH = '.anthropic-memory-store';
/**
 * Duplicated declaration, for the same reason as the literal above. Nothing in
 * a browser build can throw it — the store download is Node-only — so this
 * exists to keep the stub's export surface identical to the real module's.
 */
export class SessionMemoryError extends AnthropicError {
    constructor(message, cause) {
        super(message);
        this.name = 'SessionMemoryError';
        // in some environments the 'cause' property is already declared
        // @ts-ignore
        if (cause !== undefined)
            this.cause = cause;
    }
}
export class SessionMemoryStores {
    constructor(_client, _opts) {
        nodeOnly('SessionMemoryStores');
    }
    get roots() {
        return nodeOnly('SessionMemoryStores');
    }
    get readOnlyRoots() {
        return nodeOnly('SessionMemoryStores');
    }
    download(_session) {
        return nodeOnly('SessionMemoryStores');
    }
    finish() {
        return nodeOnly('SessionMemoryStores');
    }
    /** @internal */
    syncAll(_final) {
        return nodeOnly('SessionMemoryStores');
    }
    syncIfDue() {
        return nodeOnly('SessionMemoryStores');
    }
    flushWrites(_signal) {
        return nodeOnly('SessionMemoryStores');
    }
    dispose() {
        return nodeOnly('SessionMemoryStores');
    }
}
export function setupSkills(_ctx) {
    return nodeOnly('setupSkills');
}
export function extractSkillArchive(_resp, _dest) {
    return nodeOnly('extractSkillArchive');
}
export function betaAgentToolset20260401(_ctx) {
    return nodeOnly('betaAgentToolset20260401');
}
export function resolvePath(_ctx, _p) {
    return nodeOnly('resolvePath');
}
/**
 * A bash command exceeded its `timeoutMs`. Carries the timeout so a caller can
 * tell it apart from an abort without matching on the message text.
 */
export class BashTimeoutError extends AnthropicError {
    constructor(timeoutMs) {
        super(`bash command timed out after ${timeoutMs}ms`);
        this.name = 'BashTimeoutError';
        this.timeoutMs = timeoutMs;
    }
}
export class BashSession {
    constructor(_dir, _env) {
        nodeOnly('BashSession');
    }
    get closed() {
        return nodeOnly('BashSession');
    }
    exec(_command, _opts = {}) {
        return nodeOnly('BashSession');
    }
    close() {
        nodeOnly('BashSession');
    }
}
export function betaBashTool(_ctx) {
    return nodeOnly('betaBashTool');
}
export function betaReadTool(_ctx) {
    return nodeOnly('betaReadTool');
}
export function betaWriteTool(_ctx) {
    return nodeOnly('betaWriteTool');
}
export function betaEditTool(_ctx) {
    return nodeOnly('betaEditTool');
}
export function betaGlobTool(_ctx) {
    return nodeOnly('betaGlobTool');
}
export function betaGrepTool(_ctx) {
    return nodeOnly('betaGrepTool');
}
//# sourceMappingURL=node.browser.mjs.map