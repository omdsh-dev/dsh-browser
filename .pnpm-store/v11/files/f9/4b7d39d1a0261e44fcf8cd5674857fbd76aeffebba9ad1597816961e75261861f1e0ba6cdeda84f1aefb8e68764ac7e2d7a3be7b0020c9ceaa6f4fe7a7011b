// deno-fmt-ignore-file
import { Deferred } from '../types/deferred.mjs';
import { AddReadonlyAction } from '../engine/readonly/instantiate_add.mjs';
/** Creates a deferred AddReadonly action. */
export function AddReadonlyDeferred(type, options = {}) {
    return Deferred('AddReadonly', [type], options);
}
/** Applies an AddReadonly action to a type. */
export function AddReadonly(type, options = {}) {
    return AddReadonlyAction(type, options);
}
