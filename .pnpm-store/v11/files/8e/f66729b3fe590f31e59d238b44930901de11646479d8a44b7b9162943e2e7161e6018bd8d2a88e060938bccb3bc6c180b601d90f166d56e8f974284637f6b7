import { type TProperties } from '../../types/properties.mjs';
import { type TSchema } from '../../types/schema.mjs';
import { type TState, type TInstantiateType, type TCanInstantiate } from '../instantiate.mjs';
import { type TWithDeferred, type TWith } from '../../action/with.mjs';
export type TWithAction<Type extends TSchema, Options extends TSchema, Result extends TSchema = TCanInstantiate<[Type]> extends true ? TWith<Type, Options> : TWithDeferred<Type, Options>> = Result;
export declare function WithAction<Type extends TSchema, Options extends TSchema>(type: Type, options: Options): TWithAction<Type, Options>;
export type TWithInstantiate<Context extends TProperties, State extends TState, Type extends TSchema, Options extends TSchema, InstantiatedType extends TSchema = TInstantiateType<Context, State, Type>> = TWithAction<InstantiatedType, Options>;
export declare function WithInstantiate<Context extends TProperties, State extends TState, Type extends TSchema, Options extends TSchema>(context: Context, state: State, type: Type, options: Options): TWithInstantiate<Context, State, Type, Options>;
