// deno-fmt-ignore-file
import { Guard } from '../../guard/index.mjs';
import { IsSchema } from './schema.mjs';
import { AddImmutable } from '../action/_add_immutable.mjs';
// ------------------------------------------------------------------
// Factory
// ------------------------------------------------------------------
/** Applies an Immutable modifier to the given type. */
export function Immutable(type) {
    return AddImmutable(type);
}
// ------------------------------------------------------------------
// Guard
// ------------------------------------------------------------------
/** Returns true if the given value is a TImmutable */
export function IsImmutable(value) {
    return IsSchema(value) && Guard.HasPropertyKey(value, '~immutable');
}
