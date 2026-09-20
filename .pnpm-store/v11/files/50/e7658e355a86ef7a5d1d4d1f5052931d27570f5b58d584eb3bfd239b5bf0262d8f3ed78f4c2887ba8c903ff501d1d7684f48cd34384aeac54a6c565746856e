// deno-fmt-ignore-file
import { PropertyKeys } from '../../types/properties.mjs';
import { CyclicCheck } from './check.mjs';
function ResolveCandidateKeys(context, keys) {
    return keys.reduce((result, left) => {
        return CyclicCheck([left], context, context[left])
            ? [...result, left]
            : result;
    }, []);
}
/** Returns keys for context types that need to be transformed to TCyclic. */
export function CyclicCandidates(context) {
    const keys = PropertyKeys(context);
    const result = ResolveCandidateKeys(context, keys);
    return result;
}
