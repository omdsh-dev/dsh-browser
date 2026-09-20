import * as zlib from "node:zlib";
import { Crc32Js } from "./Crc32Js";
const zlibCrc32 = typeof zlib.crc32 === "function" ? zlib.crc32 : undefined;
export const Crc32Node = zlibCrc32 ? buildNativeClass(zlibCrc32) : Crc32Js;
function buildNativeClass(nativeCrc32) {
    return class Crc32Node {
        digestLength = 4;
        value = 0;
        update(data) {
            this.value = nativeCrc32(data, this.value);
        }
        digestSync() {
            return this.value >>> 0;
        }
        async digest() {
            const out = new Uint8Array(4);
            new DataView(out.buffer).setUint32(0, this.digestSync(), false);
            return out;
        }
        reset() {
            this.value = 0;
        }
    };
}
