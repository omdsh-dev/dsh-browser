const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; ++i) {
    let c = i;
    for (let j = 0; j < 8; ++j) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    CRC32_TABLE[i] = c >>> 0;
}
const ONES = 0xffff_ffff;
export class Crc32Js {
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
