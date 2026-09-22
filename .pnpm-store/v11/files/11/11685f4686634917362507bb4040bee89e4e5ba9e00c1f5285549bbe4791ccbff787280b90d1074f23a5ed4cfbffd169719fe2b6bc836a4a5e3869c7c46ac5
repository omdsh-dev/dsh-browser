"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultEndpointResolver = void 0;
const client_1 = require("@aws-sdk/core/client");
const endpoints_1 = require("@smithy/core/endpoints");
const bdd_1 = require("./bdd");
const cache = new endpoints_1.EndpointCache({
    size: 50,
    params: ["Endpoint", "Region", "UseDualStack", "UseFIPS"],
});
const defaultEndpointResolver = (endpointParams, context = {}) => {
    return cache.get(endpointParams, () => (0, endpoints_1.decideEndpoint)(bdd_1.bdd, {
        endpointParams: endpointParams,
        logger: context.logger,
    }));
};
exports.defaultEndpointResolver = defaultEndpointResolver;
endpoints_1.customEndpointFunctions.aws = client_1.awsEndpointFunctions;
