import { SerdeContext } from "@smithy/core/protocols";
import { NormalizedSchema } from "@smithy/core/schema";
import { NumericValue, _parseEpochTimestamp, fromBase64 } from "@smithy/core/serde";
import { cbor } from "../cbor";
export class CborShapeDeserializer extends SerdeContext {
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
