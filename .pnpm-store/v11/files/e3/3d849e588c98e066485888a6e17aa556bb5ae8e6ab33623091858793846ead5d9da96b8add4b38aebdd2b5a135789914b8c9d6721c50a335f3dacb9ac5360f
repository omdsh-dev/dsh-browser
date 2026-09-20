const { EventStreamCodec } = require("@smithy/core/event-streams");
const { Transform, Readable, PassThrough, pipeline } = require("node:stream");

class EventSigningTransformStream extends Transform {
    priorSignature;
    messageSigner;
    eventStreamCodec;
    systemClockOffsetProvider;
    staticCredentials;
    constructor(options) {
        super({
            autoDestroy: true,
            readableObjectMode: true,
            writableObjectMode: true,
            ...options,
        });
        this.priorSignature = options.priorSignature;
        this.eventStreamCodec = options.eventStreamCodec;
        this.messageSigner = options.messageSigner;
        this.systemClockOffsetProvider = options.systemClockOffsetProvider;
        this.staticCredentials = options.credentials?.();
    }
    async _transform(chunk, encoding, callback) {
        try {
            const now = new Date(Date.now() + (await this.systemClockOffsetProvider()));
            const dateHeader = {
                ":date": { type: "timestamp", value: now },
            };
            const signedMessage = await this.messageSigner.sign({
                message: {
                    body: chunk,
                    headers: dateHeader,
                },
                priorSignature: this.priorSignature,
            }, {
                signingDate: now,
                eventStreamCredentials: await this.staticCredentials,
            });
            this.priorSignature = signedMessage.signature;
            const serializedSigned = this.eventStreamCodec.encode({
                headers: {
                    ...dateHeader,
                    ":chunk-signature": {
                        type: "binary",
                        value: getSignatureBinary(signedMessage.signature),
                    },
                },
                body: chunk,
            });
            this.push(serializedSigned);
            return callback();
        }
        catch (err) {
            callback(err);
        }
    }
}
function getSignatureBinary(signature) {
    const buf = Buffer.from(signature, "hex");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength / Uint8Array.BYTES_PER_ELEMENT);
}

class EventStreamPayloadHandler {
    messageSigner;
    eventStreamCodec;
    systemClockOffsetProvider;
    credentials;
    constructor(options) {
        this.messageSigner = options.messageSigner;
        this.eventStreamCodec = new EventStreamCodec(options.utf8Encoder, options.utf8Decoder);
        this.systemClockOffsetProvider = async () => options.systemClockOffset ?? 0;
        this.credentials = options.credentials;
    }
    async handle(next, args, context = {}) {
        const request = args.request;
        const { body: payload, query } = request;
        if (!(payload instanceof Readable)) {
            throw new Error("Eventstream payload must be a Readable stream.");
        }
        request.body = new PassThrough({
            objectMode: true,
        });
        const match = request.headers?.authorization?.match(/Signature=([\w]+)$/);
        let priorSignature = match?.[1] ?? query?.["X-Amz-Signature"] ?? "";
        if (context.__staticSignature) {
            priorSignature = "";
        }
        const signingStream = new EventSigningTransformStream({
            priorSignature,
            eventStreamCodec: this.eventStreamCodec,
            messageSigner: await this.messageSigner(),
            systemClockOffsetProvider: this.systemClockOffsetProvider,
            credentials: this.credentials,
        });
        let resolvePipeline;
        const pipelineError = new Promise((resolve, reject) => {
            resolvePipeline = () => resolve(undefined);
            pipeline(payload, signingStream, request.body, (err) => {
                if (err) {
                    reject(new Error(`Pipeline error in @aws-sdk/eventstream-handler-node: ${err.message}`, { cause: err }));
                }
            });
        });
        let result;
        try {
            result = await Promise.race([next(args), pipelineError]);
        }
        catch (e) {
            request.body.end();
            throw e;
        }
        finally {
            resolvePipeline();
        }
        return result;
    }
}

const eventStreamPayloadHandlerProvider = (options) => new EventStreamPayloadHandler(options);

exports.eventStreamPayloadHandlerProvider = eventStreamPayloadHandlerProvider;
