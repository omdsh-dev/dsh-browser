var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var digest_exports = {};
__export(digest_exports, {
  generateDigest: () => generateDigest
});
module.exports = __toCommonJS(digest_exports);
const mergeBuffers = (buffer1, buffer2) => {
  if (!buffer1) {
    return buffer2;
  }
  const merged = new Uint8Array(
    new ArrayBuffer(buffer1.byteLength + buffer2.byteLength)
  );
  merged.set(new Uint8Array(buffer1), 0);
  merged.set(buffer2, buffer1.byteLength);
  return merged;
};
const CHUNK_SIZE = 256 * 1024;
const generateDigest = async (stream, generator) => {
  if (!stream) {
    return null;
  }
  let result = void 0;
  let chunk;
  let chunkLength = 0;
  const digest = async (body) => {
    result = await generator(mergeBuffers(result, body));
  };
  const reader = stream.getReader();
  for (; ; ) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    let offset = 0;
    while (offset < value.byteLength) {
      const remaining = value.byteLength - offset;
      if (chunkLength === 0 && remaining >= CHUNK_SIZE) {
        await digest(value.subarray(offset, offset + CHUNK_SIZE));
        offset += CHUNK_SIZE;
        continue;
      }
      const requiredLength = chunkLength + remaining;
      if (requiredLength < CHUNK_SIZE) {
        if (!chunk) {
          chunk = value.slice(offset);
        } else {
          if (chunk.byteLength < requiredLength) {
            const nextChunk = new Uint8Array(
              new ArrayBuffer(Math.min(CHUNK_SIZE, Math.max(requiredLength, chunk.byteLength * 2)))
            );
            nextChunk.set(chunk.subarray(0, chunkLength));
            chunk = nextChunk;
          }
          chunk.set(value.subarray(offset), chunkLength);
        }
        chunkLength = requiredLength;
        break;
      }
      const length = CHUNK_SIZE - chunkLength;
      if (chunk?.byteLength !== CHUNK_SIZE) {
        const nextChunk = new Uint8Array(new ArrayBuffer(CHUNK_SIZE));
        if (chunk) {
          nextChunk.set(chunk.subarray(0, chunkLength));
        }
        chunk = nextChunk;
      }
      chunk.set(value.subarray(offset, offset + length), chunkLength);
      await digest(chunk);
      chunkLength = 0;
      offset += length;
    }
  }
  if (chunk && chunkLength > 0) {
    await digest(chunk.subarray(0, chunkLength));
  }
  if (!result) {
    return null;
  }
  return Array.prototype.map.call(new Uint8Array(result), (x) => x.toString(16).padStart(2, "0")).join("");
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateDigest
});
