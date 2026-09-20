// deno-fmt-ignore-file
import { Guard } from '../../../guard/index.mjs';
import { Object } from '../../types/object.mjs';
import { RemoveOptional } from '../../action/_remove_optional.mjs';
export function FromObject(properties) {
    const mapped = Guard.Keys(properties).reduce((result, left) => {
        return { ...result, [left]: RemoveOptional(properties[left]) };
    }, {});
    const result = Object(mapped);
    return result;
}
