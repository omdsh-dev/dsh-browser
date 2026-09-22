// Copyright (C) 2016 Dmitry Chestnykh
// MIT License. See LICENSE file for details.

import { encode, decode } from "./base64";
import { benchmark, report, byteSeq } from "@stablelib/benchmark";

let buf = byteSeq(1024);
const encBuf = encode(buf);

report("Base64 encode", benchmark(() => encode(buf), buf.length));
// Decode benchmark reports MiB/s for decoded MiB, not input.
report("Base64 decode", benchmark(() => decode(encBuf), buf.length));

declare var Buffer: any;

if (typeof Buffer !== "undefined") {
    // For comparison with Node.js buffer speed.
    const nodeBuf = Buffer.from(buf);
    const nodeEncBuf = nodeBuf.toString("base64");

    report("Buffer - Base64 encode", benchmark(() =>
        nodeBuf.toString("base64"), nodeBuf.length));
    report("Buffer - Base64 decode", benchmark(() =>
        Buffer.from(nodeEncBuf, "base64"), nodeBuf.length));
}
