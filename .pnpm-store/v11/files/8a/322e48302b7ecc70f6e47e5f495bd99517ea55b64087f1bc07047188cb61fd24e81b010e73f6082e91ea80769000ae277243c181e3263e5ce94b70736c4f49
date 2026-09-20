export function split(value, delimiter, limit) {
    if (limit === 1) {
        return [value];
    }
    if (value === "") {
        return [""];
    }
    const parts = value.split(delimiter);
    if (limit === 0) {
        return parts;
    }
    return parts.slice(0, limit - 1).concat(parts.slice(1).join(delimiter));
}
