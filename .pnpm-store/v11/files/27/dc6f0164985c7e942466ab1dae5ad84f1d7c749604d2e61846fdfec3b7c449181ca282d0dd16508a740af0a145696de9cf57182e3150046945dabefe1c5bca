// deno-fmt-ignore-file
import Guard from '../../guard/index.mjs';
import { IsArray, Array as _Array_, ArrayOptions } from '../../type/index.mjs';
import { IsUnion, Union } from '../../type/index.mjs';
import { IsObject, Object as _Object_ } from '../../type/index.mjs';
import { IsRecord, Record, RecordKey, RecordValue } from '../../type/index.mjs';
import { IsTuple, Tuple } from '../../type/index.mjs';
import { IsIntersect, Intersect } from '../../type/index.mjs';
import { Priority } from '../../type/index.mjs';
// ------------------------------------------------------------------
// Modifiers (Mutable)
//
// Prioritized types lose `~modifier` properties and additional constraints
// (e.g. additionalProperties) during the mapping phase and need to be
// reassigned afterward. This is a fast mutable assignment to handle that,
// but we should consider a more general solution. (review)
//
// ------------------------------------------------------------------
function Modifiers(type, next) {
    for (const key of Guard.Keys(type)) {
        if (Guard.HasPropertyKey(next, key))
            continue;
        next[key] = type[key];
    }
    return next;
}
// ------------------------------------------------------------------
// Properties
// ------------------------------------------------------------------
function FromProperties(properties) {
    const result = {};
    for (const key of Guard.Keys(properties))
        result[key] = FromType(properties[key]);
    return result;
}
// ------------------------------------------------------------------
// PriorityTypes
// ------------------------------------------------------------------
function FromPriorityTypes(types) {
    return FromTypes(Priority(types));
}
// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
function FromTypes(types) {
    return types.map(type => FromType(type));
}
// ------------------------------------------------------------------
// Type
// ------------------------------------------------------------------
function FromType(type) {
    const next = (IsArray(type) ? _Array_(FromType(type.items), ArrayOptions(type)) :
        IsIntersect(type) ? Intersect(FromTypes(type.allOf)) :
            IsUnion(type) ? Union(FromPriorityTypes(type.anyOf)) :
                IsObject(type) ? _Object_(FromProperties(type.properties)) :
                    IsRecord(type) ? Record(RecordKey(type), FromType(RecordValue(type))) :
                        IsTuple(type) ? Tuple(FromTypes(type.items)) :
                            type);
    return Modifiers(type, next);
}
// ------------------------------------------------------------------
// UnionPrioritySort
// ------------------------------------------------------------------
/**
 * (Type-Preprocessor) Recursively reorders Union variants from narrowest to broadest, ensuring
 * more specific types (e.g. Literal) are evaluated before broader types (e.g. String). Used
 * prior to Clean, Decode, and Encode operations.
 */
export function UnionPrioritySort(type) {
    const result = FromType(type);
    return result;
}
