// deno-fmt-ignore-file
import { Guard, GlobalsGuard } from '../../guard/index.mjs';
import * as T from '../../type/index.mjs';
import { Check } from '../check/index.mjs';
import { Create } from '../create/index.mjs';
import { FromArray } from './from_array.mjs';
import { FromEnum } from './from_enum.mjs';
import { FromIntersect } from './from_intersect.mjs';
import { FromObject } from './from_object.mjs';
import { FromRecord } from './from_record.mjs';
import { FromRef } from './from_ref.mjs';
import { FromTemplateLiteral } from './from_template_literal.mjs';
import { FromTuple } from './from_tuple.mjs';
import { FromUnion } from './from_union.mjs';
import { FromUnknown } from './from_unknown.mjs';
import { RepairError } from './error.mjs';
// ------------------------------------------------------------------
// AssertRepairableValue
// ------------------------------------------------------------------
function AssertRepairableValue(context, type, value) {
    const unsupported = GlobalsGuard.IsDate(value)
        || GlobalsGuard.IsMap(value)
        || GlobalsGuard.IsSet(value)
        || GlobalsGuard.IsTypeArray(value)
        || Guard.IsConstructor(value)
        || Guard.IsFunction(value);
    if (unsupported) {
        throw new RepairError(context, type, value, 'Value is not repairable');
    }
}
// ------------------------------------------------------------------
// AssertRepairableType
// ------------------------------------------------------------------
function AssertRepairableType(context, type, value) {
    const unsupported = T.IsConstructor(type)
        || T.IsFunction(type)
        || T.IsNever(type);
    if (unsupported) {
        throw new RepairError(context, type, value, 'Type is not repairable');
    }
}
// ------------------------------------------------------------------
// CreateWhenUndefined
//
// If the value is 'undefined' AND the type is not TUndefined, then 
// we know the value must be created. We handle this case for undefined 
// only as it enables 'default' annotation to be initialized via Create 
// before we applying subsequent Repair logic.
// ------------------------------------------------------------------
function CreateWhenUndefined(context, type, value) {
    return (Guard.IsUndefined(value) && !T.IsUndefined(type)) ? Create(context, type) : value;
}
// ------------------------------------------------------------------
// FinalizeRepair
//
// When a type includes the ~refine modifier, a post-repair validation
// check must be performed to ensure the repaired value satisfies the
// refine constraint. This logic is implemented as part of FromType to
// ensure the post-refine validation check is handled outside of
// sub-schema constraint checking (i.e., at the top level).
//
// ------------------------------------------------------------------
function FinalizeRepair(context, type, repaired) {
    return T.IsRefine(type)
        ? Check(context, type, repaired)
            ? repaired
            : Create(context, type)
        : repaired;
}
// ------------------------------------------------------------------
// FromType
// ------------------------------------------------------------------
export function FromType(context, type, value) {
    AssertRepairableValue(context, type, value);
    AssertRepairableType(context, type, value);
    const candidate = CreateWhenUndefined(context, type, value);
    const repaired = (T.IsArray(type) ? FromArray(context, type, candidate) :
        T.IsEnum(type) ? FromEnum(context, type, candidate) :
            T.IsIntersect(type) ? FromIntersect(context, type, candidate) :
                T.IsObject(type) ? FromObject(context, type, candidate) :
                    T.IsRecord(type) ? FromRecord(context, type, candidate) :
                        T.IsRef(type) ? FromRef(context, type, candidate) :
                            T.IsTemplateLiteral(type) ? FromTemplateLiteral(context, type, candidate) :
                                T.IsTuple(type) ? FromTuple(context, type, candidate) :
                                    T.IsUnion(type) ? FromUnion(context, type, candidate) :
                                        FromUnknown(context, type, candidate));
    return FinalizeRepair(context, type, repaired);
}
