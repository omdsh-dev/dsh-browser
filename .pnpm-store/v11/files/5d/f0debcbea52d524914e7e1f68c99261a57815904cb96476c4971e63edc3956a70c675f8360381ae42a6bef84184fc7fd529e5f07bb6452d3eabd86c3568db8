// deno-fmt-ignore-file
import { InstantiateType } from '../instantiate.mjs';
import { State } from '../instantiate.mjs';
export function RefInstantiate(context, state, type, ref) {
    return (state.visited.includes(ref)
        ? type
        : ref in context
            ? InstantiateType(context, State(state['callstack'], [...state['visited'], ref]), context[ref])
            : type);
}
