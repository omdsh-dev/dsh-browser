import { concatBytes } from "../concatBytes";
import { isBlob } from "./stream-type-check";
export const streamCollector = async (stream) => {
    if (isBlob(stream)) {
        return collectBlob(stream);
    }
    return collectReadableStream(stream);
};
export async function collectBlob(blob) {
    return blob.arrayBuffer().then((ab) => new Uint8Array(ab));
}
export async function collectReadableStream(stream) {
    const chunks = [];
    const reader = stream.getReader();
    let length = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (value) {
            chunks.push(value);
            length += value.length;
        }
        if (done) {
            break;
        }
    }
    return concatBytes(chunks, length);
}
