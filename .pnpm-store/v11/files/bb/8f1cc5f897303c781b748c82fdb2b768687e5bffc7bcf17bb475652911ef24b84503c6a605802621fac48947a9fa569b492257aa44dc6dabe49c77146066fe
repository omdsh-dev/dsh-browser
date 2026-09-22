"use strict";
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
var _BashSession_instances, _BashSession_proc, _BashSession_buf, _BashSession_truncated, _BashSession_closed, _BashSession_waiting, _BashSession_append, _LineRangeCollector_instances, _LineRangeCollector_filePath, _LineRangeCollector_startLine, _LineRangeCollector_endLine, _LineRangeCollector_start, _LineRangeCollector_end, _LineRangeCollector_limit, _LineRangeCollector_line, _LineRangeCollector_collected, _LineRangeCollector_collectedBytes, _LineRangeCollector_collect, _LineRangeCollector_overLimitError;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BashSession = exports.BashTimeoutError = exports.MARKER_PATH = exports.MEMORY_FLUSH_TIMEOUT_MS = exports.MIN_MEMORY_SYNC_INTERVAL_MS = exports.DEFAULT_MEMORY_SYNC_INTERVAL_MS = exports.SessionMemoryError = exports.SessionMemoryStores = exports.extractSkillArchive = exports.setupSkills = void 0;
exports.betaAgentToolset20260401 = betaAgentToolset20260401;
exports.resolvePath = resolvePath;
exports.betaBashTool = betaBashTool;
exports.betaReadTool = betaReadTool;
exports.betaWriteTool = betaWriteTool;
exports.betaEditTool = betaEditTool;
exports.betaGlobTool = betaGlobTool;
exports.betaGrepTool = betaGrepTool;
const tslib_1 = require("../../internal/tslib.js");
const fs = tslib_1.__importStar(require("node:fs/promises"));
const fssync = tslib_1.__importStar(require("node:fs"));
const path = tslib_1.__importStar(require("node:path"));
const cp = tslib_1.__importStar(require("node:child_process"));
const crypto = tslib_1.__importStar(require("node:crypto"));
const readline = tslib_1.__importStar(require("node:readline"));
const error_1 = require("../../core/error.js");
const ToolError_1 = require("../../lib/tools/ToolError.js");
const json_schema_1 = require("../../helpers/beta/json-schema.js");
const promise_1 = require("../../internal/utils/promise.js");
const fs_util_1 = require("./fs-util.js");
var skills_1 = require("./skills.js");
Object.defineProperty(exports, "setupSkills", { enumerable: true, get: function () { return skills_1.setupSkills; } });
Object.defineProperty(exports, "extractSkillArchive", { enumerable: true, get: function () { return skills_1.extractSkillArchive; } });
var memories_1 = require("./memories.js");
Object.defineProperty(exports, "SessionMemoryStores", { enumerable: true, get: function () { return memories_1.SessionMemoryStores; } });
Object.defineProperty(exports, "SessionMemoryError", { enumerable: true, get: function () { return memories_1.SessionMemoryError; } });
Object.defineProperty(exports, "DEFAULT_MEMORY_SYNC_INTERVAL_MS", { enumerable: true, get: function () { return memories_1.DEFAULT_MEMORY_SYNC_INTERVAL_MS; } });
Object.defineProperty(exports, "MIN_MEMORY_SYNC_INTERVAL_MS", { enumerable: true, get: function () { return memories_1.MIN_MEMORY_SYNC_INTERVAL_MS; } });
Object.defineProperty(exports, "MEMORY_FLUSH_TIMEOUT_MS", { enumerable: true, get: function () { return memories_1.MEMORY_FLUSH_TIMEOUT_MS; } });
Object.defineProperty(exports, "MARKER_PATH", { enumerable: true, get: function () { return memories_1.MARKER_PATH; } });
const BASH_OUTPUT_LIMIT = 100 * 1024;
const BASH_DEFAULT_TIMEOUT_MS = 120000;
// Default size cap for the read/edit tools (both load the whole file into
// memory) when AgentToolContext.maxFileBytes is unset. The reject-vs-truncate
// behaviour remains a separate question pending CMA validation.
const DEFAULT_MAX_FILE_BYTES = 256 * 1024;
const READ_STREAM_CHUNK_BYTES = 64 * 1024;
const NEWLINE = Buffer.from('\n');
const GREP_OUTPUT_LIMIT = 100 * 1024;
const GREP_MAX_LINE_LENGTH = 2000;
const GLOB_RESULT_LIMIT = 200;
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
const ANSI_RE = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;
const fsGlob = fs.glob;
function resolveMaxBytes(configured) {
    return configured === undefined ? DEFAULT_MAX_FILE_BYTES : configured;
}
/**
 * Throw when the deprecated {@link AgentToolContext.unrestrictedPaths} was
 * passed at all. Nothing else reads that property.
 */
function rejectUnrestrictedPaths(value) {
    if (value === undefined)
        return;
    throw new error_1.AnthropicError('The `unrestrictedPaths` option you passed to the agent toolset (AgentToolContext) is no longer ' +
        "supported. The toolset's file tools (read, write, edit, glob, grep) are now always confined to " +
        'the working directory plus the directories listed in `allowedRoots`. Remove `unrestrictedPaths` ' +
        'from your context; to let the file tools reach any other directory, add it to `allowedRoots`.');
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
function betaAgentToolset20260401(ctx) {
    return [
        betaBashTool(ctx),
        betaReadTool(ctx),
        betaWriteTool(ctx),
        betaEditTool(ctx),
        betaGlobTool(ctx),
        betaGrepTool(ctx),
    ];
}
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
async function resolvePath(ctx, p) {
    rejectUnrestrictedPaths(ctx.unrestrictedPaths);
    return (0, fs_util_1.confineToRoot)(ctx.workdir, p, { allowedRoots: ctx.allowedRoots ?? [] });
}
/**
 * The read-only root `target` falls under, or `undefined`. `target` arrives
 * fully canonicalized (from {@link resolvePath}), so each root is
 * canonicalized too — a root recorded through a symlinked workdir must still
 * match the resolved write target.
 */
function readOnlyRootFor(ctx, target) {
    return (0, fs_util_1.containingRoot)(ctx.readOnlyRoots ?? [], target);
}
// ---- bash ----------------------------------------------------------------
/**
 * Build the environment for the spawned bash shell. The runner process holds
 * Anthropic credentials in `ANTHROPIC_*` env vars — the API key, the auth token,
 * and the per-work session token among them. `bash` runs an unrestricted shell,
 * so any command the agent runs could read those straight out of `process.env`;
 * strip the whole `ANTHROPIC_*` namespace from the child's environment.
 * Everything else (PATH, HOME, locale, …) is passed through unchanged.
 *
 * Passing an explicit `env` to {@link AgentToolContext} does NOT add to this
 * default — it FULLY REPLACES it. The provided mapping becomes the entire bash
 * environment verbatim; nothing here is merged in, so callers who want the
 * scrubbed process environment plus extras must build that mapping themselves.
 */
function scrubbedShellEnv() {
    const env = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith('ANTHROPIC_'))
            continue;
        env[key] = value;
    }
    return env;
}
/**
 * A persistent /bin/bash process. State (cwd, env, background jobs) survives
 * across exec() calls. Uses pipes rather than a PTY so input is never echoed.
 */
class BashSession {
    constructor(dir, env = scrubbedShellEnv()) {
        _BashSession_instances.add(this);
        _BashSession_proc.set(this, void 0);
        _BashSession_buf.set(this, '');
        _BashSession_truncated.set(this, false);
        _BashSession_closed.set(this, false);
        // While a command is in flight, the resolver to fire once its sentinel lands
        // in `#buf` (or once the shell dies). Event-driven: no polling loop.
        _BashSession_waiting.set(this, null);
        tslib_1.__classPrivateFieldSet(this, _BashSession_proc, cp.spawn('/bin/bash', ['--noprofile', '--norc'], {
            cwd: dir,
            // `env` is the full base environment (the scrubbed process env by
            // default, or the verbatim replacement from `AgentToolContext.env`).
            // PS1/PS2/TERM are shell-control settings BashSession always applies so
            // the pipe-based sentinel exec parsing works — not part of the
            // user-facing environment.
            env: { ...env, PS1: '', PS2: '', TERM: 'dumb' },
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: true,
        }), "f");
        tslib_1.__classPrivateFieldGet(this, _BashSession_proc, "f").stdout.setEncoding('utf8');
        tslib_1.__classPrivateFieldGet(this, _BashSession_proc, "f").stderr.setEncoding('utf8');
        tslib_1.__classPrivateFieldGet(this, _BashSession_proc, "f").stdout.on('data', (d) => tslib_1.__classPrivateFieldGet(this, _BashSession_instances, "m", _BashSession_append).call(this, d));
        tslib_1.__classPrivateFieldGet(this, _BashSession_proc, "f").stderr.on('data', (d) => tslib_1.__classPrivateFieldGet(this, _BashSession_instances, "m", _BashSession_append).call(this, d));
        tslib_1.__classPrivateFieldGet(this, _BashSession_proc, "f").once('close', () => {
            tslib_1.__classPrivateFieldSet(this, _BashSession_closed, true, "f");
            // Wake any in-flight exec so it fails fast instead of waiting for its deadline.
            const w = tslib_1.__classPrivateFieldGet(this, _BashSession_waiting, "f");
            tslib_1.__classPrivateFieldSet(this, _BashSession_waiting, null, "f");
            w?.resolve();
        });
    }
    /** Whether the underlying shell process has exited. */
    get closed() {
        return tslib_1.__classPrivateFieldGet(this, _BashSession_closed, "f");
    }
    async exec(command, opts = {}) {
        if (tslib_1.__classPrivateFieldGet(this, _BashSession_closed, "f")) {
            throw new error_1.AnthropicError('bash session terminated');
        }
        const timeoutMs = opts.timeoutMs ?? BASH_DEFAULT_TIMEOUT_MS;
        const signal = opts.signal;
        // Reject with the signal's own reason, so a caller telling a user cancel
        // apart from an `AbortSignal.timeout()` sees the platform's name intact.
        signal?.throwIfAborted();
        tslib_1.__classPrivateFieldSet(this, _BashSession_buf, '', "f");
        tslib_1.__classPrivateFieldSet(this, _BashSession_truncated, false, "f");
        // Per-call nonce so a command that prints a fixed marker can't spoof the
        // exit-code framing. The `''` split keeps the literal out of what we write
        // to stdin — only the shell's printf reassembles it.
        const sentinel = `__ANT_CMD_${crypto.randomUUID()}_DONE__`;
        const sentinelSplit = `${sentinel.slice(0, 8)}''${sentinel.slice(8)}`;
        // </dev/null: a stdin-reading command (`cat`, `read`) gets EOF instead of
        // blocking on the shared pipe until the timeout.
        const wrapped = `{ ${command}\n} </dev/null 2>&1; printf '\\n${sentinelSplit}%d\\n' $?\n`;
        tslib_1.__classPrivateFieldGet(this, _BashSession_proc, "f").stdin.write(wrapped);
        if (tslib_1.__classPrivateFieldGet(this, _BashSession_buf, "f").indexOf(sentinel) < 0) {
            // Park until the sentinel lands, the deadline passes, the caller aborts,
            // or the shell dies — whichever comes first. `#append` (and the `close`
            // handler) resolve `sentinelSeen`; the deadline / abort reject.
            const { promise: sentinelSeen, resolve } = (0, promise_1.promiseWithResolvers)();
            tslib_1.__classPrivateFieldSet(this, _BashSession_waiting, { sentinel, resolve }, "f");
            let timer;
            let onAbort;
            try {
                await Promise.race([
                    sentinelSeen,
                    new Promise((_, reject) => {
                        timer = setTimeout(() => reject(new BashTimeoutError(timeoutMs)), timeoutMs);
                    }),
                    new Promise((_, reject) => {
                        if (!signal)
                            return;
                        onAbort = () => reject(signal.reason);
                        signal.addEventListener('abort', onAbort, { once: true });
                    }),
                ]);
            }
            finally {
                if (timer)
                    clearTimeout(timer);
                if (onAbort && signal)
                    signal.removeEventListener('abort', onAbort);
                tslib_1.__classPrivateFieldSet(this, _BashSession_waiting, null, "f");
            }
        }
        const idx = tslib_1.__classPrivateFieldGet(this, _BashSession_buf, "f").indexOf(sentinel);
        if (idx < 0) {
            // The shell closed (or was killed) before emitting the sentinel.
            throw new error_1.AnthropicError('bash session terminated');
        }
        const tail = tslib_1.__classPrivateFieldGet(this, _BashSession_buf, "f").slice(idx + sentinel.length);
        const m = tail.match(/^(-?\d+)/);
        const exitCode = m ? parseInt(m[1], 10) : -1;
        let out = tslib_1.__classPrivateFieldGet(this, _BashSession_buf, "f").slice(0, idx).replace(ANSI_RE, '').replace(/\n+$/, '');
        if (tslib_1.__classPrivateFieldGet(this, _BashSession_truncated, "f")) {
            out = `[output truncated]\n${out}`;
        }
        return { output: out, exitCode };
    }
    close() {
        if (tslib_1.__classPrivateFieldGet(this, _BashSession_closed, "f"))
            return;
        tslib_1.__classPrivateFieldSet(this, _BashSession_closed, true, "f");
        const w = tslib_1.__classPrivateFieldGet(this, _BashSession_waiting, "f");
        tslib_1.__classPrivateFieldSet(this, _BashSession_waiting, null, "f");
        w?.resolve();
        tslib_1.__classPrivateFieldGet(this, _BashSession_proc, "f").stdout.destroy();
        tslib_1.__classPrivateFieldGet(this, _BashSession_proc, "f").stderr.destroy();
        tslib_1.__classPrivateFieldGet(this, _BashSession_proc, "f").stdin.destroy();
        try {
            // Negative PID targets the process group so foreground jobs (e.g. a
            // hung sleep) die with the shell.
            process.kill(-tslib_1.__classPrivateFieldGet(this, _BashSession_proc, "f").pid, 'SIGKILL');
        }
        catch {
            tslib_1.__classPrivateFieldGet(this, _BashSession_proc, "f").kill('SIGKILL');
        }
        tslib_1.__classPrivateFieldGet(this, _BashSession_proc, "f").unref();
    }
}
exports.BashSession = BashSession;
_BashSession_proc = new WeakMap(), _BashSession_buf = new WeakMap(), _BashSession_truncated = new WeakMap(), _BashSession_closed = new WeakMap(), _BashSession_waiting = new WeakMap(), _BashSession_instances = new WeakSet(), _BashSession_append = function _BashSession_append(d) {
    tslib_1.__classPrivateFieldSet(this, _BashSession_buf, tslib_1.__classPrivateFieldGet(this, _BashSession_buf, "f") + d, "f");
    if (tslib_1.__classPrivateFieldGet(this, _BashSession_buf, "f").length > BASH_OUTPUT_LIMIT) {
        tslib_1.__classPrivateFieldSet(this, _BashSession_buf, tslib_1.__classPrivateFieldGet(this, _BashSession_buf, "f").slice(tslib_1.__classPrivateFieldGet(this, _BashSession_buf, "f").length - BASH_OUTPUT_LIMIT), "f");
        tslib_1.__classPrivateFieldSet(this, _BashSession_truncated, true, "f");
    }
    if (tslib_1.__classPrivateFieldGet(this, _BashSession_waiting, "f") && tslib_1.__classPrivateFieldGet(this, _BashSession_buf, "f").indexOf(tslib_1.__classPrivateFieldGet(this, _BashSession_waiting, "f").sentinel) >= 0) {
        const w = tslib_1.__classPrivateFieldGet(this, _BashSession_waiting, "f");
        tslib_1.__classPrivateFieldSet(this, _BashSession_waiting, null, "f");
        w.resolve();
    }
};
function betaBashTool(ctx) {
    rejectUnrestrictedPaths(ctx.unrestrictedPaths);
    let session;
    // Concurrent run() callers chain onto this promise so writes to the shared
    // shell's stdin can't interleave (which would corrupt the sentinel-match
    // exit-code parsing in BashSession.exec). Each call replaces `tail` with a
    // promise that resolves only after its own exec settles.
    let tail = Promise.resolve();
    return (0, json_schema_1.betaTool)({
        name: 'bash',
        description: 'Run a bash command in a persistent shell. State (cwd, env vars) persists across calls.',
        inputSchema: {
            type: 'object',
            properties: {
                command: { type: 'string', description: 'The command to run' },
                restart: { type: 'boolean', description: 'Restart the persistent shell before running' },
                timeout_ms: { type: 'integer', description: 'Per-call timeout in milliseconds' },
            },
        },
        run: async ({ command, restart, timeout_ms }, context) => {
            const prev = tail;
            const gate = (0, promise_1.promiseWithResolvers)();
            tail = gate.promise;
            // Swallow prior rejections — earlier callers got their own error path;
            // we just need to wait for the shell to be free.
            try {
                await prev;
            }
            catch {
                // ignore
            }
            try {
                if (restart) {
                    session?.close();
                    session = undefined;
                }
                if (!command) {
                    if (restart)
                        return 'bash session restarted';
                    throw new ToolError_1.ToolError('bash: command is required');
                }
                session ?? (session = new BashSession(ctx.workdir, ctx.env));
                try {
                    const { output, exitCode } = await session.exec(command, {
                        timeoutMs: timeout_ms ?? BASH_DEFAULT_TIMEOUT_MS,
                        signal: context?.signal,
                    });
                    if (exitCode !== 0)
                        throw new ToolError_1.ToolError(output || `exit ${exitCode}`);
                    return output;
                }
                catch (e) {
                    if (e instanceof ToolError_1.ToolError)
                        throw e;
                    // Timeout, abort, or terminated: the still-running command will emit
                    // a stale sentinel, so discard this session and let the next call
                    // start fresh.
                    session.close();
                    session = undefined;
                    throw new ToolError_1.ToolError(`bash: ${e instanceof Error ? e.message : String(e)}`);
                }
            }
            finally {
                gate.resolve();
            }
        },
        close: () => {
            session?.close();
            session = undefined;
        },
    });
}
// ---- fs ------------------------------------------------------------------
function betaReadTool(ctx) {
    rejectUnrestrictedPaths(ctx.unrestrictedPaths);
    return (0, json_schema_1.betaTool)({
        name: 'read',
        description: 'Read a UTF-8 text file relative to the workdir.',
        inputSchema: {
            type: 'object',
            properties: {
                file_path: { type: 'string' },
                view_range: {
                    type: 'array',
                    items: { type: 'integer' },
                    description: '[start_line, end_line] 1-indexed inclusive',
                },
            },
            required: ['file_path'],
        },
        run: async ({ file_path, view_range }) => {
            if (!file_path)
                throw new ToolError_1.ToolError('read: file_path is required');
            const abs = await resolvePath(ctx, file_path);
            if (view_range?.length && view_range.length !== 2) {
                throw new ToolError_1.ToolError('read: view_range must be [start_line, end_line]');
            }
            let data;
            try {
                // stat() before any open(): the size cap stops a multi-GB file from
                // OOM'ing the runner, and isFile() rejects FIFOs/devices/dirs without
                // opening them (open() on an unconnected FIFO blocks indefinitely).
                const st = await fs.stat(abs);
                if (!st.isFile()) {
                    throw new ToolError_1.ToolError(`read: ${file_path} is not a regular file`);
                }
                const limit = resolveMaxBytes(ctx.maxFileBytes);
                if (limit !== null && st.size > limit) {
                    if (!view_range?.length) {
                        throw new ToolError_1.ToolError(`read: ${file_path} is ${st.size} bytes, exceeds ${limit}-byte limit. ` +
                            'Use the view_range parameter to read specific line ranges, e.g. view_range: [1, 500].');
                    }
                    const [startLine, endLine] = view_range;
                    return await readRangeStreaming(abs, file_path, startLine, endLine, limit);
                }
                data = await fs.readFile(abs, 'utf8');
            }
            catch (e) {
                if (e instanceof ToolError_1.ToolError)
                    throw e;
                throw new ToolError_1.ToolError(`read: ${(0, fs_util_1.fsErrorMessage)(e, file_path)}`);
            }
            if (!view_range?.length)
                return data;
            const [startLine, endLine] = view_range;
            const lines = data.split('\n');
            const start = Math.max(0, startLine - 1);
            const end = endLine > 0 ? endLine : lines.length;
            return lines.slice(start, end).join('\n');
        },
    });
}
/** Returns lines `[startLine, endLine]` of the file at `abs`, capping the selected bytes at `limit`. */
async function readRangeStreaming(abs, filePath, startLine, endLine, limit) {
    const lines = new LineRangeCollector(filePath, startLine, endLine, limit);
    if (lines.rangeIsEmpty())
        return '';
    // Byte chunks rather than readline: a single huge line must never be buffered
    // whole, so memory stays bounded by `limit` plus one chunk.
    const stream = fssync.createReadStream(abs, { highWaterMark: READ_STREAM_CHUNK_BYTES });
    try {
        for await (const chunk of stream) {
            lines.collectFrom(chunk);
            if (lines.rangeIsCollected())
                break;
        }
    }
    finally {
        stream.destroy();
    }
    return lines.text();
}
/** Collects the bytes of lines `[startLine, endLine]` from consecutive file chunks, capped at `limit`. */
class LineRangeCollector {
    constructor(filePath, startLine, endLine, limit) {
        _LineRangeCollector_instances.add(this);
        _LineRangeCollector_filePath.set(this, void 0);
        _LineRangeCollector_startLine.set(this, void 0);
        _LineRangeCollector_endLine.set(this, void 0);
        _LineRangeCollector_start.set(this, void 0);
        _LineRangeCollector_end.set(this, void 0);
        _LineRangeCollector_limit.set(this, void 0);
        _LineRangeCollector_line.set(this, 0);
        _LineRangeCollector_collected.set(this, []);
        _LineRangeCollector_collectedBytes.set(this, 0);
        tslib_1.__classPrivateFieldSet(this, _LineRangeCollector_filePath, filePath, "f");
        tslib_1.__classPrivateFieldSet(this, _LineRangeCollector_startLine, startLine, "f");
        tslib_1.__classPrivateFieldSet(this, _LineRangeCollector_endLine, endLine, "f");
        tslib_1.__classPrivateFieldSet(this, _LineRangeCollector_start, Math.max(0, startLine - 1), "f");
        tslib_1.__classPrivateFieldSet(this, _LineRangeCollector_end, endLine > 0 ? endLine : Infinity, "f");
        tslib_1.__classPrivateFieldSet(this, _LineRangeCollector_limit, limit, "f");
    }
    rangeIsEmpty() {
        return tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_end, "f") <= tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_start, "f");
    }
    rangeIsCollected() {
        return tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_line, "f") >= tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_end, "f");
    }
    collectFrom(chunk) {
        var _a;
        let lineStart = 0;
        while (lineStart < chunk.length && !this.rangeIsCollected()) {
            const newline = chunk.indexOf(0x0a, lineStart);
            const lineEnd = newline < 0 ? chunk.length : newline;
            if (tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_line, "f") >= tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_start, "f")) {
                tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_instances, "m", _LineRangeCollector_collect).call(this, chunk.subarray(lineStart, lineEnd), newline >= 0);
            }
            if (newline < 0)
                break;
            tslib_1.__classPrivateFieldSet(this, _LineRangeCollector_line, (_a = tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_line, "f"), _a++, _a), "f");
            lineStart = newline + 1;
        }
    }
    text() {
        return Buffer.concat(tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_collected, "f"), tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_collectedBytes, "f")).toString('utf8');
    }
}
_LineRangeCollector_filePath = new WeakMap(), _LineRangeCollector_startLine = new WeakMap(), _LineRangeCollector_endLine = new WeakMap(), _LineRangeCollector_start = new WeakMap(), _LineRangeCollector_end = new WeakMap(), _LineRangeCollector_limit = new WeakMap(), _LineRangeCollector_line = new WeakMap(), _LineRangeCollector_collected = new WeakMap(), _LineRangeCollector_collectedBytes = new WeakMap(), _LineRangeCollector_instances = new WeakSet(), _LineRangeCollector_collect = function _LineRangeCollector_collect(lineBytes, newlineTerminated) {
    tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_collected, "f").push(lineBytes);
    tslib_1.__classPrivateFieldSet(this, _LineRangeCollector_collectedBytes, tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_collectedBytes, "f") + lineBytes.length, "f");
    if (newlineTerminated && tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_line, "f") + 1 < tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_end, "f")) {
        tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_collected, "f").push(NEWLINE);
        tslib_1.__classPrivateFieldSet(this, _LineRangeCollector_collectedBytes, tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_collectedBytes, "f") + NEWLINE.length, "f");
    }
    if (tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_collectedBytes, "f") > tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_limit, "f"))
        throw tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_instances, "m", _LineRangeCollector_overLimitError).call(this);
}, _LineRangeCollector_overLimitError = function _LineRangeCollector_overLimitError() {
    if (tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_end, "f") - tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_start, "f") === 1) {
        return new ToolError_1.ToolError(`read: line ${tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_start, "f") + 1} of ${tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_filePath, "f")} alone exceeds ${tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_limit, "f")}-byte limit. ` +
            'The read tool cannot return part of a line, so view_range cannot narrow this further.');
    }
    return new ToolError_1.ToolError(`read: view_range [${tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_startLine, "f")}, ${tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_endLine, "f")}] of ${tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_filePath, "f")} exceeds ${tslib_1.__classPrivateFieldGet(this, _LineRangeCollector_limit, "f")}-byte limit. ` +
        'Narrow the view_range to read a smaller portion.');
};
function betaWriteTool(ctx) {
    rejectUnrestrictedPaths(ctx.unrestrictedPaths);
    return (0, json_schema_1.betaTool)({
        name: 'write',
        description: 'Write a UTF-8 text file relative to the workdir, creating parent directories as needed.',
        inputSchema: {
            type: 'object',
            properties: { file_path: { type: 'string' }, content: { type: 'string' } },
            required: ['file_path', 'content'],
        },
        run: async ({ file_path, content }) => {
            if (!file_path)
                throw new ToolError_1.ToolError('write: file_path is required');
            const abs = await resolvePath(ctx, file_path);
            const ro = await readOnlyRootFor(ctx, abs);
            if (ro !== undefined) {
                throw new ToolError_1.ToolError(`write: ${file_path} is inside read-only directory ${ro}`);
            }
            try {
                await fs.mkdir(path.dirname(abs), { recursive: true, mode: fs_util_1.DIR_CREATE_MODE });
                await (0, fs_util_1.atomicWriteFile)(abs, content ?? '');
            }
            catch (e) {
                throw new ToolError_1.ToolError(`write: ${(0, fs_util_1.fsErrorMessage)(e, file_path)}`);
            }
            return `wrote ${Buffer.byteLength(content ?? '')} bytes to ${file_path}`;
        },
    });
}
function betaEditTool(ctx) {
    rejectUnrestrictedPaths(ctx.unrestrictedPaths);
    return (0, json_schema_1.betaTool)({
        name: 'edit',
        description: 'Replace old_string with new_string in a file. old_string must be unique unless replace_all.',
        inputSchema: {
            type: 'object',
            properties: {
                file_path: { type: 'string' },
                old_string: { type: 'string' },
                new_string: { type: 'string' },
                replace_all: { type: 'boolean' },
            },
            required: ['file_path', 'old_string', 'new_string'],
        },
        run: async ({ file_path, old_string, new_string, replace_all }) => {
            if (!file_path)
                throw new ToolError_1.ToolError('edit: file_path is required');
            if (!old_string)
                throw new ToolError_1.ToolError('edit: old_string is required');
            const abs = await resolvePath(ctx, file_path);
            const ro = await readOnlyRootFor(ctx, abs);
            if (ro !== undefined) {
                throw new ToolError_1.ToolError(`edit: ${file_path} is inside read-only directory ${ro}`);
            }
            let data;
            try {
                // stat() before any open() — same guard as `read`: the size cap stops a
                // multi-GB file from OOM'ing the runner, and isFile() rejects
                // FIFOs/devices/dirs without opening them (open() on an unconnected FIFO
                // blocks indefinitely). The edit path is model-controlled, so it needs
                // the same bound `read` already has.
                const st = await fs.stat(abs);
                if (!st.isFile()) {
                    throw new ToolError_1.ToolError(`edit: ${file_path} is not a regular file`);
                }
                const limit = resolveMaxBytes(ctx.maxFileBytes);
                if (limit !== null && st.size > limit) {
                    throw new ToolError_1.ToolError(`edit: ${file_path} is ${st.size} bytes, exceeds ${limit}-byte limit. ` +
                        'The edit tool loads the whole file and cannot modify a file this large.');
                }
                data = await fs.readFile(abs, 'utf8');
            }
            catch (e) {
                if (e instanceof ToolError_1.ToolError)
                    throw e;
                throw new ToolError_1.ToolError(`edit: ${(0, fs_util_1.fsErrorMessage)(e, file_path)}`);
            }
            const count = data.split(old_string).length - 1;
            if (count === 0)
                throw new ToolError_1.ToolError(`edit: old_string not found in ${file_path}`);
            let updated;
            if (replace_all) {
                updated = data.split(old_string).join(new_string);
            }
            else {
                if (count > 1)
                    throw new ToolError_1.ToolError(`edit: old_string appears ${count} times in ${file_path} (must be unique)`);
                // Callback form so `$&`/`$1`/`` $` `` in new_string are inserted
                // literally instead of expanded as replacement patterns.
                updated = data.replace(old_string, () => new_string);
            }
            try {
                await (0, fs_util_1.atomicWriteFile)(abs, updated);
            }
            catch (e) {
                throw new ToolError_1.ToolError(`edit: write: ${(0, fs_util_1.fsErrorMessage)(e, file_path)}`);
            }
            return `edited ${file_path} (${replace_all ? count : 1} replacement(s))`;
        },
    });
}
// ---- search --------------------------------------------------------------
/**
 * Best-effort: stops `fs.glob` from walking out of the root via a literal or
 * brace-expanded `..`. The realpath post-filter in {@link betaGlobTool} is the
 * boundary; this only avoids the walk.
 */
function patternCanAscend(pattern) {
    return pattern.split(/[\\/{},]/).includes('..');
}
function betaGlobTool(ctx) {
    rejectUnrestrictedPaths(ctx.unrestrictedPaths);
    return (0, json_schema_1.betaTool)({
        name: 'glob',
        description: 'Match files under the workdir against a glob pattern. Results are mtime-sorted, newest first.',
        inputSchema: {
            type: 'object',
            properties: {
                pattern: { type: 'string' },
                path: { type: 'string', description: 'Directory to search in. Defaults to the workdir.' },
            },
            required: ['pattern'],
        },
        run: async ({ pattern, path: searchPath }) => {
            if (!pattern)
                throw new ToolError_1.ToolError('glob: pattern is required');
            if (path.isAbsolute(pattern)) {
                throw new ToolError_1.ToolError('glob: absolute pattern not permitted; pass a relative pattern (and optionally path)');
            }
            if (patternCanAscend(pattern)) {
                throw new ToolError_1.ToolError('glob: ".." is not permitted in the pattern');
            }
            const root = searchPath ? await resolvePath(ctx, searchPath) : path.resolve(ctx.workdir);
            // Compare canonical against canonical: a workdir that is itself a
            // symlink would otherwise falsely reject every realpath'd match below.
            const realRoot = searchPath ? root : await (0, fs_util_1.canonicalize)(root);
            const matches = [];
            // Bounds the walk for patterns that match, or brace-expand into,
            // enormous trees.
            let remaining = WALK_MAX_ENTRIES;
            try {
                // Native `fs.glob` (Node 22+). `exclude` prunes the noisy dirs the
                // legacy walker skipped; only regular files are collected.
                for await (const entry of fsGlob(pattern, {
                    cwd: root,
                    withFileTypes: true,
                    exclude: (d) => d.name === '.git' || d.name === 'node_modules',
                })) {
                    if (remaining-- <= 0)
                        break;
                    if (!entry.isFile())
                        continue;
                    const full = path.join(entry.parentPath, entry.name);
                    // Drop any match that resolves outside the search root. A pattern
                    // that *names* a symlinked directory (the model controls the
                    // pattern, and the bash tool in the same session can plant the
                    // link) makes `fs.glob` descend through it and report entries with
                    // the raw parent path, so a lexical check on `full` alone would
                    // pass `root/link_out/secret` even though it lives outside the
                    // jail. Resolve-failure (ELOOP, EACCES, a racing unlink) is a deny.
                    let real;
                    try {
                        real = await fs.realpath(full);
                    }
                    catch {
                        continue;
                    }
                    if (!(0, fs_util_1.isWithin)(realRoot, real))
                        continue;
                    let mtime = 0;
                    try {
                        mtime = (await fs.stat(full)).mtimeMs;
                    }
                    catch {
                        // unreadable — keep it in the list with mtime 0
                    }
                    matches.push({ path: full, mtime });
                }
            }
            catch (e) {
                throw new ToolError_1.ToolError(`glob: ${e instanceof Error ? e.message : String(e)}`);
            }
            if (matches.length === 0)
                return 'no matches';
            matches.sort((a, b) => b.mtime - a.mtime);
            return matches
                .slice(0, GLOB_RESULT_LIMIT)
                .map((m) => m.path)
                .join('\n');
        },
    });
}
function betaGrepTool(ctx) {
    rejectUnrestrictedPaths(ctx.unrestrictedPaths);
    return (0, json_schema_1.betaTool)({
        name: 'grep',
        description: 'Search file contents for a regex. Uses ripgrep if available, otherwise a built-in walker.',
        inputSchema: {
            type: 'object',
            properties: { pattern: { type: 'string' }, path: { type: 'string' } },
            required: ['pattern'],
        },
        run: async ({ pattern, path: p }, context) => {
            if (!pattern)
                throw new ToolError_1.ToolError('grep: pattern is required');
            let searchPath = path.resolve(ctx.workdir);
            if (p)
                searchPath = await resolvePath(ctx, p);
            const rg = await findRg();
            return rg ?
                runRipgrep(rg, pattern, searchPath, context?.signal)
                : runWalkGrep(pattern, searchPath, context?.signal);
        },
    });
}
function runRipgrep(rg, pattern, searchPath, signal) {
    return new Promise((resolve, reject) => {
        const proc = cp.spawn(rg, ['-n', '--no-heading', '-e', pattern, '--', searchPath], {
            ...(signal ? { signal } : {}),
        });
        let out = '';
        let errOut = '';
        let truncated = false;
        proc.stdout.on('data', (d) => {
            if (truncated)
                return;
            out += d;
            if (out.length > GREP_OUTPUT_LIMIT) {
                truncated = true;
                out = out.slice(0, GREP_OUTPUT_LIMIT);
                proc.kill('SIGKILL');
            }
        });
        proc.stderr.on('data', (d) => (errOut += d));
        proc.on('close', (code) => {
            if (signal?.aborted)
                return reject(new ToolError_1.ToolError('grep: aborted'));
            if (truncated)
                return resolve(out + `\n[output truncated at ${GREP_OUTPUT_LIMIT} bytes]`);
            if (code === 0)
                return resolve(out);
            if (code === 1)
                return resolve('no matches');
            reject(new ToolError_1.ToolError(`grep: rg failed: ${errOut || `exit ${code}`}`));
        });
        proc.on('error', (e) => {
            if (signal?.aborted)
                return reject(new ToolError_1.ToolError('grep: aborted'));
            reject(new ToolError_1.ToolError(`grep: rg failed: ${e.message}`));
        });
    });
}
async function runWalkGrep(pattern, root, signal) {
    let re;
    try {
        re = new RegExp(pattern);
    }
    catch (e) {
        throw new ToolError_1.ToolError(`grep: invalid regex: ${e instanceof Error ? e.message : String(e)}`);
    }
    const hits = [];
    let budget = GREP_OUTPUT_LIMIT;
    const push = (line) => {
        budget -= line.length + 1;
        if (budget < 0) {
            hits.push(`[output truncated at ${GREP_OUTPUT_LIMIT} bytes]`);
            return false;
        }
        hits.push(line);
        return true;
    };
    const stat = await fs.stat(root).catch(() => null);
    if (stat?.isFile()) {
        await grepFile(root, re, push);
    }
    else {
        await walk(root, '', (rel) => grepFile(path.join(root, rel), re, push), signal);
    }
    if (signal?.aborted)
        throw new ToolError_1.ToolError('grep: aborted');
    if (hits.length === 0)
        return 'no matches';
    return hits.join('\n');
}
async function grepFile(file, re, push) {
    const stream = fssync.createReadStream(file, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let i = 0;
    try {
        for await (const line of rl) {
            i++;
            // Cap line length: `pattern` is model-supplied and JS regexes backtrack,
            // so a pathological pattern against a very long line is a ReDoS.
            if (line.length > GREP_MAX_LINE_LENGTH)
                continue;
            if (re.test(line) && !push(`${file}:${i}:${line}`))
                return false;
        }
    }
    catch {
        // unreadable / binary
    }
    finally {
        stream.destroy();
    }
    return true;
}
// ---- utils ---------------------------------------------------------------
const WALK_MAX_DEPTH = 40;
const WALK_MAX_ENTRIES = 50000;
/**
 * Bounded recursive walk. `fn` may return `false` to abort. Only real
 * directories are descended into and only real files are handed to `fn` —
 * symlinks (and devices/fifos/sockets) are skipped entirely so a symlink inside
 * the root cannot be followed out of it.
 */
async function walk(root, rel, fn, signal) {
    let remaining = WALK_MAX_ENTRIES;
    async function inner(rel, depth) {
        if (depth > WALK_MAX_DEPTH)
            return true;
        if (signal?.aborted)
            return false;
        let entries;
        try {
            entries = await fs.readdir(path.join(root, rel), { withFileTypes: true });
        }
        catch {
            return true;
        }
        for (const e of entries) {
            if (e.name === '.git' || e.name === 'node_modules')
                continue;
            if (remaining-- <= 0)
                return false;
            if (signal?.aborted)
                return false;
            const childRel = rel ? path.join(rel, e.name) : e.name;
            if (e.isDirectory()) {
                if (!(await inner(childRel, depth + 1)))
                    return false;
            }
            else if (e.isFile()) {
                if ((await fn(childRel)) === false)
                    return false;
            }
            // Symlinks, devices, fifos and sockets are intentionally skipped.
        }
        return true;
    }
    await inner(rel, 0);
}
async function findRg() {
    const dirs = (process.env['PATH'] ?? '').split(path.delimiter);
    for (const d of dirs) {
        const candidate = path.join(d, 'rg');
        try {
            await fs.access(candidate, fssync.constants.X_OK);
            return candidate;
        }
        catch {
            // not here
        }
    }
    return null;
}
//# sourceMappingURL=node.js.map