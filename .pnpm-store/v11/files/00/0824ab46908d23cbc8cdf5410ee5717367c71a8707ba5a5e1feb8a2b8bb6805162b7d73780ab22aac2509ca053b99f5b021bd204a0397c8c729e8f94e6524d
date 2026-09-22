import { type TAddImmutableAction } from './immutable/instantiate_add.mjs';
import { type TAddReadonlyAction } from './readonly/instantiate_add.mjs';
import { type TAddOptionalAction } from './optional/instantiate_add.mjs';
import { type TSchema } from '../types/schema.mjs';
import { type TArray } from '../types/array.mjs';
import { type TConstructor } from '../types/constructor.mjs';
import { type TDeferred } from '../types/deferred.mjs';
import { type TFunction } from '../types/function.mjs';
import { type TCall } from '../types/call.mjs';
import { type TIdentifier } from '../types/identifier.mjs';
import { type TDependent } from '../types/dependent.mjs';
import { type TIntersect } from '../types/intersect.mjs';
import { type TObject } from '../types/object.mjs';
import { type TProperties } from '../types/properties.mjs';
import { type TRecord } from '../types/record.mjs';
import { type TTuple } from '../types/tuple.mjs';
import { type TUnion } from '../types/union.mjs';
import { type TRef } from '../types/ref.mjs';
import { type TRest } from '../types/rest.mjs';
import { type TAddImmutableInstantiate } from './immutable/instantiate_add.mjs';
import { type TRemoveImmutableInstantiate } from './immutable/instantiate_remove.mjs';
import { type TAddReadonlyInstantiate } from './readonly/instantiate_add.mjs';
import { type TRemoveReadonlyInstantiate } from './readonly/instantiate_remove.mjs';
import { type TAddOptionalInstantiate } from './optional/instantiate_add.mjs';
import { type TRemoveOptionalInstantiate } from './optional/instantiate_remove.mjs';
import { type TOptional } from '../types/_optional.mjs';
import { type TImmutable } from '../types/_immutable.mjs';
import { type TReadonly } from '../types/_readonly.mjs';
import { type TCallInstantiate } from './call/instantiate.mjs';
import { type TCapitalizeInstantiate } from './intrinsics/instantiate.mjs';
import { type TConditionalInstantiate } from './conditional/index.mjs';
import { type TConstructorParametersInstantiate } from './constructor_parameters/instantiate.mjs';
import { type TEvaluateInstantiate } from './evaluate/instantiate.mjs';
import { type TExcludeInstantiate } from './exclude/instantiate.mjs';
import { type TExtractInstantiate } from './extract/instantiate.mjs';
import { type TIndexInstantiate } from './indexed/instantiate.mjs';
import { type TInstanceTypeInstantiate } from './instance_type/instantiate.mjs';
import { type TInterfaceInstantiate } from './interface/instantiate.mjs';
import { type TKeyOfInstantiate } from './keyof/instantiate.mjs';
import { type TLowercaseInstantiate } from './intrinsics/instantiate.mjs';
import { type TMappedInstantiate } from './mapped/instantiate.mjs';
import { type TModuleInstantiate } from './module/instantiate.mjs';
import { type TNonNullableInstantiate } from './non_nullable/instantiate.mjs';
import { type TOmitInstantiate } from './omit/instantiate.mjs';
import { type TParametersInstantiate } from './parameters/instantiate.mjs';
import { type TPartialInstantiate } from './partial/instantiate.mjs';
import { type TPickInstantiate } from './pick/instantiate.mjs';
import { type TReadonlyObjectInstantiate } from './readonly_object/instantiate.mjs';
import { type TRecordInstantiate } from './record/instantiate.mjs';
import { type TRefInstantiate } from './ref/instantiate.mjs';
import { type TRequiredInstantiate } from './required/instantiate.mjs';
import { type TReturnTypeInstantiate } from './return_type/instantiate.mjs';
import { type TTemplateLiteralInstantiate } from './template_literal/instantiate.mjs';
import { type TUncapitalizeInstantiate } from './intrinsics/instantiate.mjs';
import { type TUppercaseInstantiate } from './intrinsics/instantiate.mjs';
import { type TWithInstantiate } from './with/instantiate.mjs';
import { type TRestSpread } from './rest/index.mjs';
export interface TState<CallStack extends string[] = string[], Visited extends string[] = string[]> {
    callstack: CallStack;
    visited: Visited;
}
export declare function State<CallStack extends string[], Visited extends string[]>(callstack: CallStack, visited: Visited): TState<CallStack, Visited>;
export type TCanInstantiate<Types extends TSchema[]> = Types extends [infer Left extends TSchema, ...infer Right extends TSchema[]] ? Left extends TRef ? false : TCanInstantiate<Right> : true;
export declare function CanInstantiate<Types extends TSchema[]>(types: [...Types]): TCanInstantiate<Types>;
export type TInstantiateProperties<Context extends TProperties, State extends TState, Properties extends TProperties, Result extends TProperties = {
    [Key in keyof Properties]: TInstantiateType<Context, State, Properties[Key]>;
}> = Result;
export declare function InstantiateProperties<Context extends TProperties, State extends TState, Properties extends TProperties>(context: Context, state: State, properties: TProperties): TInstantiateProperties<Context, State, Properties>;
export type TInstantiateElements<Context extends TProperties, State extends TState, Types extends TSchema[], Elements extends TSchema[] = TInstantiateTypes<Context, State, Types>, Result extends TSchema[] = TRestSpread<Elements>> = Result;
export declare function InstantiateElements<Context extends TProperties, State extends TState, Types extends TSchema[]>(context: Context, state: State, types: [...Types]): TInstantiateElements<Context, State, Types>;
export type TInstantiateTypes<Context extends TProperties, State extends TState, Types extends TSchema[], Result extends TSchema[] = []> = (Types extends [infer Left extends TSchema, ...infer Right extends TSchema[]] ? TInstantiateTypes<Context, State, Right, [...Result, TInstantiateType<Context, State, Left>]> : Result);
export declare function InstantiateTypes<Context extends TProperties, State extends TState, Types extends TSchema[]>(context: Context, state: State, types: [...Types]): TInstantiateTypes<Context, State, Types>;
type TWithModifiers<Type extends TSchema, InstantiatedType extends TSchema, WithOptional extends TSchema = Type extends TOptional ? TAddOptionalAction<InstantiatedType> : InstantiatedType, WithReadonly extends TSchema = Type extends TReadonly ? TAddReadonlyAction<WithOptional> : WithOptional, WithImmutable extends TSchema = Type extends TImmutable ? TAddImmutableAction<WithReadonly> : WithReadonly> = WithImmutable;
type TInstantiateDeferred<Context extends TProperties, State extends TState, Action extends string, Parameters extends TSchema[]> = ([
    Action,
    Parameters
] extends ['AddImmutable', [infer Type extends TSchema]] ? TAddImmutableInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['RemoveImmutable', [infer Type extends TSchema]] ? TRemoveImmutableInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['AddReadonly', [infer Type extends TSchema]] ? TAddReadonlyInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['RemoveReadonly', [infer Type extends TSchema]] ? TRemoveReadonlyInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['AddOptional', [infer Type extends TSchema]] ? TAddOptionalInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['RemoveOptional', [infer Type extends TSchema]] ? TRemoveOptionalInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['Capitalize', [infer Type extends TSchema]] ? TCapitalizeInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['Conditional', [infer Left extends TSchema, infer Right extends TSchema, infer True extends TSchema, infer False extends TSchema]] ? TConditionalInstantiate<Context, State, Left, Right, True, False> : [
    Action,
    Parameters
] extends ['ConstructorParameters', [infer Type extends TSchema]] ? TConstructorParametersInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['Evaluate', [infer Type extends TSchema]] ? TEvaluateInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['Exclude', [infer Left extends TSchema, infer Right extends TSchema]] ? TExcludeInstantiate<Context, State, Left, Right> : [
    Action,
    Parameters
] extends ['Extract', [infer Left extends TSchema, infer Right extends TSchema]] ? TExtractInstantiate<Context, State, Left, Right> : [
    Action,
    Parameters
] extends ['Index', [infer Type extends TSchema, infer Indexer extends TSchema]] ? TIndexInstantiate<Context, State, Type, Indexer> : [
    Action,
    Parameters
] extends ['InstanceType', [infer Type extends TSchema]] ? TInstanceTypeInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['Interface', [infer Heritage extends TSchema[], infer Properties extends TProperties]] ? TInterfaceInstantiate<Context, State, Heritage, Properties> : [
    Action,
    Parameters
] extends ['KeyOf', [infer Type extends TSchema]] ? TKeyOfInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['Lowercase', [infer Type extends TSchema]] ? TLowercaseInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['Mapped', [infer Name extends TIdentifier, infer Key extends TSchema, infer As extends TSchema, infer Property extends TSchema]] ? TMappedInstantiate<Context, State, Name, Key, As, Property> : [
    Action,
    Parameters
] extends ['Module', [infer Declarations extends TProperties]] ? TModuleInstantiate<Context, State, Declarations> : [
    Action,
    Parameters
] extends ['NonNullable', [infer Type extends TSchema]] ? TNonNullableInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['Pick', [infer Type extends TSchema, infer Indexer extends TSchema]] ? TPickInstantiate<Context, State, Type, Indexer> : [
    Action,
    Parameters
] extends ['Parameters', [infer Type extends TSchema]] ? TParametersInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['Partial', [infer Type extends TSchema]] ? TPartialInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['Omit', [infer Type extends TSchema, infer Indexer extends TSchema]] ? TOmitInstantiate<Context, State, Type, Indexer> : [
    Action,
    Parameters
] extends ['ReadonlyObject', [infer Type extends TSchema]] ? TReadonlyObjectInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['Record', [infer Key extends TSchema, infer Value extends TSchema]] ? TRecordInstantiate<Context, State, Key, Value> : [
    Action,
    Parameters
] extends ['Required', [infer Type extends TSchema]] ? TRequiredInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['ReturnType', [infer Type extends TSchema]] ? TReturnTypeInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['TemplateLiteral', [infer Types extends TSchema[]]] ? TTemplateLiteralInstantiate<Context, State, Types> : [
    Action,
    Parameters
] extends ['Uncapitalize', [infer Type extends TSchema]] ? TUncapitalizeInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['Uppercase', [infer Type extends TSchema]] ? TUppercaseInstantiate<Context, State, Type> : [
    Action,
    Parameters
] extends ['With', [infer Type extends TSchema, infer Options extends TSchema]] ? TWithInstantiate<Context, State, Type, Options> : TDeferred<Action, Parameters>);
type TInstantiateImmediate<Context extends TProperties, State extends TState, Type extends TSchema, InstantiatedType extends TSchema = (Type extends TRef<infer Ref extends string> ? TRefInstantiate<Context, State, Type, Ref> : Type extends TArray<infer Type extends TSchema> ? TArray<TInstantiateType<Context, State, Type>> : Type extends TCall<infer Target extends TSchema, infer Parameters extends TSchema[]> ? TCallInstantiate<Context, State, Target, Parameters> : Type extends TConstructor<infer Parameters extends TSchema[], infer InstanceType extends TSchema> ? TConstructor<TInstantiateTypes<Context, State, Parameters>, TInstantiateType<Context, State, InstanceType>> : Type extends TFunction<infer Parameters extends TSchema[], infer ReturnType extends TSchema> ? TFunction<TInstantiateTypes<Context, State, Parameters>, TInstantiateType<Context, State, ReturnType>> : Type extends TDependent<infer If extends TSchema, infer Then extends TSchema, infer Else extends TSchema> ? TDependent<TInstantiateType<Context, State, If>, TInstantiateType<Context, State, Then>, TInstantiateType<Context, State, Else>> : Type extends TIntersect<infer Types extends TSchema[]> ? TIntersect<TInstantiateTypes<Context, State, Types>> : Type extends TObject<infer Properties extends TProperties> ? TObject<TInstantiateProperties<Context, State, Properties>> : Type extends TRecord<infer Key extends string, infer Type extends TSchema> ? TRecord<Key, TInstantiateType<Context, State, Type>> : Type extends TRest<infer Type extends TSchema> ? TRest<TInstantiateType<Context, State, Type>> : Type extends TTuple<infer Types extends TSchema[]> ? TTuple<TInstantiateElements<Context, State, Types>> : Type extends TUnion<infer Types extends TSchema[]> ? TUnion<TInstantiateTypes<Context, State, Types>> : Type), WithModifiers extends TSchema = TWithModifiers<Type, InstantiatedType>> = WithModifiers;
export type TInstantiateType<Context extends TProperties, State extends TState, Type extends TSchema, Result extends TSchema = Type extends TDeferred<infer Action extends string, infer Types extends TSchema[]> ? TInstantiateDeferred<Context, State, Action, Types> : TInstantiateImmediate<Context, State, Type>> = Result;
export declare function InstantiateType<Context extends TProperties, State extends TState, Type extends TSchema>(context: Context, state: State, type: Type): TInstantiateImmediate<Context, State, Type>;
/** Instantiates computed schematics using the given context and type. */
export type TInstantiate<Context extends TProperties, Type extends TSchema> = (TInstantiateType<Context, TState<[], []>, Type>);
/** Instantiates computed schematics using the given context and type. */
export declare function Instantiate<Context extends TProperties, Type extends TSchema>(context: Context, type: Type): TInstantiate<Context, Type>;
export {};
