"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BashSession = exports.BashTimeoutError = exports.SessionMemoryStores = exports.SessionMemoryError = exports.MARKER_PATH = exports.MEMORY_FLUSH_TIMEOUT_MS = exports.MIN_MEMORY_SYNC_INTERVAL_MS = exports.DEFAULT_MEMORY_SYNC_INTERVAL_MS = void 0;
exports.setupSkills = setupSkills;
exports.extractSkillArchive = extractSkillArchive;
exports.betaAgentToolset20260401 = betaAgentToolset20260401;
exports.resolvePath = resolvePath;
exports.betaBashTool = betaBashTool;
exports.betaReadTool = betaReadTool;
exports.betaWriteTool = betaWriteTool;
exports.betaEditTool = betaEditTool;
exports.betaGlobTool = betaGlobTool;
exports.betaGrepTool = betaGrepTool;
const error_1 = require("../../core/error.js");
function nodeOnly(name) {
    throw new error_1.AnthropicError(`${name} requires Node.js or a Node-compatible runtime`);
}
// `./sync-interval` is runtime-agnostic, so these re-export directly.
var sync_interval_1 = require("./sync-interval.js");
Object.defineProperty(exports, "DEFAULT_MEMORY_SYNC_INTERVAL_MS", { enumerable: true, get: function () { return sync_interval_1.DEFAULT_MEMORY_SYNC_INTERVAL_MS; } });
Object.defineProperty(exports, "MIN_MEMORY_SYNC_INTERVAL_MS", { enumerable: true, get: function () { return sync_interval_1.MIN_MEMORY_SYNC_INTERVAL_MS; } });
/**
 * Duplicated literal, not a re-export: importing the value from `./memories`
 * would pull that module's Node built-ins into browser bundles. The stub test
 * pins it to the real module's value.
 */
exports.MEMORY_FLUSH_TIMEOUT_MS = 30000;
exports.MARKER_PATH = '.anthropic-memory-store';
/**
 * Duplicated declaration, for the same reason as the literal above. Nothing in
 * a browser build can throw it — the store download is Node-only — so this
 * exists to keep the stub's export surface identical to the real module's.
 */
class SessionMemoryError extends error_1.AnthropicError {
    constructor(message, cause) {
        super(message);
        this.name = 'SessionMemoryError';
        // in some environments the 'cause' property is already declared
        // @ts-ignore
        if (cause !== undefined)
            this.cause = cause;
    }
}
exports.SessionMemoryError = SessionMemoryError;
class SessionMemoryStores {
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
exports.SessionMemoryStores = SessionMemoryStores;
function setupSkills(_ctx) {
    return nodeOnly('setupSkills');
}
function extractSkillArchive(_resp, _dest) {
    return nodeOnly('extractSkillArchive');
}
function betaAgentToolset20260401(_ctx) {
    return nodeOnly('betaAgentToolset20260401');
}
function resolvePath(_ctx, _p) {
    return nodeOnly('resolvePath');
}
/**
 * A bash command exceeded its `timeoutMs`. Carries the timeout so a caller can
 * tell it apart from an abort without matching on the message text.
 */
class BashTimeoutError extends error_1.AnthropicError {
    constructor(timeoutMs) {
        super(`bash command timed out after ${timeoutMs}ms`);
        this.name = 'BashTimeoutError';
        this.timeoutMs = timeoutMs;
    }
}
exports.BashTimeoutError = BashTimeoutError;
class BashSession {
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
exports.BashSession = BashSession;
function betaBashTool(_ctx) {
    return nodeOnly('betaBashTool');
}
function betaReadTool(_ctx) {
    return nodeOnly('betaReadTool');
}
function betaWriteTool(_ctx) {
    return nodeOnly('betaWriteTool');
}
function betaEditTool(_ctx) {
    return nodeOnly('betaEditTool');
}
function betaGlobTool(_ctx) {
    return nodeOnly('betaGlobTool');
}
function betaGrepTool(_ctx) {
    return nodeOnly('betaGrepTool');
}
//# sourceMappingURL=node.browser.js.map