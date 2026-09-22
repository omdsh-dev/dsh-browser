// deno-fmt-ignore-file
import { Memory } from '../../../system/memory/index.mjs';
import { InstantiateType } from '../instantiate.mjs';
function AddOptionalOperation(type) {
    return Memory.Update(type, { '~optional': true }, {});
}
export function AddOptionalAction(type, options) {
    const result = Memory.Update(AddOptionalOperation(type), {}, options);
    return result;
}
export function AddOptionalInstantiate(context, state, type, options) {
    const instantiatedType = InstantiateType(context, state, type);
    return AddOptionalAction(instantiatedType, options);
}
