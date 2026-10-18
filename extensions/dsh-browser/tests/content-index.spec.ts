// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

const LISTENER_KEY = '__dshBrowserContentScriptListener__'
const WATCHER_KEY = '__dshBrowserSelectionWatcher__'

afterEach(() => {
  Reflect.deleteProperty(navigator, 'userActivation')
  delete (globalThis as Record<string, unknown>)[LISTENER_KEY]
  delete (globalThis as Record<string, unknown>)[WATCHER_KEY]
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('content script registration', () => {
  it('replaces a stale listener when content.js is injected again', async () => {
    const addListener = vi.fn()
    const removeListener = vi.fn()
    const sendMessage = vi.fn(async () => undefined)
    vi.stubGlobal('chrome', {
      runtime: { onMessage: { addListener, removeListener }, sendMessage },
    })

    await import('../src/content/index.ts')
    expect(addListener).toHaveBeenCalledTimes(1)
    expect(removeListener).not.toHaveBeenCalled()
    const firstListener = addListener.mock.calls[0]?.[0]

    vi.resetModules()
    await import('../src/content/index.ts')

    expect(removeListener).toHaveBeenCalledWith(firstListener)
    expect(addListener).toHaveBeenCalledTimes(2)
    expect(addListener.mock.calls[1]?.[0]).not.toBe(firstListener)
    expect(sendMessage).toHaveBeenCalledTimes(2)
    expect(sendMessage).toHaveBeenLastCalledWith({ type: 'DSH_CONTENT_READY' })
  })
})

describe('selection watch arming', () => {
  function stubChrome(readyResponse: unknown) {
    // An event-driven capture requires the user's own transient activation.
    Object.defineProperty(navigator, 'userActivation', {
      configurable: true,
      value: { isActive: true, hasBeenActive: true },
    })
    const sendMessage = vi.fn(async (message: { type: string }) =>
      message.type === 'DSH_CONTENT_READY' ? readyResponse : undefined)
    vi.stubGlobal('chrome', {
      runtime: { onMessage: { addListener: vi.fn(), removeListener: vi.fn() }, sendMessage },
    })
    // Each import starts without a pre-existing highlight unless the test
    // explicitly installs one. Other tests replace this writable JSDOM method.
    window.getSelection = () => null
    return sendMessage
  }

  it('does not report selections until the service worker asks for them', async () => {
    const sendMessage = stubChrome({ selectionWatch: false })
    await import('../src/content/index.ts')
    await vi.waitFor(() => { expect(sendMessage).toHaveBeenCalledTimes(1) })

    window.getSelection = () => ({ toString: () => 'quoted text' }) as unknown as Selection
    document.dispatchEvent(new Event('selectionchange'))
    await new Promise((resolve) => { setTimeout(resolve, 400) })

    expect(sendMessage).toHaveBeenCalledTimes(1)
  })

  it('reports a settled selection once a panel has armed the document', async () => {
    const sendMessage = stubChrome({ selectionWatch: true })
    await import('../src/content/index.ts')
    await vi.waitFor(() => { expect(sendMessage).toHaveBeenCalledTimes(1) })

    window.getSelection = () => ({ toString: () => 'quoted text' }) as unknown as Selection
    document.dispatchEvent(new Event('selectionchange'))

    await vi.waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith({
        type: 'DSH_SELECTION',
        selection: expect.objectContaining({ text: 'quoted text' }),
      })
    }, { timeout: 2_000 })
  })
})

describe('negotiated snapshot budget', () => {
  it('applies a maxForms cap forwarded by the background to the next snapshot', async () => {
    const addListener = vi.fn()
    vi.stubGlobal('chrome', {
      runtime: { onMessage: { addListener, removeListener: vi.fn() }, sendMessage: vi.fn(async () => undefined) },
    })
    document.body.innerHTML = `<form>${Array.from({ length: 40 }, (_, index) => `<input name="f${index}" value="value-${index}">`).join('')}</form>`
    await import('../src/content/index.ts')

    const listener = addListener.mock.calls[0]?.[0] as (
      message: unknown,
      sender: unknown,
      respond: (answer: unknown) => void,
    ) => void
    const ack = vi.fn()
    listener({ type: 'DSH_BUDGET', budget: { maxItems: 600, maxForms: 800, maxChars: 400_000 } }, {}, ack)
    expect(ack).toHaveBeenCalledWith({ ok: true, result: { text: expect.stringContaining('maxForms') } })

    const answer = vi.fn()
    listener({ type: 'DSH_ACTION', action: 'browser_snapshot', args: {} }, {}, answer)
    await vi.waitFor(() => { expect(answer).toHaveBeenCalled() }, { timeout: 2_000 })

    const text = (answer.mock.calls[0]?.[0] as { result: { text: string } }).result.text
    // The 40th field only appears when the negotiated form cap replaced the
    // content script's built-in default of 30.
    expect(text).toContain('value-39')
  })
})
