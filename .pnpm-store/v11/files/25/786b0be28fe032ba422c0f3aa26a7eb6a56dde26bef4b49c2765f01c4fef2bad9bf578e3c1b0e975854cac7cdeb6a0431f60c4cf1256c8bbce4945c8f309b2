declare class ExtendableError extends Error {
    constructor(message: any);
}
export declare class WebhookVerificationError extends ExtendableError {
    constructor(message: string);
}
export interface WebhookUnbrandedRequiredHeaders {
    "webhook-id": string;
    "webhook-timestamp": string;
    "webhook-signature": string;
}
export interface WebhookOptions {
    format?: "raw";
}
export interface VerifyOptions {
    jsonParse?: boolean;
}
export declare class Webhook {
    private static prefix;
    private readonly key;
    constructor(secret: string | Uint8Array, options?: WebhookOptions);
    verify(payload: string | Buffer, headers: WebhookUnbrandedRequiredHeaders | Record<string, string>, options?: VerifyOptions): unknown;
    sign(msgId: string, timestamp: Date, payload: string | Buffer): string;
    private verifyTimestamp;
}
export {};
