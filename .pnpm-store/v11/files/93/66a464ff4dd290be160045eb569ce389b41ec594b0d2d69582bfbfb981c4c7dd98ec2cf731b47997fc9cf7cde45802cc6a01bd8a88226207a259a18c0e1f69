import { type StaticType, type StaticDirection } from './static.mjs';
import { type TSchema, type TSchemaOptions } from './schema.mjs';
import { type TProperties } from './properties.mjs';
export type StaticDependent<Stack extends string[], Direction extends StaticDirection, Context extends TProperties, This extends TProperties, If extends TSchema, Then extends TSchema, Else extends TSchema, StaticIf extends unknown = StaticType<Stack, Direction, Context, This, If>, StaticThen extends unknown = StaticType<Stack, Direction, Context, This, Then>, StaticElse extends unknown = StaticType<Stack, Direction, Context, This, Else>, Result extends unknown = (StaticIf & StaticThen) | Exclude<StaticElse, StaticIf>> = Result;
/** Represents a Dependent Type */
export interface TDependent<If extends TSchema = TSchema, Then extends TSchema = TSchema, Else extends TSchema = TSchema> extends TSchema {
    '~kind': 'Dependent';
    if: If;
    then: Then;
    else: Else;
}
/** Creates a Dependent type */
export declare function Dependent<If extends TSchema, Then extends TSchema, Else extends TSchema>(if_: If, then_: Then, else_: Else, options?: TSchemaOptions): TDependent<If, Then, Else>;
/** Returns true if the given value is TDependent. */
export declare function IsDependent(value: unknown): value is TDependent;
/** Extracts options from a IsDependent. */
export declare function DependentOptions(type: TDependent): TSchemaOptions;
