import { createServer } from 'node:http'
import type { Server, ServerResponse } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_DISCOVERY_PORT,
  createDiscoveryHandler,
  discoveryUrl,
  startDiscoveryListener,
} from '../src/discovery.ts'

const open: Server[] = []

afterEach(async () => {
  for (const server of open.splice(0)) {
    await new Promise<void>((resolve) => { server.close(() => { resolve() }) })
  }
})

/** Start a server on an OS-assigned port and remember it for cleanup. */
async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => { resolve() })
  })
  open.push(server)
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('server did not bind a TCP port')
  return address.port
}

describe('discoveryUrl', () => {
  it('builds the loopback bridge URL the extension probes', () => {
    expect(discoveryUrl(10472)).toBe('ws://127.0.0.1:10472/ext/bridge')
  })
})

describe('createDiscoveryHandler', () => {
  it('publishes the live web port on every request', async () => {
    let webPort = 10472
    const port = await listen(createServer(createDiscoveryHandler(() => webPort)))
    const first = await fetch(`http://127.0.0.1:${String(port)}/ext/bridge-config`)
    expect(first.status).toBe(200)
    expect(first.headers.get('cache-control')).toBe('no-store')
    expect(await first.json()).toEqual({ wsUrl: 'ws://127.0.0.1:10472/ext/bridge' })

    webPort = 20481
    const second = await fetch(`http://127.0.0.1:${String(port)}/ext/bridge-config`)
    expect(await second.json()).toEqual({ wsUrl: 'ws://127.0.0.1:20481/ext/bridge' })
  })

  it('answers HEAD without a body and rejects everything else', async () => {
    const port = await listen(createServer(createDiscoveryHandler(() => 10472)))
    const head = await fetch(`http://127.0.0.1:${String(port)}/ext/bridge-config`, { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(await head.text()).toBe('')

    const post = await fetch(`http://127.0.0.1:${String(port)}/ext/bridge-config`, { method: 'POST' })
    expect(post.status).toBe(405)

    const missing = await fetch(`http://127.0.0.1:${String(port)}/ext/bridge`)
    expect(missing.status).toBe(404)
  })
})

describe('startDiscoveryListener', () => {
  it('binds the requested port and republishes the live bridge URL', async () => {
    const warnings: string[] = []
    const server = await startDiscoveryListener({
      port: 0,
      webPort: () => 10472,
      warn: message => { warnings.push(message) },
    })
    if (server === undefined) throw new Error('expected a discovery listener')
    open.push(server)
    const address = server.address()
    if (address === null || typeof address === 'string') throw new Error('no port')
    const response = await fetch(`http://127.0.0.1:${String(address.port)}/ext/bridge-config`)
    expect(await response.json()).toEqual({ wsUrl: 'ws://127.0.0.1:10472/ext/bridge' })
    expect(warnings).toEqual([])
  })

  it('skips the listener when the discovery port is already the web port', async () => {
    const warnings: string[] = []
    const server = await startDiscoveryListener({
      port: DEFAULT_DISCOVERY_PORT,
      webPort: () => DEFAULT_DISCOVERY_PORT,
      warn: message => { warnings.push(message) },
    })
    expect(server).toBeUndefined()
    expect(warnings[0]).toMatch(/already answers there/)
  })

  it('degrades to a warning when the port is taken', async () => {
    const blocker = createServer((_req, res: ServerResponse) => { res.writeHead(204).end() })
    const port = await listen(blocker)
    const warnings: string[] = []
    const server = await startDiscoveryListener({
      port,
      webPort: () => 10472,
      warn: message => { warnings.push(message) },
    })
    expect(server).toBeUndefined()
    expect(warnings[0]).toMatch(/unavailable/)
  })
})
