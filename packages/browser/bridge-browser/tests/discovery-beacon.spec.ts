import { createServer, request, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isBeaconHost,
  isLoopbackBindAddress,
  sanitizeBeaconPorts,
  startDiscoveryBeacon,
  type DiscoveryBeacon,
} from '../src/discovery-beacon.ts'

const servers: Server[] = []
const beacons: DiscoveryBeacon[] = []

/** Bind a throwaway server on an ephemeral loopback port, run `answer`, and report the port. */
async function occupy(answer?: (port: number) => (req: unknown, res: import('node:http').ServerResponse) => void): Promise<number> {
  const server = createServer(answer === undefined
    ? undefined
    : (req, res) => {
        const port = (server.address() as AddressInfo).port
        answer(port)(req, res)
      })
  servers.push(server)
  await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', () => { resolve() }) })
  return (server.address() as AddressInfo).port
}

/** A loopback port that no test server holds right now. */
async function freePort(taken: ReadonlySet<number> = new Set()): Promise<number> {
  for (;;) {
    const port = await occupy()
    const server = servers.pop() as Server
    await new Promise<void>((resolve) => { server.close(() => { resolve() }) })
    if (!taken.has(port)) return port
  }
}

/** One HTTP request against a beacon, with full control over the Host header. */
function send(
  port: number,
  path: string,
  options: { method?: string; host?: string } = {},
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {}
    if (options.host !== undefined) headers.host = options.host
    const req = request({
      host: '127.0.0.1',
      port,
      path,
      method: options.method ?? 'GET',
      headers,
    }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk: string) => { body += chunk })
      res.on('end', () => { resolve({ status: res.statusCode ?? 0, body }) })
    })
    req.on('error', reject)
    req.end()
  })
}

afterEach(async () => {
  for (const beacon of beacons.splice(0)) await beacon.close()
  for (const server of servers.splice(0)) await new Promise<void>((resolve) => { server.close(() => { resolve() }) })
})

describe('sanitizeBeaconPorts', () => {
  it('drops unusable ports and duplicates while preserving order', () => {
    expect(sanitizeBeaconPorts([43190, 0, 43189, 43190, 70000, 1.5, 22])).toEqual([43190, 43189, 22])
  })
})

describe('isBeaconHost', () => {
  it('accepts the loopback authorities a browser probe sends', () => {
    expect(isBeaconHost('127.0.0.1:43189', 43189)).toBe(true)
    expect(isBeaconHost('127.0.0.1', 43189)).toBe(true)
    expect(isBeaconHost('localhost:43189', 43189)).toBe(true)
  })

  it('rejects a foreign name, a different port, and IPv6 authorities', () => {
    expect(isBeaconHost('evil.example:43189', 43189)).toBe(false)
    expect(isBeaconHost('127.0.0.1:43190', 43189)).toBe(false)
    expect(isBeaconHost('[::1]:43189', 43189)).toBe(false)
    expect(isBeaconHost(undefined, 43189)).toBe(false)
  })
})

describe('isLoopbackBindAddress', () => {
  it('accepts loopback literals, including zone and mapped forms', () => {
    expect(isLoopbackBindAddress('127.0.0.1')).toBe(true)
    expect(isLoopbackBindAddress('127.5.5.5')).toBe(true)
    expect(isLoopbackBindAddress('::1')).toBe(true)
    expect(isLoopbackBindAddress('::ffff:127.0.0.1')).toBe(true)
    expect(isLoopbackBindAddress('fe80::1%eth0')).toBe(false)
  })

  it('rejects wildcard and routable binds', () => {
    expect(isLoopbackBindAddress('0.0.0.0')).toBe(false)
    expect(isLoopbackBindAddress('10.0.0.7')).toBe(false)
    expect(isLoopbackBindAddress('::')).toBe(false)
  })

  it('assumes loopback when the host does not report an address', () => {
    expect(isLoopbackBindAddress(undefined)).toBe(true)
  })
})

describe('startDiscoveryBeacon', () => {
  it('answers the config path with the real bridge URL on the first free port', async () => {
    const port = await freePort()
    const beacon = await startDiscoveryBeacon({
      hostPort: 51801,
      ports: [port, await freePort(new Set([port]))],
      info: { pid: 4242, startedAt: '2026-10-18T00:00:00.000Z' },
    })
    expect(beacon?.port).toBe(port)
    if (beacon === undefined) throw new Error('beacon did not bind')
    beacons.push(beacon)

    const response = await send(port, '/ext/bridge-config')
    expect(response.status).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      wsUrl: 'ws://127.0.0.1:51801/ext/bridge',
      beacon: true,
      pid: 4242,
      startedAt: '2026-10-18T00:00:00.000Z',
    })
  })

  it('moves to the next candidate when the first port is taken', async () => {
    const taken = await occupy()
    const free = await freePort(new Set([taken]))
    const beacon = await startDiscoveryBeacon({ hostPort: 3080, ports: [taken, free] })
    if (beacon === undefined) throw new Error('beacon did not bind')
    beacons.push(beacon)

    expect(beacon.port).toBe(free)
    const response = await send(free, '/ext/bridge-config')
    expect(JSON.parse(response.body).wsUrl).toBe('ws://127.0.0.1:3080/ext/bridge')
  })

  it('serves only the config path over GET and HEAD', async () => {
    const port = await freePort()
    const beacon = await startDiscoveryBeacon({ hostPort: 3080, ports: [port] })
    if (beacon === undefined) throw new Error('beacon did not bind')
    beacons.push(beacon)

    expect((await send(port, '/ext/bridge')).status).toBe(404)
    expect((await send(port, '/ext/bridge-config', { method: 'POST' })).status).toBe(405)
    expect((await send(port, '/ext/bridge-config', { method: 'HEAD' })).status).toBe(200)
  })

  it('rejects a rebound Host header', async () => {
    const port = await freePort()
    const beacon = await startDiscoveryBeacon({ hostPort: 3080, ports: [port] })
    if (beacon === undefined) throw new Error('beacon did not bind')
    beacons.push(beacon)

    expect((await send(port, '/ext/bridge-config', { host: 'attacker.example' })).status).toBe(403)
  })

  it('reports 503 until the host reports its port', async () => {
    const port = await freePort()
    const beacon = await startDiscoveryBeacon({ hostPort: () => undefined, ports: [port] })
    if (beacon === undefined) throw new Error('beacon did not bind')
    beacons.push(beacon)

    expect((await send(port, '/ext/bridge-config')).status).toBe(503)
  })

  it('gives up quietly (with one warning) when every candidate is taken', async () => {
    const first = await occupy()
    const second = await occupy()
    const warn = vi.fn()

    const beacon = await startDiscoveryBeacon({ hostPort: 3080, ports: [first, second], warn })

    expect(beacon).toBeUndefined()
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]?.[0]).toMatch(/every discovery beacon port is busy/)
  })

  it('advertises its own bound port when it accepts paired upgrades', async () => {
    const port = await freePort()
    const upgrade = vi.fn()
    const beacon = await startDiscoveryBeacon({ hostPort: 3080, ports: [port], upgrade })
    if (beacon === undefined) throw new Error('beacon did not bind')
    beacons.push(beacon)

    const config = await send(port, '/ext/bridge-config')
    expect(config.status).toBe(200)
    expect(JSON.parse(config.body)).toMatchObject({ wsUrl: `ws://127.0.0.1:${port}/ext/bridge`, beacon: true })
  })

  it('admits only extension upgrades on the paired path and closes them with the beacon', async () => {
    const port = await freePort()
    const upgrade = vi.fn((_req, socket) => {
      socket.write('HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n')
    })
    const beacon = await startDiscoveryBeacon({ hostPort: 3080, ports: [port], upgrade })
    if (beacon === undefined) throw new Error('beacon did not bind')
    beacons.push(beacon)

    const chrome = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop'
    const firefox = 'moz-extension://8eb30a3f-ad6b-4da1-8960-b6bded4431ee'
    const attempt = (origin?: string, host?: string, path = '/ext/bridge') => new Promise<{ status: number; socketsClosed?: Promise<void> }>((resolve, reject) => {
      const req = request({ host: '127.0.0.1', port, path, headers: { Connection: 'Upgrade', Upgrade: 'websocket', ...(origin ? { Origin: origin } : {}), ...(host ? { Host: host } : {}) } })
      req.on('error', reject)
      req.on('response', res => { res.resume(); resolve({ status: res.statusCode ?? 0 }) })
      req.on('upgrade', (res, socket) => {
        socket.resume()
        resolve({ status: res.statusCode ?? 0, socketsClosed: new Promise(ok => socket.once('close', ok)) })
      })
      req.end()
    })
    expect(await attempt()).toEqual({ status: 403 })
    expect(await attempt('https://example.test')).toEqual({ status: 403 })
    expect(await attempt(chrome, 'example.test')).toEqual({ status: 403 })
    expect(await attempt(chrome, undefined, '/elsewhere')).toEqual({ status: 404 })
    expect(upgrade).not.toHaveBeenCalled()

    const connections = await Promise.all([attempt(chrome), attempt(firefox)])
    expect(connections.map(connection => connection.status)).toEqual([101, 101])
    await beacon.close()
    await Promise.all(connections.map(connection => connection.socketsClosed))
  })

  it('releases the port on close', async () => {
    const port = await freePort()
    const beacon = await startDiscoveryBeacon({ hostPort: 3080, ports: [port] })
    if (beacon === undefined) throw new Error('beacon did not bind')

    await beacon.close()

    await expect(send(port, '/ext/bridge-config')).rejects.toThrow()
  })
})
