const decimalToHex = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
export function bindV4(getRandomValues) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return () => crypto.randomUUID();
    }
    return () => {
        const rnds = new Uint8Array(16);
        getRandomValues(rnds);
        rnds[6] = (rnds[6] & 0x0f) | 0x40;
        rnds[8] = (rnds[8] & 0x3f) | 0x80;
        return (decimalToHex[rnds[0]] +
            decimalToHex[rnds[1]] +
            decimalToHex[rnds[2]] +
            decimalToHex[rnds[3]] +
            "-" +
            decimalToHex[rnds[4]] +
            decimalToHex[rnds[5]] +
            "-" +
            decimalToHex[rnds[6]] +
            decimalToHex[rnds[7]] +
            "-" +
            decimalToHex[rnds[8]] +
            decimalToHex[rnds[9]] +
            "-" +
            decimalToHex[rnds[10]] +
            decimalToHex[rnds[11]] +
            decimalToHex[rnds[12]] +
            decimalToHex[rnds[13]] +
            decimalToHex[rnds[14]] +
            decimalToHex[rnds[15]]);
    };
}
