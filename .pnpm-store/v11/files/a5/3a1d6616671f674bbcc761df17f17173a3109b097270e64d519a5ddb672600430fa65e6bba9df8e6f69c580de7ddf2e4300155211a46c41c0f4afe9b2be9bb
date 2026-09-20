import { type TSchema } from './schema.mjs';
import { type TAddOptional } from '../action/_add_optional.mjs';
export type TOptional<Type extends TSchema = TSchema> = (Type & {
    '~optional': true;
});
/** Applies an Optional modifier to the given type. */
export declare function Optional<Type extends TSchema>(type: Type): TAddOptional<Type>;
/** Returns true if the given value is TOptional */
export declare function IsOptional(value: unknown): value is TOptional<TSchema>;
