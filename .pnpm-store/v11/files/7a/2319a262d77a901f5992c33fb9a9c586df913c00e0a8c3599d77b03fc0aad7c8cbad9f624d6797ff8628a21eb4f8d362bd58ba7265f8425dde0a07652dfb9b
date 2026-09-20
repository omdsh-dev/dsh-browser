import { type TProperties } from '../../types/properties.mjs';
import { type TInstantiateType } from '../instantiate.mjs';
import { type TRef } from '../../types/ref.mjs';
import { type TState } from '../instantiate.mjs';
export type TRefInstantiate<Context extends TProperties, State extends TState, Type extends TRef, Ref extends string> = (Ref extends State['visited'][number] ? Type : Ref extends keyof Context ? TInstantiateType<Context, TState<State['callstack'], [...State['visited'], Ref]>, Context[Ref]> : Type);
export declare function RefInstantiate<Context extends TProperties, State extends TState, Type extends TRef, Ref extends string>(context: Context, state: State, type: Type, ref: Ref): TRefInstantiate<Context, State, Type, Ref>;
