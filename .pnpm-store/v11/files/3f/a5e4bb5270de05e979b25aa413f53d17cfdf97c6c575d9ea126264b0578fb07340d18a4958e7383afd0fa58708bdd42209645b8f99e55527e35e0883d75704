// deno-fmt-ignore-file
import { Deferred } from '../types/deferred.mjs';
import { AddOptionalAction } from '../engine/optional/instantiate_add.mjs';
/** Creates a deferred AddOptional action. */
export function AddOptionalDeferred(type, options = {}) {
    return Deferred('AddOptional', [type], options);
}
/** Applies an AddOptional action to a type. */
export function AddOptional(type, options = {}) {
    return AddOptionalAction(type, options);
}
