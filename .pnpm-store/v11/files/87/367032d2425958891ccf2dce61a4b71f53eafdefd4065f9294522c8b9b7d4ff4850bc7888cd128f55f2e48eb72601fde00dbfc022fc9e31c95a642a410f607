type HeaderValue = string | undefined | null;
export type HeadersLike = Headers | readonly HeaderValue[][] | Record<string, HeaderValue | readonly HeaderValue[]> | undefined | null | NullableHeaders;
declare const brand_privateNullableHeaders: symbol & {
    description: "brand.privateNullableHeaders";
};
/**
 * @internal
 * Users can pass explicit nulls to unset default headers. When we parse them
 * into a standard headers type we need to preserve that information.
 */
export type NullableHeaders = {
    /** Brand check, prevent users from creating a NullableHeaders. */
    [_: typeof brand_privateNullableHeaders]: true;
    /** Parsed headers. */
    values: Headers;
    /** Set of lowercase header names explicitly set to null. */
    nulls: Set<string>;
};
/**
 * Headers whose values accumulate across {@link buildHeaders} sources instead
 * of the later source's value replacing the earlier one. Values are
 * comma-appended (deduplicated, order-preserving) into a single header line.
 */
export declare const APPEND_HEADERS: ReadonlySet<string>;
export declare const appendHeaderValue: (existing: string | null, addition: string) => string;
export declare const buildHeaders: (newHeaders: HeadersLike[]) => NullableHeaders;
export declare const isEmptyHeaders: (headers: HeadersLike) => boolean;
export {};
//# sourceMappingURL=headers.d.ts.map