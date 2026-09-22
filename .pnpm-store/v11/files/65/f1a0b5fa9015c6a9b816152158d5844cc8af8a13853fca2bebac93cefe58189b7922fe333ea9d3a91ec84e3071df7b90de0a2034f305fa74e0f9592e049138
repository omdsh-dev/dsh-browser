import { Command as $Command } from "@smithy/core/client";
import { getEndpointPlugin } from "@smithy/core/endpoints";
import { commonParams } from "../endpoint/EndpointParameters";
import { ApplyGuardrail$ } from "../schemas/schemas_0";
export { $Command };
export class ApplyGuardrailCommand extends $Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonBedrockFrontendService", "ApplyGuardrail", {})
    .n("BedrockRuntimeClient", "ApplyGuardrailCommand")
    .sc(ApplyGuardrail$)
    .build() {
}
