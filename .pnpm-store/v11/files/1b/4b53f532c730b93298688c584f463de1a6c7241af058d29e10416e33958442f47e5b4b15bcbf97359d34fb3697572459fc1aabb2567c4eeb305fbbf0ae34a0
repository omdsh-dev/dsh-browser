// deno-fmt-ignore-file
import { Deferred } from '../types/deferred.mjs';
import { RemoveReadonlyAction } from '../engine/readonly/instantiate_remove.mjs';
/** Creates a deferred RemoveReadonly action. */
export function RemoveReadonlyDeferred(type, options = {}) {
    return Deferred('RemoveReadonly', [type], options);
}
/** Applies an RemoveReadonly action to a type. */
export function RemoveReadonly(type, options = {}) {
    return RemoveReadonlyAction(type, options);
}
