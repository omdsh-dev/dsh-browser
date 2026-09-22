import { createHash } from "node:crypto";
import { toUint8Array } from "@smithy/core/serde";
import { Md5Js } from "./Md5Js";
const hasNativeCrypto = (() => {
    try {
        createHash("md5");
        return true;
    }
    catch {
        return false;
    }
})();
export const Md5Node = hasNativeCrypto ? buildNativeClass() : Md5Js;
function buildNativeClass() {
    return class Md5Node {
        digestLength = 16;
        hash = createHash("md5");
        update(data) {
            this.hash.update(toUint8Array(data));
        }
        async digest() {
            const buf = this.hash.copy().digest();
            return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
        }
        reset() {
            this.hash = createHash("md5");
        }
    };
}
