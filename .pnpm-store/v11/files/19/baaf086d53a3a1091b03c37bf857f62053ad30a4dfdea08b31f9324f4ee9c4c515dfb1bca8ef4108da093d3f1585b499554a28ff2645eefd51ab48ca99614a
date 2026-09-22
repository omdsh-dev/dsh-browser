import type { Anthropic } from "../../client.js";
import type { BetaManagedAgentsAgentCustomToolUseEvent, BetaManagedAgentsAgentToolUseEvent, BetaManagedAgentsUserCustomToolResultEventParams, BetaManagedAgentsUserToolResultEventParams } from "../../resources/beta/sessions/events.js";
import { type BetaRunnableTool } from "./BetaRunnableTool.js";
import type { BetaToolRunnerRequestOptions } from "./BetaToolRunner.js";
/** Beta header for the managed-agents API. */
export declare const MANAGED_AGENTS_BETA = "managed-agents-2026-04-01";
/**
 * A tool-call event the runner dispatches against the local registry: either a
 * builtin `agent.tool_use` (answered with `user.tool_result`) or a custom
 * `agent.custom_tool_use` (answered with `user.custom_tool_result`). Server-side
 * `agent.mcp_tool_use` calls are intentionally excluded — the runner does not
 * handle them.
 */
type DispatchedToolUseEvent = BetaManagedAgentsAgentToolUseEvent | BetaManagedAgentsAgentCustomToolUseEvent;
/**
 * The result-event params paired with a {@link DispatchedToolUseEvent}: a
 * `user.tool_result` answers an `agent.tool_use`, a `user.custom_tool_result`
 * answers an `agent.custom_tool_use`. The two pairs must be matched exactly.
 */
type DispatchedToolResultParams = BetaManagedAgentsUserToolResultEventParams | BetaManagedAgentsUserCustomToolResultEventParams;
export interface SessionToolRunnerOptions {
    client: Anthropic;
    /**
     * Tools to expose to the session, in the same {@link BetaRunnableTool} shape
     * `client.beta.messages.toolRunner` accepts. Use
     * `betaAgentToolset20260401({ workdir })` from
     * `@anthropic-ai/sdk/tools/agent-toolset/node` for the standard
     * `agent_toolset_20260401` set; filter or extend the array to customise.
     */
    tools: Array<BetaRunnableTool>;
    /**
     * Once the session goes idle with `stop_reason.type === "end_turn"`, the
     * runner keeps running for this many milliseconds before stopping; any new
     * event resets the countdown and it re-arms on the next `end_turn` idle. The
     * countdown is deferred while a confirmation-gated call is held or still
     * dispatching, and starts fresh once the last one resolves.
     * Defaults to {@link DEFAULT_MAX_IDLE_MS} (60s). `0` (or negative) disables
     * it — the runner then only stops on session termination or the consumer
     * breaking out / aborting.
     */
    maxIdleMs?: number;
    /** External abort signal. Aborting it ends the iteration. */
    signal?: AbortSignal;
    /**
     * Extra per-request options merged into every call this runner issues
     * (event stream / list / send). Mirrors what `client.beta.messages.toolRunner`
     * accepts: custom `headers` (e.g. a proxy's auth/routing headers) reach the
     * poll/heartbeat/stop/stream/list/send calls. The runner always owns the abort
     * signal, so a `signal` here is ignored — pass {@link SessionToolRunnerOptions.signal}
     * to abort externally.
     */
    requestOptions?: BetaToolRunnerRequestOptions;
}
/** Default {@link SessionToolRunnerOptions.maxIdleMs}: 60 seconds. */
export declare const DEFAULT_MAX_IDLE_MS = 60000;
/**
 * Outcome of a single tool execution dispatched by {@link SessionToolRunner}.
 *
 * Yielded after the tool ran (or failed) and after the result was posted back
 * to the session as a `user.tool_result` event. Consumers can read either the
 * embedded {@link DispatchedToolCall.event} / {@link DispatchedToolCall.result}
 * blocks or the flat top-level convenience fields.
 */
export interface DispatchedToolCall {
    /**
     * The `agent.tool_use` or `agent.custom_tool_use` event that triggered this
     * dispatch. Read `event.input` for the raw tool input and `event.name` for the
     * tool name; `event.type` distinguishes a builtin tool call from a custom one.
     */
    readonly event: DispatchedToolUseEvent;
    /**
     * The result event posted (or attempted) back to the session for this call: a
     * `user.tool_result` for an `agent.tool_use`, a `user.custom_tool_result` for
     * an `agent.custom_tool_use`. Read `result.content` for the tool's output
     * blocks and `result.is_error` for the error flag.
     *
     * `undefined` when no result event was ever built — i.e. the tool name is
     * not one this runner owns and, under the split-client behavior, it
     * deliberately posted nothing and left the id pending for its owner.
     */
    readonly result?: DispatchedToolResultParams;
    /**
     * Flat convenience for `event.id` — the id of the tool-use event this result
     * answers (echoed back as `tool_use_id` / `custom_tool_use_id` on the result).
     */
    readonly toolUseId: string;
    /** Flat convenience for `event.name` — the dispatched tool's name. */
    readonly name: string;
    /**
     * Flat convenience for `result.is_error` — `true` when the tool threw,
     * `false` on success and for a skipped unowned call.
     */
    readonly isError: boolean;
    /**
     * Whether a result event for this call reached the session. `false` when the
     * post itself failed (typically a permanent 4xx or send-retry exhaustion)
     * and also `false` — with no `result` event ever built — for a tool name
     * this runner does not own when it deliberately posts nothing and leaves the
     * id pending for its owner (the split-client behavior), or when the call
     * was denied and never executed (see `confirmation`).
     */
    readonly posted: boolean;
    /**
     * The confirmation verdict that gated this call, if any.
     *
     * `'allow'` — the call required user confirmation (the server evaluated
     * its permission to `ask`, e.g. under an `always_ask` policy) and the
     * matching `user.tool_confirmation` approved it before the tool ran.
     * `'deny'` — the user denied it, or the server itself evaluated the
     * permission to `deny`; the tool was never executed and nothing was posted
     * (`result=undefined`, `posted=false`, `isError=false`).
     * `undefined` — the call needed no confirmation.
     */
    readonly confirmation: 'allow' | 'deny' | undefined;
}
/**
 * The sessions-side counterpart to `client.beta.messages.toolRunner`: an
 * async-iterable that attaches to a managed-agents session, executes every
 * incoming `agent.tool_use` and `agent.custom_tool_use` event against a local
 * tool registry, posts the matching result back (`user.tool_result` for the
 * former, `user.custom_tool_result` for the latter), and yields one
 * {@link DispatchedToolCall} per completed call. Server-side `agent.mcp_tool_use`
 * calls are not dispatched. Internally drives event-stream reconnect and result
 * posting.
 *
 * A call the server gated with `evaluated_permission: "ask"` (the `always_ask`
 * policy — or any value this SDK doesn't recognize, which fails closed) is held
 * until its `user.tool_confirmation` arrives: only an explicit `allow` runs it;
 * `deny` — or any verdict this SDK doesn't recognize, failing closed — is never
 * executed and posts nothing (the denial resolves the call server-side), but is
 * still yielded (`confirmation="deny"`, `posted=false`, `result=undefined`) so
 * the consumer can observe it. A held call — and a user-approved one still
 * dispatching — defers the `maxIdleMs` countdown, so an `end_turn` idle
 * observed in the meantime cannot stop the runner: it waits until the verdict
 * arrives, the session terminates, or the abort signal fires — pass
 * `AbortSignal.timeout(...)` for a wall-clock bound.
 *
 * Iteration ends when the session terminates (`session.status_terminated` /
 * `session.deleted`), when the consumer `break`s out of the loop or aborts the
 * supplied signal, or — once the session has gone idle with
 * `stop_reason.type === "end_turn"` — when `maxIdleMs` elapses with no new
 * event (any new event resets that countdown; it re-arms on the next `end_turn`
 * idle; `maxIdleMs <= 0` disables it). The `finally` branch drains any in-flight
 * tool calls and runs each tool's `close()` cleanup hook. It does *not* touch
 * the work-item lease — wrap it in an `EnvironmentWorker` if you need
 * heartbeating / force-stop.
 *
 * @example
 * ```ts
 * import { betaAgentToolset20260401 } from '@anthropic-ai/sdk/tools/agent-toolset/node';
 *
 * for await (const call of client.beta.sessions.events.toolRunner(work.data.id, {
 *   tools: [...betaAgentToolset20260401({ workdir }), myTool],
 * })) {
 *   console.log(`${call.name} -> ${call.isError ? 'error' : 'ok'}`);
 * }
 * ```
 */
export declare class SessionToolRunner implements AsyncIterable<DispatchedToolCall> {
    #private;
    readonly client: Anthropic;
    readonly sessionId: string;
    readonly tools: ReadonlyArray<BetaRunnableTool>;
    readonly maxIdleMs: number;
    constructor(sessionId: string, opts: SessionToolRunnerOptions);
    /** Read-only view of this runner's abort signal. */
    get signal(): AbortSignal;
    /** Abort the runner. Background tasks will wind down and `for await` will exit cleanly. */
    abort(): void;
    /**
     * @internal
     * `EnvironmentWorker` keeps this equal to the lease TTL each heartbeat
     * reports; applies to a send already retrying.
     */
    _setSendRetryWindow(ms: number): void;
    [Symbol.asyncIterator](): AsyncIterator<DispatchedToolCall>;
}
export {};
//# sourceMappingURL=SessionToolRunner.d.ts.map