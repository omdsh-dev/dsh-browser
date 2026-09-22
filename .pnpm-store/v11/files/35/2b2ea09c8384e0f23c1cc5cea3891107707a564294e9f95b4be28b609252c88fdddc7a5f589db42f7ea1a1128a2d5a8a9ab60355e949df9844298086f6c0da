// deno-fmt-ignore-file
import { Memory } from '../../../system/memory/index.mjs';
import { InstantiateType } from '../instantiate.mjs';
function RemoveReadonlyOperation(type) {
    return Memory.Discard(type, ['~readonly']);
}
export function RemoveReadonlyAction(type, options) {
    const result = Memory.Update(RemoveReadonlyOperation(type), {}, options);
    return result;
}
export function RemoveReadonlyInstantiate(context, state, type, options) {
    const instantiatedType = InstantiateType(context, state, type);
    return RemoveReadonlyAction(instantiatedType, options);
}
