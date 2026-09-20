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
var router_exports = {};
__export(router_exports, {
  RegExpRouter: () => RegExpRouter
});
module.exports = __toCommonJS(router_exports);
var import_router = require("../../router");
var import_url = require("../../utils/url");
var import_utils = require("../utils");
var import_matcher = require("./matcher");
var import_node = require("./node");
var import_trie = require("./trie");
let wildcardRegExpCache = (0, import_utils.createNullObject)();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    `^${path.replace(
      /\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g,
      (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? import_node.TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? import_node.ONLY_WILDCARD_REG_EXP_STR : `/:${import_node.LABEL_REG_EXP_STR}`
    )}$`
  );
}
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
class RegExpRouter {
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { [import_router.METHOD_NAME_ALL]: (0, import_utils.createNullObject)() };
    this.#routes = { [import_router.METHOD_NAME_ALL]: (0, import_utils.createNullObject)() };
    this.#tries = { [import_router.METHOD_NAME_ALL]: new import_trie.Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === import_node.PATH_ERROR ? new import_router.UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) {
      throw new Error(import_router.MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new import_trie.Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = (0, import_utils.createNullObject)();
        for (const p in handlerMap[import_router.METHOD_NAME_ALL]) {
          handlerMap[method][p] = [...handlerMap[import_router.METHOD_NAME_ALL][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path === "/*") {
      path = "*";
    }
    const methods = method === import_router.METHOD_NAME_ALL ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m of methods) {
        if (!middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[import_router.METHOD_NAME_ALL], path) || [];
        }
      }
      for (const handlerMap of [middleware, routes]) {
        for (const m of methods) {
          for (const p in handlerMap[m]) {
            re.test(p) && handlerMap[m][p].push([handler, path]);
          }
        }
      }
      return;
    }
    const paths = (0, import_url.checkOptionalParameter)(path) || [path];
    for (const path2 of paths) {
      for (const m of methods) {
        if (!routes[m][path2]) {
          this.#insertPath(m, path2);
          routes[m][path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware[import_router.METHOD_NAME_ALL], path2) || [];
        }
        routes[m][path2].push([handler, path2]);
      }
    }
  }
  match = import_matcher.match;
  buildAllMatchers() {
    const matchers = (0, import_utils.createNullObject)();
    for (const method of Object.keys(this.#routes)) {
      matchers[method] = this.#buildMatcher(method);
    }
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = (0, import_utils.createNullObject)();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = (0, import_utils.createNullObject)();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes]) {
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, (0, import_utils.createNullObject)()]), import_matcher.emptyParam];
          continue;
        }
        handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [
          h,
          trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
            map[key] = paramReplacementMap[pathData[1][i][1]];
            return map;
          }, (0, import_utils.createNullObject)())
        ]);
      }
    }
    return [regexp, indexReplacementMap.map((i) => handlerData[i]), staticMap];
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RegExpRouter
});
