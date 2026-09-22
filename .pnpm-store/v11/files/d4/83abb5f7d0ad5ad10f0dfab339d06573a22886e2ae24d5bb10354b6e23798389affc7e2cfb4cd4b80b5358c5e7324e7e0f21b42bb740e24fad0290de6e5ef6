// src/helper/accepts/accepts.ts
import { parseAccept } from "../../utils/accept.js";
var matchType = (acceptType, supportedType) => {
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
var getSpecificity = (type) => {
  if (type === "*/*" || type === "*") {
    return 1;
  }
  if (type.endsWith("/*")) {
    return 2;
  }
  return 3;
};
var defaultMatch = (accepts2, config) => {
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
var accepts = (c, options) => {
  const acceptHeader = c.req.header(options.header);
  if (!acceptHeader) {
    return options.default;
  }
  const accepts2 = parseAccept(acceptHeader);
  const match = options.match || defaultMatch;
  return match(accepts2, options);
};
export {
  accepts,
  defaultMatch
};
