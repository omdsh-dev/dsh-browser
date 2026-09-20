const { nv, NumericValue, calculateBodyLength, generateIdempotencyToken, fromBase64, _parseEpochTimestamp } = require("@smithy/core/serde");
const { HttpRequest, collectBody, SerdeContext, RpcProtocol } = require("@smithy/core/protocols");
const { NormalizedSchema, deref, TypeRegistry } = require("@smithy/core/schema");
const { getSmithyContext } = require("@smithy/core/transport");

const majorUint64 = 0;
const majorNegativeInt64 = 1;
const majorUnstructuredByteString = 2;
const majorUtf8String = 3;
const majorList = 4;
const majorMap = 5;
const majorTag = 6;
const majorSpecial = 7;
const specialFalse = 20;
const specialTrue = 21;
const specialNull = 22;
const specialUndefined = 23;
const extendedOneByte = 24;
const extendedFloat16 = 25;
const extendedFloat32 = 26;
const extendedFloat64 = 27;
const minorIndefinite = 31;
function alloc(size) {
    return typeof Buffer !== "undefined" ? Buffer.alloc(size) : new Uint8Array(size);
}
const tagSymbol = Symbol("@smithy/core/cbor::tagSymbol");
function tag(data) {
    data[tagSymbol] = true;
    return data;
}

const USE_BUFFER$3 = typeof Buffer !== "undefined";
const textDecoder$1 = new TextDecoder();
let payload$1 = alloc(0);
let isBuffer$1 = false;
let dataView$2 = new DataView(payload$1.buffer, payload$1.byteOffset, payload$1.byteLength);
let _offset = 0;
function setPayload(bytes) {
    payload$1 = bytes;
    isBuffer$1 = USE_BUFFER$3 && payload$1 instanceof Buffer;
    dataView$2 = new DataView(payload$1.buffer, payload$1.byteOffset, payload$1.byteLength);
}
function decode(at, to) {
    if (at >= to) {
        throw new Error("unexpected end of (decode) payload.");
    }
    const major = (payload$1[at] & 0b1110_0000) >> 5;
    const minor = payload$1[at] & 0b0001_1111;
    if (minor === minorIndefinite && 2 <= major && major <= 5) {
        return decodeIndefinite(at, to);
    }
    switch (major) {
        case majorUint64:
        case majorNegativeInt64:
        case majorTag: {
            let unsignedInt;
            let offset;
            if (minor < 24) {
                unsignedInt = minor;
                offset = 1;
            }
            else {
                switch (minor) {
                    case extendedOneByte:
                        if (to - at < 2) {
                            overflow$1(1);
                        }
                        unsignedInt = payload$1[at + 1];
                        offset = 2;
                        break;
                    case extendedFloat16:
                        if (to - at < 3) {
                            overflow$1(2);
                        }
                        unsignedInt = dataView$2.getUint16(at + 1);
                        offset = 3;
                        break;
                    case extendedFloat32:
                        if (to - at < 5) {
                            overflow$1(4);
                        }
                        unsignedInt = dataView$2.getUint32(at + 1);
                        offset = 5;
                        break;
                    case extendedFloat64:
                        if (to - at < 9) {
                            overflow$1(8);
                        }
                        {
                            const hi = dataView$2.getUint32(at + 1);
                            if (hi < 0x00200000) {
                                unsignedInt = hi * 4294967296 + dataView$2.getUint32(at + 5);
                            }
                            else {
                                unsignedInt = dataView$2.getBigUint64(at + 1);
                            }
                        }
                        offset = 9;
                        break;
                    default:
                        unexpectedMinor(minor);
                }
            }
            if (major === majorUint64) {
                _offset = offset;
                return castBigInt$1(unsignedInt);
            }
            else if (major === majorNegativeInt64) {
                let negativeInt;
                if (typeof unsignedInt === "bigint") {
                    negativeInt = BigInt(-1) - unsignedInt;
                }
                else {
                    negativeInt = -1 - unsignedInt;
                }
                _offset = offset;
                return castBigInt$1(negativeInt);
            }
            else {
                return decodeTagValue(at, to, minor, unsignedInt, offset);
            }
        }
        case majorUtf8String:
            return decodeUtf8String(at, to);
        case majorMap:
            return decodeMap(at, to);
        case majorList:
            return decodeList(at, to);
        case majorUnstructuredByteString:
            return decodeUnstructuredByteString(at, to);
        default:
            return decodeSpecial(at, to);
    }
}
function decodeIndefinite(at, to) {
    const major = (payload$1[at] & 0b1110_0000) >> 5;
    const minor = payload$1[at] & 0b0001_1111;
    if (minor === minorIndefinite) {
        switch (major) {
            case majorUtf8String:
                return decodeUtf8StringIndefinite(at, to);
            case majorMap:
                return decodeMapIndefinite(at, to);
            case majorList:
                return decodeListIndefinite(at, to);
            case majorUnstructuredByteString:
                return decodeUnstructuredByteStringIndefinite(at, to);
        }
    }
}
function bytesToFloat16$1(a, b) {
    const sign = a >> 7;
    const exponent = (a & 0b0111_1100) >> 2;
    const fraction = ((a & 0b0000_0011) << 8) | b;
    const scalar = sign === 0 ? 1 : -1;
    if (exponent === 0b00000) {
        if (fraction === 0) {
            return 0;
        }
        return scalar * (Math.pow(2, 1 - 15) * (fraction / 1024));
    }
    else if (exponent === 0b11111) {
        if (fraction === 0) {
            return scalar * Infinity;
        }
        return NaN;
    }
    return scalar * (Math.pow(2, exponent - 15) * (1 + fraction / 1024));
}
function decodeMap(at, to) {
    const mapDataLength = decodeCount$1(at, to);
    if (mapDataLength < 25) {
        return decodeMapSmall(at, to, mapDataLength);
    }
    return decodeMapLarge(at, to, mapDataLength);
}
function decodeMapLarge(at, to, mapDataLength) {
    const offset = _offset;
    at += offset;
    const base = at;
    const map = Object.create(null);
    for (let i = 0; i < mapDataLength; ++i) {
        const key = decodeUtf8String(at, to);
        at += _offset;
        const valMajor = (payload$1[at] & 0b1110_0000) >> 5;
        if (valMajor === majorUtf8String) {
            map[key] = decodeUtf8String(at, to);
        }
        else {
            map[key] = decode(at, to);
        }
        at += _offset;
    }
    _offset = offset + (at - base);
    Object.setPrototypeOf(map, Object.prototype);
    return map;
}
function decodeMapSmall(at, to, mapDataLength) {
    const offset = _offset;
    at += offset;
    const base = at;
    const map = {};
    for (let i = 0; i < mapDataLength; ++i) {
        const key = decodeUtf8String(at, to);
        at += _offset;
        map[key] = decode(at, to);
        at += _offset;
    }
    _offset = offset + (at - base);
    return map;
}
function decodeList(at, to) {
    const listDataLength = decodeCount$1(at, to);
    const offset = _offset;
    at += offset;
    const base = at;
    const list = Array(listDataLength);
    for (let i = 0; i < listDataLength; ++i) {
        list[i] = decode(at, to);
        at += _offset;
    }
    _offset = offset + (at - base);
    return list;
}
function decodeUtf8String(at, to) {
    const length = decodeCount$1(at, to);
    const offset = _offset;
    at += offset;
    if (to - at < length) {
        overflow$1(length);
    }
    _offset = offset + length;
    if (length < 24) {
        return decodeUtf8StringCached(at, length);
    }
    if (isBuffer$1) {
        return payload$1.toString("utf-8", at, at + length);
    }
    return textDecoder$1.decode(payload$1.subarray(at, at + length));
}
const stringCache$1 = new Array(2048);
const stringCacheEpochs$1 = new Uint16Array(2048);
let cacheEpoch$1 = 0;
function advanceDecodingEpoch() {
    cacheEpoch$1 = (cacheEpoch$1 + 1) & 0b1111_1111_1111_1111;
}
function decodeUtf8StringCached(at, length) {
    let h = length;
    for (let i = 0; i < length; ++i) {
        h = (h * 31 + payload$1[at + i]) | 0;
    }
    const slot = (h >>> 0) & 2047;
    const cached = stringCache$1[slot];
    if (cached !== undefined) {
        if (cached.length === length) {
            let match = true;
            for (let i = 0; i < length; ++i) {
                if (cached.charCodeAt(i) !== payload$1[at + i]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                stringCacheEpochs$1[slot] = cacheEpoch$1;
                return cached;
            }
        }
    }
    const result = isBuffer$1
        ? payload$1.toString("utf-8", at, at + length)
        : textDecoder$1.decode(payload$1.subarray(at, at + length));
    if (stringCacheEpochs$1[slot] !== cacheEpoch$1) {
        stringCache$1[slot] = result;
        stringCacheEpochs$1[slot] = cacheEpoch$1;
    }
    return result;
}
function decodeUnstructuredByteString(at, to) {
    const length = decodeCount$1(at, to);
    const offset = _offset;
    at += offset;
    if (to - at < length) {
        overflow$1(length);
    }
    const value = payload$1.subarray(at, at + length);
    _offset = offset + length;
    return value;
}
function decodeTagValue(at, to, minor, unsignedInt, offset) {
    if (minor === 2 || minor === 3) {
        const length = decodeCount$1(at + offset, to);
        let b = BigInt(0);
        const start = at + offset + _offset;
        for (let i = start; i < start + length; ++i) {
            b = (b << BigInt(8)) | BigInt(payload$1[i]);
        }
        _offset = offset + _offset + length;
        return minor === 3 ? -b - BigInt(1) : b;
    }
    else if (minor === 4) {
        const decimalFraction = decode(at + offset, to);
        const [exponent, mantissa] = decimalFraction;
        const normalizer = mantissa < 0 ? -1 : 1;
        const mantissaStr = "0".repeat(Math.abs(exponent) + 1) + String(BigInt(normalizer) * BigInt(mantissa));
        let numericString;
        const sign = mantissa < 0 ? "-" : "";
        numericString =
            exponent === 0
                ? mantissaStr
                : mantissaStr.slice(0, mantissaStr.length + exponent) + "." + mantissaStr.slice(exponent);
        numericString = numericString.replace(/^0+/g, "");
        if (numericString === "") {
            numericString = "0";
        }
        if (numericString[0] === ".") {
            numericString = "0" + numericString;
        }
        numericString = sign + numericString;
        _offset = offset + _offset;
        return nv(numericString);
    }
    else {
        const value = decode(at + offset, to);
        const valueOffset = _offset;
        _offset = offset + valueOffset;
        return tag({ tag: castBigInt$1(unsignedInt), value });
    }
}
function decodeSpecial(at, to) {
    const minor = payload$1[at] & 0b0001_1111;
    switch (minor) {
        case specialTrue:
        case specialFalse:
            _offset = 1;
            return minor === specialTrue;
        case specialNull:
            _offset = 1;
            return null;
        case specialUndefined:
            _offset = 1;
            return null;
        case extendedFloat16:
            if (to - at < 3) {
                throw new Error("incomplete float16 at end of buf.");
            }
            _offset = 3;
            return bytesToFloat16$1(payload$1[at + 1], payload$1[at + 2]);
        case extendedFloat32:
            if (to - at < 5) {
                throw new Error("incomplete float32 at end of buf.");
            }
            _offset = 5;
            return dataView$2.getFloat32(at + 1);
        case extendedFloat64:
            if (to - at < 9) {
                throw new Error("incomplete float64 at end of buf.");
            }
            _offset = 9;
            return dataView$2.getFloat64(at + 1);
        default:
            unexpectedMinor(minor);
    }
}
function decodeCount$1(at, to) {
    const minor = payload$1[at] & 0b0001_1111;
    if (minor < 24) {
        _offset = 1;
        return minor;
    }
    switch (minor) {
        case extendedOneByte:
            if (to - at < 2) {
                overflow$1(1);
            }
            _offset = 2;
            return payload$1[at + 1];
        case extendedFloat16:
            if (to - at < 3) {
                overflow$1(2);
            }
            _offset = 3;
            return dataView$2.getUint16(at + 1);
        case extendedFloat32:
            if (to - at < 5) {
                overflow$1(4);
            }
            _offset = 5;
            return dataView$2.getUint32(at + 1);
        case extendedFloat64:
            if (to - at < 9) {
                overflow$1(8);
            }
            _offset = 9;
            return demote(dataView$2.getBigUint64(at + 1));
        default:
            unexpectedMinor(minor);
    }
}
function decodeMapIndefinite(at, to) {
    at += 1;
    const base = at;
    const map = {};
    for (; at < to;) {
        if (payload$1[at] === 0b1111_1111) {
            _offset = at - base + 2;
            return map;
        }
        const key = decodeUtf8String(at, to);
        at += _offset;
        map[key] = decode(at, to);
        at += _offset;
    }
    throw new Error("expected break marker.");
}
function decodeListIndefinite(at, to) {
    at += 1;
    const list = [];
    for (const base = at; at < to;) {
        if (payload$1[at] === 0b1111_1111) {
            _offset = at - base + 2;
            return list;
        }
        list.push(decode(at, to));
        at += _offset;
    }
    throw new Error("expected break marker.");
}
function decodeUtf8StringIndefinite(at, to) {
    at += 1;
    const vector = [];
    for (const base = at; at < to;) {
        if (payload$1[at] === 0b1111_1111) {
            const data = alloc(vector.length);
            data.set(vector, 0);
            _offset = at - base + 2;
            if (USE_BUFFER$3) {
                return data.toString("utf-8", 0, data.length);
            }
            return textDecoder$1.decode(data);
        }
        const major = (payload$1[at] & 0b1110_0000) >> 5;
        const minor = payload$1[at] & 0b0001_1111;
        if (major !== majorUtf8String) {
            unexpectedMajorInIndefiniteString(major);
        }
        if (minor === minorIndefinite) {
            throw new Error("nested indefinite string.");
        }
        const bytes = decodeUnstructuredByteString(at, to);
        const length = _offset;
        at += length;
        for (let i = 0; i < bytes.length; ++i) {
            vector.push(bytes[i]);
        }
    }
    throw new Error("expected break marker.");
}
function decodeUnstructuredByteStringIndefinite(at, to) {
    at += 1;
    const vector = [];
    for (const base = at; at < to;) {
        if (payload$1[at] === 0b1111_1111) {
            const data = alloc(vector.length);
            data.set(vector, 0);
            _offset = at - base + 2;
            return data;
        }
        const major = (payload$1[at] & 0b1110_0000) >> 5;
        const minor = payload$1[at] & 0b0001_1111;
        if (major !== majorUnstructuredByteString) {
            unexpectedMajorInIndefiniteString(major);
        }
        if (minor === minorIndefinite) {
            throw new Error("nested indefinite string.");
        }
        const bytes = decodeUnstructuredByteString(at, to);
        const length = _offset;
        at += length;
        for (let i = 0; i < bytes.length; ++i) {
            vector.push(bytes[i]);
        }
    }
    throw new Error("expected break marker.");
}
function castBigInt$1(bigInt) {
    if (typeof bigInt === "number") {
        return bigInt;
    }
    const num = Number(bigInt);
    if (Number.MIN_SAFE_INTEGER <= num && num <= Number.MAX_SAFE_INTEGER) {
        return num;
    }
    return bigInt;
}
function demote(bigInteger) {
    const num = Number(bigInteger);
    if (num < Number.MIN_SAFE_INTEGER || Number.MAX_SAFE_INTEGER < num) {
        console.warn(new Error(`@smithy/core/cbor - truncating BigInt(${bigInteger}) to ${num} with loss of precision.`));
    }
    return num;
}
function overflow$1(n) {
    throw new Error(`length ${n} greater than remaining buf len.`);
}
function unexpectedMinor(minor) {
    throw new Error(`unexpected minor value ${minor}.`);
}
function unexpectedMajorInIndefiniteString(major) {
    throw new Error(`unexpected major type ${major} in indefinite string.`);
}

const USE_BUFFER$2 = typeof Buffer !== "undefined";
const encodeStringCache = new Map();
let encodeCacheEpoch$1 = 0;
let encodeCacheSaturated$1 = false;
const initialSize = 2048;
let data = alloc(initialSize);
let dataView$1 = new DataView(data.buffer, data.byteOffset, data.byteLength);
let cursor$1 = 0;
function encode(_input) {
    const encodeStack = [_input];
    while (encodeStack.length) {
        const input = encodeStack.pop();
        if (typeof input === "string") {
            const len = input.length;
            if (USE_BUFFER$2) {
                ensureSpace(len * 3 + 9);
                if (len > 23) {
                    encodeHeader$1(majorUtf8String, Buffer.byteLength(input));
                    cursor$1 += data.write(input, cursor$1);
                }
                else {
                    encodeStringCached(input);
                }
            }
            else {
                const maxBytes = len * 3;
                ensureSpace(maxBytes + 9);
                const headerPos = cursor$1;
                const result = new TextEncoder().encodeInto(input, data.subarray(cursor$1 + 9));
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
                cursor$1 = headerPos;
                encodeInteger(majorUtf8String, byteLen);
                cursor$1 += byteLen;
            }
            continue;
        }
        if (data.byteLength - cursor$1 < 9) {
            ensureSpace(64);
        }
        if (typeof input === "number") {
            if (Number.isInteger(input) && input >= -9007199254740992 && input <= 0x1fffffffffffff) {
                const nonNegative = input >= 0;
                const major = nonNegative ? majorUint64 : majorNegativeInt64;
                const value = nonNegative ? input : -input - 1;
                if (value < 24) {
                    data[cursor$1++] = (major << 5) | value;
                }
                else if (value < 256) {
                    data[cursor$1++] = (major << 5) | 24;
                    data[cursor$1++] = value;
                }
                else if (value < 65536) {
                    data[cursor$1++] = (major << 5) | extendedFloat16;
                    data[cursor$1++] = value >> 8;
                    data[cursor$1++] = value & 0xff;
                }
                else if (value < 4294967296) {
                    data[cursor$1++] = (major << 5) | extendedFloat32;
                    dataView$1.setUint32(cursor$1, value);
                    cursor$1 += 4;
                }
                else {
                    data[cursor$1++] = (major << 5) | extendedFloat64;
                    const hi = (value / 4294967296) | 0;
                    const lo = (value - hi * 4294967296) | 0;
                    dataView$1.setUint32(cursor$1, hi);
                    dataView$1.setUint32(cursor$1 + 4, lo);
                    cursor$1 += 8;
                }
                continue;
            }
            data[cursor$1++] = (majorSpecial << 5) | extendedFloat64;
            dataView$1.setFloat64(cursor$1, input);
            cursor$1 += 8;
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
                    data[cursor$1++] = (major << 5) | extendedFloat64;
                    dataView$1.setBigUint64(cursor$1, value);
                    cursor$1 += 8;
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
                data[cursor$1++] = nonNegative ? 0b110_00010 : 0b110_00011;
                encodeHeader$1(majorUnstructuredByteString, bigIntBytes.byteLength);
                data.set(bigIntBytes, cursor$1);
                cursor$1 += bigIntBytes.byteLength;
            }
            continue;
        }
        else if (input === null) {
            data[cursor$1++] = (majorSpecial << 5) | specialNull;
            continue;
        }
        else if (typeof input === "boolean") {
            data[cursor$1++] = (majorSpecial << 5) | (input ? specialTrue : specialFalse);
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
            data.set(input, cursor$1);
            cursor$1 += input.byteLength;
            continue;
        }
        else if (typeof input === "object") {
            if (input instanceof NumericValue) {
                const decimalIndex = input.string.indexOf(".");
                const exponent = decimalIndex === -1 ? 0 : decimalIndex - input.string.length + 1;
                const mantissa = BigInt(input.string.replace(".", ""));
                data[cursor$1++] = 0b110_00100;
                encodeInteger(majorList, 2);
                encodeStack.push(mantissa);
                encodeStack.push(exponent);
                continue;
            }
            if (input[tagSymbol]) {
                if ("tag" in input && "value" in input) {
                    encodeStack.push(input.value);
                    encodeHeader$1(majorTag, input.tag);
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
function advanceEncodingEpoch() {
    encodeCacheEpoch$1 = (encodeCacheEpoch$1 + 1) & 0b1111_1111_1111_1111;
    encodeCacheSaturated$1 = false;
}
function toUint8Array() {
    const out = alloc(cursor$1);
    out.set(data.subarray(0, cursor$1), 0);
    cursor$1 = 0;
    return out;
}
function resize(size) {
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
    dataView$1 = new DataView(data.buffer, data.byteOffset, data.byteLength);
}
function encodeStringCached(input) {
    const cached = encodeStringCache.get(input);
    if (cached !== undefined) {
        data.set(cached.bytes, cursor$1);
        cursor$1 += cached.bytes.length;
        cached.epoch = encodeCacheEpoch$1;
        return;
    }
    const start = cursor$1;
    const byteLen = Buffer.byteLength(input);
    encodeInteger(majorUtf8String, byteLen);
    cursor$1 += data.write(input, cursor$1);
    const bytes = Uint8Array.prototype.slice.call(data, start, cursor$1);
    if (encodeStringCache.size >= 2048) {
        if (encodeCacheSaturated$1) {
            return;
        }
        let evicted = 0;
        for (const [key, entry] of encodeStringCache) {
            if (evicted >= 1024) {
                break;
            }
            if (entry.epoch !== encodeCacheEpoch$1) {
                encodeStringCache.delete(key);
                evicted++;
            }
        }
        if (evicted === 0) {
            encodeCacheSaturated$1 = true;
            return;
        }
    }
    if (encodeStringCache.size < 2048) {
        encodeStringCache.set(input, { epoch: encodeCacheEpoch$1, bytes });
    }
}
function ensureSpace(bytes) {
    const remaining = data.byteLength - cursor$1;
    if (remaining < bytes) {
        if (cursor$1 < 16_000_000) {
            resize(Math.max(data.byteLength * 4, data.byteLength + bytes));
        }
        else {
            resize(data.byteLength + bytes + 16_000_000);
        }
    }
}
function encodeHeader$1(major, value) {
    if (value < 24) {
        data[cursor$1++] = (major << 5) | value;
    }
    else if (value < 256) {
        data[cursor$1++] = (major << 5) | 24;
        data[cursor$1++] = value;
    }
    else if (value < 65536) {
        data[cursor$1++] = (major << 5) | extendedFloat16;
        dataView$1.setUint16(cursor$1, value);
        cursor$1 += 2;
    }
    else if (value < 4294967296) {
        data[cursor$1++] = (major << 5) | extendedFloat32;
        dataView$1.setUint32(cursor$1, value);
        cursor$1 += 4;
    }
    else {
        data[cursor$1++] = (major << 5) | extendedFloat64;
        dataView$1.setBigUint64(cursor$1, typeof value === "bigint" ? value : BigInt(value));
        cursor$1 += 8;
    }
}
function encodeInteger(major, value) {
    if (value < 24) {
        data[cursor$1++] = (major << 5) | value;
    }
    else if (value < 256) {
        data[cursor$1++] = (major << 5) | 24;
        data[cursor$1++] = value;
    }
    else if (value < 65536) {
        data[cursor$1++] = (major << 5) | extendedFloat16;
        data[cursor$1++] = value >> 8;
        data[cursor$1++] = value & 0xff;
    }
    else if (value < 4294967296) {
        data[cursor$1++] = (major << 5) | extendedFloat32;
        dataView$1.setUint32(cursor$1, value);
        cursor$1 += 4;
    }
    else {
        data[cursor$1++] = (major << 5) | extendedFloat64;
        const hi = (value / 4294967296) | 0;
        const lo = (value - hi * 4294967296) | 0;
        dataView$1.setUint32(cursor$1, hi);
        dataView$1.setUint32(cursor$1 + 4, lo);
        cursor$1 += 8;
    }
}

const cbor = {
    deserialize(payload) {
        advanceDecodingEpoch();
        setPayload(payload);
        return decode(0, payload.length);
    },
    serialize(input) {
        advanceEncodingEpoch();
        try {
            encode(input);
            return toUint8Array();
        }
        catch (e) {
            toUint8Array();
            throw e;
        }
    },
    resizeEncodingBuffer(size) {
        resize(size);
    },
};

const parseCborBody = (streamBody, context) => {
    return collectBody(streamBody, context).then(async (bytes) => {
        if (bytes.length) {
            try {
                return cbor.deserialize(bytes);
            }
            catch (e) {
                Object.defineProperty(e, "$responseBodyText", {
                    value: context.utf8Encoder(bytes),
                });
                throw e;
            }
        }
        return {};
    });
};
const dateToTag = (date) => {
    return tag({
        tag: 1,
        value: date.getTime() / 1000,
    });
};
const parseCborErrorBody = async (errorBody, context) => {
    const value = await parseCborBody(errorBody, context);
    value.message = value.message ?? value.Message;
    return value;
};
const loadSmithyRpcV2CborErrorCode = (output, data) => {
    const sanitizeErrorCode = (rawValue) => {
        let cleanValue = rawValue;
        if (typeof cleanValue === "number") {
            cleanValue = cleanValue.toString();
        }
        if (cleanValue.indexOf(",") >= 0) {
            cleanValue = cleanValue.split(",")[0];
        }
        if (cleanValue.indexOf(":") >= 0) {
            cleanValue = cleanValue.split(":")[0];
        }
        if (cleanValue.indexOf("#") >= 0) {
            cleanValue = cleanValue.split("#")[1];
        }
        return cleanValue;
    };
    if (data["__type"] !== undefined) {
        return sanitizeErrorCode(data["__type"]);
    }
    let codeKey;
    for (const key in data) {
        if (key.toLowerCase() === "code") {
            codeKey = key;
            break;
        }
    }
    if (codeKey && data[codeKey] !== undefined) {
        return sanitizeErrorCode(data[codeKey]);
    }
};
const checkCborResponse = (response) => {
    if (String(response.headers["smithy-protocol"]).toLowerCase() !== "rpc-v2-cbor") {
        throw new Error("Malformed RPCv2 CBOR response, status: " + response.statusCode);
    }
};
const buildHttpRpcRequest = async (context, headers, path, resolvedHostname, body) => {
    const endpoint = await context.endpoint();
    const { hostname, protocol = "https", port, path: basePath } = endpoint;
    const contents = {
        protocol,
        hostname,
        port,
        method: "POST",
        path: basePath.endsWith("/") ? basePath.slice(0, -1) + path : basePath + path,
        headers: {
            ...headers,
        },
    };
    if (resolvedHostname !== undefined) {
        contents.hostname = resolvedHostname;
    }
    if (endpoint.headers) {
        for (const name in endpoint.headers) {
            contents.headers[name] = endpoint.headers[name];
        }
    }
    if (body !== undefined) {
        contents.body = body;
        try {
            contents.headers["content-length"] = String(calculateBodyLength(body));
        }
        catch (ignored) { }
    }
    return new HttpRequest(contents);
};

class CborShapeSerializer2 extends SerdeContext {
    write(schema, value) {
        cursor = 0;
        const ns = NormalizedSchema.of(schema);
        writeValue(ns, value, undefined, this.serdeContext);
    }
    flush() {
        const result = buf.subarray(0, cursor);
        cursor = 0;
        buf = allocUnsafe(INITIAL_BUFFER_SIZE);
        view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        return result;
    }
}
const CBOR_STRUCT_CACHE = Symbol.for("@smithy/cbor-struct-cache");
function loadCborStructIterator(ns) {
    const schema = ns.getSchema();
    const existing = schema[CBOR_STRUCT_CACHE];
    if (existing) {
        return existing;
    }
    const memberNames = [];
    const memberSchemas = [];
    for (const [name, memberSchema] of ns.structIterator()) {
        memberNames.push(name);
        memberSchemas.push(memberSchema);
    }
    const encodedKeys = new Array(memberNames.length);
    for (let i = 0; i < memberNames.length; ++i) {
        encodedKeys[i] = encodeCborStringKey(memberNames[i]);
    }
    const cache = { memberNames, memberSchemas, encodedKeys };
    schema[CBOR_STRUCT_CACHE] = cache;
    return cache;
}
function encodeCborStringKey(s) {
    let utf8Bytes;
    if (USE_BUFFER$1) {
        utf8Bytes = Buffer.from(s, "utf-8");
    }
    else {
        utf8Bytes = new TextEncoder().encode(s);
    }
    const byteLen = utf8Bytes.length;
    let headerSize;
    if (byteLen < 24) {
        headerSize = 1;
    }
    else if (byteLen < 256) {
        headerSize = 2;
    }
    else {
        headerSize = 3;
    }
    const result = new Uint8Array(headerSize + byteLen);
    if (headerSize === 1) {
        result[0] = (majorUtf8String << 5) | byteLen;
    }
    else if (headerSize === 2) {
        result[0] = (majorUtf8String << 5) | 24;
        result[1] = byteLen;
    }
    else {
        result[0] = (majorUtf8String << 5) | extendedFloat16;
        result[1] = byteLen >> 8;
        result[2] = byteLen & 0xff;
    }
    result.set(utf8Bytes, headerSize);
    return result;
}
const USE_BUFFER$1 = typeof Buffer !== "undefined";
const textEncoder = new TextEncoder();
const INITIAL_BUFFER_SIZE = 2048;
let buf = USE_BUFFER$1 ? Buffer.allocUnsafe(INITIAL_BUFFER_SIZE) : new Uint8Array(INITIAL_BUFFER_SIZE);
let view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
let cursor = 0;
const STRING_CACHE_MAX = 2048;
const stringEncodeCache = new Map();
let encodeCacheEpoch = 0;
let encodeCacheSaturated = false;
function allocUnsafe(size) {
    return USE_BUFFER$1 ? Buffer.allocUnsafe(size) : new Uint8Array(size);
}
function writeValue(ns, value, container, serdeContext) {
    if (value == null) {
        if (value === undefined && ns.isIdempotencyToken()) {
            writeString(generateIdempotencyToken());
            return;
        }
        ensure(1);
        buf[cursor++] = (majorSpecial << 5) | specialNull;
        return;
    }
    if (ns.isUnitSchema()) {
        ensure(1);
        encodeHeader(majorMap, 0);
        return;
    }
    const isObject = typeof value === "object";
    if (isObject) {
        if (ns.isBlobSchema()) {
            if (value instanceof Uint8Array) {
                writeBytes(value);
                return;
            }
        }
        if (ns.isTimestampSchema()) {
            if (value instanceof Date) {
                writeTimestamp(value);
                return;
            }
        }
        if (ns.isStructSchema()) {
            writeStruct(ns, value, serdeContext);
            return;
        }
        if (Array.isArray(value) && (ns.isListSchema() || ns.isDocumentSchema())) {
            writeList(ns, value, ns.isDocumentSchema(), serdeContext);
            return;
        }
        if (ns.isMapSchema()) {
            writeMap(ns, value, false, serdeContext);
            return;
        }
        if (value instanceof Date) {
            writeTimestamp(value);
            return;
        }
        if (value instanceof Uint8Array) {
            writeBytes(value);
            return;
        }
        if (value instanceof NumericValue) {
            writeNumericValue(value);
            return;
        }
        if (value[tagSymbol]) {
            const tagged = value;
            writeTag(tagged.tag, tagged.value);
            return;
        }
        if (ns.isDocumentSchema()) {
            if (Array.isArray(value)) {
                writeList(ns, value, true, serdeContext);
            }
            else {
                writeMap(ns, value, true, serdeContext);
            }
            return;
        }
        if (ns.isBigDecimalSchema()) {
            writeUntypedValue(value);
            return;
        }
        writeMap(ns, value, true, serdeContext);
        return;
    }
    if (typeof value === "string") {
        if (ns.isBlobSchema()) {
            const bytes = (serdeContext?.base64Decoder ?? fromBase64)(value);
            writeBytes(bytes);
            return;
        }
        writeString(value);
        return;
    }
    if (typeof value === "number") {
        ensure(9);
        if (Number.isInteger(value) && value >= -9007199254740992 && value <= 0x1fffffffffffff) {
            writeInteger(value);
        }
        else {
            writeFloat64(value);
        }
        return;
    }
    if (typeof value === "boolean") {
        ensure(1);
        buf[cursor++] = (majorSpecial << 5) | (value ? specialTrue : specialFalse);
        return;
    }
    if (typeof value === "bigint") {
        writeBigInt(value);
        return;
    }
    writeString(String(value));
}
function writeStruct(ns, value, serdeContext) {
    if (ns.isUnionSchema()) {
        let wrote = false;
        for (const [memberName, memberSchema] of ns.structIterator()) {
            const item = value[memberName];
            if (item != null) {
                ensure(9);
                encodeHeader(majorMap, 1);
                writeString(memberName);
                writeValue(memberSchema, item, ns, serdeContext);
                wrote = true;
                break;
            }
        }
        if (!wrote) {
            const { $unknown } = value;
            if (Array.isArray($unknown)) {
                ensure(9);
                encodeHeader(majorMap, 1);
                writeString($unknown[0]);
                writeUntypedValue($unknown[1]);
            }
            else {
                ensure(9);
                encodeHeader(majorMap, 0);
            }
        }
        return;
    }
    const cache = loadCborStructIterator(ns);
    const { memberNames, memberSchemas, encodedKeys } = cache;
    const z = memberNames.length;
    let headerSize;
    if (z < 24) {
        headerSize = 1;
    }
    else if (z < 256) {
        headerSize = 2;
    }
    else {
        headerSize = 3;
    }
    ensure(headerSize);
    const headerPos = cursor;
    cursor += headerSize;
    let count = 0;
    for (let i = 0; i < z; ++i) {
        const item = value[memberNames[i]];
        if (item == null && !memberSchemas[i].isIdempotencyToken()) {
            continue;
        }
        const key = encodedKeys[i];
        ensure(key.length);
        buf.set(key, cursor);
        cursor += key.length;
        writeValue(memberSchemas[i], item, ns, serdeContext);
        ++count;
    }
    if (typeof value.__type === "string") {
        for (const k in value) {
            if (!memberNames.includes(k)) {
                writeString(k);
                writeUntypedValue(value[k]);
                ++count;
            }
        }
    }
    if (headerSize === 1) {
        buf[headerPos] = (majorMap << 5) | count;
    }
    else if (headerSize === 2) {
        buf[headerPos] = (majorMap << 5) | 24;
        buf[headerPos + 1] = count;
    }
    else {
        buf[headerPos] = (majorMap << 5) | extendedFloat16;
        buf[headerPos + 1] = count >> 8;
        buf[headerPos + 2] = count & 0xff;
    }
}
function writeList(ns, value, isDocument, serdeContext) {
    const sparse = !!ns.getMergedTraits().sparse;
    const valueSchema = ns.getValueSchema();
    if (isDocument || sparse) {
        const items = [];
        for (let i = 0; i < value.length; ++i) {
            const item = value[i];
            if (isDocument) {
                if (item !== undefined) {
                    items.push(item);
                }
            }
            else {
                if (item != null || sparse) {
                    items.push(item);
                }
            }
        }
        ensure(9);
        encodeHeader(majorList, items.length);
        for (let i = 0; i < items.length; ++i) {
            writeValue(valueSchema, items[i], undefined, serdeContext);
        }
    }
    else {
        let count = 0;
        for (let i = 0; i < value.length; ++i) {
            if (value[i] != null) {
                ++count;
            }
        }
        ensure(9);
        encodeHeader(majorList, count);
        for (let i = 0; i < value.length; ++i) {
            if (value[i] != null) {
                writeValue(valueSchema, value[i], undefined, serdeContext);
            }
        }
    }
}
function writeMap(ns, value, isDocument, serdeContext) {
    const sparse = !!ns.getMergedTraits().sparse;
    const valueSchema = ns.getValueSchema();
    const keys = [];
    for (const k in value) {
        const v = value[k];
        if (isDocument ? v !== undefined : v != null || sparse) {
            keys.push(k);
        }
    }
    ensure(9);
    encodeHeader(majorMap, keys.length);
    for (let i = 0; i < keys.length; ++i) {
        const k = keys[i];
        writeString(k);
        writeValue(valueSchema, value[k], undefined, serdeContext);
    }
}
function writeUntypedValue(value) {
    if (value == null) {
        ensure(1);
        buf[cursor++] = (majorSpecial << 5) | specialNull;
        return;
    }
    if (typeof value === "string") {
        writeString(value);
        return;
    }
    if (typeof value === "number") {
        ensure(9);
        if (Number.isInteger(value) && value >= -9007199254740992 && value <= 0x1fffffffffffff) {
            writeInteger(value);
        }
        else {
            writeFloat64(value);
        }
        return;
    }
    if (typeof value === "boolean") {
        ensure(1);
        buf[cursor++] = (majorSpecial << 5) | (value ? specialTrue : specialFalse);
        return;
    }
    if (typeof value === "bigint") {
        writeBigInt(value);
        return;
    }
    if (value instanceof Uint8Array) {
        writeBytes(value);
        return;
    }
    if (value instanceof Date) {
        writeTimestamp(value);
        return;
    }
    if (value instanceof NumericValue) {
        writeNumericValue(value);
        return;
    }
    if (value[tagSymbol]) {
        const tagged = value;
        writeTag(tagged.tag, tagged.value);
        return;
    }
    if (Array.isArray(value)) {
        ensure(9);
        encodeHeader(majorList, value.length);
        for (let i = 0; i < value.length; ++i) {
            writeUntypedValue(value[i]);
        }
        return;
    }
    if (typeof value === "object") {
        const keys = Object.keys(value);
        ensure(9);
        encodeHeader(majorMap, keys.length);
        for (let i = 0; i < keys.length; ++i) {
            writeString(keys[i]);
            writeUntypedValue(value[keys[i]]);
        }
        return;
    }
    writeString(String(value));
}
function ensure(n) {
    if (cursor + n > buf.length) {
        let newSize = buf.length * 2;
        while (newSize < cursor + n) {
            newSize *= 2;
        }
        const next = allocUnsafe(newSize);
        next.set(buf.subarray(0, cursor));
        buf = next;
        view = new DataView(next.buffer, next.byteOffset, next.byteLength);
    }
}
function encodeHeader(major, value) {
    if (value < 24) {
        buf[cursor++] = (major << 5) | value;
    }
    else if (value < 256) {
        buf[cursor++] = (major << 5) | 24;
        buf[cursor++] = value;
    }
    else if (value < 65536) {
        buf[cursor++] = (major << 5) | extendedFloat16;
        buf[cursor++] = value >> 8;
        buf[cursor++] = value & 0xff;
    }
    else if (value < 4294967296) {
        buf[cursor++] = (major << 5) | extendedFloat32;
        view.setUint32(cursor, value);
        cursor += 4;
    }
    else {
        buf[cursor++] = (major << 5) | extendedFloat64;
        const hi = (value / 4294967296) | 0;
        const lo = (value - hi * 4294967296) | 0;
        view.setUint32(cursor, hi);
        view.setUint32(cursor + 4, lo);
        cursor += 8;
    }
}
function encodeBigHeader(major, value) {
    const n = Number(value);
    if (n < 4294967296) {
        encodeHeader(major, n);
        return;
    }
    buf[cursor++] = (major << 5) | extendedFloat64;
    view.setBigUint64(cursor, value);
    cursor += 8;
}
function writeString(s) {
    const len = s.length;
    if (len <= 23) {
        const cached = stringEncodeCache.get(s);
        if (cached) {
            ensure(cached.bytes.length);
            buf.set(cached.bytes, cursor);
            cursor += cached.bytes.length;
            cached.epoch = encodeCacheEpoch;
            return;
        }
        const start = cursor;
        writeStringUncached(s, len);
        const end = cursor;
        const bytes = Uint8Array.prototype.slice.call(buf, start, end);
        if (stringEncodeCache.size >= STRING_CACHE_MAX) {
            if (encodeCacheSaturated) {
                return;
            }
            let evicted = 0;
            for (const [key, entry] of stringEncodeCache) {
                if (evicted >= 1024) {
                    break;
                }
                if (entry.epoch !== encodeCacheEpoch) {
                    stringEncodeCache.delete(key);
                    ++evicted;
                }
            }
            if (evicted === 0) {
                encodeCacheSaturated = true;
                return;
            }
        }
        if (stringEncodeCache.size < STRING_CACHE_MAX) {
            stringEncodeCache.set(s, { epoch: encodeCacheEpoch, bytes });
        }
        return;
    }
    writeStringUncached(s, len);
}
function writeStringUncached(s, len) {
    if (USE_BUFFER$1) {
        const maxBytes = len * 3;
        ensure(maxBytes + 9);
        const byteLen = Buffer.byteLength(s);
        encodeHeader(majorUtf8String, byteLen);
        cursor += buf.write(s, cursor);
    }
    else {
        const maxBytes = len * 3;
        ensure(maxBytes + 9);
        const headerPos = cursor;
        const result = textEncoder.encodeInto(s, buf.subarray(headerPos + 9));
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
            buf.copyWithin(headerPos + headerSize, headerPos + 9, headerPos + 9 + byteLen);
        }
        cursor = headerPos;
        encodeHeader(majorUtf8String, byteLen);
        cursor += byteLen;
    }
}
function writeFloat64(value) {
    ensure(9);
    buf[cursor++] = (majorSpecial << 5) | extendedFloat64;
    view.setFloat64(cursor, value);
    cursor += 8;
}
function writeInteger(value) {
    ensure(9);
    const nonNegative = value >= 0;
    const major = nonNegative ? majorUint64 : majorNegativeInt64;
    const abs = nonNegative ? value : -value - 1;
    encodeHeader(major, abs);
}
function writeBigInt(value) {
    const nonNegative = value >= 0;
    const major = nonNegative ? majorUint64 : majorNegativeInt64;
    const abs = nonNegative ? value : -value - BigInt(1);
    if (abs < BigInt("18446744073709551616")) {
        ensure(9);
        encodeBigHeader(major, abs);
    }
    else {
        const binaryStr = abs.toString(2);
        const byteLen = Math.ceil(binaryStr.length / 8);
        const bigIntBytes = new Uint8Array(byteLen);
        let b = abs;
        for (let i = byteLen - 1; i >= 0; --i) {
            bigIntBytes[i] = Number(b & BigInt(255));
            b >>= BigInt(8);
        }
        ensure(byteLen + 16);
        buf[cursor++] = nonNegative ? 0b110_00010 : 0b110_00011;
        encodeHeader(majorUnstructuredByteString, byteLen);
        buf.set(bigIntBytes, cursor);
        cursor += byteLen;
    }
}
function writeBytes(data) {
    ensure(data.length + 9);
    encodeHeader(majorUnstructuredByteString, data.length);
    buf.set(data, cursor);
    cursor += data.length;
}
function writeTag(tagValue, innerValue) {
    ensure(9);
    if (typeof tagValue === "bigint") {
        encodeBigHeader(majorTag, tagValue);
    }
    else {
        encodeHeader(majorTag, tagValue);
    }
    writeUntypedValue(innerValue);
}
function writeNumericValue(nv) {
    const decimalIndex = nv.string.indexOf(".");
    const exponent = decimalIndex === -1 ? 0 : decimalIndex - nv.string.length + 1;
    const mantissa = BigInt(nv.string.replace(".", ""));
    ensure(9);
    buf[cursor++] = 0b110_00100;
    encodeHeader(majorList, 2);
    ensure(9);
    writeInteger(exponent);
    writeBigInt(mantissa);
}
function writeTimestamp(date) {
    ensure(18);
    encodeHeader(majorTag, 1);
    const epochSecs = date.getTime() / 1000;
    if (Number.isInteger(epochSecs)) {
        writeInteger(epochSecs);
    }
    else {
        writeFloat64(epochSecs);
    }
}

class CborShapeDeserializer2 extends SerdeContext {
    read(schema, bytes) {
        payload = bytes;
        isBuffer = USE_BUFFER && bytes instanceof Buffer;
        dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        pos = 0;
        end = bytes.length;
        cacheEpoch = (cacheEpoch + 1) & 0xffff;
        return readValue(NormalizedSchema.of(schema));
    }
    readValue(_schema, value) {
        return transformObject(NormalizedSchema.of(_schema), value);
    }
}
const USE_BUFFER = typeof Buffer !== "undefined";
const textDecoder = new TextDecoder();
let payload = new Uint8Array(0);
let isBuffer = false;
let dataView = new DataView(new ArrayBuffer(0));
let pos = 0;
let end = 0;
const STRING_CACHE_SIZE = 2048;
const stringCache = new Array(STRING_CACHE_SIZE);
const stringCacheEpochs = new Uint16Array(STRING_CACHE_SIZE);
let cacheEpoch = 0;
function readValue(ns) {
    if (pos >= end) {
        throw new Error("unexpected end of CBOR payload.");
    }
    const major = (payload[pos] & 0b1110_0000) >> 5;
    const minor = payload[pos] & 0b0001_1111;
    if (minor === minorIndefinite && major >= 2 && major <= 5) {
        return readIndefinite(ns, major);
    }
    switch (major) {
        case majorUint64:
            return readUnsignedInt();
        case majorNegativeInt64:
            return readNegativeInt();
        case majorUnstructuredByteString:
            return readByteString();
        case majorUtf8String:
            return readUtf8String();
        case majorList:
            return readList(ns);
        case majorMap:
            return readMap(ns);
        case majorTag:
            return readTag();
        case majorSpecial:
            return readSpecial();
        default:
            throw new Error(`unexpected CBOR major type ${major}.`);
    }
}
function readList(ns) {
    const count = decodeCount();
    const memberSchema = ns.isListSchema() ? ns.getValueSchema() : ns;
    const list = Array(count);
    for (let i = 0; i < count; ++i) {
        list[i] = readValue(memberSchema);
    }
    return list;
}
function readMap(ns) {
    const count = decodeCount();
    if (ns.isStructSchema()) {
        const startPos = pos;
        return readStruct(ns, count, startPos);
    }
    const valueSchema = ns.isMapSchema() ? ns.getValueSchema() : ns;
    const map = {};
    for (let i = 0; i < count; ++i) {
        const key = readUtf8String();
        map[key] = readValue(valueSchema);
    }
    return map;
}
function readStruct(ns, count, startPos) {
    const isUnion = ns.isUnionSchema();
    const cache = loadCborStructIterator(ns);
    const { memberSchemas, encodedKeys, memberNames } = cache;
    const z = encodedKeys.length;
    const result = {};
    let unknownKey;
    let unknownValue;
    let unknownCount = 0;
    let hasType = false;
    let hint = 0;
    for (let i = 0; i < count; ++i) {
        const matchIdx = matchStructKey(encodedKeys, z, hint);
        if (matchIdx >= 0) {
            hint = matchIdx + 1;
            if (hint >= z) {
                hint = 0;
            }
            const val = readValue(memberSchemas[matchIdx]);
            if (val != null) {
                result[memberNames[matchIdx]] = val;
            }
        }
        else {
            const key = readUtf8String();
            const val = readValue(NormalizedSchema.of(15));
            if (key === "__type" && typeof val === "string") {
                hasType = true;
            }
            else {
                unknownKey = key;
                unknownValue = val;
                ++unknownCount;
            }
        }
    }
    if (isUnion) {
        let resultEmpty = true;
        for (const _ in result) {
            resultEmpty = false;
            break;
        }
        if (resultEmpty && unknownCount === 1) {
            result.$unknown = [unknownKey, unknownValue];
        }
    }
    else if (hasType) {
        pos = startPos;
        const docSchema = NormalizedSchema.of(15);
        for (let i = 0; i < count; ++i) {
            const key = readUtf8String();
            const val = readValue(docSchema);
            if (!(key in result)) {
                result[key] = val;
            }
        }
    }
    return result;
}
function readTag(ns) {
    const tagNum = decodeArgument();
    const tagNumber = typeof tagNum === "bigint" ? Number(tagNum) : tagNum;
    if (tagNumber === 1) {
        const docSchema = NormalizedSchema.of(15);
        const epochValue = readValue(docSchema);
        return _parseEpochTimestamp(epochValue);
    }
    if (tagNumber === 2 || tagNumber === 3) {
        const byteStr = readByteString();
        let b = BigInt(0);
        for (let i = 0; i < byteStr.length; ++i) {
            b = (b << BigInt(8)) | BigInt(byteStr[i]);
        }
        return tagNumber === 3 ? -b - BigInt(1) : b;
    }
    if (tagNumber === 4) {
        const docSchema = NormalizedSchema.of(15);
        const pair = readValue(docSchema);
        const [exponent, mantissa] = pair;
        const normalizer = mantissa < 0 ? -1 : 1;
        const mantissaStr = "0".repeat(Math.abs(exponent) + 1) + String(BigInt(normalizer) * BigInt(mantissa));
        let numericString;
        const sign = mantissa < 0 ? "-" : "";
        numericString =
            exponent === 0
                ? mantissaStr
                : mantissaStr.slice(0, mantissaStr.length + exponent) + "." + mantissaStr.slice(exponent);
        numericString = numericString.replace(/^0+/g, "");
        if (numericString === "") {
            numericString = "0";
        }
        if (numericString[0] === ".") {
            numericString = "0" + numericString;
        }
        numericString = sign + numericString;
        return nv(numericString);
    }
    const docSchema = NormalizedSchema.of(15);
    const innerValue = readValue(docSchema);
    return { tag: castBigInt(tagNum), value: innerValue };
}
function readIndefinite(ns, major) {
    switch (major) {
        case majorUtf8String:
            return readUtf8StringIndefinite();
        case majorUnstructuredByteString:
            return readByteStringIndefinite();
        case majorList:
            return readListIndefinite(ns);
        case majorMap:
            return readMapIndefinite(ns);
        default:
            throw new Error(`unexpected indefinite length for major ${major}.`);
    }
}
function readUtf8StringIndefinite() {
    pos += 1;
    const chunks = [];
    let totalLen = 0;
    while (pos < end) {
        if (payload[pos] === 0xff) {
            pos += 1;
            const combined = new Uint8Array(totalLen);
            let offset = 0;
            for (let i = 0; i < chunks.length; ++i) {
                combined.set(chunks[i], offset);
                offset += chunks[i].length;
            }
            if (USE_BUFFER) {
                return Buffer.from(combined.buffer, combined.byteOffset, combined.byteLength).toString("utf-8");
            }
            return textDecoder.decode(combined);
        }
        const bytes = readByteString();
        chunks.push(bytes);
        totalLen += bytes.length;
    }
    throw new Error("expected break marker.");
}
function readByteStringIndefinite() {
    pos += 1;
    const chunks = [];
    let totalLen = 0;
    while (pos < end) {
        if (payload[pos] === 0xff) {
            pos += 1;
            const combined = new Uint8Array(totalLen);
            let offset = 0;
            for (let i = 0; i < chunks.length; ++i) {
                combined.set(chunks[i], offset);
                offset += chunks[i].length;
            }
            return combined;
        }
        const bytes = readByteString();
        chunks.push(bytes);
        totalLen += bytes.length;
    }
    throw new Error("expected break marker.");
}
function readListIndefinite(ns) {
    pos += 1;
    const memberSchema = ns.isListSchema() ? ns.getValueSchema() : ns;
    const list = [];
    while (pos < end) {
        if (payload[pos] === 0xff) {
            pos += 1;
            return list;
        }
        list.push(readValue(memberSchema));
    }
    throw new Error("expected break marker.");
}
function readMapIndefinite(ns) {
    pos += 1;
    if (ns.isStructSchema()) {
        const cache = loadCborStructIterator(ns);
        const { memberSchemas, encodedKeys, memberNames } = cache;
        const z = encodedKeys.length;
        const isUnion = ns.isUnionSchema();
        const result = {};
        let unknownKey;
        let unknownValue;
        let unknownCount = 0;
        let hint = 0;
        while (pos < end) {
            if (payload[pos] === 0xff) {
                pos += 1;
                if (isUnion) {
                    let resultEmpty = true;
                    for (const _ in result) {
                        resultEmpty = false;
                        break;
                    }
                    if (resultEmpty && unknownCount === 1) {
                        result.$unknown = [unknownKey, unknownValue];
                    }
                }
                return result;
            }
            const matchIdx = matchStructKey(encodedKeys, z, hint);
            if (matchIdx >= 0) {
                hint = matchIdx + 1;
                if (hint >= z) {
                    hint = 0;
                }
                const val = readValue(memberSchemas[matchIdx]);
                if (val != null) {
                    result[memberNames[matchIdx]] = val;
                }
            }
            else {
                const key = readUtf8String();
                const val = readValue(NormalizedSchema.of(15));
                if (key !== "__type") {
                    unknownKey = key;
                    unknownValue = val;
                    ++unknownCount;
                }
            }
        }
        throw new Error("expected break marker.");
    }
    const valueSchema = ns.isMapSchema() ? ns.getValueSchema() : ns;
    const map = {};
    while (pos < end) {
        if (payload[pos] === 0xff) {
            pos += 1;
            return map;
        }
        const key = readUtf8String();
        map[key] = readValue(valueSchema);
    }
    throw new Error("expected break marker.");
}
function matchStructKey(encodedKeys, z, hint) {
    const hintKey = encodedKeys[hint];
    if (pos + hintKey.length <= end && bytesMatch(pos, hintKey)) {
        pos += hintKey.length;
        return hint;
    }
    for (let i = 0; i < z; ++i) {
        if (i === hint) {
            continue;
        }
        const ek = encodedKeys[i];
        if (pos + ek.length <= end && bytesMatch(pos, ek)) {
            pos += ek.length;
            return i;
        }
    }
    return -1;
}
function bytesMatch(at, expected) {
    const len = expected.length;
    if (payload[at] !== expected[0]) {
        return false;
    }
    for (let i = 1; i < len; ++i) {
        if (payload[at + i] !== expected[i]) {
            return false;
        }
    }
    return true;
}
function decodeArgument() {
    const minor = payload[pos] & 0b0001_1111;
    if (minor < 24) {
        pos += 1;
        return minor;
    }
    switch (minor) {
        case extendedOneByte:
            if (end - pos < 2) {
                overflow(1);
            }
            pos += 2;
            return payload[pos - 1];
        case extendedFloat16:
            if (end - pos < 3) {
                overflow(2);
            }
            pos += 3;
            return dataView.getUint16(pos - 2);
        case extendedFloat32:
            if (end - pos < 5) {
                overflow(4);
            }
            pos += 5;
            return dataView.getUint32(pos - 4);
        case extendedFloat64: {
            if (end - pos < 9) {
                overflow(8);
            }
            pos += 9;
            const hi = dataView.getUint32(pos - 8);
            if (hi < 0x00200000) {
                return hi * 4294967296 + dataView.getUint32(pos - 4);
            }
            return dataView.getBigUint64(pos - 8);
        }
        default:
            throw new Error(`unexpected minor value ${minor}.`);
    }
}
function decodeCount() {
    const val = decodeArgument();
    return typeof val === "bigint" ? Number(val) : val;
}
function readUnsignedInt() {
    const val = decodeArgument();
    return castBigInt(val);
}
function readNegativeInt() {
    const val = decodeArgument();
    if (typeof val === "bigint") {
        return BigInt(-1) - val;
    }
    return -1 - val;
}
function readByteString() {
    const length = decodeCount();
    if (end - pos < length) {
        overflow(length);
    }
    const start = pos;
    pos += length;
    return payload.subarray(start, start + length);
}
function readUtf8String() {
    const length = decodeCount();
    if (end - pos < length) {
        overflow(length);
    }
    const start = pos;
    pos += length;
    if (length < 24) {
        return decodeUtf8Cached(start, length);
    }
    if (isBuffer) {
        return payload.toString("utf-8", start, start + length);
    }
    return textDecoder.decode(payload.subarray(start, start + length));
}
function decodeUtf8Cached(at, length) {
    let h = length;
    for (let i = 0; i < length; ++i) {
        h = (h * 31 + payload[at + i]) | 0;
    }
    const slot = (h >>> 0) & (STRING_CACHE_SIZE - 1);
    const cached = stringCache[slot];
    if (cached !== undefined && cached.length === length) {
        let match = true;
        for (let i = 0; i < length; ++i) {
            if (cached.charCodeAt(i) !== payload[at + i]) {
                match = false;
                break;
            }
        }
        if (match) {
            stringCacheEpochs[slot] = cacheEpoch;
            return cached;
        }
    }
    const result = isBuffer
        ? payload.toString("utf-8", at, at + length)
        : textDecoder.decode(payload.subarray(at, at + length));
    if (stringCacheEpochs[slot] !== cacheEpoch) {
        stringCache[slot] = result;
        stringCacheEpochs[slot] = cacheEpoch;
    }
    return result;
}
function readSpecial() {
    const p = pos;
    const minor = payload[p] & 0b0001_1111;
    switch (minor) {
        case specialTrue:
            pos = p + 1;
            return true;
        case specialFalse:
            pos = p + 1;
            return false;
        case specialNull:
            pos = p + 1;
            return null;
        case specialUndefined:
            pos = p + 1;
            return null;
        case extendedFloat16: {
            if (end - p < 3) {
                overflow(2);
            }
            pos = p + 3;
            return bytesToFloat16(payload[p + 1], payload[p + 2]);
        }
        case extendedFloat32: {
            if (end - p < 5) {
                overflow(4);
            }
            pos = p + 5;
            return dataView.getFloat32(p + 1);
        }
        case extendedFloat64: {
            if (end - p < 9) {
                overflow(8);
            }
            pos = p + 9;
            return dataView.getFloat64(p + 1);
        }
        default:
            throw new Error(`unexpected minor value ${minor} for major 7.`);
    }
}
function bytesToFloat16(a, b) {
    const sign = a >> 7;
    const exponent = (a & 0b0111_1100) >> 2;
    const fraction = ((a & 0b0000_0011) << 8) | b;
    const scalar = sign === 0 ? 1 : -1;
    if (exponent === 0b00000) {
        if (fraction === 0) {
            return 0;
        }
        return scalar * (Math.pow(2, 1 - 15) * (fraction / 1024));
    }
    else if (exponent === 0b11111) {
        if (fraction === 0) {
            return scalar * Infinity;
        }
        return NaN;
    }
    return scalar * (Math.pow(2, exponent - 15) * (1 + fraction / 1024));
}
function castBigInt(value) {
    if (typeof value === "number") {
        return value;
    }
    const num = Number(value);
    if (Number.MIN_SAFE_INTEGER <= num && num <= Number.MAX_SAFE_INTEGER) {
        return num;
    }
    return value;
}
function overflow(n) {
    throw new Error(`CBOR: length ${n} greater than remaining buffer length.`);
}
function transformObject(ns, value) {
    if (ns.isTimestampSchema()) {
        if (typeof value === "number") {
            return _parseEpochTimestamp(value);
        }
        if (typeof value === "object" && value !== null) {
            if (value.tag === 1 && "value" in value) {
                return _parseEpochTimestamp(value.value);
            }
        }
    }
    if (ns.isBlobSchema()) {
        return value;
    }
    if (typeof value === "undefined" ||
        typeof value === "boolean" ||
        typeof value === "number" ||
        typeof value === "string" ||
        typeof value === "bigint" ||
        typeof value === "symbol") {
        return value;
    }
    if (typeof value !== "object" || value === null) {
        return value;
    }
    if ("byteLength" in value) {
        return value;
    }
    if (value instanceof Date) {
        return value;
    }
    if (value instanceof NumericValue) {
        return value;
    }
    if (ns.isDocumentSchema()) {
        return value;
    }
    if (ns.isListSchema()) {
        const memberSchema = ns.getValueSchema();
        const out = [];
        for (const item of value) {
            out.push(transformObject(memberSchema, item));
        }
        return out;
    }
    const newObject = {};
    if (ns.isMapSchema()) {
        const targetSchema = ns.getValueSchema();
        for (const key in value) {
            newObject[key] = transformObject(targetSchema, value[key]);
        }
    }
    else if (ns.isStructSchema()) {
        const isUnion = ns.isUnionSchema();
        let keys;
        if (isUnion) {
            keys = new Set();
            for (const k in value) {
                if (k !== "__type") {
                    keys.add(k);
                }
            }
        }
        for (const [key, memberSchema] of ns.structIterator()) {
            if (isUnion) {
                keys.delete(key);
            }
            if (value[key] != null) {
                newObject[key] = transformObject(memberSchema, value[key]);
            }
        }
        if (isUnion && keys?.size === 1) {
            let newObjectEmpty = true;
            for (const _ in newObject) {
                newObjectEmpty = false;
                break;
            }
            if (newObjectEmpty) {
                const k = keys.values().next().value;
                newObject.$unknown = [k, value[k]];
            }
        }
        else if (typeof value.__type === "string") {
            for (const k in value) {
                if (!(k in newObject)) {
                    newObject[k] = value[k];
                }
            }
        }
    }
    return newObject;
}

class CborCodec extends SerdeContext {
    createSerializer() {
        const serializer = new CborShapeSerializer2();
        serializer.setSerdeContext(this.serdeContext);
        return serializer;
    }
    createDeserializer() {
        const deserializer = new CborShapeDeserializer2();
        deserializer.setSerdeContext(this.serdeContext);
        return deserializer;
    }
}

class SmithyRpcV2CborProtocol extends RpcProtocol {
    codec = new CborCodec();
    serializer = this.codec.createSerializer();
    deserializer = this.codec.createDeserializer();
    constructor({ defaultNamespace, errorTypeRegistries, }) {
        super({ defaultNamespace, errorTypeRegistries });
    }
    getShapeId() {
        return "smithy.protocols#rpcv2Cbor";
    }
    getPayloadCodec() {
        return this.codec;
    }
    async serializeRequest(operationSchema, input, context) {
        const request = await super.serializeRequest(operationSchema, input, context);
        Object.assign(request.headers, {
            "content-type": this.getDefaultContentType(),
            "smithy-protocol": "rpc-v2-cbor",
            accept: this.getDefaultContentType(),
        });
        if (deref(operationSchema.input) === "unit") {
            delete request.body;
            delete request.headers["content-type"];
        }
        else {
            if (!request.body) {
                this.serializer.write(15, {});
                request.body = this.serializer.flush();
            }
            if (request.body instanceof Uint8Array) {
                request.headers["content-length"] = String(request.body.byteLength);
            }
        }
        const { service, operation } = getSmithyContext(context);
        const path = `/service/${service}/operation/${operation}`;
        if (request.path.endsWith("/")) {
            request.path += path.slice(1);
        }
        else {
            request.path += path;
        }
        return request;
    }
    async deserializeResponse(operationSchema, context, response) {
        return super.deserializeResponse(operationSchema, context, response);
    }
    async handleError(operationSchema, context, response, dataObject, metadata) {
        const errorName = loadSmithyRpcV2CborErrorCode(response, dataObject) ?? "Unknown";
        const errorMetadata = {
            $metadata: metadata,
            $fault: response.statusCode <= 500 ? "client" : "server",
        };
        let namespace = this.options.defaultNamespace;
        if (errorName.includes("#")) {
            [namespace] = errorName.split("#");
        }
        const registry = this.compositeErrorRegistry;
        const nsRegistry = TypeRegistry.for(namespace);
        registry.copyFrom(nsRegistry);
        let errorSchema;
        try {
            errorSchema = registry.getSchema(errorName);
        }
        catch (ignored) {
            if (dataObject.Message) {
                dataObject.message = dataObject.Message;
            }
            const syntheticRegistry = TypeRegistry.for("smithy.ts.sdk.synthetic." + namespace);
            registry.copyFrom(syntheticRegistry);
            const baseExceptionSchema = registry.getBaseException();
            if (baseExceptionSchema) {
                const ErrorCtor = registry.getErrorCtor(baseExceptionSchema);
                throw Object.assign(new ErrorCtor({ name: errorName }), errorMetadata, dataObject);
            }
            throw Object.assign(new Error(errorName), errorMetadata, dataObject);
        }
        const ns = NormalizedSchema.of(errorSchema);
        const ErrorCtor = registry.getErrorCtor(errorSchema);
        const message = dataObject.message ?? dataObject.Message ?? "Unknown";
        const exception = new ErrorCtor({});
        const output = {};
        for (const [name, member] of ns.structIterator()) {
            output[name] = this.deserializer.readValue(member, dataObject[name]);
        }
        throw Object.assign(exception, errorMetadata, {
            $fault: ns.getMergedTraits().error,
            message,
        }, output);
    }
    getDefaultContentType() {
        return "application/cbor";
    }
}

class CborShapeSerializer extends SerdeContext {
    value;
    write(schema, value) {
        this.value = this.serialize(schema, value);
    }
    serialize(schema, source) {
        const ns = NormalizedSchema.of(schema);
        if (source == null) {
            if (ns.isIdempotencyToken()) {
                return generateIdempotencyToken();
            }
            return source;
        }
        if (ns.isBlobSchema()) {
            if (typeof source === "string") {
                return (this.serdeContext?.base64Decoder ?? fromBase64)(source);
            }
            return source;
        }
        if (ns.isTimestampSchema()) {
            if (typeof source === "number" || typeof source === "bigint") {
                return dateToTag(new Date((Number(source) / 1000) | 0));
            }
            return dateToTag(source);
        }
        if (typeof source === "function" || typeof source === "object") {
            const sourceObject = source;
            if (ns.isListSchema() && Array.isArray(sourceObject)) {
                const sparse = !!ns.getMergedTraits().sparse;
                const newArray = [];
                let i = 0;
                for (const item of sourceObject) {
                    const value = this.serialize(ns.getValueSchema(), item);
                    if (value != null || sparse) {
                        newArray[i++] = value;
                    }
                }
                return newArray;
            }
            if (sourceObject instanceof Date) {
                return dateToTag(sourceObject);
            }
            const newObject = {};
            if (ns.isMapSchema()) {
                const sparse = !!ns.getMergedTraits().sparse;
                for (const key in sourceObject) {
                    const value = this.serialize(ns.getValueSchema(), sourceObject[key]);
                    if (value != null || sparse) {
                        newObject[key] = value;
                    }
                }
            }
            else if (ns.isStructSchema()) {
                for (const [key, memberSchema] of ns.structIterator()) {
                    const value = this.serialize(memberSchema, sourceObject[key]);
                    if (value != null) {
                        newObject[key] = value;
                    }
                }
                const isUnion = ns.isUnionSchema();
                if (isUnion && Array.isArray(sourceObject.$unknown)) {
                    const [k, v] = sourceObject.$unknown;
                    newObject[k] = v;
                }
                else if (typeof sourceObject.__type === "string") {
                    for (const k in sourceObject) {
                        if (!(k in newObject)) {
                            newObject[k] = this.serialize(15, sourceObject[k]);
                        }
                    }
                }
            }
            else if (ns.isDocumentSchema()) {
                if (Array.isArray(sourceObject)) {
                    const newArray = [];
                    let i = 0;
                    for (const item of sourceObject) {
                        newArray[i++] = this.serialize(ns.getValueSchema(), item);
                    }
                    return newArray;
                }
                for (const key in sourceObject) {
                    newObject[key] = this.serialize(ns.getValueSchema(), sourceObject[key]);
                }
            }
            else if (ns.isBigDecimalSchema()) {
                return sourceObject;
            }
            return newObject;
        }
        return source;
    }
    flush() {
        const buffer = cbor.serialize(this.value);
        this.value = undefined;
        return buffer;
    }
}

class CborShapeDeserializer extends SerdeContext {
    read(schema, bytes) {
        const data = cbor.deserialize(bytes);
        return this.readValue(schema, data);
    }
    readValue(_schema, value) {
        const ns = NormalizedSchema.of(_schema);
        if (ns.isTimestampSchema()) {
            if (typeof value === "number") {
                return _parseEpochTimestamp(value);
            }
            if (typeof value === "object") {
                if (value.tag === 1 && "value" in value) {
                    return _parseEpochTimestamp(value.value);
                }
            }
        }
        if (ns.isBlobSchema()) {
            if (typeof value === "string") {
                return (this.serdeContext?.base64Decoder ?? fromBase64)(value);
            }
            return value;
        }
        if (typeof value === "undefined" ||
            typeof value === "boolean" ||
            typeof value === "number" ||
            typeof value === "string" ||
            typeof value === "bigint" ||
            typeof value === "symbol") {
            return value;
        }
        else if (typeof value === "object") {
            if (value === null) {
                return null;
            }
            if ("byteLength" in value) {
                return value;
            }
            if (value instanceof Date) {
                return value;
            }
            if (ns.isDocumentSchema()) {
                return value;
            }
            if (ns.isListSchema()) {
                const newArray = [];
                const memberSchema = ns.getValueSchema();
                for (const item of value) {
                    const itemValue = this.readValue(memberSchema, item);
                    newArray.push(itemValue);
                }
                return newArray;
            }
            const newObject = {};
            if (ns.isMapSchema()) {
                const targetSchema = ns.getValueSchema();
                for (const key in value) {
                    const itemValue = this.readValue(targetSchema, value[key]);
                    newObject[key] = itemValue;
                }
            }
            else if (ns.isStructSchema()) {
                const isUnion = ns.isUnionSchema();
                let keys;
                if (isUnion) {
                    keys = new Set();
                    for (const k in value) {
                        if (k !== "__type") {
                            keys.add(k);
                        }
                    }
                }
                for (const [key, memberSchema] of ns.structIterator()) {
                    if (isUnion) {
                        keys.delete(key);
                    }
                    if (value[key] != null) {
                        newObject[key] = this.readValue(memberSchema, value[key]);
                    }
                }
                if (isUnion && keys?.size === 1) {
                    let newObjectEmpty = true;
                    for (const _ in newObject) {
                        newObjectEmpty = false;
                        break;
                    }
                    if (newObjectEmpty) {
                        const k = keys.values().next().value;
                        newObject.$unknown = [k, value[k]];
                    }
                }
                else if (typeof value.__type === "string") {
                    for (const k in value) {
                        if (!(k in newObject)) {
                            newObject[k] = value[k];
                        }
                    }
                }
            }
            else if (value instanceof NumericValue) {
                return value;
            }
            return newObject;
        }
        else {
            return value;
        }
    }
}

exports.CborCodec = CborCodec;
exports.CborShapeDeserializer = CborShapeDeserializer;
exports.CborShapeDeserializer2 = CborShapeDeserializer2;
exports.CborShapeSerializer = CborShapeSerializer;
exports.CborShapeSerializer2 = CborShapeSerializer2;
exports.SmithyRpcV2CborProtocol = SmithyRpcV2CborProtocol;
exports.buildHttpRpcRequest = buildHttpRpcRequest;
exports.cbor = cbor;
exports.checkCborResponse = checkCborResponse;
exports.dateToTag = dateToTag;
exports.loadSmithyRpcV2CborErrorCode = loadSmithyRpcV2CborErrorCode;
exports.parseCborBody = parseCborBody;
exports.parseCborErrorBody = parseCborErrorBody;
exports.tag = tag;
exports.tagSymbol = tagSymbol;
