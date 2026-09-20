// deno-fmt-ignore-file
import { Memory } from '../../system/memory/index.mjs';
import { IsKind } from './schema.mjs';
// ------------------------------------------------------------------
// Factory
// ------------------------------------------------------------------
/** Creates a Dependent type */
export function Dependent(if_, then_, else_, options = {}) {
    return Memory.Create({ '~kind': 'Dependent' }, { if: if_, then: then_, else: else_ }, options);
}
// ------------------------------------------------------------------
// Guard
// ------------------------------------------------------------------
/** Returns true if the given value is TDependent. */
export function IsDependent(value) {
    return IsKind(value, 'Dependent');
}
// ------------------------------------------------------------------
// Options
// ------------------------------------------------------------------
/** Extracts options from a IsDependent. */
export function DependentOptions(type) {
    return Memory.Discard(type, ['~kind', 'if', 'then', 'else']);
}
