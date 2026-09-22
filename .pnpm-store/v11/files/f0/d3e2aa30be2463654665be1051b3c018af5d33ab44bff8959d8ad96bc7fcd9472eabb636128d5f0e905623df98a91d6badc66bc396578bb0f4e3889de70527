import { Readable } from "node:stream";
export const isStreamingPayload = (request) => request?.body instanceof Readable ||
    (typeof ReadableStream !== "undefined" && request?.body instanceof ReadableStream);
