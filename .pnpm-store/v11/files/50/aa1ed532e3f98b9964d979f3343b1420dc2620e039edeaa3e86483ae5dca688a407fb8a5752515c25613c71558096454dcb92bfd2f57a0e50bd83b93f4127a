import { type BaseAnthropic } from "../../client.mjs";
import { RequestOptions } from "../request-options.mjs";
type LogFn = (message: string, ...rest: unknown[]) => void;
export type Logger = {
    error: LogFn;
    warn: LogFn;
    info: LogFn;
    debug: LogFn;
};
export type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug';
export declare const defaultLogLevel: LogLevel;
export declare const parseLogLevel: (maybeLevel: string | undefined, sourceName: string, logger: Logger) => LogLevel | undefined;
export declare function loggerFor(client: BaseAnthropic): Logger;
/**
 * A logger matching the client defaults — `console`, filtered to
 * `ANTHROPIC_LOG` or {@link defaultLogLevel} — for contexts with no client to
 * read the configured `logger`/`logLevel` from.
 *
 * Cached per `ANTHROPIC_LOG` value so an invalid value warns once, like a
 * client construction does, rather than on every request.
 */
export declare function defaultLogger(): Logger;
export declare const formatRequestDetails: (details: {
    options?: RequestOptions | undefined;
    headers?: Headers | Record<string, string> | undefined;
    retryOfRequestLogID?: string | undefined;
    retryOf?: string | undefined;
    url?: string | undefined;
    status?: number | undefined;
    method?: string | undefined;
    durationMs?: number | undefined;
    message?: unknown;
    body?: unknown;
}) => {
    options?: RequestOptions | undefined;
    headers?: Headers | Record<string, string> | undefined;
    retryOfRequestLogID?: string | undefined;
    retryOf?: string | undefined;
    url?: string | undefined;
    status?: number | undefined;
    method?: string | undefined;
    durationMs?: number | undefined;
    message?: unknown;
    body?: unknown;
};
export {};
//# sourceMappingURL=log.d.mts.map