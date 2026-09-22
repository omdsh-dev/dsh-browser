import { fromHex } from "@smithy/core/serde";
export class EventSigningTransformStream extends TransformStream {
    constructor(initialSignature, messageSigner, eventStreamCodec, systemClockOffsetProvider, credentials) {
        let priorSignature = initialSignature;
        const staticCredentials = credentials?.();
        super({
            start() { },
            async transform(chunk, controller) {
                try {
                    const now = new Date(Date.now() + (await systemClockOffsetProvider()));
                    const dateHeader = {
                        ":date": { type: "timestamp", value: now },
                    };
                    const signedMessage = await messageSigner.sign({
                        message: {
                            body: chunk,
                            headers: dateHeader,
                        },
                        priorSignature: priorSignature,
                    }, {
                        signingDate: now,
                        eventStreamCredentials: await staticCredentials,
                    });
                    priorSignature = signedMessage.signature;
                    const serializedSigned = eventStreamCodec.encode({
                        headers: {
                            ...dateHeader,
                            ":chunk-signature": {
                                type: "binary",
                                value: fromHex(signedMessage.signature),
                            },
                        },
                        body: chunk,
                    });
                    controller.enqueue(serializedSigned);
                }
                catch (error) {
                    controller.error(error);
                }
            },
        });
    }
}
