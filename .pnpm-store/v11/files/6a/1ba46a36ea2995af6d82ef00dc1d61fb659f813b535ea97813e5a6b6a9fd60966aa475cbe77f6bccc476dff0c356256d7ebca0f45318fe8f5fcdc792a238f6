import { Command as $Command } from "@smithy/core/client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  BedrockRuntimeClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../BedrockRuntimeClient";
import {
  ListAsyncInvokesRequest,
  ListAsyncInvokesResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ListAsyncInvokesCommandInput extends ListAsyncInvokesRequest {}
export interface ListAsyncInvokesCommandOutput
  extends ListAsyncInvokesResponse,
    __MetadataBearer {}
declare const ListAsyncInvokesCommand_base: {
  new (
    input: ListAsyncInvokesCommandInput
  ): import("@smithy/core/client").CommandImpl<
    ListAsyncInvokesCommandInput,
    ListAsyncInvokesCommandOutput,
    BedrockRuntimeClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    ...[input]: [] | [ListAsyncInvokesCommandInput]
  ): import("@smithy/core/client").CommandImpl<
    ListAsyncInvokesCommandInput,
    ListAsyncInvokesCommandOutput,
    BedrockRuntimeClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): {
    [x: string]: unknown;
  };
};
export declare class ListAsyncInvokesCommand extends ListAsyncInvokesCommand_base {
  protected static __types: {
    api: {
      input: ListAsyncInvokesRequest;
      output: ListAsyncInvokesResponse;
    };
    sdk: {
      input: ListAsyncInvokesCommandInput;
      output: ListAsyncInvokesCommandOutput;
    };
  };
}
