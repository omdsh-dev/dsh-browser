// @vitest-environment jsdom
/**
 * Trusted-input routing: which calls stay in the content script, which run
 * through the debugger-backed channel, and how both degrade.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { dispatchToolCall, type InputRuntime, type ToolAnswer, type ToolCall } from '../src/background/tools.ts'

const TAB: chrome.tabs.Tab = {
  id: 42,
  windowId: 3,
  index: 0,
  active: true,
  highlighted: true,
  pinned: false,
  incognito: false,
  selected: true,
  discarded: false,
  autoDiscardable: true,
  groupId: -1,
  url: 'https://example.com/page',
  title: 'Example',
}

const FRAMES = [
  { frameId: 0, parentFrameId: -1, documentId: 'doc-main', url: TAB.url! },
  { frameId: 1, parentFrameId: 0, documentId: 'doc-frame', url: 'https://example.com/editor' },
]

interface ChromeStub {
  tabs: {
    update: ReturnType<typeof vi.fn>
    sendMessage: ReturnType<typeof vi.fn>
    get: ReturnType<typeof vi.fn>
  }
  windows: { update: ReturnType<typeof vi.fn> }
}

interface Harness {
  calls: Array<{ name: string; args: Record<string, unknown> }>
  actions: Array<{ name: string; args: Record<string, unknown>; frameId: number }>
  setups: Array<{ request: Record<string, unknown>; frameId: number }>
  runs: Array<{ tabId: number; methods: Array<[string, Record<string, unknown>]> }>
  chrome: ChromeStub
}

function stubChrome(frameOverride: typeof FRAMES = FRAMES): Harness {
  const calls: Harness['calls'] = []
  const actions: Harness['actions'] = []
  const setups: Harness['setups'] = []
  const runs: Harness['runs'] = []
  const sendMessage = vi.fn(async (
    _tabId: number,
    message: { type?: string; action?: string; args?: Record<string, unknown>; request?: Record<string, unknown> },
    target?: { frameId?: number; documentId?: string },
  ): Promise<unknown> => {
    const frameId = target?.frameId ?? FRAMES.find((frame) => frame.documentId === target?.documentId)?.frameId ?? 0
    if (message.type === 'DSH_INPUT_SETUP') {
      const request = (message.request ?? {}) as Record<string, unknown>
      setups.push({ request, frameId })
      switch (request.op) {
        case 'prepare':
          return { ok: true, result: { op: 'prepare', focused: true, selected: false } }
        case 'upload-mark':
          return { ok: true, result: { op: 'upload-mark', selector: 'input[data-dsh-upload="t"]' } }
        case 'upload-clear':
          return { ok: true, result: { op: 'upload-clear', cleared: true } }
        default:
          return { ok: false, error: { code: 'bad-args', message: 'unknown setup' } }
      }
    }
    if (message.type === 'DSH_ACTION') {
      const name = message.action ?? ''
      const args = message.args ?? {}
      actions.push({ name, args, frameId })
      if (name === 'browser_wait') return { ok: true, result: { text: 'stable', pageContent: 'changed-after-input' } }
      if (name === 'browser_snapshot') return { ok: true, result: { text: 'FRAME SNAPSHOT' } }
      return { ok: true, result: { text: 'content action' } }
    }
    return undefined
  })
  const tabs = {
    sendMessage,
    query: vi.fn(async () => [TAB]),
    get: vi.fn(async () => TAB),
    update: vi.fn(async () => TAB),
    remove: vi.fn(async () => undefined),
    goBack: vi.fn(async () => undefined),
    goForward: vi.fn(async () => undefined),
    reload: vi.fn(async () => undefined),
  }
  const windows = { update: vi.fn(async () => ({})) }
  vi.stubGlobal('chrome', {
    tabs,
    windows,
    scripting: { executeScript: vi.fn(async () => [{ frameId: 0, result: undefined }]) },
    webNavigation: { getAllFrames: vi.fn(async () => frameOverride) },
    runtime: {
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      sendMessage: vi.fn(async () => ({ ok: true })),
    },
  })
  return { calls, actions, setups, runs, chrome: { tabs, windows } }
}

/** A fake trusted-input runtime that records CDP commands per run. */
function fakeRuntime(harness: Harness, supported = true): InputRuntime {
  return {
    supported,
    run: async (tabId, operation) => {
      const methods: Array<[string, Record<string, unknown>]> = []
      const client = {
        send: async (method: string, params: Record<string, unknown> = {}) => {
          methods.push([method, params])
          if (method === 'DOM.getDocument') return { root: { nodeId: 1 } }
          if (method === 'DOM.querySelector') return { nodeId: 7 }
          return {}
        },
      }
      harness.runs.push({ tabId, methods })
      return operation(client)
    },
  }
}

async function run(call: ToolCall, _harness: Harness, input?: InputRuntime): Promise<ToolAnswer> {
  return dispatchToolCall(
    call,
    'auto',
    { maxItems: 60, maxChars: 12_000 },
    async () => 'approved',
    undefined,
    TAB,
    () => true,
    {
      unrestrictedAccess: true,
      followTab: async () => undefined,
      ...(input === undefined ? {} : { input }),
    },
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('trusted routing', () => {
  it('keeps an element click in the content script by default', async () => {
    const h = stubChrome()
    const answer = await run({ id: '1', name: 'browser_click', args: { selector: '#target' } }, h, fakeRuntime(h))
    expect(answer.ok).toBe(true)
    expect(h.runs).toHaveLength(0)
    expect(h.actions[0]).toMatchObject({ name: 'browser_click' })
  })

  it('falls back to synthetic keys and marks the result', async () => {
    const h = stubChrome()
    const answer = await run({
      id: '1',
      name: 'browser_press',
      args: { key: 'a', modifiers: ['Meta'] },
    }, h)
    expect(answer.ok).toBe(true)
    expect(h.runs).toHaveLength(0)
    expect(JSON.stringify(answer.result)).toContain('(synthetic)')
  })

  it('uses real keys, including held modifiers, when available', async () => {
    const h = stubChrome()
    await run({ id: '1', name: 'browser_press', args: { key: 'a', modifiers: ['Meta'] } }, h, fakeRuntime(h))
    const events = h.runs[0]!.methods.filter(([method]) => method === 'Input.dispatchKeyEvent')
    expect(events[0]![1]).toMatchObject({ type: 'rawKeyDown', modifiers: 4, key: 'a' })
  })

  it('prepares a target and inserts text for trusted typing', async () => {
    const h = stubChrome()
    await run({ id: '1', name: 'browser_type', args: { text: 'hello', selector: '#target', mode: 'insert' } }, h, fakeRuntime(h))
    expect(h.setups[0]!.request).toMatchObject({ op: 'prepare', selector: '#target', select: 'none' })
    expect(h.runs[0]!.methods.filter(([method]) => method === 'Input.insertText')).toHaveLength(1)
  })

  it('keeps a synthetic paste in the content script', async () => {
    const h = stubChrome()
    await run({ id: '1', name: 'browser_clipboard', args: { action: 'paste', text: 'x' } }, h, fakeRuntime(h))
    expect(h.actions[0]).toMatchObject({ name: 'browser_clipboard' })
    expect(h.runs).toHaveLength(0)
  })

  it('rejects trusted input when the platform has none', async () => {
    const h = stubChrome()
    const answer = await run({
      id: '1',
      name: 'browser_press',
      args: { key: 'a', trusted: true },
    }, h, fakeRuntime(h, false))
    expect(answer.error?.code).toBe('input-unavailable')
  })
})

describe('upload and frame-scoped snapshot', () => {
  it('marks the file input, attaches files, and clears the marker', async () => {
    const h = stubChrome()
    const answer = await run({
      id: '1',
      name: 'browser_upload',
      args: { selector: '#file', paths: ['/tmp/a.pdf'] },
    }, h, fakeRuntime(h))
    expect(answer.ok).toBe(true)
    expect(h.setups.map((setup) => setup.request.op)).toEqual(['upload-mark', 'upload-clear'])
    const methods = h.runs[0]!.methods.map(([method]) => method)
    expect(methods).toEqual(['DOM.getDocument', 'DOM.querySelector', 'DOM.setFileInputFiles'])
    expect(JSON.stringify(answer.result)).toContain('Attached 1 file(s)')
  })

  it('reads one iframe with the full budget', async () => {
    const h = stubChrome()
    const answer = await run({ id: '1', name: 'browser_snapshot', args: { frame: 1 } }, h)
    expect(answer.ok).toBe(true)
    expect(h.actions).toHaveLength(1)
    expect(h.actions[0]).toMatchObject({ name: 'browser_snapshot', frameId: 1 })
    expect(JSON.stringify(answer.result)).toContain('iframe frame=1')
    expect(JSON.stringify(answer.result)).toContain('FRAME SNAPSHOT')
  })
})

describe('tab activation', () => {
  it('follows and activates a tab only when asked', async () => {
    const h = stubChrome()
    const answer = await run({ id: '1', name: 'browser_follow_tab', args: { tabId: 42, activate: true } }, h)
    expect(answer.ok).toBe(true)
    expect(h.chrome.tabs.update).toHaveBeenCalledWith(42, { active: true })
    expect(JSON.stringify(answer.result)).toContain('active')
  })

  it('does not activate when the flag is omitted', async () => {
    const h = stubChrome()
    await run({ id: '1', name: 'browser_follow_tab', args: { tabId: 42 } }, h)
    expect(h.chrome.tabs.update).not.toHaveBeenCalled()
  })
})
