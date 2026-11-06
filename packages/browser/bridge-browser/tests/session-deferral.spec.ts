import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ImageAttachmentLimits } from '@deepseek-ai/dsh-attachment'
import type { BrowserHostApi, HostRpcCall, HostRpcResult } from '../src/host-api.ts'
import { withSessionDeferral } from '../src/session-deferral.ts'

function apiHarness() {
  const sessionCreate = vi.fn(async (call: HostRpcCall): Promise<HostRpcResult> => ({
    ok: true,
    value: { sessionId: (call.payload as { sessionId: string }).sessionId },
  }))
  const sessionHistory = vi.fn(async (): Promise<HostRpcResult> => ({
    ok: true,
    value: { events: [{ event: { type: 'user/message' } }], hasMore: false },
  }))
  const sessionPrompt = vi.fn(async (): Promise<HostRpcResult> => ({
    ok: true,
    value: { accepted: true },
  }))
  const call = vi.fn(async (request: HostRpcCall): Promise<HostRpcResult> => {
    if (request.method === 'session.create') return sessionCreate(request)
    if (request.method === 'session.history') return sessionHistory(request)
    if (request.method === 'session.prompt') return sessionPrompt(request)
    return { ok: false, error: { code: 'not-found', message: request.method, details: {} } }
  })
  const api: BrowserHostApi = {
    call,
    async *events() {},
    respond: async () => ({ accepted: false }),
  }
  return { api, call, sessionCreate, sessionHistory, sessionPrompt }
}

function request(method: string, payload: unknown, rpcId = method): HostRpcCall {
  return { rpcId, method, payload, signal: new AbortController().signal }
}

async function provisionalId(api: BrowserHostApi, rpcId = 'create-rpc'): Promise<string> {
  const response = await api.call(request('session.create', {}, rpcId))
  if (!response.ok || typeof (response.value as { sessionId?: unknown }).sessionId !== 'string') {
    throw new Error('provisional create failed')
  }
  return (response.value as { sessionId: string }).sessionId
}

describe('withSessionDeferral', () => {
  afterEach(() => { vi.useRealTimers() })

  it('mints a provisional id without touching the Host', async () => {
    const { api, call } = apiHarness()
    const wrapped = withSessionDeferral(api, true)

    expect(await provisionalId(wrapped)).toMatch(/^session-/)
    expect(call).not.toHaveBeenCalled()
  })

  it('honors an explicit session id', async () => {
    const { api } = apiHarness()
    const wrapped = withSessionDeferral(api, true)

    await expect(wrapped.call(request('session.create', { sessionId: 'session-fixed' })))
      .resolves.toEqual({ ok: true, value: { sessionId: 'session-fixed' } })
  })

  it('serves provisional history locally and passes real history through', async () => {
    const { api, sessionHistory } = apiHarness()
    const wrapped = withSessionDeferral(api, true)
    const id = await provisionalId(wrapped)

    await expect(wrapped.call(request('session.history', { sessionId: id })))
      .resolves.toEqual({ ok: true, value: { events: [], hasMore: false } })
    expect(sessionHistory).not.toHaveBeenCalled()

    await wrapped.call(request('session.history', { sessionId: 'session-real' }))
    expect(sessionHistory).toHaveBeenCalledOnce()
  })

  it('projects image limits before materialization', async () => {
    const { api } = apiHarness()
    const limits: ImageAttachmentLimits = {
      maxImageBytes: 1024,
      maxImagesPerMessage: 4,
      maxMessageImageBytes: 4096,
      maxImagePixels: 1_000_000,
      maxImageDimension: 1200,
      mediaTypes: ['image/png', 'image/jpeg'],
    }
    const wrapped = withSessionDeferral(api, true, limits)
    const id = await provisionalId(wrapped)

    await expect(wrapped.call(request('session.history', { sessionId: id }))).resolves.toEqual({
      ok: true,
      value: {
        events: [],
        hasMore: false,
        projections: { asOfSeq: -1, values: { imageLimits: limits } },
      },
    })
  })

  it('materializes on first prompt and replays the create payload', async () => {
    const { api, sessionCreate, sessionPrompt, sessionHistory } = apiHarness()
    const wrapped = withSessionDeferral(api, true)
    const created = await wrapped.call(request('session.create', { cwd: '/work' }))
    if (!created.ok) throw new Error('create failed')
    const id = (created.value as { sessionId: string }).sessionId
    const prompt = request('session.prompt', { sessionId: id, mode: 'queue', content: [] }, 'prompt')

    await wrapped.call(prompt)

    expect(sessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      method: 'session.create', payload: { cwd: '/work', sessionId: id },
    }))
    expect(sessionPrompt).toHaveBeenCalledWith(prompt)
    await wrapped.call(request('session.history', { sessionId: id }))
    expect(sessionHistory).toHaveBeenCalledOnce()
  })

  it('deduplicates concurrent prompts into one materialization', async () => {
    const { api, sessionCreate, sessionPrompt } = apiHarness()
    let release: (() => void) | undefined
    sessionCreate.mockImplementationOnce(async (call: HostRpcCall) => {
      await new Promise<void>((resolve) => { release = resolve })
      return { ok: true, value: { sessionId: (call.payload as { sessionId: string }).sessionId } }
    })
    const wrapped = withSessionDeferral(api, true)
    const id = await provisionalId(wrapped)

    const first = wrapped.call(request('session.prompt', { sessionId: id }, 'p1'))
    const second = wrapped.call(request('session.prompt', { sessionId: id }, 'p2'))
    await vi.waitFor(() => { expect(release).toBeDefined() })
    release?.()
    await Promise.all([first, second])

    expect(sessionCreate).toHaveBeenCalledOnce()
    expect(sessionPrompt).toHaveBeenCalledTimes(2)
  })

  it('retains the provisional entry after a business failure and retries', async () => {
    const { api, sessionCreate, sessionPrompt } = apiHarness()
    sessionCreate.mockResolvedValueOnce({
      ok: false,
      error: { code: 'internal', message: 'boom', details: {} },
    })
    const wrapped = withSessionDeferral(api, true)
    const id = await provisionalId(wrapped)

    await expect(wrapped.call(request('session.prompt', { sessionId: id }, 'p1'))).resolves.toEqual({
      ok: false, error: { code: 'internal', message: 'boom', details: {} },
    })
    expect(sessionPrompt).not.toHaveBeenCalled()
    await wrapped.call(request('session.prompt', { sessionId: id }, 'p2'))
    expect(sessionCreate).toHaveBeenCalledTimes(2)
    expect(sessionPrompt).toHaveBeenCalledOnce()
  })

  it('serves provisional model catalogs from session.models and defers selectModel', async () => {
    const { api, call } = apiHarness()
    call.mockImplementation(async (request: HostRpcCall): Promise<HostRpcResult> => {
      if (request.method === 'session.create') {
        return { ok: true, value: { sessionId: (request.payload as { sessionId: string }).sessionId } }
      }
      if (request.method === 'session.prompt') return { ok: true, value: { accepted: true } }
      if (request.method === 'session.models') {
        return {
          ok: true,
          value: {
            current: { provider: 'deepseek-official', model: 'deepseek-v4-flash' },
            routable: true,
            groups: [{
              id: 'deepseek-official',
              name: 'DeepSeek',
              models: [{ id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash' }],
            }],
            failures: [],
          },
        }
      }
      if (request.method === 'session.selectModel') {
        return { ok: true, value: { selected: request.payload } }
      }
      return { ok: false, error: { code: 'not-found', message: request.method, details: {} } }
    })
    const wrapped = withSessionDeferral(api, true)
    const id = await provisionalId(wrapped)

    await expect(wrapped.call(request('session.models', { sessionId: id }))).resolves.toEqual({
      ok: true,
      value: {
        current: { provider: 'deepseek-official', model: 'deepseek-v4-flash' },
        routable: true,
        groups: [{
          id: 'deepseek-official',
          name: 'DeepSeek',
          models: [{ id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash' }],
        }],
        failures: [],
      },
    })

    await expect(wrapped.call(request('session.selectModel', {
      sessionId: id,
      provider: 'deepseek-official',
      model: 'deepseek-v4-pro',
    }))).resolves.toEqual({
      ok: true,
      value: { selected: { provider: 'deepseek-official', model: 'deepseek-v4-pro' } },
    })

    await wrapped.call(request('session.prompt', { sessionId: id, mode: 'queue', content: [] }, 'prompt'))
    expect(call).toHaveBeenCalledWith(expect.objectContaining({
      method: 'session.selectModel',
      payload: { sessionId: id, provider: 'deepseek-official', model: 'deepseek-v4-pro' },
    }))
  })

  it.each(['business failure', 'exception'])('blocks prompts after a model %s and retries without recreating the Session', async (kind) => {
    const { api, call, sessionCreate, sessionPrompt, sessionHistory } = apiHarness()
    const original = call.getMockImplementation()!
    const failure = { ok: false as const, error: { code: 'session/model-unavailable', message: 'model unavailable', details: {} } }
    const select = vi.fn<() => Promise<HostRpcResult>>()
    if (kind === 'exception') select.mockRejectedValueOnce(new Error('model unavailable'))
    else select.mockResolvedValueOnce(failure)
    select.mockResolvedValue({ ok: true, value: { selected: { provider: 'p', model: 'chosen' } } })
    call.mockImplementation((request) => request.method === 'session.selectModel' ? select() : original(request))
    const wrapped = withSessionDeferral(api, true)
    const id = await provisionalId(wrapped)
    await wrapped.call(request('session.selectModel', { sessionId: id, provider: 'p', model: 'chosen' }))

    const first = wrapped.call(request('session.prompt', { sessionId: id }, 'first'))
    if (kind === 'exception') await expect(first).rejects.toThrow('model unavailable')
    else await expect(first).resolves.toEqual(failure)
    expect(sessionPrompt).not.toHaveBeenCalled()
    await wrapped.call(request('session.history', { sessionId: id }))
    expect(sessionHistory).toHaveBeenCalledOnce()

    // Expiry must not discard the choice after creation has already succeeded.
    vi.useFakeTimers()
    vi.advanceTimersByTime(31 * 60_000)
    await provisionalId(wrapped, 'another-session')
    await expect(wrapped.call(request('session.prompt', { sessionId: id }, 'retry')))
      .resolves.toEqual({ ok: true, value: { accepted: true } })
    expect(sessionCreate).toHaveBeenCalledOnce()
    expect(select).toHaveBeenCalledTimes(2)
    expect(sessionPrompt).toHaveBeenCalledOnce()
  })

  it('holds concurrent prompts until the latest deferred choice is installed', async () => {
    const { api, call, sessionCreate, sessionPrompt } = apiHarness()
    const original = call.getMockImplementation()!
    let release: ((result: HostRpcResult) => void) | undefined
    const select = vi.fn(async (): Promise<HostRpcResult> => ({ ok: true, value: {} }))
      .mockImplementationOnce(() => new Promise((resolve) => { release = resolve }))
    call.mockImplementation((request) => request.method === 'session.selectModel' ? select() : original(request))
    const wrapped = withSessionDeferral(api, true)
    const id = await provisionalId(wrapped)
    await wrapped.call(request('session.selectModel', { sessionId: id, provider: 'p', model: 'first-choice' }))
    const first = wrapped.call(request('session.prompt', { sessionId: id }, 'first'))
    await vi.waitFor(() => { expect(release).toBeDefined() })
    const second = wrapped.call(request('session.prompt', { sessionId: id }, 'second'))
    await wrapped.call(request('session.selectModel', { sessionId: id, provider: 'p', model: 'latest-choice' }))
    expect(sessionPrompt).not.toHaveBeenCalled()
    release?.({ ok: true, value: {} })
    await Promise.all([first, second])
    expect(sessionCreate).toHaveBeenCalledOnce()
    expect(select).toHaveBeenCalledTimes(2)
    expect(sessionPrompt).toHaveBeenCalledTimes(2)
    expect(call.mock.calls.filter(([request]) => request.method === 'session.selectModel')
      .map(([request]) => request.payload)).toEqual([
      { sessionId: id, provider: 'p', model: 'first-choice' },
      { sessionId: id, provider: 'p', model: 'latest-choice' },
    ])
  })

  it('prunes stale provisional entries and returns the original API when disabled', async () => {
    vi.useFakeTimers()
    const { api, sessionHistory } = apiHarness()
    const wrapped = withSessionDeferral(api, true)
    const first = await provisionalId(wrapped, 'c1')
    vi.advanceTimersByTime(31 * 60_000)
    const second = await provisionalId(wrapped, 'c2')

    await wrapped.call(request('session.history', { sessionId: first }))
    await wrapped.call(request('session.history', { sessionId: second }))
    expect(sessionHistory).toHaveBeenCalledOnce()
    expect(withSessionDeferral(api, false)).toBe(api)
  })

  const permissionCatalog = {
    options: [
      { value: 'read-only', name: 'Read Only' },
      { value: 'workspace-write', name: 'Workspace Write' },
      { value: 'danger-full-access', name: 'Full access' },
    ],
    defaultOptions: [
      { value: 'read-only', name: 'Read Only' },
      { value: 'workspace-write', name: 'Workspace Write' },
    ],
    defaultPreset: 'workspace-write',
  }

  function composerHarness(
    setPermission: (call: HostRpcCall) => Promise<HostRpcResult> = async (call: HostRpcCall) => ({
      ok: true,
      value: {
        preset: (call.payload as { preset: string }).preset,
        commandId: 'command-1',
        result: { kind: 'success' },
      },
    }),
  ) {
    const harness = apiHarness()
    const applied = vi.fn(setPermission)
    const original = harness.call.getMockImplementation()!
    harness.call.mockImplementation(async (call: HostRpcCall): Promise<HostRpcResult> => {
      if (call.method === 'permission.catalog') return { ok: true, value: permissionCatalog }
      if (call.method === 'session.setPermission') return applied(call)
      return original(call)
    })
    return { ...harness, applied }
  }

  it('answers a provisional permission directory and defers the preset switch', async () => {
    const { api, applied } = composerHarness()
    const wrapped = withSessionDeferral(api, true)
    const id = await provisionalId(wrapped)

    await expect(wrapped.call(request('session.permissions', { sessionId: id }))).resolves.toEqual({
      ok: true,
      value: {
        current: 'workspace-write',
        routable: true,
        provisional: true,
        options: permissionCatalog.options,
        defaultOptions: permissionCatalog.defaultOptions,
        defaultPreset: 'workspace-write',
      },
    })

    await expect(wrapped.call(request('session.setPermission', { sessionId: id, preset: 'danger-full-access' })))
      .resolves.toEqual({
        ok: true,
        value: { preset: 'danger-full-access', provisional: true, result: { kind: 'success' } },
      })
    expect(applied).not.toHaveBeenCalled()

    // The pending choice is what the next turn will run under.
    await expect(wrapped.call(request('session.permissions', { sessionId: id }))).resolves.toMatchObject({
      ok: true,
      value: { current: 'danger-full-access', provisional: true },
    })

    await wrapped.call(request('session.prompt', { sessionId: id, mode: 'queue', content: [] }, 'prompt'))
    expect(applied).toHaveBeenCalledWith(expect.objectContaining({
      method: 'session.setPermission',
      payload: { sessionId: id, preset: 'danger-full-access' },
    }))
  })

  it('applies the deferred preset before the deferred model choice', async () => {
    const order: string[] = []
    const { api, call, applied } = composerHarness(async (request: HostRpcCall) => {
      order.push(request.method)
      return { ok: true, value: { preset: (request.payload as { preset: string }).preset } }
    })
    const original = call.getMockImplementation()!
    call.mockImplementation(async (request: HostRpcCall): Promise<HostRpcResult> => {
      if (request.method === 'session.selectModel') {
        order.push(request.method)
        return { ok: true, value: { selected: request.payload } }
      }
      return original(request)
    })
    const wrapped = withSessionDeferral(api, true)
    const id = await provisionalId(wrapped)
    await wrapped.call(request('session.setPermission', { sessionId: id, preset: 'read-only' }))
    await wrapped.call(request('session.selectModel', { sessionId: id, provider: 'p', model: 'm' }))

    await wrapped.call(request('session.prompt', { sessionId: id }, 'prompt'))

    expect(applied).toHaveBeenCalledOnce()
    expect(order).toEqual(['session.setPermission', 'session.selectModel'])
  })

  it('rejects an unknown provisional preset without recording it', async () => {
    const { api, applied } = composerHarness()
    const wrapped = withSessionDeferral(api, true)
    const id = await provisionalId(wrapped)

    await expect(wrapped.call(request('session.setPermission', { sessionId: id, preset: 'custom' })))
      .resolves.toEqual({
        ok: false,
        error: { code: 'bad-request', message: 'unknown permission preset "custom"', details: {} },
      })
    await expect(wrapped.call(request('session.permissions', { sessionId: id }))).resolves.toMatchObject({
      ok: true, value: { current: 'workspace-write' },
    })
    expect(applied).not.toHaveBeenCalled()
  })

  it('blocks the first prompt when the deferred preset cannot be applied', async () => {
    const failure = {
      ok: false as const,
      error: { code: 'gateway/context-not-found', message: 'no agent', details: {} },
    }
    const { api, applied, sessionPrompt } = composerHarness(async () => failure)
    const wrapped = withSessionDeferral(api, true)
    const id = await provisionalId(wrapped)
    await wrapped.call(request('session.setPermission', { sessionId: id, preset: 'read-only' }))

    await expect(wrapped.call(request('session.prompt', { sessionId: id }, 'first'))).resolves.toEqual(failure)
    expect(sessionPrompt).not.toHaveBeenCalled()

    // The choice survives for the retry.
    applied.mockResolvedValueOnce({ ok: true, value: { preset: 'read-only' } })
    await expect(wrapped.call(request('session.prompt', { sessionId: id }, 'retry')))
      .resolves.toEqual({ ok: true, value: { accepted: true } })
  })

  it('answers empty command and skill directories for a provisional id', async () => {
    const { api, call } = composerHarness()
    const wrapped = withSessionDeferral(api, true)
    const id = await provisionalId(wrapped)

    await expect(wrapped.call(request('commands.list', { sessionId: id })))
      .resolves.toEqual({ ok: true, value: { commands: [], provisional: true } })
    await expect(wrapped.call(request('skills.list', { sessionId: id })))
      .resolves.toEqual({ ok: true, value: { skills: [], provisional: true } })
    expect(call.mock.calls.filter(([request]) => request.method === 'commands.list')).toHaveLength(0)
    expect(call.mock.calls.filter(([request]) => request.method === 'skills.list')).toHaveLength(0)
  })

  it('treats a /permission line as the provisional preset switch and refuses other commands', async () => {
    const { api, applied } = composerHarness()
    const wrapped = withSessionDeferral(api, true)
    const id = await provisionalId(wrapped)

    await expect(wrapped.call(request('commands.execute', { sessionId: id, line: '/permission read-only' })))
      .resolves.toEqual({
        ok: true,
        value: { preset: 'read-only', provisional: true, result: { kind: 'success' } },
      })
    await expect(wrapped.call(request('commands.execute', { sessionId: id, line: '/compact' })))
      .resolves.toEqual({
        ok: false,
        error: {
          code: 'provisional-session',
          message: 'this command needs a real session: send the first message to create it',
          details: {},
        },
      })
    await wrapped.call(request('session.prompt', { sessionId: id }, 'prompt'))
    expect(applied).toHaveBeenCalledWith(expect.objectContaining({
      payload: { sessionId: id, preset: 'read-only' },
    }))
  })

  it('passes composer methods through once the id is no longer provisional', async () => {
    const { api, call } = composerHarness()
    call.mockImplementation(async (request: HostRpcCall): Promise<HostRpcResult> => (
      request.method === 'session.prompt'
        ? { ok: true, value: { accepted: true } }
        : { ok: true, value: { passedThrough: request.method } }
    ))
    const wrapped = withSessionDeferral(api, true)

    await expect(wrapped.call(request('commands.execute', { sessionId: 'session-real', line: '/compact' })))
      .resolves.toEqual({ ok: true, value: { passedThrough: 'commands.execute' } })
    await expect(wrapped.call(request('session.permissions', { sessionId: 'session-real' })))
      .resolves.toEqual({ ok: true, value: { passedThrough: 'session.permissions' } })
  })
})
