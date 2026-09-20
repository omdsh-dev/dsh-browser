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
import type { Anthropic } from "../../client.mjs";
import type { BetaRunnableTool } from "../../lib/tools/BetaRunnableTool.mjs";
import type { BetaManagedAgentsSession } from "../../resources/beta/sessions/sessions.mjs";
import type { AgentToolContext } from "./node.mjs";
import type { SessionMemoryStoresOptions } from "./memories.mjs";
export type { AgentToolContext } from "./node.mjs";
export type { MemoryDeleteMode, SessionMemoryStoresOptions } from "./memories.mjs";
export { DEFAULT_MEMORY_SYNC_INTERVAL_MS, MIN_MEMORY_SYNC_INTERVAL_MS } from "./sync-interval.mjs";
/**
 * Duplicated literal, not a re-export: importing the value from `./memories`
 * would pull that module's Node built-ins into browser bundles. The stub test
 * pins it to the real module's value.
 */
export declare const MEMORY_FLUSH_TIMEOUT_MS = 30000;
export declare const MARKER_PATH = ".anthropic-memory-store";
/**
 * Duplicated declaration, for the same reason as the literal above. Nothing in
 * a browser build can throw it — the store download is Node-only — so this
 * exists to keep the stub's export surface identical to the real module's.
 */
export declare class SessionMemoryError extends AnthropicError {
    constructor(message: string, cause?: unknown);
}
export declare class SessionMemoryStores {
    constructor(_client: Anthropic, _opts: SessionMemoryStoresOptions);
    get roots(): string[];
    get readOnlyRoots(): string[];
    download(_session: BetaManagedAgentsSession): Promise<void>;
    finish(): Promise<void>;
    /** @internal */
    syncAll(_final: boolean): Promise<void>;
    syncIfDue(): Promise<void>;
    flushWrites(_signal?: AbortSignal): Promise<void>;
    dispose(): Promise<void>;
}
export declare function setupSkills(_ctx: AgentToolContext): Promise<() => Promise<void>>;
export declare function extractSkillArchive(_resp: Response, _dest: string): Promise<void>;
export declare function betaAgentToolset20260401(_ctx: AgentToolContext): BetaRunnableTool[];
export declare function resolvePath(_ctx: AgentToolContext, _p: string): Promise<string>;
/**
 * A bash command exceeded its `timeoutMs`. Carries the timeout so a caller can
 * tell it apart from an abort without matching on the message text.
 */
export declare class BashTimeoutError extends AnthropicError {
    readonly timeoutMs: number;
    constructor(timeoutMs: number);
}
export declare class BashSession {
    constructor(_dir: string, _env?: Record<string, string | undefined>);
    get closed(): boolean;
    exec(_command: string, _opts?: {
        timeoutMs?: number;
        signal?: AbortSignal | null | undefined;
    }): Promise<{
        output: string;
        exitCode: number;
    }>;
    close(): void;
}
export declare function betaBashTool(_ctx: AgentToolContext): BetaRunnableTool;
export declare function betaReadTool(_ctx: AgentToolContext): BetaRunnableTool;
export declare function betaWriteTool(_ctx: AgentToolContext): BetaRunnableTool;
export declare function betaEditTool(_ctx: AgentToolContext): BetaRunnableTool;
export declare function betaGlobTool(_ctx: AgentToolContext): BetaRunnableTool;
export declare function betaGrepTool(_ctx: AgentToolContext): BetaRunnableTool;
//# sourceMappingURL=node.browser.d.mts.map