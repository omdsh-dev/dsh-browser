// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { dispatchToolCall, type ToolCall } from '../src/background/tools.ts'

const TAB_URL = 'https://admin.example.com/lines'
const BUDGET = { maxItems: 40, maxChars: 12_000 }

function installChrome(options: {
  url?: string
  scriptResults?: unknown[]
  sendMessageResponse?: unknown
} = {}): { executeScript: ReturnType<typeof vi.fn>; sendMessage: ReturnType<typeof vi.fn> } {
  const url = options.url ?? TAB_URL
  const queued = [...(options.scriptResults ?? [])]
  const executeScript = vi.fn(async () => {
    const next = queued.shift()
    return next === undefined ? [{ frameId: 0, result: undefined }] : next
  })
  const sendMessage = vi.fn(async () => options.sendMessageResponse ?? { ok: true, result: { text: 'page text' } })
  vi.stubGlobal('chrome', {
    tabs: {
      query: vi.fn(async () => [{ id: 7, windowId: 1, index: 0, active: true, url, title: 'Line admin' }]),
      get: vi.fn(async () => ({ id: 7, windowId: 1, index: 0, active: true, url, title: 'Line admin' })),
      sendMessage,
    },
    scripting: { executeScript },
    webNavigation: {
      getAllFrames: vi.fn(async () => [{ frameId: 0, parentFrameId: -1, documentId: 'document-7', url }]),
    },
    runtime: { onMessage: { addListener: vi.fn(), removeListener: vi.fn() } },
  })
  return { executeScript, sendMessage }
}

function call(name: string, args: Record<string, unknown>): ToolCall {
  return { id: `call-${name}`, name, args }
}

/** Browser approval is exercised separately; behavior tests bypass it. */
const UNRESTRICTED = { unrestrictedAccess: true }

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('browser_eval dispatch', () => {
  it('runs in the page main world and wraps the result as untrusted content', async () => {
    const chromeMock = installChrome({
      scriptResults: [[{ frameId: 0, result: { ok: true, json: '"Example Admin"' } }]],
    })

    const answer = await dispatchToolCall(call('browser_eval', { code: 'document.title' }), 'auto', BUDGET, undefined, undefined, undefined, undefined, UNRESTRICTED)

    expect(answer.ok).toBe(true)
    const text = (answer.result as { text: string }).text
    expect(text).toContain('Evaluation result:')
    expect(text).toContain('UNTRUSTED_PAGE_CONTENT')
    expect(text).toContain('Example Admin')
    const injection = chromeMock.executeScript.mock.calls[0]![0] as {
      target: { tabId: number; frameIds: number[] }
      world: string
      args: unknown[]
    }
    expect(injection.target).toEqual({ tabId: 7, frameIds: [0] })
    expect(injection.world).toBe('MAIN')
    expect(injection.args[0]).toBe('document.title')
  })

  it('polls until an async page evaluation settles', async () => {
    vi.useFakeTimers()
    try {
      const chromeMock = installChrome({
        scriptResults: [
          [{ frameId: 0, result: { pending: true, key: '__dsh_eval_call-browser_eval' } }],
          [{ frameId: 0, result: { pending: true } }],
          [{ frameId: 0, result: { ok: true, json: '42' } }],
        ],
      })

      const pending = dispatchToolCall(call('browser_eval', { code: 'Promise.resolve(42)' }), 'auto', BUDGET, undefined, undefined, undefined, undefined, UNRESTRICTED)
      await vi.advanceTimersByTimeAsync(300)
      const answer = await pending

      expect(answer.ok).toBe(true)
      const text = (answer.result as { text: string }).text
      expect(text).toContain('42')
      expect(chromeMock.executeScript).toHaveBeenCalledTimes(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it('reports a page-authored eval failure inside the untrusted boundary', async () => {
    installChrome({
      scriptResults: [[{ frameId: 0, result: { ok: false, error: 'EvalError: Refused to evaluate a string as JavaScript' } }]],
    })

    const answer = await dispatchToolCall(call('browser_eval', { code: '1+1' }), 'auto', BUDGET, undefined, undefined, undefined, undefined, UNRESTRICTED)

    expect(answer.ok).toBe(true)
    const text = (answer.result as { text: string }).text
    expect(text).toContain('Evaluation failed:')
    expect(text).toContain('Content Security Policy')
    expect(text).toContain('UNTRUSTED_PAGE_CONTENT')
  })

  it('refuses empty code and code over the character cap without injecting', async () => {
    const chromeMock = installChrome()

    const empty = await dispatchToolCall(call('browser_eval', { code: '   ' }), 'auto', BUDGET, undefined, undefined, undefined, undefined, UNRESTRICTED)
    expect(empty).toMatchObject({ ok: false, error: { code: 'bad-args' } })

    const tooLong = await dispatchToolCall(call('browser_eval', { code: 'a'.repeat(20_001) }), 'auto', BUDGET, undefined, undefined, undefined, undefined, UNRESTRICTED)
    expect(tooLong).toMatchObject({ ok: false, error: { code: 'bad-args' } })

    expect(chromeMock.executeScript).not.toHaveBeenCalled()
  })

  it('never injects when the user denies the approval request', async () => {
    const chromeMock = installChrome()
    const authorize = vi.fn(async () => 'denied' as const)

    const answer = await dispatchToolCall(call('browser_eval', { code: 'document.cookie' }), 'ask', BUDGET, authorize)

    expect(answer).toMatchObject({ ok: false, error: { code: 'action-failed', message: expect.stringContaining('denied') } })
    expect(chromeMock.executeScript).not.toHaveBeenCalled()
  })

  it('is unavailable on browser-protected pages', async () => {
    const chromeMock = installChrome({ url: 'chrome://extensions' })

    const answer = await dispatchToolCall(call('browser_eval', { code: '1' }), 'auto', BUDGET, undefined, undefined, undefined, undefined, UNRESTRICTED)

    expect(answer.ok).toBe(false)
    expect(chromeMock.executeScript).not.toHaveBeenCalled()
  })

  it('evaluates expressions and statement bodies in the injected entry point', async () => {
    // Run the real injected function instead of a canned envelope: this is the
    // only way to cover expression/statement/return forms and serialization.
    const execute = vi.fn((injection: { func: (...args: unknown[]) => unknown; args: unknown[] }) => [
      { frameId: 0, result: injection.func(...injection.args) },
    ])
    vi.stubGlobal('chrome', {
      tabs: {
        query: vi.fn(async () => [{ id: 7, windowId: 1, index: 0, active: true, url: TAB_URL, title: 'Line admin' }]),
        get: vi.fn(async () => ({ id: 7, windowId: 1, index: 0, active: true, url: TAB_URL, title: 'Line admin' })),
        sendMessage: vi.fn(),
      },
      scripting: { executeScript: execute },
      webNavigation: {
        getAllFrames: vi.fn(async () => [{ frameId: 0, parentFrameId: -1, documentId: 'document-7', url: TAB_URL }]),
      },
      runtime: { onMessage: { addListener: vi.fn(), removeListener: vi.fn() } },
    })
    document.title = 'Line admin'

    const expression = await dispatchToolCall(
      call('browser_eval', { code: 'document.title' }), 'auto', BUDGET,
      undefined, undefined, undefined, undefined, UNRESTRICTED,
    )
    expect((expression.result as { text: string }).text).toContain('"Line admin"')

    const statements = await dispatchToolCall(
      call('browser_eval', { code: 'const total = 2 + 2\nreturn total * 10' }), 'auto', BUDGET,
      undefined, undefined, undefined, undefined, UNRESTRICTED,
    )
    expect((statements.result as { text: string }).text).toContain('40')
  })
})

describe('advanced tool result boundaries', () => {
  it('wraps browser_get_storage output as untrusted page content', async () => {
    installChrome({ sendMessageResponse: { ok: true, result: { text: 'localStorage: token = ••••' } } })

    const answer = await dispatchToolCall(call('browser_get_storage', {}), 'auto', BUDGET, undefined, undefined, undefined, undefined, UNRESTRICTED)

    expect(answer.ok).toBe(true)
    const text = (answer.result as { text: string }).text
    expect(text).toContain('UNTRUSTED_PAGE_CONTENT')
    expect(text).toContain('localStorage: token = ••••')
  })

  it('wraps browser_fetch output as untrusted page content', async () => {
    installChrome({ sendMessageResponse: { ok: true, result: { text: 'GET /api → 200 OK\nBody: "ok"' } } })

    const answer = await dispatchToolCall(call('browser_fetch', { url: '/api' }), 'auto', BUDGET, undefined, undefined, undefined, undefined, UNRESTRICTED)

    expect(answer.ok).toBe(true)
    expect((answer.result as { text: string }).text).toContain('UNTRUSTED_PAGE_CONTENT')
  })

  it('blocks page-content tools when the user disabled page content sharing', async () => {
    const chromeMock = installChrome()

    const answer = await dispatchToolCall(call('browser_get_storage', {}), 'off', BUDGET)

    expect(answer).toMatchObject({ ok: false, error: { code: 'action-failed', message: expect.stringContaining('Page content sharing is disabled') } })
    expect(chromeMock.sendMessage).not.toHaveBeenCalled()
  })
})
