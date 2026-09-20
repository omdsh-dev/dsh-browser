"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timingSafeEqual = timingSafeEqual;
function assert(expr, msg = "") {
    if (!expr) {
        throw new Error(msg);
    }
}
function timingSafeEqual(a, b) {
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    if (!(a instanceof DataView)) {
        a = new DataView(ArrayBuffer.isView(a) ? a.buffer : a);
    }
    if (!(b instanceof DataView)) {
        b = new DataView(ArrayBuffer.isView(b) ? b.buffer : b);
    }
    assert(a instanceof DataView);
    assert(b instanceof DataView);
    const length = a.byteLength;
    let out = 0;
    let i = -1;
    while (++i < length) {
        out |= a.getUint8(i) ^ b.getUint8(i);
    }
    return out === 0;
}
//# sourceMappingURL=timing_safe_equal.js.map