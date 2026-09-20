import { Command as $Command } from "@smithy/core/client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  BedrockRuntimeClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../BedrockRuntimeClient";
import { ConverseRequest, ConverseResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ConverseCommandInput extends ConverseRequest {}
export interface ConverseCommandOutput
  extends ConverseResponse,
    __MetadataBearer {}
declare const ConverseCommand_base: {
  new (input: ConverseCommandInput): import("@smithy/core/client").CommandImpl<
    ConverseCommandInput,
    ConverseCommandOutput,
    BedrockRuntimeClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (input: ConverseCommandInput): import("@smithy/core/client").CommandImpl<
    ConverseCommandInput,
    ConverseCommandOutput,
    BedrockRuntimeClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): {
    [x: string]: unknown;
  };
};
export declare class ConverseCommand extends ConverseCommand_base {
  protected static __types: {
    api: {
      input: ConverseRequest;
      output: ConverseResponse;
    };
    sdk: {
      input: ConverseCommandInput;
      output: ConverseCommandOutput;
    };
  };
}
