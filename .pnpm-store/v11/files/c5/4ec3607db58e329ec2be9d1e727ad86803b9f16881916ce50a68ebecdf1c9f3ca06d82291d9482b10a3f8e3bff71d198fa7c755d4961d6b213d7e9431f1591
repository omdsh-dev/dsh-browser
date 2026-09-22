"use strict";
// Copyright (C) 2016 Dmitry Chestnykh
// MIT License. See LICENSE file for details.
Object.defineProperty(exports, "__esModule", { value: true });
var base64_1 = require("./base64");
var benchmark_1 = require("@stablelib/benchmark");
var buf = benchmark_1.byteSeq(1024);
var encBuf = base64_1.encode(buf);
benchmark_1.report("Base64 encode", benchmark_1.benchmark(function () { return base64_1.encode(buf); }, buf.length));
// Decode benchmark reports MiB/s for decoded MiB, not input.
benchmark_1.report("Base64 decode", benchmark_1.benchmark(function () { return base64_1.decode(encBuf); }, buf.length));
if (typeof Buffer !== "undefined") {
    // For comparison with Node.js buffer speed.
    var nodeBuf_1 = Buffer.from(buf);
    var nodeEncBuf_1 = nodeBuf_1.toString("base64");
    benchmark_1.report("Buffer - Base64 encode", benchmark_1.benchmark(function () {
        return nodeBuf_1.toString("base64");
    }, nodeBuf_1.length));
    benchmark_1.report("Buffer - Base64 decode", benchmark_1.benchmark(function () {
        return Buffer.from(nodeEncBuf_1, "base64");
    }, nodeBuf_1.length));
}
//# sourceMappingURL=base64.bench.js.map