import type { IProtobufWriter } from './i-protobuf-writer';
/**
 * Size estimator for protobuf messages.
 * Implements the same interface as ProtobufWriter but only counts bytes without allocating a buffer.
 * @internal
 */
export declare class ProtobufSizeEstimator implements IProtobufWriter {
    pos: number;
    startLengthDelimited(): number;
    finishLengthDelimited(_: number, length: number): void;
    writeVarint(value: number): void;
    writeSint32(value: number): void;
    writeSfixed64(_value: number): void;
    writeFixed32(_value: number): void;
    writeFixed64(_low: number, _high: number): void;
    writeBytes(bytes: Uint8Array): void;
    writeTag(fieldNumber: number, wireType: number): void;
    writeDouble(_value: number): void;
    writeString(str: string): void;
}
//# sourceMappingURL=protobuf-size-estimator.d.ts.map