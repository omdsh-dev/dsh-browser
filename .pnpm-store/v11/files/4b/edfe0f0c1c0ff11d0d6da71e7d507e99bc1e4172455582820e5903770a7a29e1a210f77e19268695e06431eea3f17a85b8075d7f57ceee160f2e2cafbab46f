import { type TSchema, type TSchemaOptions } from '../types/schema.mjs';
import { type TDeferred } from '../types/deferred.mjs';
import { type TAddReadonlyAction } from '../engine/readonly/instantiate_add.mjs';
/** Creates a deferred AddReadonly action. */
export type TAddReadonlyDeferred<Type extends TSchema> = (TDeferred<'AddReadonly', [Type]>);
/** Creates a deferred AddReadonly action. */
export declare function AddReadonlyDeferred<Type extends TSchema>(type: Type, options?: TSchemaOptions): TAddReadonlyDeferred<Type>;
/** Applies an AddReadonly action to a type. */
export type TAddReadonly<Type extends TSchema> = (TAddReadonlyAction<Type>);
/** Applies an AddReadonly action to a type. */
export declare function AddReadonly<Type extends TSchema>(type: Type, options?: TSchemaOptions): TAddReadonly<Type>;
