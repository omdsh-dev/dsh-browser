// src/helper/ssg/utils.ts
import { METHOD_NAME_ALL } from "../../router.js";
import { findTargetHandler, isMiddleware } from "../../utils/handler.js";
var dirname = (path) => {
  const separatedPath = path.split(/[\/\\]/);
  return separatedPath.slice(0, -1).join("/");
};
var normalizePath = (path) => {
  return path.replace(/(\\)/g, "/").replace(/\/$/g, "");
};
var getUncRoot = (path) => {
  const uncRoot = path.replace(/\\/g, "/").match(/^\/\/([^/]+)\/([^/]+)/);
  if (uncRoot) {
    return `${uncRoot[1].toLowerCase()}/${uncRoot[2].toLowerCase()}`;
  }
};
var handleParent = (resultPaths) => {
  if (resultPaths.length === 0 || resultPaths[resultPaths.length - 1] === "..") {
    resultPaths.push("..");
  } else {
    resultPaths.pop();
  }
};
var handleNonDot = (path, resultPaths) => {
  path = path.replace(/^\.(?!.)/, "");
  if (path !== "") {
    resultPaths.push(path);
  }
};
var handleSegments = (paths, resultPaths) => {
  for (const path of paths) {
    if (path === "..") {
      handleParent(resultPaths);
    } else {
      handleNonDot(path, resultPaths);
    }
  }
};
var joinPaths = (...paths) => {
  const hasUncPrefix = getUncRoot(paths[0]) !== void 0;
  paths = paths.map(normalizePath);
  const resultPaths = [];
  handleSegments(paths.join("/").split("/"), resultPaths);
  return (hasUncPrefix ? "//" : paths[0][0] === "/" ? "/" : "") + resultPaths.join("/");
};
var filterStaticGenerateRoutes = (hono) => {
  return hono.routes.reduce((acc, { method, handler, path }) => {
    const targetHandler = findTargetHandler(handler);
    if (["GET", METHOD_NAME_ALL].includes(method) && !isMiddleware(targetHandler)) {
      acc.push({ path });
    }
    return acc;
  }, []);
};
var isDynamicRoute = (path) => {
  return path.split("/").some((segment) => segment.startsWith(":") || segment.includes("*"));
};
var toSegments = (path) => path === "" ? [] : path.split("/");
var getPathRoot = (path) => {
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
var ensureWithinOutDir = (outDir, filePath) => {
  const outDirSegments = toSegments(joinPaths(outDir));
  const filePathSegments = toSegments(joinPaths(filePath));
  const hasMismatchedPathRoot = getPathRoot(outDir) !== getPathRoot(filePath);
  const climbsAboveOutDir = filePathSegments[outDirSegments.length] === "..";
  if (hasMismatchedPathRoot || filePathSegments.length <= outDirSegments.length || !outDirSegments.every((segment, i) => segment === filePathSegments[i]) || climbsAboveOutDir) {
    throw new Error(`Path traversal detected: "${filePath}" is outside the output directory`);
  }
};
export {
  dirname,
  ensureWithinOutDir,
  filterStaticGenerateRoutes,
  isDynamicRoute,
  joinPaths
};
