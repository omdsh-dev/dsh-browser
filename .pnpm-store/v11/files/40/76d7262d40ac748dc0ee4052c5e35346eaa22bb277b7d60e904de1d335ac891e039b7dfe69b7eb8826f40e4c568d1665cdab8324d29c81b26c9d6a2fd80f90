import { Writable } from "node:stream";
import { concatBytes } from "../concatBytes";
import { collectBlob, collectReadableStream } from "./stream-collector.browser";
import { isBlob, isReadableStream } from "./stream-type-check";
export const streamCollector = (stream) => {
    if (isBlob(stream)) {
        return collectBlob(stream);
    }
    if (isReadableStream(stream)) {
        return collectReadableStream(stream);
    }
    return new Promise((resolve, reject) => {
        const collector = new Collector();
        const nodeStream = stream;
        nodeStream.pipe(collector);
        nodeStream.on("error", (err) => {
            collector.end();
            reject(err);
        });
        collector.on("error", reject);
        collector.on("finish", function () {
            const bytes = concatBytes(this.bufferedBytes);
            resolve(bytes);
        });
    });
};
class Collector extends Writable {
    bufferedBytes = [];
    _write(chunk, encoding, callback) {
        this.bufferedBytes.push(chunk);
        callback();
    }
}
