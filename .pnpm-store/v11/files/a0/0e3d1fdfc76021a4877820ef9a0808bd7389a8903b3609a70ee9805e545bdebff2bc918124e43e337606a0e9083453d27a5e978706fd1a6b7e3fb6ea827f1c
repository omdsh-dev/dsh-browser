import { type TSchema } from './schema.mjs';
import { type TAddImmutable } from '../action/_add_immutable.mjs';
export type TImmutable<Type extends TSchema = TSchema> = (Type & {
    '~immutable': true;
});
/** Applies an Immutable modifier to the given type. */
export declare function Immutable<Type extends TSchema>(type: Type): TAddImmutable<Type>;
/** Returns true if the given value is a TImmutable */
export declare function IsImmutable(value: unknown): value is TImmutable<TSchema>;
