// deno-fmt-ignore-file
import { Guard } from '../../../guard/index.mjs';
import { Compare } from '../evaluate/compare.mjs';
function Comparer(left, right) {
    const compareResult = Compare(left, right);
    const result = (Guard.IsEqual(compareResult, 'right-inside') ? 1 :
        Guard.IsEqual(compareResult, 'disjoint') ? 1 :
            0);
    return result;
}
function Insert(type, types, result = []) {
    return Guard.ShiftLeft(types, (left, right) => Guard.IsEqual(Comparer(type, left), 1)
        ? Insert(type, right, [...result, left])
        : [...result, type, ...types], () => [...result, type]);
}
function Sort(types, result = []) {
    return Guard.ShiftLeft(types, (left, right) => Sort(right, Insert(left, result)), () => result);
}
/**
 * Priority sorts types in sequence of narrowest to broadest using an Insertion Sort
 * algorithm. This function is typically used to sequence types for union variant
 * checks to ensure that values are checked against the most narrow types before
 * the broadest, which in turn helps ensure order-independent Union checking.
 */
export function Priority(types) {
    const result = Sort(types);
    return result;
}
