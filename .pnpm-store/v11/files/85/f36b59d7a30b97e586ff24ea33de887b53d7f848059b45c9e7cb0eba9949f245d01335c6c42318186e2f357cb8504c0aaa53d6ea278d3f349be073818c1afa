import { type TSchema, type TSchemaOptions } from '../types/schema.mjs';
import { type TDeferred } from '../types/deferred.mjs';
import { type TAddImmutableAction } from '../engine/immutable/instantiate_add.mjs';
/** Creates a deferred AddImmutable action. */
export type TAddImmutableDeferred<Type extends TSchema> = (TDeferred<'AddImmutable', [Type]>);
/** Creates a deferred AddImmutable action. */
export declare function AddImmutableDeferred<Type extends TSchema>(type: Type, options?: TSchemaOptions): TAddImmutableDeferred<Type>;
/** Applies an AddImmutable action to a type. */
export type TAddImmutable<Type extends TSchema> = (TAddImmutableAction<Type>);
/** Applies an AddImmutable action to a type. */
export declare function AddImmutable<Type extends TSchema>(type: Type, options?: TSchemaOptions): TAddImmutable<Type>;
