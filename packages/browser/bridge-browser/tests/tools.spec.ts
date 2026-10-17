import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { BridgeServer } from '../src/server.ts'
import { ADVANCED_BROWSER_TOOL_NAMES, BASE_BROWSER_TOOL_NAMES, BROWSER_TOOL_NAMES, registerBrowserTools } from '../src/tools.ts'

describe('registerBrowserTools', () => {
  function makeHarness() {
    const registered: { name: string; definition: Record<string, unknown> }[] = []
    const ctx = {
      tools: {
        register: vi.fn((definition: { name: string }) => {
          registered.push({ name: definition.name, definition: definition as Record<string, unknown> })
          return () => {}
        }),
      },
    } as unknown as Context
    const requestTool = vi.fn(async (_name: string, _args: Record<string, unknown>, _signal: AbortSignal, _timeoutMs?: number): Promise<unknown> => {
      return { text: 'ok' }
    })
    const bridge = { requestTool } as unknown as BridgeServer
    return { ctx, bridge, requestTool, registered }
  }

  it('registers only the base tool set unless advanced tools are enabled', () => {
    const { ctx, bridge, registered } = makeHarness()
    const disposers = registerBrowserTools(ctx, bridge, { toolTimeoutMs: 1_000, snapshotMaxChars: 12_000, maxInteractiveItems: 60 })
    expect(registered.map((r) => r.name).sort()).toEqual([...BASE_BROWSER_TOOL_NAMES].sort())
    expect(disposers.size).toBe(BASE_BROWSER_TOOL_NAMES.length)
    for (const dispose of disposers.values()) dispose()
  })

  it('registers the full tool set when advanced tools are enabled', () => {
    const { ctx, bridge, registered } = makeHarness()
    const disposers = registerBrowserTools(ctx, bridge, {
      toolTimeoutMs: 1_000,
      snapshotMaxChars: 12_000,
      maxInteractiveItems: 60,
      advancedTools: true,
    })
    expect(registered.map((r) => r.name).sort()).toEqual([...BROWSER_TOOL_NAMES].sort())
    expect(disposers.size).toBe(BROWSER_TOOL_NAMES.length)
    expect(registered.map((r) => r.name)).toEqual(expect.arrayContaining([...ADVANCED_BROWSER_TOOL_NAMES]))
    for (const dispose of disposers.values()) dispose()
  })

  it('executes browser_click with mapped args', async () => {
    const { ctx, bridge, requestTool, registered } = makeHarness()
    registerBrowserTools(ctx, bridge, { toolTimeoutMs: 1_000, snapshotMaxChars: 12_000, maxInteractiveItems: 60 })
    const tool = registered.find((r) => r.name === 'browser_click')!
    const exec = { signal: new AbortController().signal }
    const result = await (tool.definition.execute as (args: unknown, e: { signal: AbortSignal }) => Promise<unknown>)({ index: 3, frame: 7 }, exec)
    expect(requestTool).toHaveBeenCalledWith('browser_click', { index: 3, frame: 7 }, exec.signal, 1_000)
    expect(result).toEqual({ text: 'ok' })
  })

  it('associates browser calls with the owning Agent session', async () => {
    const { ctx, bridge, requestTool, registered } = makeHarness()
    registerBrowserTools(ctx, bridge, { toolTimeoutMs: 1_000, snapshotMaxChars: 12_000, maxInteractiveItems: 60 })
    const tool = registered.find((r) => r.name === 'browser_click')!
    const exec = {
      signal: new AbortController().signal,
      agent: { id: 'session-browser' },
    }

    await (tool.definition.execute as (args: unknown, e: typeof exec) => Promise<unknown>)({ index: 3 }, exec)

    expect(requestTool).toHaveBeenCalledWith(
      'browser_click',
      { index: 3 },
      exec.signal,
      1_000,
      'session-browser',
    )
  })

  it('normalizes snapshot args (delta/region omitted when absent)', async () => {
    const { ctx, bridge, requestTool, registered } = makeHarness()
    registerBrowserTools(ctx, bridge, { toolTimeoutMs: 1_000, snapshotMaxChars: 12_000, maxInteractiveItems: 60 })
    const tool = registered.find((r) => r.name === 'browser_snapshot')!
    const exec = { signal: new AbortController().signal }
    await (tool.definition.execute as (args: unknown, e: { signal: AbortSignal }) => Promise<unknown>)({ delta: true }, exec)
    expect(requestTool).toHaveBeenLastCalledWith('browser_snapshot', { delta: true }, exec.signal, 1_000)
    await (tool.definition.execute as (args: unknown, e: { signal: AbortSignal }) => Promise<unknown>)({}, exec)
    expect(requestTool).toHaveBeenLastCalledWith('browser_snapshot', {}, exec.signal, 1_000)
    await (tool.definition.execute as (args: unknown, e: { signal: AbortSignal }) => Promise<unknown>)({ delta: true, region: 'main' }, exec)
    expect(requestTool).toHaveBeenLastCalledWith('browser_snapshot', { delta: true, region: 'main' }, exec.signal, 1_000)
  })

  it('executes every remaining tool with mapped args', async () => {
    const { ctx, bridge, requestTool, registered } = makeHarness()
    registerBrowserTools(ctx, bridge, { toolTimeoutMs: 1_000, snapshotMaxChars: 12_000, maxInteractiveItems: 60, advancedTools: true })
    const byName = new Map(registered.map((r) => [r.name, r.definition]))
    const exec = { signal: new AbortController().signal }
    const run = async (name: string, args: unknown): Promise<void> => {
      await (byName.get(name)!.execute as (a: unknown, e: { signal: AbortSignal }) => Promise<unknown>)(args, exec)
    }

    await run('browser_click', { index: 3, frame: 2 })
    expect(requestTool).toHaveBeenLastCalledWith('browser_click', { index: 3, frame: 2 }, exec.signal, 1_000)
    await run('browser_click', { selector: 'nav.pager > a:nth-of-type(3)' })
    expect(requestTool).toHaveBeenLastCalledWith('browser_click', { selector: 'nav.pager > a:nth-of-type(3)' }, exec.signal, 1_000)
    await run('browser_click', { text: 'Next', role: 'button', nth: 1 })
    expect(requestTool).toHaveBeenLastCalledWith('browser_click', { text: 'Next', role: 'button', nth: 1 }, exec.signal, 1_000)

    await run('browser_type', { index: 2, text: 'hello' })
    expect(requestTool).toHaveBeenLastCalledWith('browser_type', { index: 2, text: 'hello' }, exec.signal, 1_000)
    await run('browser_type', { index: 2, text: 'hello', replace: true })
    expect(requestTool).toHaveBeenLastCalledWith('browser_type', { index: 2, text: 'hello', replace: true }, exec.signal, 1_000)
    await run('browser_type', { index: 2, frame: 4, text: 'inside frame' })
    expect(requestTool).toHaveBeenLastCalledWith('browser_type', { index: 2, frame: 4, text: 'inside frame' }, exec.signal, 1_000)

    await run('browser_press', { key: 'Enter' })
    expect(requestTool).toHaveBeenLastCalledWith('browser_press', { key: 'Enter' }, exec.signal, 1_000)
    await run('browser_press', { key: 'Enter', modifiers: ['ctrl'] })
    expect(requestTool).toHaveBeenLastCalledWith('browser_press', { key: 'Enter', modifiers: ['ctrl'] }, exec.signal, 1_000)

    await run('browser_scroll', { direction: 'down', amount: 200 })
    expect(requestTool).toHaveBeenLastCalledWith('browser_scroll', { direction: 'down', amount: 200 }, exec.signal, 1_000)
    await run('browser_scroll', { direction: 'top' })
    expect(requestTool).toHaveBeenLastCalledWith('browser_scroll', { direction: 'top' }, exec.signal, 1_000)
    await run('browser_scroll', { direction: 'down', frame: 4 })
    expect(requestTool).toHaveBeenLastCalledWith('browser_scroll', { direction: 'down', frame: 4 }, exec.signal, 1_000)
    await run('browser_scroll', { direction: 'bottom', selector: '#content' })
    expect(requestTool).toHaveBeenLastCalledWith('browser_scroll', { direction: 'bottom', selector: '#content' }, exec.signal, 1_000)
    await run('browser_scroll', { direction: 'down', index: 12 })
    expect(requestTool).toHaveBeenLastCalledWith('browser_scroll', { direction: 'down', index: 12 }, exec.signal, 1_000)

    await run('browser_get_storage', { area: 'session', key: 'token' })
    expect(requestTool).toHaveBeenLastCalledWith('browser_get_storage', { area: 'session', key: 'token' }, exec.signal, 1_000)
    await run('browser_get_storage', {})
    expect(requestTool).toHaveBeenLastCalledWith('browser_get_storage', {}, exec.signal, 1_000)

    await run('browser_fetch', { url: '/api/lines?page=2', method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"id":7}' })
    expect(requestTool).toHaveBeenLastCalledWith(
      'browser_fetch',
      { url: '/api/lines?page=2', method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"id":7}' },
      exec.signal,
      1_000,
    )
    await run('browser_fetch', { url: 'https://example.com/api' })
    expect(requestTool).toHaveBeenLastCalledWith('browser_fetch', { url: 'https://example.com/api' }, exec.signal, 1_000)

    await run('browser_eval', { code: 'document.title' })
    expect(requestTool).toHaveBeenLastCalledWith('browser_eval', { code: 'document.title' }, exec.signal, 1_000)
    await run('browser_eval', { code: 'location.href', frame: 4 })
    expect(requestTool).toHaveBeenLastCalledWith('browser_eval', { code: 'location.href', frame: 4 }, exec.signal, 1_000)

    await run('browser_navigate', { url: 'https://example.com' })
    expect(requestTool).toHaveBeenLastCalledWith('browser_navigate', { url: 'https://example.com' }, exec.signal, 1_000)
    await run('browser_open_tab', { url: 'https://example.com/new' })
    expect(requestTool).toHaveBeenLastCalledWith('browser_open_tab', { url: 'https://example.com/new' }, exec.signal, 1_000)
    await run('browser_open_tab', { url: 'https://example.com/bg', active: false })
    expect(requestTool).toHaveBeenLastCalledWith(
      'browser_open_tab',
      { url: 'https://example.com/bg', active: false },
      exec.signal,
      1_000,
    )

    await run('browser_list_tabs', {})
    expect(requestTool).toHaveBeenLastCalledWith('browser_list_tabs', {}, exec.signal, 1_000)
    await run('browser_follow_tab', { tabId: 17 })
    expect(requestTool).toHaveBeenLastCalledWith('browser_follow_tab', { tabId: 17 }, exec.signal, 1_000)
    await run('browser_close_tab', { tabId: 18 })
    expect(requestTool).toHaveBeenLastCalledWith('browser_close_tab', { tabId: 18 }, exec.signal, 1_000)

    for (const name of ['browser_back', 'browser_forward', 'browser_reload'] as const) {
      await run(name, {})
      expect(requestTool).toHaveBeenLastCalledWith(name, {}, exec.signal, 1_000)
    }

    await run('browser_get_text', { selector: '#main' })
    expect(requestTool).toHaveBeenLastCalledWith('browser_get_text', { selector: '#main' }, exec.signal, 1_000)
    await run('browser_get_text', {})
    expect(requestTool).toHaveBeenLastCalledWith('browser_get_text', {}, exec.signal, 1_000)
    await run('browser_get_text', { selector: 'main', frame: 4 })
    expect(requestTool).toHaveBeenLastCalledWith('browser_get_text', { selector: 'main', frame: 4 }, exec.signal, 1_000)

    await run('browser_wait', { ms: 100 })
    expect(requestTool).toHaveBeenLastCalledWith('browser_wait', { ms: 100 }, exec.signal, 1_000)
    await run('browser_wait', {})
    expect(requestTool).toHaveBeenLastCalledWith('browser_wait', {}, exec.signal, 1_000)
    await run('browser_wait', { frame: 4 })
    expect(requestTool).toHaveBeenLastCalledWith('browser_wait', { frame: 4 }, exec.signal, 1_000)
  })

  it('normalizes every DSH parameter map to JSON Schema before registration', () => {
    const { ctx, bridge, registered } = makeHarness()
    registerBrowserTools(ctx, bridge, { toolTimeoutMs: 1_000, snapshotMaxChars: 12_000, maxInteractiveItems: 60, advancedTools: true })
    for (const { definition } of registered) {
      const params = definition.parameters as { type?: unknown; properties?: unknown }
      expect(params.type).toBe('object')
      expect(params.properties).toBeDefined()
    }
    const click = registered.find(({ name }) => name === 'browser_click')!.definition.parameters as {
      properties: Record<string, unknown>
      required?: string[]
    }
    // Three addressing modes: none of them may be required on its own.
    expect(click.properties.index).toBeDefined()
    expect(click.properties.selector).toBeDefined()
    expect(click.properties.text).toBeDefined()
    expect(click.required ?? []).not.toContain('index')
    const typeTool = registered.find(({ name }) => name === 'browser_type')!.definition.parameters as {
      required?: string[]
    }
    expect(typeTool.required).toContain('index')
    expect(typeTool.required).toContain('text')
  })

  it('declares cooperative timeoutMs on every tool', () => {
    const { ctx, bridge, registered } = makeHarness()
    registerBrowserTools(ctx, bridge, { toolTimeoutMs: 5_000, snapshotMaxChars: 12_000, maxInteractiveItems: 60 })
    for (const { definition } of registered) {
      expect(definition.timeoutMs).toBe(5_000)
    }
  })

  it('keeps model-facing tool schemas in English', () => {
    const { ctx, bridge, registered } = makeHarness()
    registerBrowserTools(ctx, bridge, { toolTimeoutMs: 5_000, snapshotMaxChars: 12_000, maxInteractiveItems: 60 })
    const han = /\p{Script=Han}/u
    for (const { definition } of registered) {
      expect(String(definition.description)).not.toMatch(han)
      expect(JSON.stringify(definition.parameters)).not.toMatch(han)
    }
  })

  it('keeps model-facing tool descriptions concise', () => {
    const { ctx, bridge, registered } = makeHarness()
    registerBrowserTools(ctx, bridge, { toolTimeoutMs: 5_000, snapshotMaxChars: 12_000, maxInteractiveItems: 60 })
    const baseChars = registered.reduce((sum, { definition }) => sum + String(definition.description).length, 0)
    expect(baseChars).toBeLessThan(1_700)

    const { ctx: advancedCtx, bridge: advancedBridge, registered: advancedRegistered } = makeHarness()
    registerBrowserTools(advancedCtx, advancedBridge, {
      toolTimeoutMs: 5_000,
      snapshotMaxChars: 12_000,
      maxInteractiveItems: 60,
      advancedTools: true,
    })
    const allChars = advancedRegistered.reduce((sum, { definition }) => sum + String(definition.description).length, 0)
    expect(allChars).toBeLessThan(2_200)
  })

  it('exposes optional frame routing on frame-local tools only', () => {
    const { ctx, bridge, registered } = makeHarness()
    registerBrowserTools(ctx, bridge, { toolTimeoutMs: 5_000, snapshotMaxChars: 12_000, maxInteractiveItems: 60, advancedTools: true })
    const byName = new Map(registered.map((entry) => [entry.name, entry.definition]))
    for (const name of ['browser_click', 'browser_type', 'browser_press', 'browser_scroll', 'browser_get_text', 'browser_wait', 'browser_get_storage', 'browser_fetch', 'browser_eval']) {
      const params = byName.get(name)!.parameters as { properties: { frame?: { type?: unknown } } }
      expect(params.properties.frame?.type).toBe('number')
    }
    for (const name of ['browser_snapshot', 'browser_navigate', 'browser_open_tab', 'browser_list_tabs', 'browser_follow_tab', 'browser_close_tab', 'browser_back', 'browser_forward', 'browser_reload']) {
      const params = byName.get(name)!.parameters as { properties: { frame?: unknown } }
      expect(params.properties.frame).toBeUndefined()
    }
  })

  it('falls back to a no-text payload when the extension returns non-text', async () => {
    const { ctx, bridge, requestTool, registered } = makeHarness()
    requestTool.mockResolvedValueOnce(null)
    registerBrowserTools(ctx, bridge, { toolTimeoutMs: 1_000, snapshotMaxChars: 12_000, maxInteractiveItems: 60 })
    const tool = registered.find((r) => r.name === 'browser_wait')!
    const exec = { signal: new AbortController().signal }
    const result = await (tool.definition.execute as (args: unknown, e: { signal: AbortSignal }) => Promise<unknown>)({}, exec)
    expect(result).toEqual({ text: expect.stringContaining('no text') })
  })

  it('renders the canonical result as one text block', () => {
    const { ctx, bridge, registered } = makeHarness()
    registerBrowserTools(ctx, bridge, { toolTimeoutMs: 1_000, snapshotMaxChars: 12_000, maxInteractiveItems: 60 })
    const tool = registered.find((r) => r.name === 'browser_click')!
    const output = tool.definition.output as { render: (args: unknown, value: unknown) => unknown }
    expect(output.render({}, { text: 'hello' })).toEqual([{ type: 'text', text: 'hello' }])
  })
})
