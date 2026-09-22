import { type TSchema } from './schema.mjs';
import { type Static } from './static.mjs';
/** Applies a Refine check to the given type. */
export type TRefineAdd<Type extends TSchema = TSchema> = ('~refine' extends keyof Type ? Type : TRefine<Type>);
/** Applies a Refine check to the given type. */
export declare function RefineAdd<Type extends TSchema>(type: Type, refinement: TRefinement<Type>): TRefineAdd<Type>;
/** Represents a type with embedded Refine check. */
export type TRefine<Type extends TSchema = TSchema> = (Type & {
    '~refine': TRefinement<unknown>[];
});
export type TRefineCheckCallback<Value extends unknown = unknown> = (value: Value) => boolean;
export type TRefineErrorCallback<Value extends unknown = unknown> = (value: Value) => string;
export interface TRefinement<Value extends unknown = unknown> {
    check: TRefineCheckCallback<Value>;
    error: TRefineErrorCallback<Value>;
}
/** Refines a type with an explicit check */
export declare function Refine<Type extends TSchema, Value = Static<Type>>(type: Type, check: TRefineCheckCallback<Value>, error: TRefineErrorCallback<Value>): TRefineAdd<Type>;
/** Refines a type with an explicit check */
export declare function Refine<Type extends TSchema, Value = Static<Type>>(type: Type, check: TRefineCheckCallback<Value>): TRefineAdd<Type>;
/** Returns true if the given value is a TRefinement. */
export declare function IsRefinement(value: unknown): value is TRefinement;
/** Returns true if the given value is a TRefine. */
export declare function IsRefine(value: unknown): value is TRefine;
