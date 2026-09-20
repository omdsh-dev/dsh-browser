// deno-fmt-ignore-file
import { Guard } from '../../guard/index.mjs';
import { RecordPattern, RecordValue } from '../../type/index.mjs';
import { FromType } from './from_type.mjs';
import { Callback } from './callback.mjs';
// ------------------------------------------------------------------
// Decode
// ------------------------------------------------------------------
function Decode(direction, context, type, value) {
    if (!Guard.IsObjectNotArray(value))
        return value;
    const regexp = new RegExp(RecordPattern(type));
    for (const key of Guard.Keys(value)) {
        if (!regexp.test(key))
            continue;
        value[key] = FromType(direction, context, RecordValue(type), value[key]);
    }
    return Callback(direction, context, type, value);
}
// ------------------------------------------------------------------
// Encode
// ------------------------------------------------------------------
function Encode(direction, context, type, value) {
    const exterior = Callback(direction, context, type, value);
    if (!Guard.IsObjectNotArray(exterior))
        return exterior;
    const regexp = new RegExp(RecordPattern(type));
    for (const key of Guard.Keys(exterior)) {
        if (!regexp.test(key))
            continue;
        exterior[key] = FromType(direction, context, RecordValue(type), exterior[key]);
    }
    return exterior;
}
export function FromRecord(direction, context, type, value) {
    return Guard.IsEqual(direction, 'Decode')
        ? Decode(direction, context, type, value)
        : Encode(direction, context, type, value);
}
