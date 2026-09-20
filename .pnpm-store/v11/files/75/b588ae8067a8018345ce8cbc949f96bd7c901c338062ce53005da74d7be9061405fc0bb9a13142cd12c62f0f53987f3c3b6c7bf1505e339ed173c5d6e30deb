/**
 * @internal
 */
export type GetRandomValues = (array: Uint8Array) => Uint8Array;
/**
 * Creates a RFC4122 version 4 UUID generator.
 *
 * Uses the native crypto.randomUUID() if available, otherwise falls back
 * to a manual implementation using the provided getRandomValues function.
 *
 * The fallback implementation:
 * - Generates 16 random bytes using getRandomValues()
 * - Sets the version bits to indicate version 4
 * - Sets the variant bits to indicate RFC4122
 * - Formats the bytes as a UUID string with dashes
 *
 * @param getRandomValues - platform-specific random byte source.
 * @returns A function that generates version 4 UUID strings
 * in the format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * where x is any hexadecimal digit and y is one of 8, 9, a, or b.
 *
 * @internal
 */
export declare function bindV4(getRandomValues: GetRandomValues): () => string;
