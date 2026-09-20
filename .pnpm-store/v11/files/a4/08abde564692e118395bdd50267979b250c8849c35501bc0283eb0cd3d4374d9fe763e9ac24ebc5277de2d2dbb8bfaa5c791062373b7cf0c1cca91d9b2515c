const { createHmac, createHash, getRandomValues } = require("node:crypto");
const { ReadStream, lstatSync, fstatSync } = require("node:fs");
const { HttpResponse } = require("@smithy/core/transport");
const { toEndpointV1 } = require("@smithy/core/endpoints");
const { Readable, Writable, PassThrough } = require("node:stream");

const isArrayBuffer = (arg) => (typeof ArrayBuffer === "function" && arg instanceof ArrayBuffer) ||
    Object.prototype.toString.call(arg) === "[object ArrayBuffer]";

const fromArrayBuffer = (input, offset = 0, length = input.byteLength - offset) => {
    if (!isArrayBuffer(input)) {
        throw new TypeError(`The "input" argument must be ArrayBuffer. Received type ${typeof input} (${input})`);
    }
    return Buffer.from(input, offset, length);
};
const fromString = (input, encoding) => {
    if (typeof input !== "string") {
        throw new TypeError(`The "input" argument must be of type string. Received type ${typeof input} (${input})`);
    }
    return encoding ? Buffer.from(input, encoding) : Buffer.from(input);
};

const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
const fromBase64 = (input) => {
    if ((input.length * 3) % 4 !== 0) {
        throw new TypeError(`Incorrect padding on base64 string.`);
    }
    if (!BASE64_REGEX.exec(input)) {
        throw new TypeError(`Invalid base64 string.`);
    }
    const buffer = fromString(input, "base64");
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
};

const fromUtf8$1 = (input) => {
    const buf = fromString(input, "utf8");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength / Uint8Array.BYTES_PER_ELEMENT);
};

const toBase64$1 = (_input) => {
    let input;
    if (typeof _input === "string") {
        input = fromUtf8$1(_input);
    }
    else {
        input = _input;
    }
    if (typeof input !== "object" || typeof input.byteOffset !== "number" || typeof input.byteLength !== "number") {
        throw new Error("@smithy/util-base64: toBase64 encoder function only accepts string | Uint8Array.");
    }
    return fromArrayBuffer(input.buffer, input.byteOffset, input.byteLength).toString("base64");
};

function bindUint8ArrayBlobAdapter(toUtf8, fromUtf8, toBase64, fromBase64) {
    return class Uint8ArrayBlobAdapter extends Uint8Array {
        static fromString(source, encoding = "utf-8") {
            if (typeof source === "string") {
                if (encoding === "base64") {
                    return Uint8ArrayBlobAdapter.mutate(fromBase64(source));
                }
                return Uint8ArrayBlobAdapter.mutate(fromUtf8(source));
            }
            throw new Error(`Unsupported conversion from ${typeof source} to Uint8ArrayBlobAdapter.`);
        }
        static mutate(source) {
            Object.setPrototypeOf(source, Uint8ArrayBlobAdapter.prototype);
            return source;
        }
        transformToString(encoding = "utf-8") {
            if (encoding === "base64") {
                return toBase64(this);
            }
            return toUtf8(this);
        }
    };
}

const toUtf8$1 = (input) => {
    if (typeof input === "string") {
        return input;
    }
    if (typeof input !== "object" || typeof input.byteOffset !== "number" || typeof input.byteLength !== "number") {
        throw new Error("@smithy/util-utf8: toUtf8 encoder function only accepts string | Uint8Array.");
    }
    return fromArrayBuffer(input.buffer, input.byteOffset, input.byteLength).toString("utf8");
};

const decimalToHex = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bindV4(getRandomValues) {
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

const copyDocumentWithTransform = (source, _schemaRef, _transform = (_) => _) => source;

const parseBoolean = (value) => {
    switch (value) {
        case "true":
            return true;
        case "false":
            return false;
        default:
            throw new Error(`Unable to parse boolean value "${value}"`);
    }
};
const expectBoolean = (value) => {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value === "number") {
        if (value === 0 || value === 1) {
            logger.warn(stackTraceWarning(`Expected boolean, got ${typeof value}: ${value}`));
        }
        if (value === 0) {
            return false;
        }
        if (value === 1) {
            return true;
        }
    }
    if (typeof value === "string") {
        const lower = value.toLowerCase();
        if (lower === "false" || lower === "true") {
            logger.warn(stackTraceWarning(`Expected boolean, got ${typeof value}: ${value}`));
        }
        if (lower === "false") {
            return false;
        }
        if (lower === "true") {
            return true;
        }
    }
    if (typeof value === "boolean") {
        return value;
    }
    throw new TypeError(`Expected boolean, got ${typeof value}: ${value}`);
};
const expectNumber = (value) => {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value === "string") {
        const parsed = parseFloat(value);
        if (!Number.isNaN(parsed)) {
            if (String(parsed) !== String(value)) {
                logger.warn(stackTraceWarning(`Expected number but observed string: ${value}`));
            }
            return parsed;
        }
    }
    if (typeof value === "number") {
        return value;
    }
    throw new TypeError(`Expected number, got ${typeof value}: ${value}`);
};
const MAX_FLOAT = Math.ceil(2 ** 127 * (2 - 2 ** -23));
const expectFloat32 = (value) => {
    const expected = expectNumber(value);
    if (expected !== undefined && !Number.isNaN(expected) && expected !== Infinity && expected !== -Infinity) {
        if (Math.abs(expected) > MAX_FLOAT) {
            throw new TypeError(`Expected 32-bit float, got ${value}`);
        }
    }
    return expected;
};
const expectLong = (value) => {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (Number.isInteger(value) && !Number.isNaN(value)) {
        return value;
    }
    throw new TypeError(`Expected integer, got ${typeof value}: ${value}`);
};
const expectInt = expectLong;
const expectInt32 = (value) => expectSizedInt(value, 32);
const expectShort = (value) => expectSizedInt(value, 16);
const expectByte = (value) => expectSizedInt(value, 8);
const expectSizedInt = (value, size) => {
    const expected = expectLong(value);
    if (expected !== undefined && castInt(expected, size) !== expected) {
        throw new TypeError(`Expected ${size}-bit integer, got ${value}`);
    }
    return expected;
};
const castInt = (value, size) => {
    switch (size) {
        case 32:
            return Int32Array.of(value)[0];
        case 16:
            return Int16Array.of(value)[0];
        case 8:
            return Int8Array.of(value)[0];
    }
};
const expectNonNull = (value, location) => {
    if (value === null || value === undefined) {
        if (location) {
            throw new TypeError(`Expected a non-null value for ${location}`);
        }
        throw new TypeError("Expected a non-null value");
    }
    return value;
};
const expectObject = (value) => {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    const receivedType = Array.isArray(value) ? "array" : typeof value;
    throw new TypeError(`Expected object, got ${receivedType}: ${value}`);
};
const expectString = (value) => {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value === "string") {
        return value;
    }
    if (["boolean", "number", "bigint"].includes(typeof value)) {
        logger.warn(stackTraceWarning(`Expected string, got ${typeof value}: ${value}`));
        return String(value);
    }
    throw new TypeError(`Expected string, got ${typeof value}: ${value}`);
};
const expectUnion = (value) => {
    if (value === null || value === undefined) {
        return undefined;
    }
    const asObject = expectObject(value);
    const setKeys = [];
    for (const k in asObject) {
        if (asObject[k] != null) {
            setKeys.push(k);
        }
    }
    if (setKeys.length === 0) {
        throw new TypeError(`Unions must have exactly one non-null member. None were found.`);
    }
    if (setKeys.length > 1) {
        throw new TypeError(`Unions must have exactly one non-null member. Keys ${setKeys} were not null.`);
    }
    return asObject;
};
const strictParseDouble = (value) => {
    if (typeof value == "string") {
        return expectNumber(parseNumber(value));
    }
    return expectNumber(value);
};
const strictParseFloat = strictParseDouble;
const strictParseFloat32 = (value) => {
    if (typeof value == "string") {
        return expectFloat32(parseNumber(value));
    }
    return expectFloat32(value);
};
const NUMBER_REGEX = /(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)|(-?Infinity)|(NaN)/g;
const parseNumber = (value) => {
    const matches = value.match(NUMBER_REGEX);
    if (matches === null || matches[0].length !== value.length) {
        throw new TypeError(`Expected real number, got implicit NaN`);
    }
    return parseFloat(value);
};
const limitedParseDouble = (value) => {
    if (typeof value == "string") {
        return parseFloatString(value);
    }
    return expectNumber(value);
};
const handleFloat = limitedParseDouble;
const limitedParseFloat = limitedParseDouble;
const limitedParseFloat32 = (value) => {
    if (typeof value == "string") {
        return parseFloatString(value);
    }
    return expectFloat32(value);
};
const parseFloatString = (value) => {
    switch (value) {
        case "NaN":
            return NaN;
        case "Infinity":
            return Infinity;
        case "-Infinity":
            return -Infinity;
        default:
            throw new Error(`Unable to parse float value: ${value}`);
    }
};
const strictParseLong = (value) => {
    if (typeof value === "string") {
        return expectLong(parseNumber(value));
    }
    return expectLong(value);
};
const strictParseInt = strictParseLong;
const strictParseInt32 = (value) => {
    if (typeof value === "string") {
        return expectInt32(parseNumber(value));
    }
    return expectInt32(value);
};
const strictParseShort = (value) => {
    if (typeof value === "string") {
        return expectShort(parseNumber(value));
    }
    return expectShort(value);
};
const strictParseByte = (value) => {
    if (typeof value === "string") {
        return expectByte(parseNumber(value));
    }
    return expectByte(value);
};
const stackTraceWarning = (message) => {
    return String(new TypeError(message).stack || message)
        .split("\n")
        .slice(0, 5)
        .filter((s) => !s.includes("stackTraceWarning"))
        .join("\n");
};
const logger = {
    warn: console.warn,
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dateToUtcString(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const dayOfWeek = date.getUTCDay();
    const dayOfMonthInt = date.getUTCDate();
    const hoursInt = date.getUTCHours();
    const minutesInt = date.getUTCMinutes();
    const secondsInt = date.getUTCSeconds();
    const dayOfMonthString = dayOfMonthInt < 10 ? `0${dayOfMonthInt}` : `${dayOfMonthInt}`;
    const hoursString = hoursInt < 10 ? `0${hoursInt}` : `${hoursInt}`;
    const minutesString = minutesInt < 10 ? `0${minutesInt}` : `${minutesInt}`;
    const secondsString = secondsInt < 10 ? `0${secondsInt}` : `${secondsInt}`;
    return `${DAYS[dayOfWeek]}, ${dayOfMonthString} ${MONTHS[month]} ${year} ${hoursString}:${minutesString}:${secondsString} GMT`;
}
const RFC3339 = new RegExp(/^(\d{4})-(\d{2})-(\d{2})[tT](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?[zZ]$/);
const parseRfc3339DateTime = (value) => {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new TypeError("RFC-3339 date-times must be expressed as strings");
    }
    const match = RFC3339.exec(value);
    if (!match) {
        throw new TypeError("Invalid RFC-3339 date-time value");
    }
    const [_, yearStr, monthStr, dayStr, hours, minutes, seconds, fractionalMilliseconds] = match;
    const year = strictParseShort(stripLeadingZeroes(yearStr));
    const month = parseDateValue(monthStr, "month", 1, 12);
    const day = parseDateValue(dayStr, "day", 1, 31);
    return buildDate(year, month, day, { hours, minutes, seconds, fractionalMilliseconds });
};
const RFC3339_WITH_OFFSET$1 = new RegExp(/^(\d{4})-(\d{2})-(\d{2})[tT](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(([-+]\d{2}:\d{2})|[zZ])$/);
const parseRfc3339DateTimeWithOffset = (value) => {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new TypeError("RFC-3339 date-times must be expressed as strings");
    }
    const match = RFC3339_WITH_OFFSET$1.exec(value);
    if (!match) {
        throw new TypeError("Invalid RFC-3339 date-time value");
    }
    const [_, yearStr, monthStr, dayStr, hours, minutes, seconds, fractionalMilliseconds, offsetStr] = match;
    const year = strictParseShort(stripLeadingZeroes(yearStr));
    const month = parseDateValue(monthStr, "month", 1, 12);
    const day = parseDateValue(dayStr, "day", 1, 31);
    const date = buildDate(year, month, day, { hours, minutes, seconds, fractionalMilliseconds });
    if (offsetStr.toUpperCase() != "Z") {
        date.setTime(date.getTime() - parseOffsetToMilliseconds(offsetStr));
    }
    return date;
};
const IMF_FIXDATE$1 = new RegExp(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))? GMT$/);
const RFC_850_DATE$1 = new RegExp(/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2}) (\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))? GMT$/);
const ASC_TIME$1 = new RegExp(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( [1-9]|\d{2}) (\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))? (\d{4})$/);
const parseRfc7231DateTime = (value) => {
    if (value === null || value === undefined) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new TypeError("RFC-7231 date-times must be expressed as strings");
    }
    let match = IMF_FIXDATE$1.exec(value);
    if (match) {
        const [_, dayStr, monthStr, yearStr, hours, minutes, seconds, fractionalMilliseconds] = match;
        return buildDate(strictParseShort(stripLeadingZeroes(yearStr)), parseMonthByShortName(monthStr), parseDateValue(dayStr, "day", 1, 31), { hours, minutes, seconds, fractionalMilliseconds });
    }
    match = RFC_850_DATE$1.exec(value);
    if (match) {
        const [_, dayStr, monthStr, yearStr, hours, minutes, seconds, fractionalMilliseconds] = match;
        return adjustRfc850Year(buildDate(parseTwoDigitYear(yearStr), parseMonthByShortName(monthStr), parseDateValue(dayStr, "day", 1, 31), {
            hours,
            minutes,
            seconds,
            fractionalMilliseconds,
        }));
    }
    match = ASC_TIME$1.exec(value);
    if (match) {
        const [_, monthStr, dayStr, hours, minutes, seconds, fractionalMilliseconds, yearStr] = match;
        return buildDate(strictParseShort(stripLeadingZeroes(yearStr)), parseMonthByShortName(monthStr), parseDateValue(dayStr.trimLeft(), "day", 1, 31), { hours, minutes, seconds, fractionalMilliseconds });
    }
    throw new TypeError("Invalid RFC-7231 date-time value");
};
const parseEpochTimestamp = (value) => {
    if (value === null || value === undefined) {
        return undefined;
    }
    let valueAsDouble;
    if (typeof value === "number") {
        valueAsDouble = value;
    }
    else if (typeof value === "string") {
        valueAsDouble = strictParseDouble(value);
    }
    else if (typeof value === "object" && value.tag === 1) {
        valueAsDouble = value.value;
    }
    else {
        throw new TypeError("Epoch timestamps must be expressed as floating point numbers or their string representation");
    }
    if (Number.isNaN(valueAsDouble) || valueAsDouble === Infinity || valueAsDouble === -Infinity) {
        throw new TypeError("Epoch timestamps must be valid, non-Infinite, non-NaN numerics");
    }
    return new Date(Math.round(valueAsDouble * 1000));
};
const buildDate = (year, month, day, time) => {
    const adjustedMonth = month - 1;
    validateDayOfMonth(year, adjustedMonth, day);
    return new Date(Date.UTC(year, adjustedMonth, day, parseDateValue(time.hours, "hour", 0, 23), parseDateValue(time.minutes, "minute", 0, 59), parseDateValue(time.seconds, "seconds", 0, 60), parseMilliseconds(time.fractionalMilliseconds)));
};
const parseTwoDigitYear = (value) => {
    const thisYear = new Date().getUTCFullYear();
    const valueInThisCentury = Math.floor(thisYear / 100) * 100 + strictParseShort(stripLeadingZeroes(value));
    if (valueInThisCentury < thisYear) {
        return valueInThisCentury + 100;
    }
    return valueInThisCentury;
};
const FIFTY_YEARS_IN_MILLIS = 50 * 365 * 24 * 60 * 60 * 1000;
const adjustRfc850Year = (input) => {
    if (input.getTime() - new Date().getTime() > FIFTY_YEARS_IN_MILLIS) {
        return new Date(Date.UTC(input.getUTCFullYear() - 100, input.getUTCMonth(), input.getUTCDate(), input.getUTCHours(), input.getUTCMinutes(), input.getUTCSeconds(), input.getUTCMilliseconds()));
    }
    return input;
};
const parseMonthByShortName = (value) => {
    const monthIdx = MONTHS.indexOf(value);
    if (monthIdx < 0) {
        throw new TypeError(`Invalid month: ${value}`);
    }
    return monthIdx + 1;
};
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const validateDayOfMonth = (year, month, day) => {
    let maxDays = DAYS_IN_MONTH[month];
    if (month === 1 && isLeapYear(year)) {
        maxDays = 29;
    }
    if (day > maxDays) {
        throw new TypeError(`Invalid day for ${MONTHS[month]} in ${year}: ${day}`);
    }
};
const isLeapYear = (year) => {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
};
const parseDateValue = (value, type, lower, upper) => {
    const dateVal = strictParseByte(stripLeadingZeroes(value));
    if (dateVal < lower || dateVal > upper) {
        throw new TypeError(`${type} must be between ${lower} and ${upper}, inclusive`);
    }
    return dateVal;
};
const parseMilliseconds = (value) => {
    if (value === null || value === undefined) {
        return 0;
    }
    return strictParseFloat32("0." + value) * 1000;
};
const parseOffsetToMilliseconds = (value) => {
    const directionStr = value[0];
    let direction = 1;
    if (directionStr == "+") {
        direction = 1;
    }
    else if (directionStr == "-") {
        direction = -1;
    }
    else {
        throw new TypeError(`Offset direction, ${directionStr}, must be "+" or "-"`);
    }
    const hour = Number(value.substring(1, 3));
    const minute = Number(value.substring(4, 6));
    return direction * (hour * 60 + minute) * 60 * 1000;
};
const stripLeadingZeroes = (value) => {
    let idx = 0;
    while (idx < value.length - 1 && value.charAt(idx) === "0") {
        idx++;
    }
    if (idx === 0) {
        return value;
    }
    return value.slice(idx);
};

const LazyJsonString = function LazyJsonString(val) {
    const str = Object.assign(new String(val), {
        deserializeJSON() {
            return JSON.parse(String(val));
        },
        toString() {
            return String(val);
        },
        toJSON() {
            return String(val);
        },
    });
    return str;
};
LazyJsonString.from = (object) => {
    if (object && typeof object === "object" && (object instanceof LazyJsonString || "deserializeJSON" in object)) {
        return object;
    }
    else if (typeof object === "string" || Object.getPrototypeOf(object) === String.prototype) {
        return LazyJsonString(String(object));
    }
    return LazyJsonString(JSON.stringify(object));
};
LazyJsonString.fromObject = LazyJsonString.from;

function quoteHeader(part) {
    if (part.includes(",") || part.includes('"')) {
        part = `"${part.replace(/"/g, '\\"')}"`;
    }
    return part;
}

const ddd = `(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:[ne|u?r]?s?day)?`;
const mmm = `(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)`;
const time = `(\\d?\\d):(\\d{2}):(\\d{2})(?:\\.(\\d+))?`;
const date = `(\\d?\\d)`;
const year = `(\\d{4})`;
const RFC3339_WITH_OFFSET = new RegExp(/^(\d{4})-(\d\d)-(\d\d)[tT](\d\d):(\d\d):(\d\d)(\.(\d+))?(([-+]\d\d:\d\d)|[zZ])$/);
const IMF_FIXDATE = new RegExp(`^${ddd}, ${date} ${mmm} ${year} ${time} GMT$`);
const RFC_850_DATE = new RegExp(`^${ddd}, ${date}-${mmm}-(\\d\\d) ${time} GMT$`);
const ASC_TIME = new RegExp(`^${ddd} ${mmm} ( [1-9]|\\d\\d) ${time} ${year}$`);
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const _parseEpochTimestamp = (value) => {
    if (value == null) {
        return void 0;
    }
    let num = NaN;
    if (typeof value === "number") {
        num = value;
    }
    else if (typeof value === "string") {
        if (!/^-?\d*\.?\d+$/.test(value)) {
            throw new TypeError(`parseEpochTimestamp - numeric string invalid.`);
        }
        num = Number.parseFloat(value);
    }
    else if (typeof value === "object" && value.tag === 1) {
        num = value.value;
    }
    if (isNaN(num) || Math.abs(num) === Infinity) {
        throw new TypeError("Epoch timestamps must be valid finite numbers.");
    }
    return new Date(Math.round(num * 1000));
};
const _parseRfc3339DateTimeWithOffset = (value) => {
    if (value == null) {
        return void 0;
    }
    if (typeof value !== "string") {
        throw new TypeError("RFC3339 timestamps must be strings");
    }
    const matches = RFC3339_WITH_OFFSET.exec(value);
    if (!matches) {
        throw new TypeError(`Invalid RFC3339 timestamp format ${value}`);
    }
    const [, yearStr, monthStr, dayStr, hours, minutes, seconds, , ms, offsetStr] = matches;
    range(monthStr, 1, 12);
    range(dayStr, 1, 31);
    range(hours, 0, 23);
    range(minutes, 0, 59);
    range(seconds, 0, 60);
    const date = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr), Number(hours), Number(minutes), Number(seconds), Number(ms) ? Math.round(parseFloat(`0.${ms}`) * 1000) : 0));
    date.setUTCFullYear(Number(yearStr));
    if (offsetStr.toUpperCase() != "Z") {
        const [, sign, offsetH, offsetM] = /([+-])(\d\d):(\d\d)/.exec(offsetStr) || [void 0, "+", 0, 0];
        const scalar = sign === "-" ? 1 : -1;
        date.setTime(date.getTime() + scalar * (Number(offsetH) * 60 * 60 * 1000 + Number(offsetM) * 60 * 1000));
    }
    return date;
};
const _parseRfc7231DateTime = (value) => {
    if (value == null) {
        return void 0;
    }
    if (typeof value !== "string") {
        throw new TypeError("RFC7231 timestamps must be strings.");
    }
    let day;
    let month;
    let year;
    let hour;
    let minute;
    let second;
    let fraction;
    let matches;
    if ((matches = IMF_FIXDATE.exec(value))) {
        [, day, month, year, hour, minute, second, fraction] = matches;
    }
    else if ((matches = RFC_850_DATE.exec(value))) {
        [, day, month, year, hour, minute, second, fraction] = matches;
        year = (Number(year) + 1900).toString();
    }
    else if ((matches = ASC_TIME.exec(value))) {
        [, month, day, hour, minute, second, fraction, year] = matches;
    }
    if (year && second) {
        const timestamp = Date.UTC(Number(year), months.indexOf(month), Number(day), Number(hour), Number(minute), Number(second), fraction ? Math.round(parseFloat(`0.${fraction}`) * 1000) : 0);
        range(day, 1, 31);
        range(hour, 0, 23);
        range(minute, 0, 59);
        range(second, 0, 60);
        const date = new Date(timestamp);
        date.setUTCFullYear(Number(year));
        return date;
    }
    throw new TypeError(`Invalid RFC7231 date-time value ${value}.`);
};
function range(v, min, max) {
    const _v = Number(v);
    if (_v < min || _v > max) {
        throw new Error(`Value ${_v} out of range [${min}, ${max}]`);
    }
}

function splitEvery(value, delimiter, numDelimiters) {
    if (numDelimiters <= 0 || !Number.isInteger(numDelimiters)) {
        throw new Error("Invalid number of delimiters (" + numDelimiters + ") for splitEvery.");
    }
    const segments = value.split(delimiter);
    if (numDelimiters === 1) {
        return segments;
    }
    const compoundSegments = [];
    let currentSegment = "";
    for (let i = 0; i < segments.length; i++) {
        if (currentSegment === "") {
            currentSegment = segments[i];
        }
        else {
            currentSegment += delimiter + segments[i];
        }
        if ((i + 1) % numDelimiters === 0) {
            compoundSegments.push(currentSegment);
            currentSegment = "";
        }
    }
    if (currentSegment !== "") {
        compoundSegments.push(currentSegment);
    }
    return compoundSegments;
}

const splitHeader = (value) => {
    const z = value.length;
    const values = [];
    let withinQuotes = false;
    let prevChar = undefined;
    let anchor = 0;
    for (let i = 0; i < z; ++i) {
        const char = value[i];
        switch (char) {
            case `"`:
                if (prevChar !== "\\") {
                    withinQuotes = !withinQuotes;
                }
                break;
            case ",":
                if (!withinQuotes) {
                    values.push(value.slice(anchor, i));
                    anchor = i + 1;
                }
                break;
        }
        prevChar = char;
    }
    values.push(value.slice(anchor));
    return values.map((v) => {
        v = v.trim();
        const z = v.length;
        if (z < 2) {
            return v;
        }
        if (v[0] === `"` && v[z - 1] === `"`) {
            v = v.slice(1, z - 1);
        }
        return v.replace(/\\"/g, '"');
    });
};

const format = /^-?((0|[1-9]\d*)(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/;
class NumericValue {
    string;
    type;
    constructor(string, type) {
        this.string = string;
        this.type = type;
        if (!format.test(string)) {
            throw new Error(`@smithy/core/serde - NumericValue string must conform to the Smithy bigDecimal format. Received: "${string}"`);
        }
    }
    toString() {
        return this.string;
    }
    static [Symbol.hasInstance](object) {
        if (!object || typeof object !== "object") {
            return false;
        }
        const _nv = object;
        return NumericValue.prototype.isPrototypeOf(object) || (_nv.type === "bigDecimal" && format.test(_nv.string));
    }
}
function nv(input) {
    return new NumericValue(String(input), "bigDecimal");
}

const SHORT_TO_HEX = {};
const HEX_TO_SHORT = {};
for (let i = 0; i < 256; i++) {
    let encodedByte = i.toString(16).toLowerCase();
    if (encodedByte.length === 1) {
        encodedByte = `0${encodedByte}`;
    }
    SHORT_TO_HEX[i] = encodedByte;
    HEX_TO_SHORT[encodedByte] = i;
}
function fromHex(encoded) {
    if (encoded.length % 2 !== 0) {
        throw new Error("Hex encoded strings must have an even number length");
    }
    const out = new Uint8Array(encoded.length / 2);
    for (let i = 0; i < encoded.length; i += 2) {
        const encodedByte = encoded.slice(i, i + 2).toLowerCase();
        if (encodedByte in HEX_TO_SHORT) {
            out[i / 2] = HEX_TO_SHORT[encodedByte];
        }
        else {
            throw new Error(`Cannot decode unrecognized sequence ${encodedByte} as hexadecimal`);
        }
    }
    return out;
}
function toHex(bytes) {
    let out = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        out += SHORT_TO_HEX[bytes[i]];
    }
    return out;
}

const calculateBodyLength = (body) => {
    if (!body) {
        return 0;
    }
    if (typeof body === "string") {
        return Buffer.byteLength(body);
    }
    else if (typeof body.byteLength === "number") {
        return body.byteLength;
    }
    else if (typeof body.size === "number") {
        return body.size;
    }
    else if (typeof body.start === "number" && typeof body.end === "number") {
        return body.end + 1 - body.start;
    }
    else if (body instanceof ReadStream) {
        if (body.path != null) {
            return lstatSync(body.path).size;
        }
        else if (typeof body.fd === "number") {
            return fstatSync(body.fd).size;
        }
    }
    throw new Error(`Body Length computation failed for ${body}`);
};

const toUint8Array = (data) => {
    if (data instanceof Uint8Array) {
        return data;
    }
    if (typeof data === "string") {
        return fromUtf8$1(data);
    }
    if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
    }
    return new Uint8Array(data);
};

function concatBytes(arrays, length) {
    if (length === undefined) {
        length = 0;
        for (const bytes of arrays) {
            length += bytes.byteLength;
        }
    }
    const result = new Uint8Array(length);
    let offset = 0;
    for (const buf of arrays) {
        result.set(buf, offset);
        offset += buf.byteLength;
    }
    return result;
}

const deserializerMiddleware = (options, deserializer) => (next, context) => async (args) => {
    const { response } = await next(args);
    try {
        const parsed = await deserializer(response, options);
        return {
            response,
            output: parsed,
        };
    }
    catch (error) {
        Object.defineProperty(error, "$response", {
            value: response,
            enumerable: false,
            writable: false,
            configurable: false,
        });
        if (!("$metadata" in error)) {
            const hint = `Deserialization error: to see the raw response, inspect the hidden field {error}.$response on this object.`;
            try {
                error.message += "\n  " + hint;
            }
            catch (ignored) {
                if (!context.logger || context.logger?.constructor?.name === "NoOpLogger") {
                    console.warn(hint);
                }
                else {
                    context.logger?.warn?.(hint);
                }
            }
            if (typeof error.$responseBodyText !== "undefined") {
                if (error.$response) {
                    error.$response.body = error.$responseBodyText;
                }
            }
            try {
                if (HttpResponse.isInstance(response)) {
                    const { headers = {} } = response;
                    const headerEntries = Object.entries(headers);
                    error.$metadata = {
                        httpStatusCode: response.statusCode,
                        requestId: findHeader(/^x-[\w-]+-request-?id$/, headerEntries),
                        extendedRequestId: findHeader(/^x-[\w-]+-id-2$/, headerEntries),
                        cfId: findHeader(/^x-[\w-]+-cf-id$/, headerEntries),
                    };
                }
            }
            catch (ignored) {
            }
        }
        throw error;
    }
};
const findHeader = (pattern, headers) => {
    return (headers.find(([k]) => {
        return k.match(pattern);
    }) || [void 0, void 0])[1];
};

const serializerMiddleware = (options, serializer) => (next, context) => async (args) => {
    const endpointConfig = options;
    const endpoint = context.endpointV2
        ? async () => toEndpointV1(context.endpointV2)
        : endpointConfig.endpoint;
    if (!endpoint) {
        throw new Error("No valid endpoint provider available.");
    }
    const request = await serializer(args.input, { ...options, endpoint });
    return next({
        ...args,
        request,
    });
};

const deserializerMiddlewareOption = {
    name: "deserializerMiddleware",
    step: "deserialize",
    tags: ["DESERIALIZER"],
    override: true,
};
const serializerMiddlewareOption = {
    name: "serializerMiddleware",
    step: "serialize",
    tags: ["SERIALIZER"],
    override: true,
};
function getSerdePlugin(config, serializer, deserializer) {
    return {
        applyToStack: (commandStack) => {
            commandStack.add(deserializerMiddleware(config, deserializer), deserializerMiddlewareOption);
            commandStack.add(serializerMiddleware(config, serializer), serializerMiddlewareOption);
        },
    };
}

class Hash {
    algorithmIdentifier;
    secret;
    hash;
    constructor(algorithmIdentifier, secret) {
        this.algorithmIdentifier = algorithmIdentifier;
        this.secret = secret;
        this.reset();
    }
    update(toHash, encoding) {
        this.hash.update(toUint8Array(castSourceData(toHash, encoding)));
    }
    digest() {
        return Promise.resolve(this.hash.digest());
    }
    reset() {
        this.hash = this.secret
            ? createHmac(this.algorithmIdentifier, castSourceData(this.secret))
            : createHash(this.algorithmIdentifier);
    }
}
function castSourceData(toCast, encoding) {
    if (Buffer.isBuffer(toCast)) {
        return toCast;
    }
    if (typeof toCast === "string") {
        return fromString(toCast, encoding);
    }
    if (ArrayBuffer.isView(toCast)) {
        return fromArrayBuffer(toCast.buffer, toCast.byteOffset, toCast.byteLength);
    }
    return fromArrayBuffer(toCast);
}

let ChecksumStream$1 = class ChecksumStream extends Readable {
    expectedChecksum;
    checksumSourceLocation;
    checksum;
    source;
    base64Encoder;
    constructor({ expectedChecksum, checksum, source, checksumSourceLocation, base64Encoder, }) {
        super();
        if (typeof source.pipe !== "function") {
            throw new Error(`@smithy/util-stream: unsupported source type ${source?.constructor?.name ?? source} in ChecksumStream.`);
        }
        this.source = source;
        this.base64Encoder = base64Encoder ?? toBase64$1;
        this.expectedChecksum = expectedChecksum;
        this.checksum = checksum;
        this.checksumSourceLocation = checksumSourceLocation;
        this.source.on("data", this.onSourceData);
        this.source.on("end", this.onSourceEnd);
        this.source.on("error", this.onSourceError);
        this.source.on("close", this.onSourceClose);
        this.source.pause();
    }
    onSourceData = (chunk) => {
        if (this.destroyed) {
            return;
        }
        try {
            this.checksum.update(chunk);
        }
        catch (e) {
            this.destroy(e);
            return;
        }
        if (!this.push(chunk)) {
            this.source.pause();
        }
    };
    onSourceEnd = async () => {
        if (this.destroyed) {
            return;
        }
        try {
            const digest = await this.checksum.digest();
            const received = this.base64Encoder(digest);
            if (this.expectedChecksum !== received) {
                this.destroy(new Error(`Checksum mismatch: expected "${this.expectedChecksum}" but received "${received}"` +
                    ` in response header "${this.checksumSourceLocation}".`));
                return;
            }
        }
        catch (e) {
            this.destroy(e);
            return;
        }
        this.push(null);
    };
    onSourceError = (error) => {
        this.destroy(error);
    };
    onSourceClose = () => {
        if (!this.destroyed && !this.source.readableEnded) {
            this.destroy(new Error("Connection lost or stream closed before all data was received."));
        }
    };
    _read(_size) {
        this.source.resume();
    }
    _destroy(error, callback) {
        this.source?.removeListener("data", this.onSourceData);
        this.source?.removeListener("end", this.onSourceEnd);
        this.source?.removeListener("error", this.onSourceError);
        this.source?.removeListener("close", this.onSourceClose);
        this.source?.destroy();
        callback(error);
    }
};

const isReadableStream = (stream) => typeof ReadableStream === "function" &&
    (stream?.constructor?.name === ReadableStream.name || stream instanceof ReadableStream);
const isBlob = (blob) => {
    return typeof Blob === "function" && (blob?.constructor?.name === Blob.name || blob instanceof Blob);
};

const fromUtf8 = (input) => new TextEncoder().encode(input);

const chars = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`;
Object.entries(chars).reduce((acc, [i, c]) => {
    acc[c] = Number(i);
    return acc;
}, {});
const alphabetByValue = chars.split("");
const bitsPerLetter = 6;
const bitsPerByte = 8;
const maxLetterValue = 0b111111;

function toBase64(_input) {
    let input;
    if (typeof _input === "string") {
        input = fromUtf8(_input);
    }
    else {
        input = _input;
    }
    const isArrayLike = typeof input === "object" && typeof input.length === "number";
    const isUint8Array = typeof input === "object" &&
        typeof input.byteOffset === "number" &&
        typeof input.byteLength === "number";
    if (!isArrayLike && !isUint8Array) {
        throw new Error("@smithy/util-base64: toBase64 encoder function only accepts string | Uint8Array.");
    }
    let str = "";
    for (let i = 0; i < input.length; i += 3) {
        let bits = 0;
        let bitLength = 0;
        for (let j = i, limit = Math.min(i + 3, input.length); j < limit; j++) {
            bits |= input[j] << ((limit - j - 1) * bitsPerByte);
            bitLength += bitsPerByte;
        }
        const bitClusterCount = Math.ceil(bitLength / bitsPerLetter);
        bits <<= bitClusterCount * bitsPerLetter - bitLength;
        for (let k = 1; k <= bitClusterCount; k++) {
            const offset = (bitClusterCount - k) * bitsPerLetter;
            str += alphabetByValue[(bits & (maxLetterValue << offset)) >> offset];
        }
        str += "==".slice(0, 4 - bitClusterCount);
    }
    return str;
}

const ReadableStreamRef = typeof ReadableStream === "function" ? ReadableStream : function () { };
class ChecksumStream extends ReadableStreamRef {
}

const createChecksumStream$1 = ({ expectedChecksum, checksum, source, checksumSourceLocation, base64Encoder, }) => {
    if (!isReadableStream(source)) {
        throw new Error(`@smithy/util-stream: unsupported source type ${source?.constructor?.name ?? source} in ChecksumStream.`);
    }
    const encoder = base64Encoder ?? toBase64;
    if (typeof TransformStream !== "function") {
        throw new Error("@smithy/util-stream: unable to instantiate ChecksumStream because API unavailable: ReadableStream/TransformStream.");
    }
    const transform = new TransformStream({
        start() { },
        async transform(chunk, controller) {
            checksum.update(chunk);
            controller.enqueue(chunk);
        },
        async flush(controller) {
            const digest = await checksum.digest();
            const received = encoder(digest);
            if (expectedChecksum !== received) {
                const error = new Error(`Checksum mismatch: expected "${expectedChecksum}" but received "${received}"` +
                    ` in response header "${checksumSourceLocation}".`);
                controller.error(error);
            }
            else {
                controller.terminate();
            }
        },
    });
    source.pipeThrough(transform);
    const readable = transform.readable;
    Object.setPrototypeOf(readable, ChecksumStream.prototype);
    return readable;
};

function createChecksumStream(init) {
    if (typeof ReadableStream === "function" && isReadableStream(init.source)) {
        return createChecksumStream$1(init);
    }
    return new ChecksumStream$1(init);
}

class ByteArrayCollector {
    allocByteArray;
    byteLength = 0;
    byteArrays = [];
    constructor(allocByteArray) {
        this.allocByteArray = allocByteArray;
    }
    push(byteArray) {
        this.byteArrays.push(byteArray);
        this.byteLength += byteArray.byteLength;
    }
    flush() {
        if (this.byteArrays.length === 1) {
            const bytes = this.byteArrays[0];
            this.reset();
            return bytes;
        }
        const aggregation = this.allocByteArray(this.byteLength);
        let cursor = 0;
        for (let i = 0; i < this.byteArrays.length; ++i) {
            const bytes = this.byteArrays[i];
            aggregation.set(bytes, cursor);
            cursor += bytes.byteLength;
        }
        this.reset();
        return aggregation;
    }
    reset() {
        this.byteArrays = [];
        this.byteLength = 0;
    }
}

function createBufferedReadableStream(upstream, size, logger) {
    const reader = upstream.getReader();
    let streamBufferingLoggedWarning = false;
    let bytesSeen = 0;
    const buffers = ["", new ByteArrayCollector((size) => new Uint8Array(size))];
    let mode = -1;
    const pull = async (controller) => {
        const { value, done } = await reader.read();
        const chunk = value;
        if (done) {
            if (mode !== -1) {
                const remainder = flush(buffers, mode);
                if (sizeOf(remainder) > 0) {
                    controller.enqueue(remainder);
                }
            }
            controller.close();
        }
        else {
            const chunkMode = modeOf(chunk, false);
            if (mode !== chunkMode) {
                if (mode >= 0) {
                    controller.enqueue(flush(buffers, mode));
                }
                mode = chunkMode;
            }
            if (mode === -1) {
                controller.enqueue(chunk);
                return;
            }
            const chunkSize = sizeOf(chunk);
            bytesSeen += chunkSize;
            const bufferSize = sizeOf(buffers[mode]);
            if (chunkSize >= size && bufferSize === 0) {
                controller.enqueue(chunk);
            }
            else {
                const newSize = merge(buffers, mode, chunk);
                if (!streamBufferingLoggedWarning && bytesSeen > size * 2) {
                    streamBufferingLoggedWarning = true;
                    logger?.warn(`@smithy/util-stream - stream chunk size ${chunkSize} is below threshold of ${size}, automatically buffering.`);
                }
                if (newSize >= size) {
                    controller.enqueue(flush(buffers, mode));
                }
                else {
                    await pull(controller);
                }
            }
        }
    };
    return new ReadableStream({
        pull,
    });
}
function merge(buffers, mode, chunk) {
    switch (mode) {
        case 0:
            buffers[0] += chunk;
            return sizeOf(buffers[0]);
        case 1:
        case 2:
            buffers[mode].push(chunk);
            return sizeOf(buffers[mode]);
    }
}
function flush(buffers, mode) {
    switch (mode) {
        case 0:
            const s = buffers[0];
            buffers[0] = "";
            return s;
        case 1:
        case 2:
            return buffers[mode].flush();
    }
    throw new Error(`@smithy/util-stream - invalid index ${mode} given to flush()`);
}
function sizeOf(chunk) {
    return chunk?.byteLength ?? chunk?.length ?? 0;
}
function modeOf(chunk, allowBuffer = true) {
    if (allowBuffer && typeof Buffer !== "undefined" && chunk instanceof Buffer) {
        return 2;
    }
    if (chunk instanceof Uint8Array) {
        return 1;
    }
    if (typeof chunk === "string") {
        return 0;
    }
    return -1;
}

function createBufferedReadable(upstream, size, logger) {
    if (isReadableStream(upstream)) {
        return createBufferedReadableStream(upstream, size, logger);
    }
    const downstream = new Readable({ read() { } });
    let streamBufferingLoggedWarning = false;
    let bytesSeen = 0;
    const buffers = [
        "",
        new ByteArrayCollector((size) => new Uint8Array(size)),
        new ByteArrayCollector((size) => Buffer.from(new Uint8Array(size))),
    ];
    let mode = -1;
    upstream.on("data", (chunk) => {
        const chunkMode = modeOf(chunk, true);
        if (mode !== chunkMode) {
            if (mode >= 0) {
                downstream.push(flush(buffers, mode));
            }
            mode = chunkMode;
        }
        if (mode === -1) {
            downstream.push(chunk);
            return;
        }
        const chunkSize = sizeOf(chunk);
        bytesSeen += chunkSize;
        const bufferSize = sizeOf(buffers[mode]);
        if (chunkSize >= size && bufferSize === 0) {
            downstream.push(chunk);
        }
        else {
            const newSize = merge(buffers, mode, chunk);
            if (!streamBufferingLoggedWarning && bytesSeen > size * 2) {
                streamBufferingLoggedWarning = true;
                logger?.warn(`@smithy/util-stream - stream chunk size ${chunkSize} is below threshold of ${size}, automatically buffering.`);
            }
            if (newSize >= size) {
                downstream.push(flush(buffers, mode));
            }
        }
    });
    upstream.on("end", () => {
        if (mode !== -1) {
            const remainder = flush(buffers, mode);
            if (sizeOf(remainder) > 0) {
                downstream.push(remainder);
            }
        }
        downstream.push(null);
    });
    return downstream;
}

const getAwsChunkedEncodingStream$1 = (readableStream, options) => {
    const { base64Encoder, bodyLengthChecker, checksumAlgorithmFn, checksumLocationName, streamHasher } = options;
    const checksumRequired = base64Encoder !== undefined &&
        bodyLengthChecker !== undefined &&
        checksumAlgorithmFn !== undefined &&
        checksumLocationName !== undefined &&
        streamHasher !== undefined;
    const digest = checksumRequired ? streamHasher(checksumAlgorithmFn, readableStream) : undefined;
    const reader = readableStream.getReader();
    return new ReadableStream({
        async pull(controller) {
            const { value, done } = await reader.read();
            if (done) {
                controller.enqueue(`0\r\n`);
                if (checksumRequired) {
                    const checksum = base64Encoder(await digest);
                    controller.enqueue(`${checksumLocationName}:${checksum}\r\n`);
                    controller.enqueue(`\r\n`);
                }
                controller.close();
            }
            else {
                controller.enqueue(`${(bodyLengthChecker(value) || 0).toString(16)}\r\n${value}\r\n`);
            }
        },
    });
};

function getAwsChunkedEncodingStream(stream, options) {
    const readable = stream;
    const readableStream = stream;
    if (isReadableStream(readableStream)) {
        return getAwsChunkedEncodingStream$1(readableStream, options);
    }
    const { base64Encoder, bodyLengthChecker, checksumAlgorithmFn, checksumLocationName, streamHasher } = options;
    const checksumRequired = base64Encoder !== undefined &&
        checksumAlgorithmFn !== undefined &&
        checksumLocationName !== undefined &&
        streamHasher !== undefined;
    const digest = checksumRequired ? streamHasher(checksumAlgorithmFn, readable) : undefined;
    const awsChunkedEncodingStream = new Readable({
        read: () => { },
    });
    readable.on("data", (data) => {
        const length = bodyLengthChecker(data) || 0;
        if (length === 0) {
            return;
        }
        awsChunkedEncodingStream.push(`${length.toString(16)}\r\n`);
        awsChunkedEncodingStream.push(data);
        awsChunkedEncodingStream.push("\r\n");
    });
    readable.on("end", async () => {
        awsChunkedEncodingStream.push(`0\r\n`);
        if (checksumRequired) {
            const checksum = base64Encoder(await digest);
            awsChunkedEncodingStream.push(`${checksumLocationName}:${checksum}\r\n`);
            awsChunkedEncodingStream.push(`\r\n`);
        }
        awsChunkedEncodingStream.push(null);
    });
    return awsChunkedEncodingStream;
}

async function headStream$1(stream, bytes) {
    let byteLengthCounter = 0;
    const chunks = [];
    const reader = stream.getReader();
    let isDone = false;
    while (!isDone) {
        const { done, value } = await reader.read();
        if (value) {
            chunks.push(value);
            byteLengthCounter += value?.byteLength ?? 0;
        }
        if (byteLengthCounter >= bytes) {
            break;
        }
        isDone = done;
    }
    reader.releaseLock();
    const collected = new Uint8Array(Math.min(bytes, byteLengthCounter));
    let offset = 0;
    for (const chunk of chunks) {
        if (chunk.byteLength > collected.byteLength - offset) {
            collected.set(chunk.subarray(0, collected.byteLength - offset), offset);
            break;
        }
        else {
            collected.set(chunk, offset);
        }
        offset += chunk.length;
    }
    return collected;
}

const headStream = (stream, bytes) => {
    if (isReadableStream(stream)) {
        return headStream$1(stream, bytes);
    }
    return new Promise((resolve, reject) => {
        const collector = new Collector$1();
        collector.limit = bytes;
        stream.pipe(collector);
        stream.on("error", (err) => {
            collector.end();
            reject(err);
        });
        collector.on("error", reject);
        collector.on("finish", function () {
            const bytes = concatBytes(this.buffers);
            resolve(bytes);
        });
    });
};
let Collector$1 = class Collector extends Writable {
    buffers = [];
    limit = Infinity;
    bytesBuffered = 0;
    _write(chunk, encoding, callback) {
        this.buffers.push(chunk);
        this.bytesBuffered += chunk.byteLength ?? 0;
        if (this.bytesBuffered >= this.limit) {
            const excess = this.bytesBuffered - this.limit;
            const tailBuffer = this.buffers[this.buffers.length - 1];
            this.buffers[this.buffers.length - 1] = tailBuffer.subarray(0, tailBuffer.byteLength - excess);
            this.emit("finish");
        }
        callback();
    }
};

const toUtf8 = (input) => {
    if (typeof input === "string") {
        return input;
    }
    if (typeof input !== "object" || typeof input.byteOffset !== "number" || typeof input.byteLength !== "number") {
        throw new Error("@smithy/util-utf8: toUtf8 encoder function only accepts string | Uint8Array.");
    }
    return new TextDecoder("utf-8").decode(input);
};

const streamCollector$1 = async (stream) => {
    if (isBlob(stream)) {
        return collectBlob(stream);
    }
    return collectReadableStream(stream);
};
async function collectBlob(blob) {
    return blob.arrayBuffer().then((ab) => new Uint8Array(ab));
}
async function collectReadableStream(stream) {
    const chunks = [];
    const reader = stream.getReader();
    let length = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (value) {
            chunks.push(value);
            length += value.length;
        }
        if (done) {
            break;
        }
    }
    return concatBytes(chunks, length);
}

const ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED$1 = "The stream has already been transformed.";
const sdkStreamMixin$1 = (stream) => {
    if (!isBlobInstance(stream) && !isReadableStream(stream)) {
        const name = stream?.__proto__?.constructor?.name || stream;
        throw new Error(`Unexpected stream implementation, expect Blob or ReadableStream, got ${name}`);
    }
    let transformed = false;
    const transformToByteArray = async () => {
        if (transformed) {
            throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED$1);
        }
        transformed = true;
        return await streamCollector$1(stream);
    };
    const blobToWebStream = (blob) => {
        if (typeof blob.stream !== "function") {
            throw new Error("Cannot transform payload Blob to web stream. Please make sure the Blob.stream() is polyfilled.\n" +
                "If you are using React Native, this API is not yet supported, see: https://react-native.canny.io/feature-requests/p/fetch-streaming-body");
        }
        return blob.stream();
    };
    return Object.assign(stream, {
        transformToByteArray: transformToByteArray,
        transformToString: async (encoding) => {
            const buf = await transformToByteArray();
            if (encoding === "base64") {
                return toBase64(buf);
            }
            else if (encoding === "hex") {
                return toHex(buf);
            }
            else if (encoding === undefined || encoding === "utf8" || encoding === "utf-8") {
                return toUtf8(buf);
            }
            else if (typeof TextDecoder === "function") {
                return new TextDecoder(encoding).decode(buf);
            }
            else {
                throw new Error("TextDecoder is not available, please make sure polyfill is provided.");
            }
        },
        transformToWebStream: () => {
            if (transformed) {
                throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED$1);
            }
            transformed = true;
            if (isBlobInstance(stream)) {
                return blobToWebStream(stream);
            }
            else if (isReadableStream(stream)) {
                return stream;
            }
            else {
                throw new Error(`Cannot transform payload to web stream, got ${stream}`);
            }
        },
    });
};
const isBlobInstance = (stream) => typeof Blob === "function" && stream instanceof Blob;

const streamCollector = (stream) => {
    if (isBlob(stream)) {
        return collectBlob(stream);
    }
    if (isReadableStream(stream)) {
        return collectReadableStream(stream);
    }
    return new Promise((resolve, reject) => {
        const collector = new Collector();
        const nodeStream = stream;
        nodeStream.pipe(collector);
        nodeStream.on("error", (err) => {
            collector.end();
            reject(err);
        });
        collector.on("error", reject);
        collector.on("finish", function () {
            const bytes = concatBytes(this.bufferedBytes);
            resolve(bytes);
        });
    });
};
class Collector extends Writable {
    bufferedBytes = [];
    _write(chunk, encoding, callback) {
        this.bufferedBytes.push(chunk);
        callback();
    }
}

const ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED = "The stream has already been transformed.";
const sdkStreamMixin = (stream) => {
    if (!(stream instanceof Readable)) {
        try {
            return sdkStreamMixin$1(stream);
        }
        catch (ignored) {
            const name = stream?.__proto__?.constructor?.name || stream;
            throw new Error(`Unexpected stream implementation, expect Stream.Readable instance, got ${name}`);
        }
    }
    let transformed = false;
    const transformToByteArray = async () => {
        if (transformed) {
            throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
        }
        transformed = true;
        return await streamCollector(stream);
    };
    return Object.assign(stream, {
        transformToByteArray,
        transformToString: async (encoding) => {
            const buf = await transformToByteArray();
            if (encoding === undefined || Buffer.isEncoding(encoding)) {
                return fromArrayBuffer(buf.buffer, buf.byteOffset, buf.byteLength).toString(encoding);
            }
            else {
                const decoder = new TextDecoder(encoding);
                return decoder.decode(buf);
            }
        },
        transformToWebStream: () => {
            if (transformed) {
                throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
            }
            if (stream.readableFlowing !== null) {
                throw new Error("The stream has been consumed by other callbacks.");
            }
            if (typeof Readable.toWeb !== "function") {
                throw new Error("Readable.toWeb() is not supported. Please ensure a polyfill is available.");
            }
            transformed = true;
            return Readable.toWeb(stream);
        },
    });
};

async function splitStream$1(stream) {
    if (typeof stream.stream === "function") {
        stream = stream.stream();
    }
    const readableStream = stream;
    return readableStream.tee();
}

async function splitStream(stream) {
    if (isReadableStream(stream) || isBlob(stream)) {
        return splitStream$1(stream);
    }
    const stream1 = new PassThrough();
    const stream2 = new PassThrough();
    stream.pipe(stream1);
    stream.pipe(stream2);
    return [stream1, stream2];
}

class Uint8ArrayBlobAdapter extends bindUint8ArrayBlobAdapter(toUtf8$1, fromUtf8$1, toBase64$1, fromBase64) {
}
const _getRandomValues = getRandomValues;
const v4 = bindV4(_getRandomValues);
const generateIdempotencyToken = v4;

exports.ChecksumStream = ChecksumStream$1;
exports.Hash = Hash;
exports.LazyJsonString = LazyJsonString;
exports.NumericValue = NumericValue;
exports.Uint8ArrayBlobAdapter = Uint8ArrayBlobAdapter;
exports._parseEpochTimestamp = _parseEpochTimestamp;
exports._parseRfc3339DateTimeWithOffset = _parseRfc3339DateTimeWithOffset;
exports._parseRfc7231DateTime = _parseRfc7231DateTime;
exports.calculateBodyLength = calculateBodyLength;
exports.concatBytes = concatBytes;
exports.copyDocumentWithTransform = copyDocumentWithTransform;
exports.createBufferedReadable = createBufferedReadable;
exports.createChecksumStream = createChecksumStream;
exports.dateToUtcString = dateToUtcString;
exports.deserializerMiddleware = deserializerMiddleware;
exports.deserializerMiddlewareOption = deserializerMiddlewareOption;
exports.expectBoolean = expectBoolean;
exports.expectByte = expectByte;
exports.expectFloat32 = expectFloat32;
exports.expectInt = expectInt;
exports.expectInt32 = expectInt32;
exports.expectLong = expectLong;
exports.expectNonNull = expectNonNull;
exports.expectNumber = expectNumber;
exports.expectObject = expectObject;
exports.expectShort = expectShort;
exports.expectString = expectString;
exports.expectUnion = expectUnion;
exports.fromArrayBuffer = fromArrayBuffer;
exports.fromBase64 = fromBase64;
exports.fromHex = fromHex;
exports.fromString = fromString;
exports.fromUtf8 = fromUtf8$1;
exports.generateIdempotencyToken = generateIdempotencyToken;
exports.getAwsChunkedEncodingStream = getAwsChunkedEncodingStream;
exports.getSerdePlugin = getSerdePlugin;
exports.handleFloat = handleFloat;
exports.headStream = headStream;
exports.isArrayBuffer = isArrayBuffer;
exports.isBlob = isBlob;
exports.isReadableStream = isReadableStream;
exports.limitedParseDouble = limitedParseDouble;
exports.limitedParseFloat = limitedParseFloat;
exports.limitedParseFloat32 = limitedParseFloat32;
exports.logger = logger;
exports.nv = nv;
exports.parseBoolean = parseBoolean;
exports.parseEpochTimestamp = parseEpochTimestamp;
exports.parseRfc3339DateTime = parseRfc3339DateTime;
exports.parseRfc3339DateTimeWithOffset = parseRfc3339DateTimeWithOffset;
exports.parseRfc7231DateTime = parseRfc7231DateTime;
exports.quoteHeader = quoteHeader;
exports.sdkStreamMixin = sdkStreamMixin;
exports.serializerMiddleware = serializerMiddleware;
exports.serializerMiddlewareOption = serializerMiddlewareOption;
exports.splitEvery = splitEvery;
exports.splitHeader = splitHeader;
exports.splitStream = splitStream;
exports.streamCollector = streamCollector;
exports.strictParseByte = strictParseByte;
exports.strictParseDouble = strictParseDouble;
exports.strictParseFloat = strictParseFloat;
exports.strictParseFloat32 = strictParseFloat32;
exports.strictParseInt = strictParseInt;
exports.strictParseInt32 = strictParseInt32;
exports.strictParseLong = strictParseLong;
exports.strictParseShort = strictParseShort;
exports.toBase64 = toBase64$1;
exports.toHex = toHex;
exports.toUint8Array = toUint8Array;
exports.toUtf8 = toUtf8$1;
exports.v4 = v4;
