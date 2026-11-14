import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { createServer } from 'node:http'

export const name = 'browser-smoke-probe'
export const inject = ['tools', 'typertGateway', 'connection']

export async function apply(ctx, config) {
  const peer = ctx.connection.createPeer({ principal: { kind: 'owner' } })
  ctx.effect(() => () => peer.dispose())
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
    const { name, args, cancelAfterMs, rpc } = JSON.parse(Buffer.concat(chunks).toString())
    if (rpc !== undefined) {
      const result = await ctx.typertGateway.invoke({ ...rpc, peer, signal: AbortSignal.timeout(30_000) })
      response.end(JSON.stringify(result))
      return
    }
    const result = await ctx.tools.execute({
      calls: [{ type: 'tool-call', id: randomUUID(), name, arguments: JSON.stringify(args) }],
      signal: AbortSignal.timeout(cancelAfterMs ?? 30_000),
    })
    assert.equal(result.results.length, 1)
    response.end(JSON.stringify(result.results[0].result))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  console.log(`Browser smoke probe: http://127.0.0.1:${server.address().port}`)
  ctx.effect(() => () => new Promise(resolve => server.close(resolve)))
}
