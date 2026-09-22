// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { hasOwn } from "./values.mjs";
import { readEnv } from "./env.mjs";
export const defaultLogLevel = 'warn';
const levelNumbers = {
    off: 0,
    error: 200,
    warn: 300,
    info: 400,
    debug: 500,
};
export const parseLogLevel = (maybeLevel, sourceName, logger) => {
    if (!maybeLevel) {
        return undefined;
    }
    if (hasOwn(levelNumbers, maybeLevel)) {
        return maybeLevel;
    }
    logger.warn(`${sourceName} was set to ${JSON.stringify(maybeLevel)}, expected one of ${JSON.stringify(Object.keys(levelNumbers))}`);
    return undefined;
};
function noop() { }
function makeLogFn(fnLevel, logger, logLevel) {
    if (!logger || levelNumbers[fnLevel] > levelNumbers[logLevel]) {
        return noop;
    }
    else {
        // Don't wrap logger functions, we want the stacktrace intact!
        return logger[fnLevel].bind(logger);
    }
}
const noopLogger = {
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
};
let cachedLoggers = /* @__PURE__ */ new WeakMap();
function filterLogger(logger, logLevel) {
    const cachedLogger = cachedLoggers.get(logger);
    if (cachedLogger && cachedLogger[0] === logLevel) {
        return cachedLogger[1];
    }
    const levelLogger = {
        error: makeLogFn('error', logger, logLevel),
        warn: makeLogFn('warn', logger, logLevel),
        info: makeLogFn('info', logger, logLevel),
        debug: makeLogFn('debug', logger, logLevel),
    };
    cachedLoggers.set(logger, [logLevel, levelLogger]);
    return levelLogger;
}
export function loggerFor(client) {
    const logger = client.logger;
    const logLevel = client.logLevel ?? 'off';
    if (!logger) {
        return noopLogger;
    }
    return filterLogger(logger, logLevel);
}
let lastEnvLevel;
let cachedDefaultLogger;
/**
 * A logger matching the client defaults — `console`, filtered to
 * `ANTHROPIC_LOG` or {@link defaultLogLevel} — for contexts with no client to
 * read the configured `logger`/`logLevel` from.
 *
 * Cached per `ANTHROPIC_LOG` value so an invalid value warns once, like a
 * client construction does, rather than on every request.
 */
export function defaultLogger() {
    const envLevel = readEnv('ANTHROPIC_LOG');
    if (!cachedDefaultLogger || envLevel !== lastEnvLevel) {
        lastEnvLevel = envLevel;
        cachedDefaultLogger = filterLogger(console, parseLogLevel(envLevel, "process.env['ANTHROPIC_LOG']", filterLogger(console, defaultLogLevel)) ??
            defaultLogLevel);
    }
    return cachedDefaultLogger;
}
export const formatRequestDetails = (details) => {
    if (details.options) {
        details.options = { ...details.options };
        delete details.options['headers']; // redundant + leaks internals
    }
    if (details.headers) {
        details.headers = Object.fromEntries((details.headers instanceof Headers ? [...details.headers] : Object.entries(details.headers)).map(([name, value]) => [
            name,
            (name.toLowerCase() === 'authorization' ||
                name.toLowerCase() === 'api-key' ||
                name.toLowerCase() === 'x-api-key' ||
                name.toLowerCase() === 'cookie' ||
                name.toLowerCase() === 'set-cookie') ?
                '***'
                : value,
        ]));
    }
    if ('retryOfRequestLogID' in details) {
        if (details.retryOfRequestLogID) {
            details.retryOf = details.retryOfRequestLogID;
        }
        delete details.retryOfRequestLogID;
    }
    return details;
};
//# sourceMappingURL=log.mjs.map