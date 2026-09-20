// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../core/resource.mjs";
import { buildHeaders } from "../../internal/headers.mjs";
import { stainlessHelperHeader } from "../../internal/stainless-helper-header.mjs";
import { MessageStream } from "../../lib/MessageStream.mjs";
import { parseMessage, } from "../../lib/parser.mjs";
import * as BatchesAPI from "./batches.mjs";
import { Batches, } from "./batches.mjs";
import { MODEL_NONSTREAMING_TOKENS } from "../../internal/constants.mjs";
export class Messages extends APIResource {
    constructor() {
        super(...arguments);
        this.batches = new BatchesAPI.Batches(this._client);
    }
    create(params, options) {
        const { user_profile_id, ...body } = params;
        if (body.model in DEPRECATED_MODELS) {
            console.warn(`The model '${body.model}' is deprecated and will reach end-of-life on ${DEPRECATED_MODELS[body.model]}\nPlease migrate to a newer model. Visit https://docs.anthropic.com/en/docs/resources/model-deprecations for more information.`);
        }
        if (MODELS_TO_WARN_WITH_THINKING_ENABLED.includes(body.model) &&
            body.thinking &&
            body.thinking.type === 'enabled') {
            console.warn(`Using Claude with ${body.model} and 'thinking.type=enabled' is deprecated. Use 'thinking.type=adaptive' instead which results in better model performance in our testing: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking`);
        }
        let timeout = options?.timeout ?? this._client._options.timeout;
        if (!body.stream && timeout == null) {
            const maxNonstreamingTokens = MODEL_NONSTREAMING_TOKENS[body.model] ?? undefined;
            timeout = this._client.calculateNonstreamingTimeout(body.max_tokens, maxNonstreamingTokens);
        }
        // Collect helper info from tools and messages
        const helperHeader = stainlessHelperHeader(body.tools, body.messages);
        return this._client.post('/v1/messages', {
            body,
            timeout: timeout ?? 600000,
            ...options,
            headers: buildHeaders([
                { ...(user_profile_id != null ? { 'anthropic-user-profile-id': user_profile_id } : undefined) },
                helperHeader,
                options?.headers,
            ]),
            stream: params.stream ?? false,
        });
    }
    /**
     * Send a structured list of input messages with text and/or image content, along with an expected `output_config.format` and
     * the response will be automatically parsed and available in the `parsed_output` property of the message.
     *
     * @example
     * ```ts
     * const message = await client.messages.parse({
     *   model: 'claude-sonnet-4-5-20250929',
     *   max_tokens: 1024,
     *   messages: [{ role: 'user', content: 'What is 2+2?' }],
     *   output_config: {
     *     format: zodOutputFormat(z.object({ answer: z.number() })),
     *   },
     * });
     *
     * console.log(message.parsed_output?.answer); // 4
     * ```
     */
    parse(params, options) {
        return this.create(params, options).then((message) => parseMessage(message, params, { logger: this._client.logger ?? console }));
    }
    /**
     * Create a Message stream.
     *
     * If `output_config.format` is provided with a parseable format (like `zodOutputFormat()`),
     * the final message will include a `parsed_output` property with the parsed content.
     *
     * @example
     * ```ts
     * const stream = client.messages.stream({
     *   model: 'claude-sonnet-4-5-20250929',
     *   max_tokens: 1024,
     *   messages: [{ role: 'user', content: 'What is 2+2?' }],
     *   output_config: {
     *     format: zodOutputFormat(z.object({ answer: z.number() })),
     *   },
     * });
     *
     * const message = await stream.finalMessage();
     * console.log(message.parsed_output?.answer); // 4
     * ```
     */
    stream(body, options) {
        return MessageStream.createMessage(this, body, options, { logger: this._client.logger ?? console });
    }
    /**
     * Count the number of tokens in a Message.
     *
     * The Token Count API can be used to count the number of tokens in a Message,
     * including tools, images, and documents, without creating it.
     *
     * Learn more about token counting in our
     * [user guide](https://platform.claude.com/docs/en/build-with-claude/token-counting)
     *
     * @example
     * ```ts
     * const messageTokensCount =
     *   await client.messages.countTokens({
     *     messages: [{ content: 'Hello, world', role: 'user' }],
     *     model: 'claude-opus-5',
     *   });
     * ```
     */
    countTokens(params, options) {
        const { user_profile_id, ...body } = params;
        return this._client.post('/v1/messages/count_tokens', {
            body,
            ...options,
            headers: buildHeaders([
                { ...(user_profile_id != null ? { 'anthropic-user-profile-id': user_profile_id } : undefined) },
                options?.headers,
            ]),
        });
    }
}
const DEPRECATED_MODELS = {};
const MODELS_TO_WARN_WITH_THINKING_ENABLED = ['claude-mythos-preview', 'claude-opus-4-6'];
Messages.Batches = Batches;
//# sourceMappingURL=messages.mjs.map