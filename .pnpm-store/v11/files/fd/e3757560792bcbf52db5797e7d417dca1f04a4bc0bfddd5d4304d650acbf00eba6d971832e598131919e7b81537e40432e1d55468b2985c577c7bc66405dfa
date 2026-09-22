import { Readable } from "node:stream";
import { toBase64 } from "../../util-base64/toBase64";
export class ChecksumStream extends Readable {
    expectedChecksum;
    checksumSourceLocation;
    checksum;
    source;
    base64Encoder;
    constructor({ expectedChecksum, checksum, source, checksumSourceLocation, base64Encoder, }) {
        super();
        if (typeof source.pipe !== "function") {
            throw new Error(`@smithy/util-stream: unsupported source type ${source?.constructor?.name ?? source} in ChecksumStream.`);
        }
        this.source = source;
        this.base64Encoder = base64Encoder ?? toBase64;
        this.expectedChecksum = expectedChecksum;
        this.checksum = checksum;
        this.checksumSourceLocation = checksumSourceLocation;
        this.source.on("data", this.onSourceData);
        this.source.on("end", this.onSourceEnd);
        this.source.on("error", this.onSourceError);
        this.source.on("close", this.onSourceClose);
        this.source.pause();
    }
    onSourceData = (chunk) => {
        if (this.destroyed) {
            return;
        }
        try {
            this.checksum.update(chunk);
        }
        catch (e) {
            this.destroy(e);
            return;
        }
        if (!this.push(chunk)) {
            this.source.pause();
        }
    };
    onSourceEnd = async () => {
        if (this.destroyed) {
            return;
        }
        try {
            const digest = await this.checksum.digest();
            const received = this.base64Encoder(digest);
            if (this.expectedChecksum !== received) {
                this.destroy(new Error(`Checksum mismatch: expected "${this.expectedChecksum}" but received "${received}"` +
                    ` in response header "${this.checksumSourceLocation}".`));
                return;
            }
        }
        catch (e) {
            this.destroy(e);
            return;
        }
        this.push(null);
    };
    onSourceError = (error) => {
        this.destroy(error);
    };
    onSourceClose = () => {
        if (!this.destroyed && !this.source.readableEnded) {
            this.destroy(new Error("Connection lost or stream closed before all data was received."));
        }
    };
    _read(_size) {
        this.source.resume();
    }
    _destroy(error, callback) {
        this.source?.removeListener("data", this.onSourceData);
        this.source?.removeListener("end", this.onSourceEnd);
        this.source?.removeListener("error", this.onSourceError);
        this.source?.removeListener("close", this.onSourceClose);
        this.source?.destroy();
        callback(error);
    }
}
