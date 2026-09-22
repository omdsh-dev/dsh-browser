import { getSmithyContext } from "@smithy/core/transport";
import { bindGetEndpointFromInstructions } from "./adaptors/getEndpointFromInstructions";
function setFeature(context, feature, value) {
    if (!context.__smithy_context) {
        context.__smithy_context = { features: {} };
    }
    else if (!context.__smithy_context.features) {
        context.__smithy_context.features = {};
    }
    context.__smithy_context.features[feature] = value;
}
export function bindEndpointMiddleware(getEndpointFromConfig) {
    const getEndpointFromInstructions = bindGetEndpointFromInstructions(getEndpointFromConfig);
    return ({ config, instructions, }) => {
        return (next, context) => async (args) => {
            if (config.isCustomEndpoint) {
                setFeature(context, "ENDPOINT_OVERRIDE", "N");
            }
            const endpoint = await getEndpointFromInstructions(args.input, {
                getEndpointParameterInstructions() {
                    return instructions;
                },
            }, { ...config }, context);
            context.endpointV2 = endpoint;
            context.authSchemes = endpoint.properties?.authSchemes;
            const authScheme = context.authSchemes?.[0];
            if (authScheme) {
                context["signing_region"] = authScheme.signingRegion;
                context["signing_service"] = authScheme.signingName;
                const smithyContext = getSmithyContext(context);
                const httpAuthOption = smithyContext?.selectedHttpAuthScheme?.httpAuthOption;
                if (httpAuthOption) {
                    httpAuthOption.signingProperties = Object.assign(httpAuthOption.signingProperties || {}, {
                        signing_region: authScheme.signingRegion,
                        signingRegion: authScheme.signingRegion,
                        signing_service: authScheme.signingName,
                        signingName: authScheme.signingName,
                        signingRegionSet: authScheme.signingRegionSet,
                    }, authScheme.properties);
                }
            }
            return next({
                ...args,
            });
        };
    };
}
