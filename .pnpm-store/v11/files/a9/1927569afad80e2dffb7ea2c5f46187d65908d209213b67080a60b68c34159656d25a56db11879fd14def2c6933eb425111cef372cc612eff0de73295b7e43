// deno-fmt-ignore-file
import { Memory } from '../../../system/memory/index.mjs';
import { InstantiateType } from '../instantiate.mjs';
function AddReadonlyOperation(type) {
    return Memory.Update(type, { '~readonly': true }, {});
}
export function AddReadonlyAction(type, options) {
    const result = Memory.Update(AddReadonlyOperation(type), {}, options);
    return result;
}
export function AddReadonlyInstantiate(context, state, type, options) {
    const instantiatedType = InstantiateType(context, state, type);
    return AddReadonlyAction(instantiatedType, options);
}
