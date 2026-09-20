import { EndpointError } from "./types";
import { evaluateCondition } from "./utils/evaluateCondition";
import { evaluateExpression } from "./utils/evaluateExpression";
import { getEndpointHeaders } from "./utils/getEndpointHeaders";
import { getEndpointProperties } from "./utils/getEndpointProperties";
import { getEndpointUrl } from "./utils/getEndpointUrl";
const RESULT = 100_000_000;
export const decideEndpoint = (bdd, options) => {
    const { nodes, root, results, conditions } = bdd;
    let ref = root;
    const referenceRecord = {};
    const closure = {
        referenceRecord,
        endpointParams: options.endpointParams,
        logger: options.logger,
    };
    while (ref !== 1 && ref !== -1 && ref < RESULT) {
        const node_i = 3 * (Math.abs(ref) - 1);
        const [condition_i, highRef, lowRef] = [nodes[node_i], nodes[node_i + 1], nodes[node_i + 2]];
        const [fn, argv, assign] = conditions[condition_i];
        const evaluation = evaluateCondition({ fn, assign, argv }, closure);
        if (evaluation.toAssign) {
            const { name, value } = evaluation.toAssign;
            referenceRecord[name] = value;
        }
        ref = ref >= 0 === evaluation.result ? highRef : lowRef;
    }
    if (ref >= RESULT) {
        const result = results[ref - RESULT];
        if (result[0] === -1) {
            const [, errorExpression] = result;
            throw new EndpointError(evaluateExpression(errorExpression, "Error", closure));
        }
        const [url, properties, headers] = result;
        return {
            url: getEndpointUrl(url, closure),
            properties: getEndpointProperties(properties, closure),
            headers: getEndpointHeaders(headers ?? {}, closure),
        };
    }
    throw new EndpointError(`No matching endpoint.`);
};
