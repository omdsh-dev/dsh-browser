// deno-fmt-ignore-file
import { Memory } from '../../../system/memory/index.mjs';
import { InstantiateType, CanInstantiate } from '../instantiate.mjs';
import { WithDeferred } from '../../action/with.mjs';
export function WithAction(type, options) {
    const result = CanInstantiate([type])
        ? Memory.Update(type, {}, options)
        : WithDeferred(type, options);
    return result;
}
export function WithInstantiate(context, state, type, options) {
    const instaniatedType = InstantiateType(context, state, type);
    return WithAction(instaniatedType, options);
}
