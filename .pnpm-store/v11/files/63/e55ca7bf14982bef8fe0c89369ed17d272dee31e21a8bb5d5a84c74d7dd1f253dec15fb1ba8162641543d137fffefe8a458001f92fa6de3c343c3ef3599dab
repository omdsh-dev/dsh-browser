export function concatBytes(arrays, length) {
    if (length === undefined) {
        length = 0;
        for (const bytes of arrays) {
            length += bytes.byteLength;
        }
    }
    const result = new Uint8Array(length);
    let offset = 0;
    for (const buf of arrays) {
        result.set(buf, offset);
        offset += buf.byteLength;
    }
    return result;
}
