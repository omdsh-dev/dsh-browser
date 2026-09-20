import { Command as $Command } from "@smithy/core/client";
import { Uint8ArrayBlobAdapter } from "@smithy/core/serde";
import {
  BlobPayloadInputTypes,
  MetadataBearer as __MetadataBearer,
} from "@smithy/types";
import {
  BedrockRuntimeClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../BedrockRuntimeClient";
import { InvokeModelRequest, InvokeModelResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export type InvokeModelCommandInputType = Pick<
  InvokeModelRequest,
  Exclude<keyof InvokeModelRequest, "body">
> & {
  body?: BlobPayloadInputTypes;
};
export interface InvokeModelCommandInput extends InvokeModelCommandInputType {}
export type InvokeModelCommandOutputType = Pick<
  InvokeModelResponse,
  Exclude<keyof InvokeModelResponse, "body">
> & {
  body: Uint8ArrayBlobAdapter;
};
export interface InvokeModelCommandOutput
  extends InvokeModelCommandOutputType,
    __MetadataBearer {}
declare const InvokeModelCommand_base: {
  new (
    input: InvokeModelCommandInput
  ): import("@smithy/core/client").CommandImpl<
    InvokeModelCommandInput,
    InvokeModelCommandOutput,
    BedrockRuntimeClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: InvokeModelCommandInput
  ): import("@smithy/core/client").CommandImpl<
    InvokeModelCommandInput,
    InvokeModelCommandOutput,
    BedrockRuntimeClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): {
    [x: string]: unknown;
  };
};
export declare class InvokeModelCommand extends InvokeModelCommand_base {
  protected static __types: {
    api: {
      input: InvokeModelRequest;
      output: InvokeModelResponse;
    };
    sdk: {
      input: InvokeModelCommandInput;
      output: InvokeModelCommandOutput;
    };
  };
}
