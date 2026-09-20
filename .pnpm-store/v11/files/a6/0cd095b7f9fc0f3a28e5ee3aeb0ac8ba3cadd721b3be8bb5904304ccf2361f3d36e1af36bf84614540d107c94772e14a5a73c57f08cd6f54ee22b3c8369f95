// deno-fmt-ignore-file
import { Memory } from '../../../system/memory/index.mjs';
import { InstantiateType } from '../instantiate.mjs';
function RemoveOptionalOperation(type) {
    return Memory.Discard(type, ['~optional']);
}
export function RemoveOptionalAction(type, options) {
    const result = Memory.Update(RemoveOptionalOperation(type), {}, options);
    return result;
}
export function RemoveOptionalInstantiate(context, state, type, options) {
    const instantiatedType = InstantiateType(context, state, type);
    return RemoveOptionalAction(instantiatedType, options);
}
