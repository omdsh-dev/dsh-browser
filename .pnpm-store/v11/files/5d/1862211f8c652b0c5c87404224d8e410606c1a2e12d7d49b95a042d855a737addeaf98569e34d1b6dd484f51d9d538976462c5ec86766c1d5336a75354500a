import { type StaticDirection, type StaticDecode, type StaticType } from './static.mjs';
import { type TSchema } from './schema.mjs';
import { type TProperties } from './properties.mjs';
export type StaticCodec<Stack extends string[], Direction extends StaticDirection, Context extends TProperties, This extends TProperties, Type extends TSchema, Decoded extends unknown> = (Direction extends 'Decode' ? Decoded : StaticType<Stack, Direction, Context, This, Omit<Type, '~codec'>>);
export type TDecodeCallback<Encoded extends unknown, Decoded = unknown> = (input: Encoded) => Decoded;
export type TEncodeCallback<Encoded extends unknown, Decoded = unknown> = (input: Decoded) => Encoded;
export type TCodec<Type extends TSchema = TSchema, Decoded extends unknown = unknown> = Type & {
    '~codec': {
        encode: TDecodeCallback<unknown, Decoded>;
        decode: TEncodeCallback<unknown, Decoded>;
    };
};
export declare class EncodeBuilder<Type extends TSchema, Encoded extends unknown, Decoded extends unknown> {
    private readonly type;
    private readonly decode;
    constructor(type: Type, decode: globalThis.Function);
    Encode(callback: TEncodeCallback<Encoded, Decoded>): TCodec<Type, Decoded>;
}
export declare class DecodeBuilder<Type extends TSchema, Encoded extends unknown> {
    private readonly type;
    constructor(type: Type);
    Decode<Callback extends TDecodeCallback<Encoded, unknown>>(callback: Callback): EncodeBuilder<Type, Encoded, ReturnType<Callback>>;
}
/** Creates a bi-directional Codec. Codec functions are called on Value.Decode and Value.Encode. */
export declare function Codec<Type extends TSchema>(type: Type): DecodeBuilder<Type, StaticDecode<Type>>;
/** Createsa  uni-directional Codec with Decode only. The Decode function is called on Value.Decode */
export declare function Decode<Type extends TSchema, Callback extends TDecodeCallback<StaticDecode<Type>, unknown>>(type: Type, callback: Callback): TCodec<Type, ReturnType<Callback>>;
/** Creates a uni-directional Codec with Encode only. The Encode function is called on Value.Encode */
export declare function Encode<Type extends TSchema>(type: Type, callback: TEncodeCallback<StaticDecode<Type>, unknown>): TCodec<Type, unknown>;
export declare function IsCodec(value: unknown): value is TCodec;
