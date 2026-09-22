import type { ParsedIniData, Profile, Provider } from "@smithy/types";
import type { SourceProfileInit } from "../shared-ini-file-loader/parseKnownFiles";
/**
 * @internal
 */
export interface NodeSharedConfigInit extends SourceProfileInit {
    /**
     * The preferred shared ini file to load the config. "config" option refers to
     * the shared config file(defaults to `~/.aws/config`). "credentials" option
     * refers to the shared credentials file(defaults to `~/.aws/credentials`)
     */
    preferredFile?: "config" | "credentials";
}
/**
 * @internal
 */
export type GetterFromConfig<T> = (profile: Profile, configFile?: ParsedIniData) => T | undefined;
/**
 * Get config value from the shared config files with inferred profile name.
 * @internal
 */
export declare const fromSharedConfigFiles: <T = string>(configSelector: GetterFromConfig<T>, { preferredFile, ...init }?: NodeSharedConfigInit) => Provider<T>;
