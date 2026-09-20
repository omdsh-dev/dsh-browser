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
var utils_exports = {};
__export(utils_exports, {
  dirname: () => dirname,
  ensureWithinOutDir: () => ensureWithinOutDir,
  filterStaticGenerateRoutes: () => filterStaticGenerateRoutes,
  isDynamicRoute: () => isDynamicRoute,
  joinPaths: () => joinPaths
});
module.exports = __toCommonJS(utils_exports);
var import_router = require("../../router");
var import_handler = require("../../utils/handler");
const dirname = (path) => {
  const separatedPath = path.split(/[\/\\]/);
  return separatedPath.slice(0, -1).join("/");
};
const normalizePath = (path) => {
  return path.replace(/(\\)/g, "/").replace(/\/$/g, "");
};
const getUncRoot = (path) => {
  const uncRoot = path.replace(/\\/g, "/").match(/^\/\/([^/]+)\/([^/]+)/);
  if (uncRoot) {
    return `${uncRoot[1].toLowerCase()}/${uncRoot[2].toLowerCase()}`;
  }
};
const handleParent = (resultPaths) => {
  if (resultPaths.length === 0 || resultPaths[resultPaths.length - 1] === "..") {
    resultPaths.push("..");
  } else {
    resultPaths.pop();
  }
};
const handleNonDot = (path, resultPaths) => {
  path = path.replace(/^\.(?!.)/, "");
  if (path !== "") {
    resultPaths.push(path);
  }
};
const handleSegments = (paths, resultPaths) => {
  for (const path of paths) {
    if (path === "..") {
      handleParent(resultPaths);
    } else {
      handleNonDot(path, resultPaths);
    }
  }
};
const joinPaths = (...paths) => {
  const hasUncPrefix = getUncRoot(paths[0]) !== void 0;
  paths = paths.map(normalizePath);
  const resultPaths = [];
  handleSegments(paths.join("/").split("/"), resultPaths);
  return (hasUncPrefix ? "//" : paths[0][0] === "/" ? "/" : "") + resultPaths.join("/");
};
const filterStaticGenerateRoutes = (hono) => {
  return hono.routes.reduce((acc, { method, handler, path }) => {
    const targetHandler = (0, import_handler.findTargetHandler)(handler);
    if (["GET", import_router.METHOD_NAME_ALL].includes(method) && !(0, import_handler.isMiddleware)(targetHandler)) {
      acc.push({ path });
    }
    return acc;
  }, []);
};
const isDynamicRoute = (path) => {
  return path.split("/").some((segment) => segment.startsWith(":") || segment.includes("*"));
};
const toSegments = (path) => path === "" ? [] : path.split("/");
const getPathRoot = (path) => {
  const normalizedPath = path.replace(/\\/g, "/");
  const uncRoot = getUncRoot(normalizedPath);
  if (uncRoot) {
    return `unc:${uncRoot}`;
  }
  const driveRoot = normalizedPath.match(/^([A-Za-z]):/);
  if (driveRoot) {
    const kind = normalizedPath[2] === "/" ? "drive-absolute" : "drive-relative";
    return `${kind}:${driveRoot[1].toLowerCase()}`;
  }
  return normalizedPath.startsWith("/") ? "absolute" : "relative";
};
const ensureWithinOutDir = (outDir, filePath) => {
  const outDirSegments = toSegments(joinPaths(outDir));
  const filePathSegments = toSegments(joinPaths(filePath));
  const hasMismatchedPathRoot = getPathRoot(outDir) !== getPathRoot(filePath);
  const climbsAboveOutDir = filePathSegments[outDirSegments.length] === "..";
  if (hasMismatchedPathRoot || filePathSegments.length <= outDirSegments.length || !outDirSegments.every((segment, i) => segment === filePathSegments[i]) || climbsAboveOutDir) {
    throw new Error(`Path traversal detected: "${filePath}" is outside the output directory`);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  dirname,
  ensureWithinOutDir,
  filterStaticGenerateRoutes,
  isDynamicRoute,
  joinPaths
});
