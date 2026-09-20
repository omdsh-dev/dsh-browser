// deno-fmt-ignore-file
import { Guard } from '../../guard/index.mjs';
import { IsSchema } from './schema.mjs';
import { AddReadonly } from '../action/_add_readonly.mjs';
// ------------------------------------------------------------------
// Factory
// ------------------------------------------------------------------
/** Applies an Readonly property modifier to the given type. */
export function Readonly(type) {
    return AddReadonly(type);
}
// ------------------------------------------------------------------
// Guard
// ------------------------------------------------------------------
/** Returns true if the given value is a TReadonly */
export function IsReadonly(value) {
    return IsSchema(value) && Guard.HasPropertyKey(value, '~readonly');
}
