import { type TSchema, type TSchemaOptions } from '../types/schema.mjs';
import { type TDeferred } from '../types/deferred.mjs';
import { type TRemoveImmutableAction } from '../engine/immutable/instantiate_remove.mjs';
/** Creates a deferred RemoveImmutable action. */
export type TRemoveImmutableDeferred<Type extends TSchema> = (TDeferred<'RemoveImmutable', [Type]>);
/** Creates a deferred RemoveImmutable action. */
export declare function RemoveImmutableDeferred<Type extends TSchema>(type: Type, options?: TSchemaOptions): TRemoveImmutableDeferred<Type>;
/** Applies an RemoveImmutable action to a type. */
export type TRemoveImmutable<Type extends TSchema> = (TRemoveImmutableAction<Type>);
/** Applies an RemoveImmutable action to a type. */
export declare function RemoveImmutable<Type extends TSchema>(type: Type, options?: TSchemaOptions): TRemoveImmutable<Type>;
