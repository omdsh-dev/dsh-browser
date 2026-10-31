import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { dshHomePath } from '@deepseek-ai/dsh-home-paths'
import { BEACON_PORTS } from '../src/protocol.ts'
import { apply, assertPositiveInteger, Config, resolveConfig } from '../src/index.ts'

/**
 * The beacon opens real sockets; those are covered by discovery-beacon.spec.ts.
 * Mounting is asserted here through the factory, keeping this file hermetic.
 */
const beaconMock = vi.hoisted(() => ({
  start: vi.fn(async (): Promise<{ port: number; close: () => Promise<void> } | undefined> => ({
    port: 43189,
    close: async () => {},
  })),
}))

vi.mock('../src/discovery-beacon.ts', async importOriginal => ({
  ...(await importOriginal<typeof import('../src/discovery-beacon.ts')>()),
  startDiscoveryBeacon: beaconMock.start,
}))

/** Minimal context stub: apply only needs the services at registration time. */
function stubContext(): Context {
  const gateway = {
    wireStream: {
      open: async (): Promise<AsyncIterable<unknown>> => ({
        async *[Symbol.asyncIterator]() { yield { type: 'ready', clientId: 'test', host: { home: '/tmp' } } },
      }),
      failure: (error: unknown) => ({ code: 'internal', message: String(error), details: {} }),
    },
    invoke: async () => undefined,
  }
  const connection = {
    createSharedFetchHandler: () => ({
      fetch: async (_request: Request, _peer: unknown) => new Response('not found', { status: 404 }),
    }),
    createPeer: () => ({ signal: new AbortController().signal, dispose: async () => {} }),
  }
  return {
    webServer: { host: '127.0.0.1', port: 0, registerUpgrade: () => () => {}, register: () => () => {} },
    tools: { register: () => () => {} },
    agents: { get: () => undefined },
    get: (key: string) => key === 'typertGateway' ? gateway : key === 'connection' ? connection : undefined,
    on: () => () => {},
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    effect: (fn: () => unknown, label?: string) => {
      void label
      return fn() as () => void
    },
  } as unknown as Context
}

const dirs: string[] = []
beforeEach(() => {
  beaconMock.start.mockClear()
})
afterEach(async () => {
  vi.unstubAllEnvs()
  for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true })
})

describe('assertPositiveInteger', () => {
  it('accepts positive integers and rejects everything else', () => {
    expect(() => assertPositiveInteger('x', 1)).not.toThrow()
    expect(() => assertPositiveInteger('x', 0)).toThrow(/must be a positive integer/)
    expect(() => assertPositiveInteger('x', -1)).toThrow(/must be a positive integer/)
    expect(() => assertPositiveInteger('x', 1.5)).toThrow(/must be a positive integer/)
  })
})

/** Valid budgets (the Loader applies schema defaults; hand-built tests pass them explicitly). */
const VALID = { toolTimeoutMs: 90_000, snapshotMaxChars: 32_000, maxInteractiveItems: 60, devToolsMaxChars: 24_000 }

describe('config', () => {
  it('resolves defaults, including an enabled workspace under the dsh home', () => {
    expect(resolveConfig({})).toEqual({
      ...VALID,
      sessionWorkspacePath: dshHomePath('browser-sessions'),
      deferSessionCreate: true,
      beacon: true,
      beaconPorts: [...BEACON_PORTS],
    })
    expect(new Config().sessionWorkspacePath).toBe(dshHomePath('browser-sessions'))
    expect(new Config().beaconPorts).toEqual([...BEACON_PORTS])
  })

  it('preserves explicit values and the empty-string workspace opt-out', () => {
    expect(resolveConfig({
      token: 'fixed',
      toolTimeoutMs: 1,
      snapshotMaxChars: 500,
      maxInteractiveItems: 3,
      sessionWorkspacePath: '',
      deferSessionCreate: false,
      beacon: false,
    })).toEqual({
      token: 'fixed',
      toolTimeoutMs: 1,
      snapshotMaxChars: 500,
      maxInteractiveItems: 3,
      devToolsMaxChars: 24_000,
      sessionWorkspacePath: '',
      deferSessionCreate: false,
      beacon: false,
      beaconPorts: [...BEACON_PORTS],
    })
    expect(new Config({ sessionWorkspacePath: '' }).sessionWorkspacePath).toBe('')
  })

  it('rejects beacon ports that are not usable ports', () => {
    expect(() => resolveConfig({ beaconPorts: [0] })).toThrow(/1 through 65535/)
    expect(() => resolveConfig({ beaconPorts: [1.5] })).toThrow(/1 through 65535/)
    expect(() => resolveConfig({ beaconPorts: [] })).toThrow(/at least one port/)
  })

  it('keeps an empty port list when the beacon is disabled', () => {
    expect(resolveConfig({ beacon: false, beaconPorts: [] }).beaconPorts).toEqual([])
  })
})

describe('apply', () => {
  it('registers the bridge with a fixed token (no generation)', async () => {
    await apply(stubContext(), { token: 'fixed-token', ...VALID, sessionWorkspacePath: '' })
  })

  it.each([undefined, {}, { wireStream: {} }])('rejects unsupported Gateway capabilities: %j', async (gateway) => {
    const ctx = stubContext()
    const get = ctx.get.bind(ctx)
    vi.spyOn(ctx, 'get').mockImplementation((key) => key === 'typertGateway' ? gateway : get(key))
    const register = vi.spyOn(ctx.webServer, 'registerUpgrade')
    await expect(apply(ctx, { token: 'fixed-token', ...VALID })).rejects.toThrow(/dsh 0\.2\.1-rc\.5.*wireStream unavailable/)
    expect(register).not.toHaveBeenCalled()
  })

  it('rejects a Connection without the in-process Peer factory', async () => {
    const ctx = stubContext()
    const get = ctx.get.bind(ctx)
    vi.spyOn(ctx, 'get').mockImplementation((key) => key === 'connection'
      ? { createSharedFetchHandler: () => ({ fetch: async () => new Response(null, { status: 404 }) }) }
      : get(key))
    const register = vi.spyOn(ctx.webServer, 'registerUpgrade')
    await expect(apply(ctx, { token: 'fixed-token', ...VALID })).rejects.toThrow(/createPeer unavailable/)
    expect(register).not.toHaveBeenCalled()
  })

  it('leaves Remote event source ownership to the host composition', async () => {
    const ctx = stubContext()
    const gateway = ctx.get('typertGateway')
    const open = vi.spyOn(gateway.wireStream, 'open')

    await apply(ctx, { token: 'fixed-token', ...VALID, sessionWorkspacePath: '' })

    expect(open).not.toHaveBeenCalled()
  })

  it('generates and persists a token when none is configured', async () => {
    const home = await mkdtemp(join(tmpdir(), 'dsh-bridge-home-'))
    dirs.push(home)
    vi.stubEnv('DSH_HOME', home)
    await apply(stubContext(), VALID)
  })

  it('rejects invalid budgets loudly', async () => {
    await expect(apply(stubContext(), { ...VALID, toolTimeoutMs: 0 })).rejects.toThrow(/toolTimeoutMs/)
    await expect(apply(stubContext(), { ...VALID, snapshotMaxChars: -1 })).rejects.toThrow(/snapshotMaxChars/)
    await expect(apply(stubContext(), { ...VALID, snapshotMaxChars: 499 })).rejects.toThrow(/at least 500/)
  })

  it('advertises the bridge on the default beacon ports', async () => {
    await apply(stubContext(), { token: 'fixed-token', ...VALID, sessionWorkspacePath: '' })

    expect(beaconMock.start).toHaveBeenCalledOnce()
    expect(beaconMock.start.mock.calls[0]?.[0]).toMatchObject({
      ports: [...BEACON_PORTS],
      info: { pid: process.pid },
    })
  })

  it('honours a custom port list and the beacon opt-out', async () => {
    await apply(stubContext(), { token: 'fixed-token', ...VALID, sessionWorkspacePath: '', beaconPorts: [45111] })
    expect(beaconMock.start.mock.calls[0]?.[0]).toMatchObject({ ports: [45111] })

    beaconMock.start.mockClear()
    await apply(stubContext(), { token: 'fixed-token', ...VALID, sessionWorkspacePath: '', beacon: false })
    expect(beaconMock.start).not.toHaveBeenCalled()
  })

  it('skips the beacon when the host binds a non-loopback interface', async () => {
    const ctx = stubContext()
    Object.assign(ctx.webServer as unknown as Record<string, unknown>, { host: '10.0.0.7' })

    await apply(ctx, { token: 'fixed-token', ...VALID, sessionWorkspacePath: '' })

    expect(beaconMock.start).not.toHaveBeenCalled()
  })

  it('closes the beacon when the plugin is disposed', async () => {
    const close = vi.fn(async () => {})
    beaconMock.start.mockResolvedValueOnce({ port: 43190, close })
    let dispose: (() => unknown) | undefined
    const ctx = stubContext()
    const effect = ctx.effect.bind(ctx)
    vi.spyOn(ctx, 'effect').mockImplementation((fn: () => unknown, label?: string) => {
      const disposer = effect(fn, label) as (() => unknown) | undefined
      if (typeof label === 'string' && label.includes('discovery beacon')) dispose = disposer
      return disposer as () => void
    })

    await apply(ctx, { token: 'fixed-token', ...VALID, sessionWorkspacePath: '' })
    await vi.waitFor(() => { expect(beaconMock.start).toHaveBeenCalledOnce() })
    await Promise.resolve()
    expect(typeof dispose).toBe('function')
    await dispose?.()

    expect(close).toHaveBeenCalledOnce()
  })
})
