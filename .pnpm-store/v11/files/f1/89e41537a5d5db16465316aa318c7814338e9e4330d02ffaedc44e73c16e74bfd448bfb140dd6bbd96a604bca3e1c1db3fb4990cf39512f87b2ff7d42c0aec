export declare const digestLength: number;
export declare const blockSize: number;
export declare class Hash {
    digestLength: number;
    blockSize: number;
    private state;
    private temp;
    private buffer;
    private bufferLength;
    private bytesHashed;
    finished: boolean;
    constructor();
    reset(): this;
    clean(): void;
    update(data: Uint8Array, dataLength?: number): this;
    finish(out: Uint8Array): this;
    digest(): Uint8Array;
    _saveState(out: Uint32Array): void;
    _restoreState(from: Uint32Array, bytesHashed: number): void;
}
export declare class HMAC {
    private inner;
    private outer;
    blockSize: number;
    digestLength: number;
    private istate;
    private ostate;
    constructor(key: Uint8Array);
    reset(): this;
    clean(): void;
    update(data: Uint8Array): this;
    finish(out: Uint8Array): this;
    digest(): Uint8Array;
}
export declare function hash(data: Uint8Array): Uint8Array;
export default hash;
export declare function hmac(key: Uint8Array, data: Uint8Array): Uint8Array;
export declare function hkdf(key: Uint8Array, salt?: Uint8Array, info?: Uint8Array, length?: number): Uint8Array;
export declare function pbkdf2(password: Uint8Array, salt: Uint8Array, iterations: number, dkLen: number): Uint8Array;
