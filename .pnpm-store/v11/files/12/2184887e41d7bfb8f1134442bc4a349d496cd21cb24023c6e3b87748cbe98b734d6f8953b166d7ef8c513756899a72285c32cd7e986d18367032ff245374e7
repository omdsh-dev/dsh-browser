// deno-fmt-ignore-file
import { Deferred } from '../types/deferred.mjs';
import { AddImmutableAction } from '../engine/immutable/instantiate_add.mjs';
/** Creates a deferred AddImmutable action. */
export function AddImmutableDeferred(type, options = {}) {
    return Deferred('AddImmutable', [type], options);
}
/** Applies an AddImmutable action to a type. */
export function AddImmutable(type, options = {}) {
    return AddImmutableAction(type, options);
}
