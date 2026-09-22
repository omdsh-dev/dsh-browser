import { type TSchema, type TSchemaOptions } from '../types/schema.mjs';
import { type TDeferred } from '../types/deferred.mjs';
import { type TAddOptionalAction } from '../engine/optional/instantiate_add.mjs';
/** Creates a deferred AddOptional action. */
export type TAddOptionalDeferred<Type extends TSchema> = (TDeferred<'AddOptional', [Type]>);
/** Creates a deferred AddOptional action. */
export declare function AddOptionalDeferred<Type extends TSchema>(type: Type, options?: TSchemaOptions): TAddOptionalDeferred<Type>;
/** Applies an AddOptional action to a type. */
export type TAddOptional<Type extends TSchema> = (TAddOptionalAction<Type>);
/** Applies an AddOptional action to a type. */
export declare function AddOptional<Type extends TSchema>(type: Type, options?: TSchemaOptions): TAddOptional<Type>;
