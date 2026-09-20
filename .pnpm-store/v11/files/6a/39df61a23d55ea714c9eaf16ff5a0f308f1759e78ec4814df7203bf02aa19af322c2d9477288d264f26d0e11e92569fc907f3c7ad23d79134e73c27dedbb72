import { Readable } from "node:stream";
import type { Checksum, Encoder } from "@smithy/types";
/**
 * @internal
 */
export interface ChecksumStreamInit<T extends Readable | ReadableStream> {
    /**
     * Base64 value of the expected checksum.
     */
    expectedChecksum: string;
    /**
     * For error messaging, the location from which the checksum value was read.
     */
    checksumSourceLocation: string;
    /**
     * The checksum calculator.
     */
    checksum: Checksum;
    /**
     * The stream to be checked.
     */
    source: T;
    /**
     * Optional base 64 encoder if calling from a request context.
     */
    base64Encoder?: Encoder;
}
/**
 * Wrapper for throwing checksum errors for streams without
 * buffering the stream.
 *
 * Note: this effectively behaves as a duplex, reading from the source on one
 * side and forwarding chunks to its own readable side on the other. It should
 * not be rewritten back into a Duplex (or Transform). The source is observed
 * and driven manually (pause/resume in onSourceData/_read) so data is pulled
 * at the rate it is consumed and never buffered twice; this manual control is
 * used deliberately for performance and would be lost with the built-in duplex
 * machinery.
 *
 * @internal
 */
export declare class ChecksumStream extends Readable {
    private readonly expectedChecksum;
    private readonly checksumSourceLocation;
    private checksum;
    private source;
    private readonly base64Encoder;
    constructor({ expectedChecksum, checksum, source, checksumSourceLocation, base64Encoder, }: ChecksumStreamInit<Readable>);
    /**
     * Update the checksum and forward each source chunk to the readable side,
     * pausing the source when the readable side signals backpressure.
     */
    private onSourceData;
    /**
     * When the source finishes, perform the checksum comparison and end this stream.
     */
    private onSourceEnd;
    /**
     * Surface source errors on this stream.
     */
    private onSourceError;
    /**
     * If the source stream closes without having ended,
     * this is considered an error.
     */
    private onSourceClose;
    /**
     * Resume the source so it flows at the rate this stream is consumed.
     * Do not call this directly.
     * @internal
     */
    _read(_size: number): void;
    /**
     * Destroy the upstream source for cleanup so it is not left dangling, then
     * complete this stream's destruction. The error is intentionally not forwarded
     * to the source as the source is typically internal and without an error listener
     * The error still surfaces on this stream via the callback.
     * Do not call this directly.
     * @internal
     */
    _destroy(error: Error | null, callback: (error?: Error | null | undefined) => void): void;
}
