import { AwsCredentialIdentityProvider } from "@aws-sdk/types";
import { EventStreamCodec } from "@smithy/core/event-streams";
import { MessageSigner, Provider } from "@smithy/types";
export declare class EventSigningTransformStream extends TransformStream<Uint8Array, Uint8Array> {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  constructor(
    initialSignature: string,
    messageSigner: MessageSigner,
    eventStreamCodec: EventStreamCodec,
    systemClockOffsetProvider: Provider<number>,
    credentials?: AwsCredentialIdentityProvider,
  );
}
