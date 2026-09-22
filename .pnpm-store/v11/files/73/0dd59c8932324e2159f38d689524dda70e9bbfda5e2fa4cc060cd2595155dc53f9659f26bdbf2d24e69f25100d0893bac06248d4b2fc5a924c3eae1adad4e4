import { type TSchema, type TSchemaOptions } from '../types/schema.mjs';
import { type TDeferred } from '../types/deferred.mjs';
import { type TRemoveReadonlyAction } from '../engine/readonly/instantiate_remove.mjs';
/** Creates a deferred RemoveReadonly action. */
export type TRemoveReadonlyDeferred<Type extends TSchema> = (TDeferred<'RemoveReadonly', [Type]>);
/** Creates a deferred RemoveReadonly action. */
export declare function RemoveReadonlyDeferred<Type extends TSchema>(type: Type, options?: TSchemaOptions): TRemoveReadonlyDeferred<Type>;
/** Applies an RemoveReadonly action to a type. */
export type TRemoveReadonly<Type extends TSchema> = (TRemoveReadonlyAction<Type>);
/** Applies an RemoveReadonly action to a type. */
export declare function RemoveReadonly<Type extends TSchema>(type: Type, options?: TSchemaOptions): TRemoveReadonly<Type>;
