import { Command as $Command } from "@smithy/core/client";
import { getEndpointPlugin } from "@smithy/core/endpoints";
import { commonParams } from "../endpoint/EndpointParameters";
import { GetAsyncInvoke$ } from "../schemas/schemas_0";
export { $Command };
export class GetAsyncInvokeCommand extends $Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AmazonBedrockFrontendService", "GetAsyncInvoke", {})
    .n("BedrockRuntimeClient", "GetAsyncInvokeCommand")
    .sc(GetAsyncInvoke$)
    .build() {
}
