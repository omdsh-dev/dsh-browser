import { toUint8Array } from "@smithy/core/serde";
export class Md5Js {
    digestLength = 16;
    state = Uint32Array.from(INIT);
    writeBuffer = new DataView(new ArrayBuffer(64));
    bufferLength = 0;
    bytesHashed = 0;
    update(sourceData) {
        const data = toUint8Array(sourceData);
        let pos = 0;
        let len = data.byteLength;
        this.bytesHashed += len;
        while (len > 0) {
            this.writeBuffer.setUint8(this.bufferLength++, data[pos++]);
            --len;
            if (this.bufferLength === 64) {
                compress(this.state, this.writeBuffer);
                this.bufferLength = 0;
            }
        }
    }
    async digest() {
        const state = Uint32Array.from(this.state);
        const buf = new DataView(this.writeBuffer.buffer.slice(0));
        let bufLen = this.bufferLength;
        const bits = this.bytesHashed * 8;
        buf.setUint8(bufLen++, 0x80);
        if (this.bufferLength % 64 >= 56) {
            for (let i = bufLen; i < 64; ++i) {
                buf.setUint8(i, 0);
            }
            compress(state, buf);
            bufLen = 0;
        }
        for (let i = bufLen; i < 56; ++i) {
            buf.setUint8(i, 0);
        }
        buf.setUint32(56, bits >>> 0, true);
        buf.setUint32(60, Math.floor(bits / 2 ** 32), true);
        compress(state, buf);
        const out = new Uint8Array(16);
        const view = new DataView(out.buffer);
        for (let i = 0; i < 4; ++i) {
            view.setUint32(i * 4, state[i], true);
        }
        return out;
    }
    reset() {
        this.state.set(INIT);
        this.writeBuffer = new DataView(new ArrayBuffer(64));
        this.bufferLength = 0;
        this.bytesHashed = 0;
    }
}
const INIT = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
const M = 0xffffffff;
const S = Uint8Array.of(7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21);
const T = Array.from({ length: 64 }, (_, i) => (Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
function compress(state, block) {
    let a = state[0], b = state[1], c = state[2], d = state[3];
    for (let i = 0; i < 64; ++i) {
        let f, g;
        if (i < 16) {
            f = (b & c) | (~b & d);
            g = i;
        }
        else if (i < 32) {
            f = (d & b) | (c & ~d);
            g = (5 * i + 1) % 16;
        }
        else if (i < 48) {
            f = b ^ c ^ d;
            g = (3 * i + 5) % 16;
        }
        else {
            f = c ^ (b | ~d);
            g = (7 * i) % 16;
        }
        const x = block.getUint32(g * 4, true);
        const tmp = d;
        d = c;
        c = b;
        const s = S[(i >> 4) * 4 + (i & 3)];
        const sum = (((a + f) & M) + ((x + T[i]) & M)) & M;
        b = (b + (((sum << s) | (sum >>> (32 - s))) >>> 0)) & M;
        a = tmp;
    }
    state[0] = (state[0] + a) & M;
    state[1] = (state[1] + b) & M;
    state[2] = (state[2] + c) & M;
    state[3] = (state[3] + d) & M;
}
