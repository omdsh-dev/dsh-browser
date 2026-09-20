import { HttpHandlerOptions as __HttpHandlerOptions } from "@smithy/types";
import {
  CreateOAuth2TokenCommandInput,
  CreateOAuth2TokenCommandOutput,
} from "./commands/CreateOAuth2TokenCommand";
import {
  CreateOAuth2TokenWithIAMCommandInput,
  CreateOAuth2TokenWithIAMCommandOutput,
} from "./commands/CreateOAuth2TokenWithIAMCommand";
import { SigninClient } from "./SigninClient";
export interface Signin {
  createOAuth2Token(
    args: CreateOAuth2TokenCommandInput,
    options?: __HttpHandlerOptions,
  ): Promise<CreateOAuth2TokenCommandOutput>;
  createOAuth2Token(
    args: CreateOAuth2TokenCommandInput,
    cb: (err: any, data?: CreateOAuth2TokenCommandOutput) => void,
  ): void;
  createOAuth2Token(
    args: CreateOAuth2TokenCommandInput,
    options: __HttpHandlerOptions,
    cb: (err: any, data?: CreateOAuth2TokenCommandOutput) => void,
  ): void;
  createOAuth2TokenWithIAM(
    args: CreateOAuth2TokenWithIAMCommandInput,
    options?: __HttpHandlerOptions,
  ): Promise<CreateOAuth2TokenWithIAMCommandOutput>;
  createOAuth2TokenWithIAM(
    args: CreateOAuth2TokenWithIAMCommandInput,
    cb: (err: any, data?: CreateOAuth2TokenWithIAMCommandOutput) => void,
  ): void;
  createOAuth2TokenWithIAM(
    args: CreateOAuth2TokenWithIAMCommandInput,
    options: __HttpHandlerOptions,
    cb: (err: any, data?: CreateOAuth2TokenWithIAMCommandOutput) => void,
  ): void;
}
export declare class Signin extends SigninClient implements Signin {}
