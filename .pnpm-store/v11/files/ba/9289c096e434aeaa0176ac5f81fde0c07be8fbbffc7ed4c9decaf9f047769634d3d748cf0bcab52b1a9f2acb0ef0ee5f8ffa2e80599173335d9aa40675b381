/**
 * Implements standard Base64 encoding.
 *
 * Operates in constant time.
 */
export declare class Coder {
    private _paddingCharacter;
    constructor(_paddingCharacter?: string);
    encodedLength(length: number): number;
    encode(data: Uint8Array): string;
    maxDecodedLength(length: number): number;
    decodedLength(s: string): number;
    decode(s: string): Uint8Array;
    protected _encodeByte(b: number): string;
    protected _decodeChar(c: number): number;
    private _getPaddingLength;
}
export declare function encode(data: Uint8Array): string;
export declare function decode(s: string): Uint8Array;
/**
 * Implements URL-safe Base64 encoding.
 * (Same as Base64, but '+' is replaced with '-', and '/' with '_').
 *
 * Operates in constant time.
 */
export declare class URLSafeCoder extends Coder {
    protected _encodeByte(b: number): string;
    protected _decodeChar(c: number): number;
}
export declare function encodeURLSafe(data: Uint8Array): string;
export declare function decodeURLSafe(s: string): Uint8Array;
export declare const encodedLength: (length: number) => number;
export declare const maxDecodedLength: (length: number) => number;
export declare const decodedLength: (s: string) => number;
