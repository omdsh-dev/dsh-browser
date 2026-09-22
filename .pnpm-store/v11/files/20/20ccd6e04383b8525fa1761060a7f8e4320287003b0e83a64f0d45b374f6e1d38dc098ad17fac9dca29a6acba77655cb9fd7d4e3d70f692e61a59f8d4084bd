// deno-fmt-ignore-file
import { Deferred } from '../types/deferred.mjs';
import { RemoveImmutableAction } from '../engine/immutable/instantiate_remove.mjs';
/** Creates a deferred RemoveImmutable action. */
export function RemoveImmutableDeferred(type, options = {}) {
    return Deferred('RemoveImmutable', [type], options);
}
/** Applies an RemoveImmutable action to a type. */
export function RemoveImmutable(type, options = {}) {
    return RemoveImmutableAction(type, options);
}
