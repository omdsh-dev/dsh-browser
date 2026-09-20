// deno-fmt-ignore-file
import { Memory } from '../../../system/memory/index.mjs';
import { InstantiateType } from '../instantiate.mjs';
function AddImmutableOperation(type) {
    return Memory.Update(type, { '~immutable': true }, {});
}
export function AddImmutableAction(type, options) {
    const result = Memory.Update(AddImmutableOperation(type), {}, options);
    return result;
}
export function AddImmutableInstantiate(context, state, type, options) {
    const instantiatedType = InstantiateType(context, state, type);
    return AddImmutableAction(instantiatedType, options);
}
