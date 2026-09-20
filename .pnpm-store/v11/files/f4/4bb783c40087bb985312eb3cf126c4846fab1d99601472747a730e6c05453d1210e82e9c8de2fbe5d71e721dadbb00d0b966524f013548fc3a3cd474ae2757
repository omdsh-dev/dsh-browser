import { Memory } from '../../../system/memory/index.mjs';
import { type TSchemaOptions } from '../../types/schema.mjs';
import { type TProperties } from '../../types/properties.mjs';
import { type TState } from '../instantiate.mjs';
import { type TCyclicCandidates } from '../cyclic/candidates.mjs';
import { type TInstantiateCyclic } from '../cyclic/instantiate.mjs';
import { type TInstantiateType } from '../instantiate.mjs';
type TInstantiateCyclics<Context extends TProperties, Declarations extends TProperties, CyclicKeys extends string[], DeclarationContext extends TProperties = Memory.TAssign<Context, Declarations>, Result extends TProperties = {
    [Key in Extract<keyof Declarations, CyclicKeys[number]>]: TInstantiateCyclic<DeclarationContext, Key, Declarations[Key]>;
}> = Result;
type TInstantiateNonCyclics<Context extends TProperties, Declarations extends TProperties, CyclicKeys extends string[], DeclarationContext extends TProperties = Memory.TAssign<Context, Declarations>, Result extends TProperties = {
    [Key in Exclude<keyof Declarations, CyclicKeys[number]>]: TInstantiateType<DeclarationContext, TState<[], []>, Declarations[Key]>;
}> = Result;
type TInstantiateModule<Context extends TProperties, Declarations extends TProperties, CyclicCandidates extends string[] = TCyclicCandidates<Declarations>, InstantiatedCyclics extends TProperties = TInstantiateCyclics<Context, Declarations, CyclicCandidates>, InstantiatedNonCyclics extends TProperties = TInstantiateNonCyclics<Context, Declarations, CyclicCandidates>, InstantiatedModule extends TProperties = InstantiatedCyclics & InstantiatedNonCyclics> = {
    [Key in keyof InstantiatedModule]: InstantiatedModule[Key];
} & {};
export type TModuleInstantiate<Context extends TProperties, _State extends TState, Declarations extends TProperties, InstantiatedModule extends TProperties = TInstantiateModule<Context, Declarations>> = InstantiatedModule;
export declare function ModuleInstantiate<Context extends TProperties, State extends TState, Declarations extends TProperties>(context: Context, _state: State, declarations: Declarations, options: TSchemaOptions): TModuleInstantiate<Context, State, Declarations>;
export {};
