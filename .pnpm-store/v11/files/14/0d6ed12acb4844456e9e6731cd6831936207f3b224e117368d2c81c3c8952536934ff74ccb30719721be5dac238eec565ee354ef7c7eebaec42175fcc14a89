// deno-lint-ignore-file ban-types
// deno-fmt-ignore-file
import { Deferred } from '../types/deferred.mjs';
import { State } from '../engine/instantiate.mjs';
import { ModuleInstantiate } from '../engine/module/instantiate.mjs';
/** Creates a deferred Module action. */
export function ModuleDeferred(declarations, options = {}) {
    return Deferred('Module', [declarations], options);
}
/** Creates a Module with the given declarations */
export function Module(declarations, options = {}) {
    return ModuleInstantiate({}, State([], []), declarations, options);
}
