// deno-fmt-ignore-file
import { Guard } from '../../guard/index.mjs';
import { IsSchema } from './schema.mjs';
import { AddOptional } from '../action/_add_optional.mjs';
// ------------------------------------------------------------------
// Factory
// ------------------------------------------------------------------
/** Applies an Optional modifier to the given type. */
export function Optional(type) {
    return AddOptional(type);
}
// ------------------------------------------------------------------
// Guard
// ------------------------------------------------------------------
/** Returns true if the given value is TOptional */
export function IsOptional(value) {
    return IsSchema(value) && Guard.HasPropertyKey(value, '~optional');
}
