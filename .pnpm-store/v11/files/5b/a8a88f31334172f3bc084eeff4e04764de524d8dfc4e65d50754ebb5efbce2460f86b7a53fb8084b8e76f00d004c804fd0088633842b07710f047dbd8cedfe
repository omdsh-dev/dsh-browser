const { toUint8Array, concatBytes } = require("@smithy/core/serde");

async function blobReader(blob, onChunk, chunkSize = 1024 * 1024) {
    const size = blob.size;
    let totalBytesRead = 0;
    while (totalBytesRead < size) {
        const slice = blob.slice(totalBytesRead, Math.min(size, totalBytesRead + chunkSize));
        onChunk(new Uint8Array(await slice.arrayBuffer()));
        totalBytesRead += slice.size;
    }
}

const blobHasher = async function blobHasher(hashCtor, blob) {
    const hash = new hashCtor();
    await blobReader(blob, (chunk) => {
        hash.update(chunk);
    });
    return hash.digest();
};

class Md5Js {
    digestLength = 16;
    state = Uint32Array.from(INIT$1);
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
        this.state.set(INIT$1);
        this.writeBuffer = new DataView(new ArrayBuffer(64));
        this.bufferLength = 0;
        this.bytesHashed = 0;
    }
}
const INIT$1 = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
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

const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; ++i) {
    let c = i;
    for (let j = 0; j < 8; ++j) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    CRC32_TABLE[i] = c >>> 0;
}
const ONES = 0xffff_ffff;
class Crc32Js {
    digestLength = 4;
    checksum = ONES;
    update(data) {
        for (let i = 0; i < data.length; ++i) {
            this.checksum = (this.checksum >>> 8) ^ CRC32_TABLE[(this.checksum ^ data[i]) & 0xff];
        }
    }
    digestSync() {
        return (this.checksum ^ ONES) >>> 0;
    }
    async digest() {
        const value = this.digestSync();
        const out = new Uint8Array(4);
        new DataView(out.buffer).setUint32(0, value, false);
        return out;
    }
    reset() {
        this.checksum = ONES;
    }
}

const BLOCK = 64;
const DIGEST_LENGTH = 32;
const MAX_HASHABLE_LENGTH = 2 ** 53 - 1;
class Sha256Js {
    digestLength = DIGEST_LENGTH;
    state = Int32Array.from(INIT);
    w;
    buffer = new Uint8Array(64);
    bufferLength = 0;
    bytesHashed = 0;
    finished = false;
    inner;
    outer;
    constructor(secret) {
        if (secret) {
            const key = Sha256Js.normalizeKey(secret);
            this.inner = new Sha256Js();
            this.outer = new Sha256Js();
            const { inner, outer } = this;
            const pad = new Uint8Array(BLOCK * 2);
            for (let i = 0; i < BLOCK; ++i) {
                pad[i] = 0x36 ^ key[i];
                pad[i + BLOCK] = 0x5c ^ key[i];
            }
            inner.update(pad.subarray(0, BLOCK));
            outer.update(pad.subarray(BLOCK));
        }
    }
    update(data) {
        if (this.finished) {
            throw new Error("Attempted to update an already finished HMAC.");
        }
        if (this.inner) {
            this.inner.update(data);
            return;
        }
        const chunk = toUint8Array(data);
        let position = 0;
        let { byteLength } = chunk;
        this.bytesHashed += byteLength;
        if (this.bytesHashed * 8 > MAX_HASHABLE_LENGTH) {
            throw new Error("Cannot hash more than 2^53 - 1 bits");
        }
        while (byteLength > 0) {
            this.buffer[this.bufferLength++] = chunk[position++];
            byteLength--;
            if (this.bufferLength === BLOCK) {
                this.hashBuffer();
                this.bufferLength = 0;
            }
        }
    }
    async digest() {
        const { inner, outer } = this;
        if (inner && outer) {
            if (this.finished) {
                throw new Error("Attempted to digest an already finished HMAC.");
            }
            this.finished = true;
            const innerDigest = inner.digestSync();
            outer.update(innerDigest);
            return outer.digestSync();
        }
        return this.digestSync();
    }
    reset() {
        this.state = Int32Array.from(INIT);
        this.buffer = new Uint8Array(64);
        this.bufferLength = 0;
        this.bytesHashed = 0;
    }
    digestSync() {
        const state = this.state.slice();
        const buffer = this.buffer.slice();
        let bufferLength = this.bufferLength;
        const bitsHashed = this.bytesHashed * 8;
        const bufferView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        bufferView.setUint8(bufferLength++, 0x80);
        if ((bufferLength - 1) % BLOCK >= BLOCK - 8) {
            for (let i = bufferLength; i < BLOCK; ++i) {
                bufferView.setUint8(i, 0);
            }
            this.hashBufferWith(state, buffer);
            bufferLength = 0;
        }
        for (let i = bufferLength; i < BLOCK - 8; ++i) {
            bufferView.setUint8(i, 0);
        }
        bufferView.setUint32(BLOCK - 8, Math.floor(bitsHashed / 0x100000000), false);
        bufferView.setUint32(BLOCK - 4, bitsHashed, false);
        this.hashBufferWith(state, buffer);
        const out = new Uint8Array(DIGEST_LENGTH);
        for (let i = 0; i < 8; ++i) {
            out[i * 4] = (state[i] >>> 24) & 0xff;
            out[i * 4 + 1] = (state[i] >>> 16) & 0xff;
            out[i * 4 + 2] = (state[i] >>> 8) & 0xff;
            out[i * 4 + 3] = (state[i] >>> 0) & 0xff;
        }
        return out;
    }
    static normalizeKey(secret) {
        const key = toUint8Array(secret);
        if (key.byteLength > BLOCK) {
            const h = new Sha256Js();
            h.update(key);
            const out = h.digestSync();
            const padded = new Uint8Array(BLOCK);
            padded.set(out);
            return padded;
        }
        if (key.byteLength < BLOCK) {
            const padded = new Uint8Array(BLOCK);
            padded.set(key);
            return padded;
        }
        return key;
    }
    hashBuffer() {
        this.hashBufferWith(this.state, this.buffer);
    }
    hashBufferWith(state, buffer) {
        const w = (this.w ??= new Int32Array(64));
        let s0 = state[0], s1 = state[1], s2 = state[2], s3 = state[3], s4 = state[4], s5 = state[5], s6 = state[6], s7 = state[7];
        for (let i = 0; i < BLOCK; ++i) {
            if (i < 16) {
                w[i] =
                    ((buffer[i * 4] & 0xff) << 24) |
                        ((buffer[i * 4 + 1] & 0xff) << 16) |
                        ((buffer[i * 4 + 2] & 0xff) << 8) |
                        (buffer[i * 4 + 3] & 0xff);
            }
            else {
                let u = w[i - 2];
                const t1 = ((u >>> 17) | (u << 15)) ^ ((u >>> 19) | (u << 13)) ^ (u >>> 10);
                u = w[i - 15];
                const t2 = ((u >>> 7) | (u << 25)) ^ ((u >>> 18) | (u << 14)) ^ (u >>> 3);
                w[i] = ((t1 + w[i - 7]) | 0) + ((t2 + w[i - 16]) | 0);
            }
            const t1 = ((((((s4 >>> 6) | (s4 << 26)) ^ ((s4 >>> 11) | (s4 << 21)) ^ ((s4 >>> 25) | (s4 << 7))) +
                ((s4 & s5) ^ (~s4 & s6))) |
                0) +
                ((s7 + ((K[i] + w[i]) | 0)) | 0)) |
                0;
            const t2 = ((((s0 >>> 2) | (s0 << 30)) ^ ((s0 >>> 13) | (s0 << 19)) ^ ((s0 >>> 22) | (s0 << 10))) +
                ((s0 & s1) ^ (s0 & s2) ^ (s1 & s2))) |
                0;
            s7 = s6;
            s6 = s5;
            s5 = s4;
            s4 = (s3 + t1) | 0;
            s3 = s2;
            s2 = s1;
            s1 = s0;
            s0 = (t1 + t2) | 0;
        }
        state[0] += s0;
        state[1] += s1;
        state[2] += s2;
        state[3] += s3;
        state[4] += s4;
        state[5] += s5;
        state[6] += s6;
        state[7] += s7;
    }
}
const INIT = new Int32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);
const K = new Int32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const { digest, sign, importKey } = globalThis?.crypto?.subtle ?? {};
const subtle = typeof digest === "function" && typeof sign === "function" && typeof importKey === "function"
    ? globalThis.crypto.subtle
    : undefined;
const MAX_PENDING_BYTES = 8 * 1024 * 1024;
class Sha256WebCrypto {
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

const no = Symbol.for("node-only");
const fileStreamHasher = no;
const readableStreamHasher = no;
const Md5Node = no;
const Crc32Node = no;
const Sha256Node = no;

exports.Crc32 = Crc32Js;
exports.Crc32Js = Crc32Js;
exports.Crc32Node = Crc32Node;
exports.Md5 = Md5Js;
exports.Md5Js = Md5Js;
exports.Md5Node = Md5Node;
exports.Sha256 = Sha256WebCrypto;
exports.Sha256Js = Sha256Js;
exports.Sha256Node = Sha256Node;
exports.Sha256WebCrypto = Sha256WebCrypto;
exports.blobHasher = blobHasher;
exports.blobReader = blobReader;
exports.fileStreamHasher = fileStreamHasher;
exports.readableStreamHasher = readableStreamHasher;
