import { type TSchemaOptions } from '../types/schema.mjs';
import { type TProperties } from '../types/properties.mjs';
import { type TDeferred } from '../types/deferred.mjs';
import { type TState } from '../engine/instantiate.mjs';
import { type TModuleInstantiate } from '../engine/module/instantiate.mjs';
/** Creates a deferred Module action. */
export type TModuleDeferred<Declarations extends TProperties> = (TDeferred<'Module', [Declarations]>);
/** Creates a deferred Module action. */
export declare function ModuleDeferred<Declarations extends TProperties>(declarations: Declarations, options?: TSchemaOptions): TModuleDeferred<Declarations>;
/** Creates a Module with the given declarations */
export type TModule<Declarations extends TProperties> = (TModuleInstantiate<{}, TState<[], []>, Declarations>);
/** Creates a Module with the given declarations */
export declare function Module<Declarations extends TProperties>(declarations: Declarations, options?: TSchemaOptions): TModule<Declarations>;
