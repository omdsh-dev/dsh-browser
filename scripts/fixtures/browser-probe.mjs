import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { createServer } from 'node:http'

export const name = 'browser-smoke-probe'
export const inject = ['tools']

export async function apply(ctx, config) {
  // 通过真实 Host 的工具执行链驱动扩展，不发起模型请求。
  const server = createServer(async (request, response) => {
    assert.equal(request.headers.authorization, `Bearer ${config.token}`)
    response.setHeader('content-type', 'application/json')
    if (request.method === 'GET') {
      response.end(JSON.stringify(ctx.tools.schemas().map(tool => tool.name)))
      return
    }
    assert.equal(request.method, 'POST')
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const { name, args } = JSON.parse(Buffer.concat(chunks).toString())
    const result = await ctx.tools.execute({
      callId: randomUUID(), name, arguments: args,
      signal: AbortSignal.timeout(30_000),
    })
    response.end(JSON.stringify(result))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  console.log(`Browser smoke probe: http://127.0.0.1:${server.address().port}`)
  ctx.effect(() => () => new Promise(resolve => server.close(resolve)))
}
