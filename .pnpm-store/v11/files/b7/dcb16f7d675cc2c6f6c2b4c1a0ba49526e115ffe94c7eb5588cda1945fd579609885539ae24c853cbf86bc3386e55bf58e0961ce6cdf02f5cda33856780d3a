import { createHash, createHmac } from "node:crypto";
import { Sha256Js } from "./Sha256Js";
const hasNativeCrypto = (() => {
    try {
        createHash("sha256");
        return true;
    }
    catch {
        return false;
    }
})();
export const Sha256Node = hasNativeCrypto ? buildNativeClass() : Sha256Js;
function buildNativeClass() {
    return class Sha256Node {
        digestLength = 32;
        secret;
        hash;
        isHmac;
        finished = false;
        constructor(secret) {
            this.secret = secret;
            this.isHmac = !!secret;
            this.hash = this.createHash();
        }
        update(data) {
            if (this.finished) {
                throw new Error("Attempted to update an already finished hash.");
            }
            this.hash.update(data);
        }
        async digest() {
            let buf;
            if (this.isHmac) {
                this.finished = true;
                buf = this.hash.digest();
            }
            else {
                buf = this.hash.copy().digest();
            }
            return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
        }
        reset() {
            this.hash = this.createHash();
            this.finished = false;
        }
        createHash() {
            return this.secret ? createHmac("sha256", toBuffer(this.secret)) : createHash("sha256");
        }
    };
}
function toBuffer(data) {
    if (typeof data === "string") {
        return data;
    }
    if (ArrayBuffer.isView(data)) {
        return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    }
    return Buffer.from(data);
}
