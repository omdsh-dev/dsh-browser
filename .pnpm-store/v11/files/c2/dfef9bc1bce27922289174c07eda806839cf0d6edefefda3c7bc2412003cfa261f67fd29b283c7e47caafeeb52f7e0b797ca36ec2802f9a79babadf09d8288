// deno-fmt-ignore-file
import { Memory } from '../../system/memory/index.mjs';
import { Guard } from '../../guard/index.mjs';
import { IsKind } from './schema.mjs';
import { Integer, IntegerPattern } from './integer.mjs';
import { Number, NumberPattern } from './number.mjs';
import { String, StringPattern } from './string.mjs';
import { Deferred } from './deferred.mjs';
import { TemplateLiteralDecodeUnsafe } from '../engine/template_literal/decode.mjs';
import { CreateRecord } from '../engine/record/record_create.mjs';
import { RecordAction } from '../engine/record/instantiate.mjs';
export const IntegerKey = `^${IntegerPattern}$`;
export const NumberKey = `^${NumberPattern}$`;
export const StringKey = `^${StringPattern}$`;
/** Represents a deferred Record action. */
export function RecordDeferred(key, value, options = {}) {
    return Deferred('Record', [key, value], options);
}
// -------------------------------------------------------------------
// Factory
// -------------------------------------------------------------------
/** Creates a Record type. */
export function Record(key, value, options = {}) {
    return RecordAction(key, value, options);
}
// -------------------------------------------------------------------
// RecordFromPattern
// -------------------------------------------------------------------
/** Creates a Record type from regular expression pattern. */
export function RecordFromPattern(pattern, value) {
    return CreateRecord(pattern, value);
}
/** Transforms a Record Pattern to a Type */
export function RecordPatternToType(pattern) {
    const result = (Guard.IsEqual(pattern, StringKey) ? String() :
        Guard.IsEqual(pattern, IntegerKey) ? Integer() :
            Guard.IsEqual(pattern, NumberKey) ? Number() :
                TemplateLiteralDecodeUnsafe(pattern));
    return result;
}
/** Extracts the Pattern from a Record type */
export function RecordPattern(type) {
    return Guard.Keys(type.patternProperties)[0];
}
/** Extracts the Key from a Record type */
export function RecordKey(type) {
    const pattern = RecordPattern(type);
    const result = RecordPatternToType(pattern);
    return result;
}
/** Extracts the Value from a Record type */
export function RecordValue(type) {
    return type.patternProperties[RecordPattern(type)];
}
// -------------------------------------------------------------------
// Guard
// -------------------------------------------------------------------
export function IsRecord(value) {
    return IsKind(value, 'Record');
}
// -------------------------------------------------------------------
// Options
// -------------------------------------------------------------------
export function RecordOptions(type) {
    return Memory.Discard(type, ['~kind', 'type', 'patternProperties']);
}
