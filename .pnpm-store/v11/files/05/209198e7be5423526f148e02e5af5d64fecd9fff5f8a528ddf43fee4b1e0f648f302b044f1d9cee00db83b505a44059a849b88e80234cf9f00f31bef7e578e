"use strict";
var _BetaToolRunner_instances, _BetaToolRunner_consumed, _BetaToolRunner_mutated, _BetaToolRunner_state, _BetaToolRunner_options, _BetaToolRunner_message, _BetaToolRunner_toolResponse, _BetaToolRunner_completion, _BetaToolRunner_iterationCount, _BetaToolRunner_checkAndCompact, _BetaToolRunner_generateToolResponse;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetaToolRunner = void 0;
const tslib_1 = require("../../internal/tslib.js");
const ToolError_1 = require("./ToolError.js");
const error_1 = require("../../core/error.js");
const headers_1 = require("../../internal/headers.js");
const promise_1 = require("../../internal/utils/promise.js");
const values_1 = require("../../internal/utils/values.js");
const CompactionControl_1 = require("./CompactionControl.js");
const stainless_helper_header_1 = require("../../internal/stainless-helper-header.js");
/**
 * A ToolRunner handles the automatic conversation loop between the assistant and tools.
 *
 * A ToolRunner is an async iterable that yields either BetaMessage or BetaMessageStream objects
 * depending on the streaming configuration.
 */
class BetaToolRunner {
    constructor(client, params, options) {
        _BetaToolRunner_instances.add(this);
        this.client = client;
        /** Whether the async iterator has been consumed */
        _BetaToolRunner_consumed.set(this, false);
        /** Whether parameters have been mutated since the last API call */
        _BetaToolRunner_mutated.set(this, false);
        /** Current state containing the request parameters */
        _BetaToolRunner_state.set(this, void 0);
        _BetaToolRunner_options.set(this, void 0);
        /** Promise for the last message received from the assistant */
        _BetaToolRunner_message.set(this, void 0);
        /** Cached tool response to avoid redundant executions */
        _BetaToolRunner_toolResponse.set(this, void 0);
        /** Promise resolvers for waiting on completion */
        _BetaToolRunner_completion.set(this, void 0);
        /** Number of iterations (API requests) made so far */
        _BetaToolRunner_iterationCount.set(this, 0);
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_state, {
            params: {
                // You can't clone the entire params since there are functions as handlers.
                // You also don't really need to clone params.messages, but it probably will prevent a foot gun
                // somewhere.
                ...params,
                messages: structuredClone(params.messages),
            },
        }, "f");
        // structuredClone drops symbol-keyed properties, so collect helper marks
        // from the original params here — the create()-side collector won't see
        // them on the cloned messages.
        const collected = (0, stainless_helper_header_1.collectStainlessHelpers)(params.tools, params.messages);
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_options, {
            ...options,
            headers: (0, headers_1.buildHeaders)([
                (0, stainless_helper_header_1.helperHeader)('BetaToolRunner'),
                collected.length ? { [stainless_helper_header_1.STAINLESS_HELPER_HEADER]: collected.join(', ') } : undefined,
                options?.headers,
            ]),
        }, "f");
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_completion, (0, promise_1.promiseWithResolvers)(), "f");
        if (params.compactionControl?.enabled) {
            console.warn('Anthropic: The `compactionControl` parameter is deprecated and will be removed in a future version. ' +
                'Use server-side compaction instead by passing `edits: [{ type: "compact_20260112" }]` in the params passed to `toolRunner()`. ' +
                'See https://platform.claude.com/docs/en/build-with-claude/compaction');
        }
    }
    async *[(_BetaToolRunner_consumed = new WeakMap(), _BetaToolRunner_mutated = new WeakMap(), _BetaToolRunner_state = new WeakMap(), _BetaToolRunner_options = new WeakMap(), _BetaToolRunner_message = new WeakMap(), _BetaToolRunner_toolResponse = new WeakMap(), _BetaToolRunner_completion = new WeakMap(), _BetaToolRunner_iterationCount = new WeakMap(), _BetaToolRunner_instances = new WeakSet(), _BetaToolRunner_checkAndCompact = async function _BetaToolRunner_checkAndCompact() {
        const compactionControl = tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.compactionControl;
        if (!compactionControl || !compactionControl.enabled) {
            return false;
        }
        let tokensUsed = 0;
        if (tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f") !== undefined) {
            try {
                const message = await tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f");
                const totalInputTokens = message.usage.input_tokens +
                    (message.usage.cache_creation_input_tokens ?? 0) +
                    (message.usage.cache_read_input_tokens ?? 0);
                tokensUsed = totalInputTokens + message.usage.output_tokens;
            }
            catch {
                // If we can't get the message, skip compaction
                return false;
            }
        }
        const threshold = compactionControl.contextTokenThreshold ?? CompactionControl_1.DEFAULT_TOKEN_THRESHOLD;
        if (tokensUsed < threshold) {
            return false;
        }
        const model = compactionControl.model ?? tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.model;
        const summaryPrompt = compactionControl.summaryPrompt ?? CompactionControl_1.DEFAULT_SUMMARY_PROMPT;
        const messages = tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages;
        if (messages[messages.length - 1].role === 'assistant') {
            // Remove tool_use blocks from the last message to avoid 400 error
            // (tool_use requires tool_result, which we don't have yet)
            const lastMessage = messages[messages.length - 1];
            if (Array.isArray(lastMessage.content)) {
                const nonToolBlocks = lastMessage.content.filter((block) => block.type !== 'tool_use');
                if (nonToolBlocks.length === 0) {
                    // If all blocks were tool_use, just remove the message entirely
                    messages.pop();
                }
                else {
                    lastMessage.content = nonToolBlocks;
                }
            }
        }
        const response = await this.client.beta.messages.create({
            model,
            messages: [
                ...messages,
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: summaryPrompt,
                        },
                    ],
                },
            ],
            max_tokens: tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_tokens,
        }, {
            signal: tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_options, "f").signal,
            headers: (0, headers_1.buildHeaders)([tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_options, "f").headers, (0, stainless_helper_header_1.helperHeader)('compaction')]),
        });
        if (response.content[0]?.type !== 'text') {
            throw new error_1.AnthropicError('Expected text response for compaction');
        }
        tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages = [
            {
                role: 'user',
                content: response.content,
            },
        ];
        return true;
    }, Symbol.asyncIterator)]() {
        var _a;
        if (tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_consumed, "f")) {
            throw new error_1.AnthropicError('Cannot iterate over a consumed stream');
        }
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_consumed, true, "f");
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_mutated, true, "f");
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_toolResponse, undefined, "f");
        try {
            while (true) {
                let stream;
                try {
                    if (tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_iterations &&
                        tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_iterationCount, "f") >= tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_iterations) {
                        break;
                    }
                    tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_mutated, false, "f");
                    tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_toolResponse, undefined, "f");
                    tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_iterationCount, (_a = tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_iterationCount, "f"), _a++, _a), "f");
                    tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_message, undefined, "f");
                    const { max_iterations, compactionControl, ...params } = tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params;
                    if (params.stream) {
                        stream = this.client.beta.messages.stream({ ...params }, tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_options, "f"));
                        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_message, stream.finalMessage(), "f");
                        // Make sure that this promise doesn't throw before we get the option to do something about it.
                        // Error will be caught when we call await this.#message ultimately
                        tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f").catch(() => { });
                        yield stream;
                    }
                    else {
                        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_message, this.client.beta.messages.create({ ...params, stream: false }, tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_options, "f")), "f");
                        yield tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f");
                    }
                    const isCompacted = await tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_checkAndCompact).call(this);
                    if (!isCompacted) {
                        if (!tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_mutated, "f")) {
                            const message = await tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f");
                            const nextStep = determineNextStepFromStopReason(message.stop_reason);
                            tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.push({ role: message.role, content: message.content });
                            // Container-bound server tools reject a follow-up request that omits the container the
                            // previous turn ran in, so carry its id forward unless the caller pinned one themselves.
                            const { container } = tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params;
                            if (message.container) {
                                if (container == null) {
                                    tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.container = message.container.id;
                                }
                                else if (typeof container === 'object' && container.id == null) {
                                    tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.container = { ...container, id: message.container.id };
                                }
                            }
                            if (nextStep === 'stop') {
                                break;
                            }
                            if (nextStep === 'resume') {
                                continue;
                            }
                        }
                        const toolMessage = await tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_generateToolResponse).call(this, tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.at(-1));
                        if (toolMessage) {
                            tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.push(toolMessage);
                        }
                        else if (!tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_mutated, "f")) {
                            break;
                        }
                    }
                }
                finally {
                    if (stream) {
                        stream.abort();
                    }
                }
            }
            if (!tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f")) {
                throw new error_1.AnthropicError('ToolRunner concluded without a message from the server');
            }
            tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_completion, "f").resolve(await tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f"));
        }
        catch (error) {
            tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_consumed, false, "f");
            // Silence unhandled promise errors
            tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_completion, "f").promise.catch(() => { });
            tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_completion, "f").reject(error);
            tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_completion, (0, promise_1.promiseWithResolvers)(), "f");
            throw error;
        }
    }
    setMessagesParams(paramsOrMutator) {
        if (typeof paramsOrMutator === 'function') {
            tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params = paramsOrMutator(tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params);
        }
        else {
            tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params = paramsOrMutator;
        }
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_mutated, true, "f");
        // Invalidate cached tool response since parameters changed
        tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_toolResponse, undefined, "f");
    }
    setRequestOptions(optionsOrMutator) {
        if (typeof optionsOrMutator === 'function') {
            tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_options, optionsOrMutator(tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_options, "f")), "f");
        }
        else {
            tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_options, { ...tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_options, "f"), ...optionsOrMutator }, "f");
        }
    }
    /**
     * Get the tool response for the last message from the assistant.
     * Avoids redundant tool executions by caching results.
     *
     * @returns A promise that resolves to a BetaMessageParam containing tool results, or null if no tools need to be executed
     *
     * @example
     * const toolResponse = await runner.generateToolResponse();
     * if (toolResponse) {
     *   console.log('Tool results:', toolResponse.content);
     * }
     */
    async generateToolResponse(signal = tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_options, "f").signal) {
        const message = (await tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_message, "f")) ?? this.params.messages.at(-1);
        if (!message) {
            return null;
        }
        return tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_generateToolResponse).call(this, message, signal);
    }
    /**
     * Wait for the async iterator to complete. This works even if the async iterator hasn't yet started, and
     * will wait for an instance to start and go to completion.
     *
     * @returns A promise that resolves to the final BetaMessage when the iterator completes
     *
     * @example
     * // Start consuming the iterator
     * for await (const message of runner) {
     *   console.log('Message:', message.content);
     * }
     *
     * // Meanwhile, wait for completion from another part of the code
     * const finalMessage = await runner.done();
     * console.log('Final response:', finalMessage.content);
     */
    done() {
        return tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_completion, "f").promise;
    }
    /**
     * Returns a promise indicating that the stream is done. Unlike .done(), this will eagerly read the stream:
     * * If the iterator has not been consumed, consume the entire iterator and return the final message from the
     * assistant.
     * * If the iterator has been consumed, waits for it to complete and returns the final message.
     *
     * @returns A promise that resolves to the final BetaMessage from the conversation
     * @throws {AnthropicError} If no messages were processed during the conversation
     *
     * @example
     * const finalMessage = await runner.runUntilDone();
     * console.log('Final response:', finalMessage.content);
     */
    async runUntilDone() {
        // If not yet consumed, start consuming and wait for completion
        if (!tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_consumed, "f")) {
            for await (const _ of this) {
                // Iterator naturally populates this.#message
            }
        }
        // If consumed but not completed, wait for completion
        return this.done();
    }
    /**
     * Get the current parameters being used by the ToolRunner.
     *
     * @returns A readonly view of the current ToolRunnerParams
     *
     * @example
     * const currentParams = runner.params;
     * console.log('Current model:', currentParams.model);
     * console.log('Message count:', currentParams.messages.length);
     */
    get params() {
        return tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params;
    }
    /**
     * Add one or more messages to the conversation history.
     *
     * @param messages - One or more BetaMessageParam objects to add to the conversation
     *
     * @example
     * runner.pushMessages(
     *   { role: 'user', content: 'Also, what about the weather in NYC?' }
     * );
     *
     * @example
     * // Adding multiple messages
     * runner.pushMessages(
     *   { role: 'user', content: 'What about NYC?' },
     *   { role: 'user', content: 'And Boston?' }
     * );
     */
    pushMessages(...messages) {
        this.setMessagesParams((params) => ({
            ...params,
            messages: [...params.messages, ...messages],
        }));
    }
    /**
     * Makes the ToolRunner directly awaitable, equivalent to calling .runUntilDone()
     * This allows using `await runner` instead of `await runner.runUntilDone()`
     */
    then(onfulfilled, onrejected) {
        return this.runUntilDone().then(onfulfilled, onrejected);
    }
}
exports.BetaToolRunner = BetaToolRunner;
_BetaToolRunner_generateToolResponse = async function _BetaToolRunner_generateToolResponse(lastMessage, signal = tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_options, "f").signal) {
    if (tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f") !== undefined) {
        return tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f");
    }
    tslib_1.__classPrivateFieldSet(this, _BetaToolRunner_toolResponse, generateToolResponse(tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params, lastMessage, {
        ...tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_options, "f"),
        signal,
    }), "f");
    return tslib_1.__classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f");
};
async function generateToolResponse(params, lastMessage = params.messages.at(-1), requestOptions) {
    // Only process if the last message is from the assistant and has tool use blocks
    if (!lastMessage ||
        lastMessage.role !== 'assistant' ||
        !lastMessage.content ||
        typeof lastMessage.content === 'string') {
        return null;
    }
    const toolUseBlocks = lastMessage.content.filter((content) => content.type === 'tool_use');
    if (toolUseBlocks.length === 0) {
        return null;
    }
    const available = availableToolNames(params);
    const toolResults = await Promise.all(toolUseBlocks.map(async (toolUse) => {
        const tool = params.tools.find((t) => ('name' in t ? t.name
            : 'mcp_server_name' in t ? t.mcp_server_name
                : t.type) === toolUse.name);
        // A `tool_removal` is only a hint to the model, which may still emit a tool_use for a
        // withdrawn tool — treat those exactly like a tool that was never defined.
        if (!tool || !('run' in tool) || !available.has(toolUse.name)) {
            return toolNotFoundResult(toolUse);
        }
        try {
            let input = toolUse.input;
            if ('parse' in tool && tool.parse) {
                input = tool.parse(input);
            }
            const result = await tool.run(input, {
                toolUse: toolUse,
                toolUseBlock: toolUse,
                signal: requestOptions?.signal,
            });
            return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: result,
            };
        }
        catch (error) {
            return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: error instanceof ToolError_1.ToolError ?
                    error.content
                    : `Error: ${error instanceof Error ? error.message : String(error)}`,
                is_error: true,
            };
        }
    }));
    return {
        role: 'user',
        content: toolResults,
    };
}
function toolNotFoundResult(toolUse) {
    return {
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: `Error: Tool '${toolUse.name}' not found`,
        is_error: true,
    };
}
/**
 * Computes the names of locally runnable tools that are still available for the assistant
 * turn being answered, by folding `tool_removal` / `tool_addition` blocks from the
 * `role: "system"` messages over the runnable tools. The assistant turn being answered is
 * terminal-or-absent and only `system` messages are inspected, so folding the whole current
 * history is exactly folding the messages preceding that turn — call this before appending
 * anything after it. MCP references are ignored — those tools are executed server-side and
 * never dispatched by this runner.
 */
function availableToolNames(params) {
    const available = new Set();
    for (const tool of params.tools) {
        if ('run' in tool) {
            available.add(tool.name);
        }
    }
    for (const message of params.messages) {
        if (message.role !== 'system' || typeof message.content === 'string') {
            continue;
        }
        for (const block of message.content) {
            applyToolChange(block, available);
        }
    }
    return available;
}
function applyToolChange(block, available) {
    switch (block.type) {
        case 'tool_removal':
        case 'tool_addition':
            applyToolReference(block, available);
            break;
    }
}
function applyToolReference(block, available) {
    const name = referencedToolName(block.tool);
    if (name === undefined)
        return;
    if (block.type === 'tool_removal') {
        available.delete(name);
    }
    else {
        available.add(name);
    }
}
function referencedToolName(ref) {
    switch (ref.type) {
        case 'tool_reference':
            return ref.name;
        default:
            // mcp_tool_reference / mcp_toolset_reference run server-side; unknown reference
            // types are ignored rather than rejected.
            return undefined;
    }
}
/**
 * Sorts every stop reason into one of three buckets: `run_tools` turns run their client tool
 * calls and continue the loop; `resume` turns are sent back unchanged so the server continues
 * them; `stop` turns end the loop without running any tool calls.
 */
function determineNextStepFromStopReason(stopReason) {
    if (stopReason === null)
        return 'stop';
    switch (stopReason) {
        case 'tool_use':
            return 'run_tools';
        case 'pause_turn':
        // pause_after_compaction hands the turn back before the model answers; sending it back
        // unchanged continues it.
        case 'compaction':
            return 'resume';
        case 'end_turn':
        case 'stop_sequence':
        case 'max_tokens':
        case 'model_context_window_exceeded':
        case 'refusal':
            return 'stop';
        default:
            // The union is forward-compatible, so a stop reason this SDK doesn't know yet ends the
            // loop rather than throwing; the `never` check makes tsc reject an unclassified member.
            (0, values_1.checkNever)(stopReason);
            return 'stop';
    }
}
//# sourceMappingURL=BetaToolRunner.js.map