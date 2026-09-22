// deno-fmt-ignore-file
import { Guard } from '../../../guard/index.mjs';
import { Object } from '../../types/object.mjs';
import { AddOptional } from '../../action/_add_optional.mjs';
export function FromObject(properties) {
    const mapped = Guard.Keys(properties).reduce((result, left) => {
        return { ...result, [left]: AddOptional(properties[left]) };
    }, {});
    const result = Object(mapped);
    return result;
}
