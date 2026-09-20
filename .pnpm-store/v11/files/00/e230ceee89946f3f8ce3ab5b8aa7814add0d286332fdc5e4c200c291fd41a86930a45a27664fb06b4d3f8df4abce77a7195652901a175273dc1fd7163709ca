// deno-lint-ignore-file ban-types
// deno-fmt-ignore-file
import { Guard } from '../../../guard/index.mjs';
import { Memory } from '../../../system/memory/index.mjs';
import { State } from '../instantiate.mjs';
// ------------------------------------------------------------------
// Module: Instantiation Infrastructure
// ------------------------------------------------------------------
import { CyclicCandidates } from '../cyclic/candidates.mjs';
import { InstantiateCyclic } from '../cyclic/instantiate.mjs';
import { InstantiateType } from '../instantiate.mjs';
function InstantiateCyclics(context, declarations, cyclicKeys) {
    const declarationContext = Memory.Assign(context, declarations);
    const declarationKeys = Guard.Keys(declarations).filter(key => cyclicKeys.includes(key));
    return declarationKeys.reduce((result, key) => {
        return { ...result, [key]: InstantiateCyclic(declarationContext, key, declarations[key]) };
    }, {});
}
function InstantiateNonCyclics(context, declarations, cyclicKeys) {
    const declarationContext = Memory.Assign(context, declarations);
    const declarationKeys = Guard.Keys(declarations).filter(key => !cyclicKeys.includes(key));
    return declarationKeys.reduce((result, key) => {
        return { ...result, [key]: InstantiateType(declarationContext, State([], []), declarations[key]) };
    }, {});
}
function InstantiateModule(context, declarations, options) {
    const cyclicCandidates = CyclicCandidates(declarations);
    const instantiatedCyclics = InstantiateCyclics(context, declarations, cyclicCandidates);
    const instantiatedNonCyclics = InstantiateNonCyclics(context, declarations, cyclicCandidates);
    const instantiatedModule = { ...instantiatedCyclics, ...instantiatedNonCyclics };
    return Memory.Update(instantiatedModule, {}, options);
}
export function ModuleInstantiate(context, _state, declarations, options) {
    const instantiatedModule = InstantiateModule(context, declarations, options);
    return instantiatedModule;
}
