import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { dshHomePath } from '@deepseek-ai/dsh-home-paths'
import { apply, assertPositiveInteger, Config, resolveConfig } from '../src/index.ts'

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
    createSharedFetchHandler: () => ({ fetch: async () => new Response('not found', { status: 404 }) }),
  }
  return {
    webServer: { port: 0, registerUpgrade: () => () => {}, register: () => () => {} },
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
const VALID = { toolTimeoutMs: 90_000, snapshotMaxChars: 32_000, maxInteractiveItems: 60 }

describe('config', () => {
  it('resolves defaults, including an enabled workspace under the dsh home', () => {
    expect(resolveConfig({})).toEqual({
      ...VALID,
      sessionWorkspacePath: dshHomePath('browser-sessions'),
      deferSessionCreate: true,
    })
    expect(new Config().sessionWorkspacePath).toBe(dshHomePath('browser-sessions'))
  })

  it('preserves explicit values and the empty-string workspace opt-out', () => {
    expect(resolveConfig({
      token: 'fixed',
      toolTimeoutMs: 1,
      snapshotMaxChars: 500,
      maxInteractiveItems: 3,
      sessionWorkspacePath: '',
      deferSessionCreate: false,
    })).toEqual({
      token: 'fixed',
      toolTimeoutMs: 1,
      snapshotMaxChars: 500,
      maxInteractiveItems: 3,
      sessionWorkspacePath: '',
      deferSessionCreate: false,
    })
    expect(new Config({ sessionWorkspacePath: '' }).sessionWorkspacePath).toBe('')
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
    await expect(apply(ctx, { token: 'fixed-token', ...VALID })).rejects.toThrow(/dsh 0\.2\.0-rc\.1.*wireStream unavailable/)
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

  // dsh 0.2.1 requires a live Peer on every Gateway call; 0.2.0 has no
  // `createPeer` and must keep working without one.
  it('mints an owner Peer when the Connection offers one and disposes it with the plugin scope', async () => {
    const ctx = stubContext()
    const dispose = vi.fn()
    const peer = { signal: new AbortController().signal, principal: { kind: 'owner' as const }, dispose }
    const createPeer = vi.fn(() => peer)
    const connection = { ...(ctx.get('connection') as object), createPeer }
    const get = ctx.get.bind(ctx)
    vi.spyOn(ctx, 'get').mockImplementation((key) => key === 'connection' ? connection : get(key))
    const scopes: Array<() => unknown> = []
    const effect = ctx.effect.bind(ctx)
    vi.spyOn(ctx, 'effect').mockImplementation((fn, label) => {
      if (label !== 'bridge-browser: Host Peer scope') return effect(fn, label)
      // Cordis: the effect callback returns the disposer.
      scopes.push((fn as () => unknown)() as () => unknown)
      return () => {}
    })

    await apply(ctx, { token: 'fixed-token', ...VALID, sessionWorkspacePath: '' })

    expect(createPeer).toHaveBeenCalledWith({ principal: { kind: 'owner' } })
    expect(scopes).toHaveLength(1)
    expect(dispose).not.toHaveBeenCalled()
    scopes[0]?.()
    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('keeps the Peer slot empty on a runtime without createPeer (dsh 0.2.0)', async () => {
    const ctx = stubContext()
    const mint = vi.fn()
    const get = ctx.get.bind(ctx)
    vi.spyOn(ctx, 'get').mockImplementation((key) => key === 'connection' ? { createSharedFetchHandler: () => ({ fetch: async () => new Response('') }) } : get(key))
    vi.spyOn(ctx, 'effect').mockImplementation((fn, label) => {
      if (label === 'bridge-browser: Host Peer scope') mint()
      return (fn as () => unknown)() as () => void
    })

    await expect(apply(ctx, { token: 'fixed-token', ...VALID, sessionWorkspacePath: '' })).resolves.toBeUndefined()
    expect(mint).not.toHaveBeenCalled()
  })

  it('rejects invalid budgets loudly', async () => {
    await expect(apply(stubContext(), { ...VALID, toolTimeoutMs: 0 })).rejects.toThrow(/toolTimeoutMs/)
    await expect(apply(stubContext(), { ...VALID, snapshotMaxChars: -1 })).rejects.toThrow(/snapshotMaxChars/)
    await expect(apply(stubContext(), { ...VALID, snapshotMaxChars: 499 })).rejects.toThrow(/at least 500/)
  })
})
