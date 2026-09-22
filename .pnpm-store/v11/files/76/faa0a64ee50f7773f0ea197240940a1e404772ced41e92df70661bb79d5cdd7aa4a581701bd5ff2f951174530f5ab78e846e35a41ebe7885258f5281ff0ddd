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
var accepts_exports = {};
__export(accepts_exports, {
  accepts: () => accepts,
  defaultMatch: () => defaultMatch
});
module.exports = __toCommonJS(accepts_exports);
var import_accept = require("../../utils/accept");
const matchType = (acceptType, supportedType) => {
  if (acceptType === supportedType) {
    return true;
  }
  if (acceptType === "*/*" || acceptType === "*") {
    return false;
  }
  if (acceptType.endsWith("/*")) {
    const [acceptMain] = acceptType.split("/");
    const [supportedMain] = supportedType.split("/");
    return acceptMain === supportedMain;
  }
  return false;
};
const getSpecificity = (type) => {
  if (type === "*/*" || type === "*") {
    return 1;
  }
  if (type.endsWith("/*")) {
    return 2;
  }
  return 3;
};
const defaultMatch = (accepts2, config) => {
  const { supports, default: defaultSupport } = config;
  const sortedAccepts = accepts2.slice().sort((a, b) => {
    if (b.q !== a.q) {
      return b.q - a.q;
    }
    return getSpecificity(b.type) - getSpecificity(a.type);
  });
  for (const accept of sortedAccepts) {
    const matched = supports.find((supported) => matchType(accept.type, supported));
    if (matched) {
      return matched;
    }
  }
  return defaultSupport;
};
const accepts = (c, options) => {
  const acceptHeader = c.req.header(options.header);
  if (!acceptHeader) {
    return options.default;
  }
  const accepts2 = (0, import_accept.parseAccept)(acceptHeader);
  const match = options.match || defaultMatch;
  return match(accepts2, options);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  accepts,
  defaultMatch
});
