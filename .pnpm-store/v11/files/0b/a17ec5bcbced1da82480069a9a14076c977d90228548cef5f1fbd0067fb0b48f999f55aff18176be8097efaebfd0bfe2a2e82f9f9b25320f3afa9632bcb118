import { type TSchema } from './schema.mjs';
import { type TAddReadonly } from '../action/_add_readonly.mjs';
export type TReadonly<Type extends TSchema = TSchema> = (Type & {
    '~readonly': true;
});
/** Applies an Readonly property modifier to the given type. */
export declare function Readonly<Type extends TSchema>(type: Type): TAddReadonly<Type>;
/** Returns true if the given value is a TReadonly */
export declare function IsReadonly(value: unknown): value is TReadonly<TSchema>;
