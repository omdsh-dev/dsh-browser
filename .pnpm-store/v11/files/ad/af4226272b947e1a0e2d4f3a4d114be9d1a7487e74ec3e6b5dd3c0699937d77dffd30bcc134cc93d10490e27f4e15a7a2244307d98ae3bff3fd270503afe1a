import { NumericValue } from "@smithy/core/serde";
import { alloc, extendedFloat16, extendedFloat32, extendedFloat64, majorList, majorMap, majorNegativeInt64, majorSpecial, majorTag, majorUint64, majorUnstructuredByteString, majorUtf8String, specialFalse, specialNull, specialTrue, tagSymbol, } from "./cbor-types";
const USE_BUFFER = typeof Buffer !== "undefined";
const encodeStringCache = new Map();
let encodeCacheEpoch = 0;
let encodeCacheSaturated = false;
const initialSize = 2048;
let data = alloc(initialSize);
let dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
let cursor = 0;
export function encode(_input) {
    const encodeStack = [_input];
    while (encodeStack.length) {
        const input = encodeStack.pop();
        if (typeof input === "string") {
            const len = input.length;
            if (USE_BUFFER) {
                ensureSpace(len * 3 + 9);
                if (len > 23) {
                    encodeHeader(majorUtf8String, Buffer.byteLength(input));
                    cursor += data.write(input, cursor);
                }
                else {
                    encodeStringCached(input);
                }
            }
            else {
                const maxBytes = len * 3;
                ensureSpace(maxBytes + 9);
                const headerPos = cursor;
                const result = new TextEncoder().encodeInto(input, data.subarray(cursor + 9));
                const byteLen = result.written;
                let headerSize;
                if (byteLen < 24) {
                    headerSize = 1;
                }
                else if (byteLen < 256) {
                    headerSize = 2;
                }
                else if (byteLen < 65536) {
                    headerSize = 3;
                }
                else if (byteLen < 4294967296) {
                    headerSize = 5;
                }
                else {
                    headerSize = 9;
                }
                if (headerSize < 9) {
                    data.copyWithin(headerPos + headerSize, headerPos + 9, headerPos + 9 + byteLen);
                }
                cursor = headerPos;
                encodeInteger(majorUtf8String, byteLen);
                cursor += byteLen;
            }
            continue;
        }
        if (data.byteLength - cursor < 9) {
            ensureSpace(64);
        }
        if (typeof input === "number") {
            if (Number.isInteger(input) && input >= -0x20000000000000 && input <= 0x1fffffffffffff) {
                const nonNegative = input >= 0;
                const major = nonNegative ? majorUint64 : majorNegativeInt64;
                const value = nonNegative ? input : -input - 1;
                if (value < 24) {
                    data[cursor++] = (major << 5) | value;
                }
                else if (value < 256) {
                    data[cursor++] = (major << 5) | 24;
                    data[cursor++] = value;
                }
                else if (value < 65536) {
                    data[cursor++] = (major << 5) | extendedFloat16;
                    data[cursor++] = value >> 8;
                    data[cursor++] = value & 0xff;
                }
                else if (value < 4294967296) {
                    data[cursor++] = (major << 5) | extendedFloat32;
                    dataView.setUint32(cursor, value);
                    cursor += 4;
                }
                else {
                    data[cursor++] = (major << 5) | extendedFloat64;
                    const hi = (value / 4294967296) | 0;
                    const lo = (value - hi * 4294967296) | 0;
                    dataView.setUint32(cursor, hi);
                    dataView.setUint32(cursor + 4, lo);
                    cursor += 8;
                }
                continue;
            }
            data[cursor++] = (majorSpecial << 5) | extendedFloat64;
            dataView.setFloat64(cursor, input);
            cursor += 8;
            continue;
        }
        else if (typeof input === "bigint") {
            const nonNegative = input >= 0;
            const major = nonNegative ? majorUint64 : majorNegativeInt64;
            const value = nonNegative ? input : -input - BigInt(1);
            if (value < BigInt("18446744073709551616")) {
                const n = Number(value);
                if (n < 4294967296) {
                    encodeInteger(major, n);
                }
                else {
                    data[cursor++] = (major << 5) | extendedFloat64;
                    dataView.setBigUint64(cursor, value);
                    cursor += 8;
                }
            }
            else {
                const binaryBigInt = value.toString(2);
                const bigIntBytes = new Uint8Array(Math.ceil(binaryBigInt.length / 8));
                let b = value;
                let i = 0;
                while (bigIntBytes.byteLength - ++i >= 0) {
                    bigIntBytes[bigIntBytes.byteLength - i] = Number(b & BigInt(255));
                    b >>= BigInt(8);
                }
                ensureSpace(bigIntBytes.byteLength * 2 + 16);
                data[cursor++] = nonNegative ? 0b110_00010 : 0b110_00011;
                encodeHeader(majorUnstructuredByteString, bigIntBytes.byteLength);
                data.set(bigIntBytes, cursor);
                cursor += bigIntBytes.byteLength;
            }
            continue;
        }
        else if (input === null) {
            data[cursor++] = (majorSpecial << 5) | specialNull;
            continue;
        }
        else if (typeof input === "boolean") {
            data[cursor++] = (majorSpecial << 5) | (input ? specialTrue : specialFalse);
            continue;
        }
        else if (typeof input === "undefined") {
            throw new Error("@smithy/core/cbor: client may not serialize undefined value.");
        }
        else if (Array.isArray(input)) {
            encodeInteger(majorList, input.length);
            ensureSpace(input.length * 9 + 64);
            for (let i = input.length - 1; i >= 0; --i) {
                encodeStack.push(input[i]);
            }
            continue;
        }
        else if (typeof input.byteLength === "number") {
            ensureSpace(input.length * 2 + 9);
            encodeInteger(majorUnstructuredByteString, input.length);
            data.set(input, cursor);
            cursor += input.byteLength;
            continue;
        }
        else if (typeof input === "object") {
            if (input instanceof NumericValue) {
                const decimalIndex = input.string.indexOf(".");
                const exponent = decimalIndex === -1 ? 0 : decimalIndex - input.string.length + 1;
                const mantissa = BigInt(input.string.replace(".", ""));
                data[cursor++] = 0b110_00100;
                encodeInteger(majorList, 2);
                encodeStack.push(mantissa);
                encodeStack.push(exponent);
                continue;
            }
            if (input[tagSymbol]) {
                if ("tag" in input && "value" in input) {
                    encodeStack.push(input.value);
                    encodeHeader(majorTag, input.tag);
                    continue;
                }
                else {
                    throw new Error("tag encountered with missing fields, need 'tag' and 'value', found: " + JSON.stringify(input));
                }
            }
            const keys = Object.keys(input);
            const len = keys.length;
            encodeInteger(majorMap, len);
            for (let i = len - 1; i >= 0; --i) {
                encodeStack.push(input[keys[i]]);
                encodeStack.push(keys[i]);
            }
            continue;
        }
        throw new Error(`data type ${input?.constructor?.name ?? typeof input} not compatible for encoding.`);
    }
}
export function advanceEncodingEpoch() {
    encodeCacheEpoch = (encodeCacheEpoch + 1) & 0b1111_1111_1111_1111;
    encodeCacheSaturated = false;
}
export function toUint8Array() {
    const out = alloc(cursor);
    out.set(data.subarray(0, cursor), 0);
    cursor = 0;
    return out;
}
export function resize(size) {
    const old = data;
    data = alloc(size);
    if (old) {
        if (old.copy) {
            old.copy(data, 0, 0, old.byteLength);
        }
        else {
            data.set(old, 0);
        }
    }
    dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
}
function encodeStringCached(input) {
    const cached = encodeStringCache.get(input);
    if (cached !== undefined) {
        data.set(cached.bytes, cursor);
        cursor += cached.bytes.length;
        cached.epoch = encodeCacheEpoch;
        return;
    }
    const start = cursor;
    const byteLen = Buffer.byteLength(input);
    encodeInteger(majorUtf8String, byteLen);
    cursor += data.write(input, cursor);
    const bytes = Uint8Array.prototype.slice.call(data, start, cursor);
    if (encodeStringCache.size >= 2048) {
        if (encodeCacheSaturated) {
            return;
        }
        let evicted = 0;
        for (const [key, entry] of encodeStringCache) {
            if (evicted >= 1024) {
                break;
            }
            if (entry.epoch !== encodeCacheEpoch) {
                encodeStringCache.delete(key);
                evicted++;
            }
        }
        if (evicted === 0) {
            encodeCacheSaturated = true;
            return;
        }
    }
    if (encodeStringCache.size < 2048) {
        encodeStringCache.set(input, { epoch: encodeCacheEpoch, bytes });
    }
}
function ensureSpace(bytes) {
    const remaining = data.byteLength - cursor;
    if (remaining < bytes) {
        if (cursor < 16_000_000) {
            resize(Math.max(data.byteLength * 4, data.byteLength + bytes));
        }
        else {
            resize(data.byteLength + bytes + 16_000_000);
        }
    }
}
function encodeHeader(major, value) {
    if (value < 24) {
        data[cursor++] = (major << 5) | value;
    }
    else if (value < 256) {
        data[cursor++] = (major << 5) | 24;
        data[cursor++] = value;
    }
    else if (value < 65536) {
        data[cursor++] = (major << 5) | extendedFloat16;
        dataView.setUint16(cursor, value);
        cursor += 2;
    }
    else if (value < 4294967296) {
        data[cursor++] = (major << 5) | extendedFloat32;
        dataView.setUint32(cursor, value);
        cursor += 4;
    }
    else {
        data[cursor++] = (major << 5) | extendedFloat64;
        dataView.setBigUint64(cursor, typeof value === "bigint" ? value : BigInt(value));
        cursor += 8;
    }
}
function encodeInteger(major, value) {
    if (value < 24) {
        data[cursor++] = (major << 5) | value;
    }
    else if (value < 256) {
        data[cursor++] = (major << 5) | 24;
        data[cursor++] = value;
    }
    else if (value < 65536) {
        data[cursor++] = (major << 5) | extendedFloat16;
        data[cursor++] = value >> 8;
        data[cursor++] = value & 0xff;
    }
    else if (value < 4294967296) {
        data[cursor++] = (major << 5) | extendedFloat32;
        dataView.setUint32(cursor, value);
        cursor += 4;
    }
    else {
        data[cursor++] = (major << 5) | extendedFloat64;
        const hi = (value / 4294967296) | 0;
        const lo = (value - hi * 4294967296) | 0;
        dataView.setUint32(cursor, hi);
        dataView.setUint32(cursor + 4, lo);
        cursor += 8;
    }
}
