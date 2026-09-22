import { HttpRequest } from "@smithy/core/transport";
import type { SerdeContext } from "@smithy/types";
/**
 * used in code-generated serde.
 *
 * @internal
 */
export declare function requestBuilder(input: any, context: SerdeContext): RequestBuilder;
/**
 * @internal
 */
export declare class RequestBuilder {
    private input;
    private context;
    private query;
    private method;
    private headers;
    private path;
    private body;
    private hostname;
    private resolvePathStack;
    constructor(input: any, context: SerdeContext);
    build(): Promise<HttpRequest>;
    /**
     * Brevity setter for "hostname".
     */
    hn(hostname: string): this;
    /**
     * Brevity initial builder for "basepath".
     */
    bp(uriLabel: string): this;
    /**
     * Brevity incremental builder for "path".
     */
    p(memberName: string, labelValueProvider: () => string | undefined, uriLabel: string, isGreedyLabel: boolean): this;
    /**
     * Brevity setter for "headers".
     */
    h(headers: Record<string, string>): this;
    /**
     * Brevity setter for "query".
     */
    q(query: Record<string, string>): this;
    /**
     * Brevity setter for "body".
     */
    b(body: any): this;
    /**
     * Brevity setter for "method".
     */
    m(method: string): this;
}
