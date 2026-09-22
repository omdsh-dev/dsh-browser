// deno-fmt-ignore-file
import { Memory } from '../../../system/memory/index.mjs';
import { InstantiateType } from '../instantiate.mjs';
function RemoveImmutableOperation(type) {
    return Memory.Discard(type, ['~immutable']);
}
export function RemoveImmutableAction(type, options) {
    const result = Memory.Update(RemoveImmutableOperation(type), {}, options);
    return result;
}
export function RemoveImmutableInstantiate(context, state, type, options) {
    const instantiatedType = InstantiateType(context, state, type);
    return RemoveImmutableAction(instantiatedType, options);
}
