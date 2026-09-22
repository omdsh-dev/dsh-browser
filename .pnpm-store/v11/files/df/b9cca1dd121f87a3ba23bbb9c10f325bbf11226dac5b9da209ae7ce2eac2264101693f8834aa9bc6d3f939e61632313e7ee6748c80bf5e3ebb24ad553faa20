import { Arguments, Settings } from '../../system/index.mjs';
import { FromType } from './from_type.mjs';
import { UnionPrioritySort } from '../shared/union_priority_sort.mjs';
/**
 * Cleans a value by removing non-evaluated properties and elements as derived from the provided type.
 * This function returns unknown so callers should Check the return value before use. This function
 * mutates the provided value. If mutation is not wanted, you should Clone the value before passing
 * to this function.
 */
export function Clean(...args) {
    const [context, type, value] = Arguments.Match(args, {
        3: (context, type, value) => [context, type, value],
        2: (type, value) => [{}, type, value]
    });
    const sorted = Settings.Get().unionPrioritySort ? UnionPrioritySort(type) : type;
    return FromType(context, sorted, value);
}
