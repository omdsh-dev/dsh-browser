import { SerdeContext } from "@smithy/core/protocols";
import { NormalizedSchema } from "@smithy/core/schema";
import { NumericValue, fromBase64, generateIdempotencyToken } from "@smithy/core/serde";
import { extendedFloat16, extendedFloat32, extendedFloat64, majorList, majorMap, majorNegativeInt64, majorSpecial, majorTag, majorUint64, majorUnstructuredByteString, majorUtf8String, specialFalse, specialNull, specialTrue, tagSymbol, } from "../cbor-types";
export class CborShapeSerializer2 extends SerdeContext {
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
export function advanceSinglePassEncodingEpoch() {
    encodeCacheEpoch = (encodeCacheEpoch + 1) & 0xffff;
    encodeCacheSaturated = false;
}
const CBOR_STRUCT_CACHE = Symbol.for("@smithy/cbor-struct-cache");
export function loadCborStructIterator(ns) {
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
    if (USE_BUFFER) {
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
const USE_BUFFER = typeof Buffer !== "undefined";
const textEncoder = new TextEncoder();
const INITIAL_BUFFER_SIZE = 2048;
let buf = USE_BUFFER ? Buffer.allocUnsafe(INITIAL_BUFFER_SIZE) : new Uint8Array(INITIAL_BUFFER_SIZE);
let view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
let cursor = 0;
const STRING_CACHE_MAX = 2048;
const stringEncodeCache = new Map();
let encodeCacheEpoch = 0;
let encodeCacheSaturated = false;
function allocUnsafe(size) {
    return USE_BUFFER ? Buffer.allocUnsafe(size) : new Uint8Array(size);
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
        if (Number.isInteger(value) && value >= -0x20000000000000 && value <= 0x1fffffffffffff) {
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
        if (Number.isInteger(value) && value >= -0x20000000000000 && value <= 0x1fffffffffffff) {
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
    if (USE_BUFFER) {
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
