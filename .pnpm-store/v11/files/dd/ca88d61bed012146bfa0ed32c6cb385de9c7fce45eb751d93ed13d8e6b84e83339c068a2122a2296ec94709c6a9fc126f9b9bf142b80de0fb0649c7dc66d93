/**
 * Node implementation of the `agent_toolset_20260401` tools — `bash`, `read`,
 * `write`, `edit`, `glob`, `grep` — plus the workdir/skills
 * {@link AgentToolContext}.
 *
 * This mirrors `@anthropic-ai/sdk/tools/memory/node`: it is the explicit,
 * Node-only entry point for these implementations. Importing it pulls in
 * `node:child_process`, `node:fs`, etc., so it is kept separate from the rest of
 * the SDK — depending on it is an opt-in.
 *
 * **Node 22+ is required** for this module: the `glob` tool uses the native
 * `fs.glob`, added in Node 22. The rest of the SDK still supports Node 18+; only
 * the agent toolset has this requirement.
 *
 * The result of {@link betaAgentToolset20260401} is a plain `BetaRunnableTool[]`;
 * hand it to any tool runner — `client.beta.messages.toolRunner({ …, tools })`
 * for the Messages API, or `client.beta.sessions.events.toolRunner({ …, tools })`
 * for a managed-agents session:
 *
 * ```ts
 * import { betaAgentToolset20260401 } from '@anthropic-ai/sdk/tools/agent-toolset/node';
 *
 * const tools = betaAgentToolset20260401({ workdir: '/work' });
 * const tools2 = betaAgentToolset20260401({ workdir: '/work' }).filter((t) => t.name !== 'bash');
 * ```
 *
 * Trust model: the file tools confine to `workdir` plus any `allowedRoots`
 * (symlink-aware) and are safe without a sandbox; `bash` is unrestricted and
 * should run inside one. See {@link AgentToolContext}.
 */
import type { Anthropic } from "../../client.mjs";
import type { BetaManagedAgentsSession } from "../../resources/beta/sessions/sessions.mjs";
import { AnthropicError } from "../../core/error.mjs";
import type { BetaRunnableTool } from "../../lib/tools/BetaRunnableTool.mjs";
export { setupSkills, extractSkillArchive } from "./skills.mjs";
export { SessionMemoryStores, SessionMemoryError, DEFAULT_MEMORY_SYNC_INTERVAL_MS, MIN_MEMORY_SYNC_INTERVAL_MS, MEMORY_FLUSH_TIMEOUT_MS, MARKER_PATH, type MemoryDeleteMode, type SessionMemoryStoresOptions, } from "./memories.mjs";
/**
 * A bash command exceeded its `timeoutMs`. Carries the timeout so a caller can
 * tell it apart from an abort without matching on the message text.
 */
export declare class BashTimeoutError extends AnthropicError {
    readonly timeoutMs: number;
    constructor(timeoutMs: number);
}
/**
 * Workdir + path-policy for the agent toolset.
 *
 * Trust model — two tiers:
 *
 * - The file tools ({@link betaReadTool}, {@link betaWriteTool},
 *   {@link betaEditTool}, {@link betaGlobTool}, {@link betaGrepTool}) confine to
 *   `workdir` plus any `allowedRoots`. {@link resolvePath} canonicalizes the
 *   target (resolving every symlink, including the leaf) before the check
 *   *and* returns that canonical path for the operation, so a symlink inside
 *   the workdir that points outside it neither passes the check nor gets
 *   followed afterwards — this is a real boundary, not a lexical hint (modulo
 *   the residual TOCTOU noted on {@link resolvePath}).
 * - {@link betaBashTool} runs an unrestricted `/bin/bash` and cannot be
 *   confined. Run it — and, for defense in depth, the whole toolset — inside a
 *   sandbox the host controls (e.g. a self-hosted environment runner).
 */
export interface AgentToolContext {
    /** Base directory for resolving relative tool paths. */
    workdir: string;
    /**
     * @deprecated No longer accepted: the file tools are always confined to
     * `workdir` plus `allowedRoots`, which is neither behavior this flag used to
     * select, so passing either value throws. Remove it; list extra directories
     * in {@link AgentToolContext.allowedRoots}. The property is removed in a
     * future release.
     */
    unrestrictedPaths?: boolean;
    /**
     * Absolute directories outside `workdir` the file tools may also reach,
     * resolved at check time. The environment worker sets this to the session's
     * memory-store folders. Does **not** constrain {@link betaBashTool}.
     */
    allowedRoots?: string[];
    /**
     * Anthropic client. Optional — the bare toolset needs no client; it is only
     * used by `setupSkills`, which (together with {@link AgentToolContext.session},
     * or the deprecated {@link AgentToolContext.sessionId}) downloads each of the
     * session agent's skills into `{workdir}/skills/<name>/`.
     */
    client?: Anthropic;
    /**
     * The already-fetched session whose agent's skills `setupSkills` downloads.
     * A session's resources cannot change while it runs, so the caller fetches it
     * once and shares that snapshot with the memory-store download; the two can
     * then never disagree about them.
     */
    session?: BetaManagedAgentsSession;
    /**
     * @deprecated `setupSkills` fetches the session itself when given only an id,
     * one extra round trip per context. Prefer {@link AgentToolContext.session}.
     * Kept for callers written before `session` existed; ignored when `session`
     * is set.
     */
    sessionId?: string;
    /**
     * Directories the write and edit tools refuse to modify, resolved at check
     * time exactly like `allowedRoots`. The worker sets this to the roots of
     * read-only memory stores so the agent sees the error at write time instead
     * of the change silently never syncing; the mechanism is generic to any
     * directory.
     */
    readOnlyRoots?: string[];
    /**
     * Optional environment for the bash subprocess. When unset, the bash tool
     * inherits the process environment with the runner's `ANTHROPIC_*`
     * credentials scrubbed. When provided, it FULLY REPLACES that default
     * environment — the mapping is used verbatim and is NOT merged with or added
     * to the scrubbed process environment. To keep the defaults plus extra vars,
     * build the combined mapping yourself before passing it.
     */
    env?: Record<string, string | undefined>;
    /**
     * Size cap for a whole-file `read` and for `edit`, which both load the whole
     * file into memory. A `read` with `view_range` on a larger file streams it and
     * applies the cap to the selected lines instead. `undefined` (default) uses the
     * built-in 256 KiB cap; a positive number sets a custom cap; `null` disables the
     * cap entirely. Disabling it reintroduces the OOM risk on a model-controlled
     * path, so pass `null` only when the sandbox can absorb arbitrarily large files.
     * The non-regular-file (FIFO/device) guard always applies regardless of this
     * value.
     */
    maxFileBytes?: number | null;
}
/**
 * Returns the `agent_toolset_20260401` implementations bound to `ctx`. The
 * result is a plain array of `BetaRunnableTool`; filter or extend it before
 * handing it to a tool runner:
 *
 * ```ts
 * const tools = [...betaAgentToolset20260401(ctx), myCustomTool];
 * const tools = betaAgentToolset20260401(ctx).filter((t) => t.name !== 'grep');
 * ```
 *
 * Concurrency note: `client.beta.sessions.events.toolRunner` dispatches a
 * session's tool calls serially (the sessions API delivers one `agent.tool_use`
 * at a time). `client.beta.messages.toolRunner` runs a turn's `tool.run` calls
 * via `Promise.all`. The toolset below is safe under either model —
 * {@link betaBashTool} serializes its persistent shell internally and the FS
 * tools are independent per call — but {@link betaEditTool}/{@link betaWriteTool}
 * cannot synchronize concurrent writes to the *same* file across processes, so a
 * multi-edit turn touching one path is still subject to inherent FS lost-update
 * races. Custom tools that close over mutable state should do their own queueing.
 */
export declare function betaAgentToolset20260401(ctx: AgentToolContext): BetaRunnableTool[];
/**
 * Resolve `p` against `ctx.workdir`; reject results outside `ctx.workdir` and
 * `ctx.allowedRoots`. Absolute and relative inputs go through the same
 * canonicalise-then-contain check — an absolute path that lands inside a
 * permitted root is accepted, only paths that resolve *outside* all of them
 * are rejected. Every symlink in `p` (including the leaf, even a dangling one)
 * is resolved before the check, and the resolved path is what the tool then
 * operates on, so a symlink inside the workdir that points outside it can
 * neither pass the check nor be followed afterwards. See the trust model on
 * {@link AgentToolContext}.
 *
 * Residual TOCTOU: a component could still be swapped for a symlink between this
 * call and the eventual `fs` operation. Closing that fully needs per-component
 * `O_NOFOLLOW`/`openat`, which Node does not expose ergonomically; the same
 * residual exposure exists in `tools/memory/node` and is why a sandbox is still
 * recommended for the toolset as a whole.
 */
export declare function resolvePath(ctx: AgentToolContext, p: string): Promise<string>;
/**
 * A persistent /bin/bash process. State (cwd, env, background jobs) survives
 * across exec() calls. Uses pipes rather than a PTY so input is never echoed.
 */
export declare class BashSession {
    #private;
    constructor(dir: string, env?: Record<string, string | undefined>);
    /** Whether the underlying shell process has exited. */
    get closed(): boolean;
    exec(command: string, opts?: {
        timeoutMs?: number;
        signal?: AbortSignal | null | undefined;
    }): Promise<{
        output: string;
        exitCode: number;
    }>;
    close(): void;
}
export declare function betaBashTool(ctx: AgentToolContext): BetaRunnableTool;
export declare function betaReadTool(ctx: AgentToolContext): BetaRunnableTool;
export declare function betaWriteTool(ctx: AgentToolContext): BetaRunnableTool;
export declare function betaEditTool(ctx: AgentToolContext): BetaRunnableTool;
export declare function betaGlobTool(ctx: AgentToolContext): BetaRunnableTool;
export declare function betaGrepTool(ctx: AgentToolContext): BetaRunnableTool;
//# sourceMappingURL=node.d.mts.map