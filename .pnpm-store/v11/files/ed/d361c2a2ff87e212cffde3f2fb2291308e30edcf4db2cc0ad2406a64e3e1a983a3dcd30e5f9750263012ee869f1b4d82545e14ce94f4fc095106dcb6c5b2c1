import { SerdeContext } from "@smithy/core/protocols";
import { NormalizedSchema } from "@smithy/core/schema";
import { fromBase64, generateIdempotencyToken } from "@smithy/core/serde";
import { cbor } from "../cbor";
import { dateToTag } from "../parseCborBody";
export class CborShapeSerializer extends SerdeContext {
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
