// src/middleware/pretty-json/index.ts
var jsonContentTypeRegex = /^application\/(?:[a-z0-9._-]+\+)?json(?=$|[;\s])/i;
var prettyJSON = (options) => {
  const targetQuery = options?.query ?? "pretty";
  return async function prettyJSON2(c, next) {
    const pretty = options?.force || c.req.query(targetQuery) || c.req.query(targetQuery) === "";
    await next();
    const contentType = c.res.headers.get("Content-Type");
    if (pretty && contentType && jsonContentTypeRegex.test(contentType)) {
      const obj = await c.res.json();
      c.res = new Response(JSON.stringify(obj, null, options?.space ?? 2), c.res);
    }
  };
};
export {
  prettyJSON
};
