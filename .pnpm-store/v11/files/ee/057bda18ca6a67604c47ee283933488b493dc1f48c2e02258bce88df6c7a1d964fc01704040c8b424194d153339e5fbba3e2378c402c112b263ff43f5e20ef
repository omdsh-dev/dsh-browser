// deno-fmt-ignore-file
import { Deferred } from '../types/deferred.mjs';
import { RemoveOptionalAction } from '../engine/optional/instantiate_remove.mjs';
/** Creates a deferred RemoveOptional action. */
export function RemoveOptionalDeferred(type, options = {}) {
    return Deferred('RemoveOptional', [type], options);
}
/** Applies an RemoveOptional action to a type. */
export function RemoveOptional(type, options = {}) {
    return RemoveOptionalAction(type, options);
}
