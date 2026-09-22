import { advanceDecodingEpoch, decode, setPayload } from "./cbor-decode";
import { advanceEncodingEpoch, encode, resize, toUint8Array } from "./cbor-encode";
export const cbor = {
    deserialize(payload) {
        advanceDecodingEpoch();
        setPayload(payload);
        return decode(0, payload.length);
    },
    serialize(input) {
        advanceEncodingEpoch();
        try {
            encode(input);
            return toUint8Array();
        }
        catch (e) {
            toUint8Array();
            throw e;
        }
    },
    resizeEncodingBuffer(size) {
        resize(size);
    },
};
