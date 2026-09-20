import { concatBytes, toUint8Array } from "@smithy/core/serde";
import { Sha256Js } from "./Sha256Js";
const { digest, sign, importKey } = globalThis?.crypto?.subtle ?? {};
const subtle = typeof digest === "function" && typeof sign === "function" && typeof importKey === "function"
    ? globalThis.crypto.subtle
    : undefined;
const MAX_PENDING_BYTES = 8 * 1024 * 1024;
export class Sha256WebCrypto {
    digestLength = 32;
    secret;
    pending = [];
    pendingBytes = 0;
    fallback;
    finished = false;
    constructor(secret) {
        if (secret) {
            this.secret = toUint8Array(secret);
        }
    }
    update(data) {
        if (this.finished) {
            throw new Error("Attempted to update an already finished HMAC.");
        }
        if (this.fallback) {
            this.fallback.update(data);
            return;
        }
        this.pending.push(data.slice());
        this.pendingBytes += data.byteLength;
        if (this.pendingBytes >= MAX_PENDING_BYTES) {
            this.switchToFallback();
        }
    }
    async digest() {
        if (this.fallback) {
            return this.fallback.digest();
        }
        if (this.secret && this.finished) {
            throw new Error("Attempted to digest an already finished HMAC.");
        }
        const data = concatBytes(this.pending);
        if (subtle) {
            if (this.secret) {
                this.finished = true;
                const key = await subtle.importKey("raw", this.secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
                const sig = await subtle.sign("HMAC", key, data);
                return new Uint8Array(sig);
            }
            const hash = await subtle.digest("SHA-256", data);
            return new Uint8Array(hash);
        }
        const sha256 = new Sha256Js(this.secret);
        sha256.update(data);
        return sha256.digest();
    }
    reset() {
        this.pending = [];
        this.pendingBytes = 0;
        this.fallback = undefined;
        this.finished = false;
    }
    switchToFallback() {
        const sha256Js = new Sha256Js(this.secret);
        for (const chunk of this.pending) {
            sha256Js.update(chunk);
        }
        this.fallback = sha256Js;
        this.pending = [];
        this.pendingBytes = 0;
    }
}
