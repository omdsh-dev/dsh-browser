import { type TSchema, type TSchemaOptions } from '../types/schema.mjs';
import { type TDeferred } from '../types/deferred.mjs';
import { type TRemoveOptionalAction } from '../engine/optional/instantiate_remove.mjs';
/** Creates a deferred RemoveOptional action. */
export type TRemoveOptionalDeferred<Type extends TSchema> = (TDeferred<'RemoveOptional', [Type]>);
/** Creates a deferred RemoveOptional action. */
export declare function RemoveOptionalDeferred<Type extends TSchema>(type: Type, options?: TSchemaOptions): TRemoveOptionalDeferred<Type>;
/** Applies an RemoveOptional action to a type. */
export type TRemoveOptional<Type extends TSchema> = (TRemoveOptionalAction<Type>);
/** Applies an RemoveOptional action to a type. */
export declare function RemoveOptional<Type extends TSchema>(type: Type, options?: TSchemaOptions): TRemoveOptional<Type>;
