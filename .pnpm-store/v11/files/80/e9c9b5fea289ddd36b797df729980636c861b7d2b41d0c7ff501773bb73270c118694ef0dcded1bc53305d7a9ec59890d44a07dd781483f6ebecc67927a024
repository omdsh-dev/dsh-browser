// Copyright (C) 2016 Dmitry Chestnykh
// MIT License. See LICENSE file for details.

import { encode, decode, encodeURLSafe, decodeURLSafe } from "./base64";

const testVectors: [number[], string][] = [
    // https://tools.ietf.org/html/rfc4648
    [[], ""],
    [[102], "Zg=="],
    [[102, 111], "Zm8="],
    [[102, 111, 111], "Zm9v"],
    [[102, 111, 111, 98], "Zm9vYg=="],
    [[102, 111, 111, 98, 97], "Zm9vYmE="],
    [[102, 111, 111, 98, 97, 114], "Zm9vYmFy"],
    // "hello world"
    [[104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100], "aGVsbG8gd29ybGQ="],
    // zeros
    [[0], "AA=="],
    [[0, 0], "AAA="],
    [[0, 0, 0], "AAAA"],
    [[0, 0, 0, 0], "AAAAAA=="],
    [[0, 0, 0, 0, 0], "AAAAAAA="],
    [[0, 0, 0, 0, 0, 0], "AAAAAAAA"],
    // random
    [
        [111, 16, 164, 40, 38, 216, 61, 120, 247, 118, 115, 82, 77, 65, 170, 155],
        "bxCkKCbYPXj3dnNSTUGqmw=="
    ],
    [
        [216, 8, 213, 125, 61, 133, 254, 192, 132, 229, 47, 151, 14, 63, 142, 230, 59, 143, 232, 228],
        "2AjVfT2F/sCE5S+XDj+O5juP6OQ="
    ]
];

const badVectors = [
    "=",
    "==",
    "Zg===",
    "AAA",
    "=Zm8",
    "что"
];

describe("Base64", () => {
    it("should correctly encode test vectors", () => {
        testVectors.forEach((v) => {
            const input = new Uint8Array(v[0] as Array<number>);
            expect(encode(input)).toBe(v[1]);
        });
    });
    it("should correctly decode test vectors", () => {
        testVectors.forEach((v) => {
            const output = new Uint8Array(v[0] as Array<number>);
            expect(decode(v[1] as string).toString()).toBe(output.toString());
        });
    });
    it("should throw when decoding incorrect strings", () => {
        badVectors.forEach((v) => {
            expect(() => decode(v)).toThrow();
        });
    });
});

describe("Base64 URL-safe", () => {
    // Converts strings from standard to URL-safe encoding.
    const urlSafe = (s: string) => s.replace(/\+/g, "-").replace(/\//g, "_");

    it("should correctly encode test vectors", () => {
        testVectors.forEach((v) => {
            const input = new Uint8Array(v[0] as Array<number>);
            expect(encodeURLSafe(input)).toBe(urlSafe(v[1] as string));
        });
    });
    it("should correctly decode test vectors", () => {
        testVectors.forEach((v) => {
            const output = new Uint8Array(v[0] as Array<number>);
            expect(decodeURLSafe(urlSafe(v[1] as string)).toString()).toBe(output.toString());
        });
    });
    it("should throw when decoding incorrect strings", () => {
        badVectors.forEach((v) => {
            expect(() => decodeURLSafe(urlSafe(v))).toThrow();
        });
    });
});
