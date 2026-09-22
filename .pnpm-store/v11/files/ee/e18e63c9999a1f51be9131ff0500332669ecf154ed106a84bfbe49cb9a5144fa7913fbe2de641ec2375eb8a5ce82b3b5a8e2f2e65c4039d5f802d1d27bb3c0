import type { Decoder, Encoder } from "@smithy/types";
/**
 * Adapter for conversions of the native Uint8Array type.
 * @public
 */
export interface IUint8ArrayBlobAdapter extends Uint8Array {
    /**
     * @param encoding - default 'utf-8'.
     * @returns the blob as string.
     */
    transformToString(encoding?: string): string;
}
export interface Uint8ArrayBlobAdapterConstructor {
    new (...args: any): IUint8ArrayBlobAdapter;
    fromString(source: string, encoding?: string): IUint8ArrayBlobAdapter;
    mutate(source: Uint8Array): IUint8ArrayBlobAdapter;
}
export declare function bindUint8ArrayBlobAdapter(toUtf8: Encoder, fromUtf8: Decoder, toBase64: Encoder, fromBase64: Decoder): Uint8ArrayBlobAdapterConstructor;
