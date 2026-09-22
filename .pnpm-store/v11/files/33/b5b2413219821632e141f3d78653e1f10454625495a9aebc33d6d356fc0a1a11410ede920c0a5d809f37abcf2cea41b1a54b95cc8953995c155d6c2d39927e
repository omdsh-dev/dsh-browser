import { AwsCredentialIdentityProvider } from "@aws-sdk/types";
import { EventStreamCodec } from "@smithy/core/event-streams";
import { MessageSigner, Provider } from "@smithy/types";
import { TransformCallback, TransformOptions, Transform } from "node:stream";
export interface EventSigningStreamOptions extends TransformOptions {
  priorSignature: string;
  messageSigner: MessageSigner;
  eventStreamCodec: EventStreamCodec;
  systemClockOffsetProvider: Provider<number>;
  credentials?: AwsCredentialIdentityProvider;
}
export declare class EventSigningTransformStream extends Transform {
  private priorSignature;
  private messageSigner;
  private eventStreamCodec;
  private readonly systemClockOffsetProvider;
  private readonly staticCredentials?;
  constructor(options: EventSigningStreamOptions);
  _transform(chunk: Uint8Array, encoding: string, callback: TransformCallback): Promise<void>;
}
