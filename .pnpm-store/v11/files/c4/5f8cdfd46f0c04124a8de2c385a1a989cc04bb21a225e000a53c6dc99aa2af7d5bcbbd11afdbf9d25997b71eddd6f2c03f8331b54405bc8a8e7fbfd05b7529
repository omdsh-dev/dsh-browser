"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = void 0;
const tslib_1 = require("../../internal/tslib.js");
const resource_1 = require("../../core/resource.js");
const headers_1 = require("../../internal/headers.js");
const stainless_helper_header_1 = require("../../internal/stainless-helper-header.js");
const MessageStream_1 = require("../../lib/MessageStream.js");
const parser_1 = require("../../lib/parser.js");
const BatchesAPI = tslib_1.__importStar(require("./batches.js"));
const batches_1 = require("./batches.js");
const constants_1 = require("../../internal/constants.js");
class Messages extends resource_1.APIResource {
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
            const maxNonstreamingTokens = constants_1.MODEL_NONSTREAMING_TOKENS[body.model] ?? undefined;
            timeout = this._client.calculateNonstreamingTimeout(body.max_tokens, maxNonstreamingTokens);
        }
        // Collect helper info from tools and messages
        const helperHeader = (0, stainless_helper_header_1.stainlessHelperHeader)(body.tools, body.messages);
        return this._client.post('/v1/messages', {
            body,
            timeout: timeout ?? 600000,
            ...options,
            headers: (0, headers_1.buildHeaders)([
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
        return this.create(params, options).then((message) => (0, parser_1.parseMessage)(message, params, { logger: this._client.logger ?? console }));
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
        return MessageStream_1.MessageStream.createMessage(this, body, options, { logger: this._client.logger ?? console });
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
            headers: (0, headers_1.buildHeaders)([
                { ...(user_profile_id != null ? { 'anthropic-user-profile-id': user_profile_id } : undefined) },
                options?.headers,
            ]),
        });
    }
}
exports.Messages = Messages;
const DEPRECATED_MODELS = {};
const MODELS_TO_WARN_WITH_THINKING_ENABLED = ['claude-mythos-preview', 'claude-opus-4-6'];
Messages.Batches = batches_1.Batches;
//# sourceMappingURL=messages.js.map