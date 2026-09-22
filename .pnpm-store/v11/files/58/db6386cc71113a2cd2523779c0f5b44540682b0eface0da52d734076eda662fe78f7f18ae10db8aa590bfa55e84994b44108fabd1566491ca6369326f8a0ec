// deno-fmt-ignore-file
// deno-lint-ignore-file
import { Guard } from '../../guard/index.mjs';
// ------------------------------------------------------------------
// Modifiers
// ------------------------------------------------------------------
import { AddImmutableAction } from './immutable/instantiate_add.mjs';
import { AddReadonlyAction } from './readonly/instantiate_add.mjs';
import { AddOptionalAction } from './optional/instantiate_add.mjs';
import { _Array_, IsArray, ArrayOptions } from '../types/array.mjs';
import { Constructor, IsConstructor, ConstructorOptions } from '../types/constructor.mjs';
import { Deferred, IsDeferred } from '../types/deferred.mjs';
import { _Function_, IsFunction, FunctionOptions } from '../types/function.mjs';
import { IsCall } from '../types/call.mjs';
import { Dependent, IsDependent, DependentOptions } from '../types/dependent.mjs';
import { Intersect, IsIntersect, IntersectOptions } from '../types/intersect.mjs';
import { Object, IsObject, ObjectOptions } from '../types/object.mjs';
import { RecordFromPattern, IsRecord, RecordPattern, RecordValue } from '../types/record.mjs';
import { Tuple, IsTuple, TupleOptions } from '../types/tuple.mjs';
import { Union, IsUnion, UnionOptions } from '../types/union.mjs';
import { IsRef } from '../types/ref.mjs';
import { Rest, IsRest } from '../types/rest.mjs';
// ------------------------------------------------------------------
// Modifier Instantiate
// ------------------------------------------------------------------
import { AddImmutableInstantiate } from './immutable/instantiate_add.mjs';
import { RemoveImmutableInstantiate } from './immutable/instantiate_remove.mjs';
import { AddReadonlyInstantiate } from './readonly/instantiate_add.mjs';
import { RemoveReadonlyInstantiate } from './readonly/instantiate_remove.mjs';
import { AddOptionalInstantiate } from './optional/instantiate_add.mjs';
import { RemoveOptionalInstantiate } from './optional/instantiate_remove.mjs';
import { IsOptional } from '../types/_optional.mjs';
import { IsImmutable } from '../types/_immutable.mjs';
import { IsReadonly } from '../types/_readonly.mjs';
// ------------------------------------------------------------------
// Instantiate
// ------------------------------------------------------------------
import { CallInstantiate } from './call/instantiate.mjs';
import { CapitalizeInstantiate } from './intrinsics/instantiate.mjs';
import { ConditionalInstantiate } from './conditional/index.mjs';
import { ConstructorParametersInstantiate } from './constructor_parameters/instantiate.mjs';
import { EvaluateInstantiate } from './evaluate/instantiate.mjs';
import { ExcludeInstantiate } from './exclude/instantiate.mjs';
import { ExtractInstantiate } from './extract/instantiate.mjs';
import { IndexInstantiate } from './indexed/instantiate.mjs';
import { InstanceTypeInstantiate } from './instance_type/instantiate.mjs';
import { InterfaceInstantiate } from './interface/instantiate.mjs';
import { KeyOfInstantiate } from './keyof/instantiate.mjs';
import { LowercaseInstantiate } from './intrinsics/instantiate.mjs';
import { MappedInstantiate } from './mapped/instantiate.mjs';
import { ModuleInstantiate } from './module/instantiate.mjs';
import { NonNullableInstantiate } from './non_nullable/instantiate.mjs';
import { OmitInstantiate } from './omit/instantiate.mjs';
import { ParametersInstantiate } from './parameters/instantiate.mjs';
import { PartialInstantiate } from './partial/instantiate.mjs';
import { PickInstantiate } from './pick/instantiate.mjs';
import { ReadonlyObjectInstantiate } from './readonly_object/instantiate.mjs';
import { RecordInstantiate } from './record/instantiate.mjs';
import { RefInstantiate } from './ref/instantiate.mjs';
import { RequiredInstantiate } from './required/instantiate.mjs';
import { ReturnTypeInstantiate } from './return_type/instantiate.mjs';
import { TemplateLiteralInstantiate } from './template_literal/instantiate.mjs';
import { UncapitalizeInstantiate } from './intrinsics/instantiate.mjs';
import { UppercaseInstantiate } from './intrinsics/instantiate.mjs';
import { WithInstantiate } from './with/instantiate.mjs';
import { RestSpread } from './rest/index.mjs';
export function State(callstack, visited) {
    return { callstack, visited };
}
export function CanInstantiate(types) {
    return Guard.ShiftLeft(types, (left, right) => IsRef(left)
        ? false
        : CanInstantiate(right), () => true);
}
export function InstantiateProperties(context, state, properties) {
    return Guard.Keys(properties).reduce((result, key) => {
        return { ...result, [key]: InstantiateType(context, state, properties[key]) };
    }, {});
}
export function InstantiateElements(context, state, types) {
    const elements = InstantiateTypes(context, state, types);
    const result = RestSpread(elements);
    return result;
}
export function InstantiateTypes(context, state, types) {
    return types.map(type => InstantiateType(context, state, type));
}
function WithModifiers(type, instantiatedType) {
    const withOptional = IsOptional(type) ? AddOptionalAction(instantiatedType, {}) : instantiatedType;
    const withReadonly = IsReadonly(type) ? AddReadonlyAction(withOptional, {}) : withOptional;
    const withImmutable = IsImmutable(type) ? AddImmutableAction(withReadonly, {}) : withReadonly;
    return withImmutable;
}
function InstantiateDeferred(context, state, action, parameters, options) {
    return (
    // Modifiers
    Guard.IsEqual(action, 'AddImmutable') ? AddImmutableInstantiate(context, state, parameters[0], options) :
        Guard.IsEqual(action, 'RemoveImmutable') ? RemoveImmutableInstantiate(context, state, parameters[0], options) :
            Guard.IsEqual(action, 'AddReadonly') ? AddReadonlyInstantiate(context, state, parameters[0], options) :
                Guard.IsEqual(action, 'RemoveReadonly') ? RemoveReadonlyInstantiate(context, state, parameters[0], options) :
                    Guard.IsEqual(action, 'AddOptional') ? AddOptionalInstantiate(context, state, parameters[0], options) :
                        Guard.IsEqual(action, 'RemoveOptional') ? RemoveOptionalInstantiate(context, state, parameters[0], options) :
                            // Actions
                            Guard.IsEqual(action, 'Capitalize') ? CapitalizeInstantiate(context, state, parameters[0], options) :
                                Guard.IsEqual(action, 'Conditional') ? ConditionalInstantiate(context, state, parameters[0], parameters[1], parameters[2], parameters[3], options) :
                                    Guard.IsEqual(action, 'ConstructorParameters') ? ConstructorParametersInstantiate(context, state, parameters[0], options) :
                                        Guard.IsEqual(action, 'Evaluate') ? EvaluateInstantiate(context, state, parameters[0], options) :
                                            Guard.IsEqual(action, 'Exclude') ? ExcludeInstantiate(context, state, parameters[0], parameters[1], options) :
                                                Guard.IsEqual(action, 'Extract') ? ExtractInstantiate(context, state, parameters[0], parameters[1], options) :
                                                    Guard.IsEqual(action, 'Index') ? IndexInstantiate(context, state, parameters[0], parameters[1], options) :
                                                        Guard.IsEqual(action, 'InstanceType') ? InstanceTypeInstantiate(context, state, parameters[0], options) :
                                                            Guard.IsEqual(action, 'Interface') ? InterfaceInstantiate(context, state, parameters[0], parameters[1], options) :
                                                                Guard.IsEqual(action, 'KeyOf') ? KeyOfInstantiate(context, state, parameters[0], options) :
                                                                    Guard.IsEqual(action, 'Lowercase') ? LowercaseInstantiate(context, state, parameters[0], options) :
                                                                        Guard.IsEqual(action, 'Mapped') ? MappedInstantiate(context, state, parameters[0], parameters[1], parameters[2], parameters[3], options) :
                                                                            Guard.IsEqual(action, 'Module') ? ModuleInstantiate(context, state, parameters[0], options) :
                                                                                Guard.IsEqual(action, 'NonNullable') ? NonNullableInstantiate(context, state, parameters[0], options) :
                                                                                    Guard.IsEqual(action, 'Pick') ? PickInstantiate(context, state, parameters[0], parameters[1], options) :
                                                                                        Guard.IsEqual(action, 'Parameters') ? ParametersInstantiate(context, state, parameters[0], options) :
                                                                                            Guard.IsEqual(action, 'Partial') ? PartialInstantiate(context, state, parameters[0], options) :
                                                                                                Guard.IsEqual(action, 'Omit') ? OmitInstantiate(context, state, parameters[0], parameters[1], options) :
                                                                                                    Guard.IsEqual(action, 'ReadonlyObject') ? ReadonlyObjectInstantiate(context, state, parameters[0], options) :
                                                                                                        Guard.IsEqual(action, 'Record') ? RecordInstantiate(context, state, parameters[0], parameters[1], options) :
                                                                                                            Guard.IsEqual(action, 'Required') ? RequiredInstantiate(context, state, parameters[0], options) :
                                                                                                                Guard.IsEqual(action, 'ReturnType') ? ReturnTypeInstantiate(context, state, parameters[0], options) :
                                                                                                                    Guard.IsEqual(action, 'TemplateLiteral') ? TemplateLiteralInstantiate(context, state, parameters[0], options) :
                                                                                                                        Guard.IsEqual(action, 'Uncapitalize') ? UncapitalizeInstantiate(context, state, parameters[0], options) :
                                                                                                                            Guard.IsEqual(action, 'Uppercase') ? UppercaseInstantiate(context, state, parameters[0], options) :
                                                                                                                                Guard.IsEqual(action, 'With') ? WithInstantiate(context, state, parameters[0], parameters[1]) :
                                                                                                                                    Deferred(action, parameters, options));
}
function InstantiateImmediate(context, state, type) {
    const instantiatedType = (IsRef(type) ? RefInstantiate(context, state, type, type.$ref) :
        IsArray(type) ? _Array_(InstantiateType(context, state, type.items), ArrayOptions(type)) :
            IsCall(type) ? CallInstantiate(context, state, type.target, type.arguments) :
                IsConstructor(type) ? Constructor(InstantiateTypes(context, state, type.parameters), InstantiateType(context, state, type.instanceType), ConstructorOptions(type)) :
                    IsFunction(type) ? _Function_(InstantiateTypes(context, state, type.parameters), InstantiateType(context, state, type.returnType), FunctionOptions(type)) :
                        IsDependent(type) ? Dependent(InstantiateType(context, state, type.if), InstantiateType(context, state, type.then), InstantiateType(context, state, type.else), DependentOptions(type)) :
                            IsIntersect(type) ? Intersect(InstantiateTypes(context, state, type.allOf), IntersectOptions(type)) :
                                IsObject(type) ? Object(InstantiateProperties(context, state, type.properties), ObjectOptions(type)) :
                                    IsRecord(type) ? RecordFromPattern(RecordPattern(type), InstantiateType(context, state, RecordValue(type))) :
                                        IsRest(type) ? Rest(InstantiateType(context, state, type.items)) :
                                            IsTuple(type) ? Tuple(InstantiateElements(context, state, type.items), TupleOptions(type)) :
                                                IsUnion(type) ? Union(InstantiateTypes(context, state, type.anyOf), UnionOptions(type)) :
                                                    type);
    const withModifiers = WithModifiers(type, instantiatedType);
    return withModifiers;
}
export function InstantiateType(context, state, type) {
    const result = IsDeferred(type)
        ? InstantiateDeferred(context, state, type.action, type.parameters, type.options)
        : InstantiateImmediate(context, state, type);
    return result;
}
/** Instantiates computed schematics using the given context and type. */
export function Instantiate(context, type) {
    return InstantiateType(context, State([], []), type);
}
