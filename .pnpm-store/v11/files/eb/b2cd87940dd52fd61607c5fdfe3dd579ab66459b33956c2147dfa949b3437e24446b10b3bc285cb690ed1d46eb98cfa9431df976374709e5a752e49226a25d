import { type TSchema } from '../types/schema.mjs';
import { type TDeferred } from '../types/deferred.mjs';
import { type TWithAction } from '../engine/with/instantiate.mjs';
/** Creates a deferred With action. */
export type TWithDeferred<Type extends TSchema, Options extends TSchema> = (TDeferred<'With', [Type, Options]>);
/** Creates a deferred With action. */
export declare function WithDeferred<Type extends TSchema, Options extends TSchema>(type: Type, options: Options): TWithDeferred<Type, Options>;
/** Applies annotation options to the given type. */
export type TWith<Type extends TSchema, Options extends TSchema> = (Type & Options);
/** Applies annotation options to the given type. */
export declare function With<Type extends TSchema, const Options extends TSchema>(type: Type, options: Options): TWithAction<Type, Options>;
