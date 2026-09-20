// deno-fmt-ignore-file
import { Arguments, Settings } from '../../system/index.mjs';
import { AssertError } from '../assert/index.mjs';
import { Check } from '../check/index.mjs';
import { Errors } from '../errors/index.mjs';
import { Clean } from '../clean/index.mjs';
import { Clone } from '../clone/index.mjs';
import { Convert } from '../convert/index.mjs';
import { Default } from '../default/index.mjs';
import { Pipeline } from '../pipeline/index.mjs';
import { FromType } from './from_type.mjs';
import { UnionPrioritySort } from '../shared/union_priority_sort.mjs';
// ------------------------------------------------------------------
// Assert
// ------------------------------------------------------------------
export class DecodeError extends AssertError {
    constructor(value, errors) {
        super('Decode', value, errors);
    }
}
function Assert(context, type, value) {
    if (!Check(context, type, value))
        throw new DecodeError(value, Errors(context, type, value));
    return value;
}
// ------------------------------------------------------------------
// DecodeUnsafe
// ------------------------------------------------------------------
/** Executes Decode callbacks only */
export function DecodeUnsafe(context, type, value) {
    const sorted = Settings.Get().unionPrioritySort ? UnionPrioritySort(type) : type;
    return FromType('Decode', context, sorted, value);
}
// ------------------------------------------------------------------
// Decoder
// ------------------------------------------------------------------
const Decoder = Pipeline([
    (_context, _type, value) => Clone(value),
    (context, type, value) => Default(context, type, value),
    (context, type, value) => Convert(context, type, value),
    (context, type, value) => Clean(context, type, value),
    (context, type, value) => Assert(context, type, value),
    (context, type, value) => DecodeUnsafe(context, type, value)
]);
/** Decodes a value with the given type. */
export function Decode(...args) {
    const [context, type, value] = Arguments.Match(args, {
        3: (context, type, value) => [context, type, value],
        2: (type, value) => [{}, type, value],
    });
    return Decoder(context, type, value);
}
