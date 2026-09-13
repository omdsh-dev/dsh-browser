// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ApprovalPrompt } from '../src/security/approval.ts'
import { dispatchToolCall, type ToolCall } from '../src/background/tools.ts'

/**
 * The capture path photographs the ACTIVE tab of a window, so the two things
 * worth proving are that the controlled tab is the one in front when the
 * shutter opens, and that the encoded bytes the bridge receives are the PNG
 * the browser produced rather than the data-URL wrapper.
 */

const PNG_BYTES = Buffer.from('fake-png-bytes')
const PNG_DATA_URL = `data:image/png;base64,${PNG_BYTES.toString('base64')}`

function managedTab(overrides: Partial<chrome.tabs.Tab> = {}): chrome.tabs.Tab {
  return {
    id: 7,
    windowId: 1,
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
    ...overrides,
  }
}

interface MockOptions {
  tab?: chrome.tabs.Tab
  /** Which tab the window currently shows; defaults to the controlled tab. */
  activeTabId?: number
  capture?: () => Promise<string>
}

function mockChrome(options: MockOptions = {}) {
  const tab = options.tab ?? managedTab()
  const update = vi.fn(async (tabId: number, changes: chrome.tabs.UpdateProperties) => ({ ...managedTab({ id: tabId }), ...changes }))
  const query = vi.fn(async (info?: chrome.tabs.QueryInfo) => {
    if (info?.active === true) {
      const activeId = options.activeTabId ?? tab.id
      return [managedTab({ id: activeId, active: true })]
    }
    return [tab]
  })
  const captureVisibleTab = vi.fn(options.capture ?? (async () => PNG_DATA_URL))
  vi.stubGlobal('chrome', {
    tabs: {
      query,
      update,
      captureVisibleTab,
      get: vi.fn(async () => ({ ...tab })),
      sendMessage: vi.fn(async () => ({ text: 'page' })),
      goBack: vi.fn(), goForward: vi.fn(), reload: vi.fn(), remove: vi.fn(),
    },
    scripting: { executeScript: vi.fn(async () => [{ frameId: 0, result: undefined }]) },
    webNavigation: {
      getAllFrames: vi.fn(async () => [
        { frameId: 0, parentFrameId: -1, documentId: 'top', url: tab.url ?? '' },
      ]),
    },
    runtime: { onMessage: { addListener: vi.fn(), removeListener: vi.fn() } },
  })
  return { captureVisibleTab, query, update, tab }
}

function screenshotCall(): ToolCall {
  return { id: 'shot-1', name: 'browser_screenshot', args: {} }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('browser_screenshot capture', () => {
  it('returns the raw PNG bytes the bridge will persist', async () => {
    const chromeMock = mockChrome()

    const answer = await dispatchToolCall(screenshotCall(), 'auto', undefined, undefined, undefined, chromeMock.tab)

    expect(answer.ok).toBe(true)
    const result = answer.result as { text: string; image: { mediaType: string; data: string } }
    expect(result.image.mediaType).toBe('image/png')
    // The data-URL wrapper must not survive: the bridge decodes base64.
    expect(result.image.data).toBe(PNG_BYTES.toString('base64'))
    expect(result.image.data).not.toContain('data:')
    expect(result.text).toContain('https://example.com/page')
  })

  it('brings the controlled tab forward before capturing', async () => {
    // Another tab holds the foreground, so an unqualified capture would
    // photograph a page the caller never asked about.
    const chromeMock = mockChrome({ activeTabId: 99 })

    await dispatchToolCall(screenshotCall(), 'auto', undefined, undefined, undefined, chromeMock.tab)

    expect(chromeMock.update).toHaveBeenCalledWith(7, { active: true })
    const updateOrder = chromeMock.update.mock.invocationCallOrder[0]!
    const captureOrder = chromeMock.captureVisibleTab.mock.invocationCallOrder[0]!
    expect(updateOrder).toBeLessThan(captureOrder)
  })

  it('does not disturb the foreground when the controlled tab already has it', async () => {
    const chromeMock = mockChrome()

    await dispatchToolCall(screenshotCall(), 'auto', undefined, undefined, undefined, chromeMock.tab)

    expect(chromeMock.update).not.toHaveBeenCalled()
    expect(chromeMock.captureVisibleTab).toHaveBeenCalledWith(1, { format: 'png' })
  })

  it('reports a browser refusal instead of throwing', async () => {
    const chromeMock = mockChrome({
      capture: async () => { throw new Error('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND quota exceeded') },
    })

    const answer = await dispatchToolCall(screenshotCall(), 'auto', undefined, undefined, undefined, chromeMock.tab)

    expect(answer.ok).toBe(false)
    expect(answer.error?.message).toMatch(/refused the screenshot/)
    expect(answer.error?.message).toContain('quota exceeded')
  })

  it('refuses an unexpected encoding rather than forwarding garbage', async () => {
    const chromeMock = mockChrome({ capture: async () => 'about:blank' })

    const answer = await dispatchToolCall(screenshotCall(), 'auto', undefined, undefined, undefined, chromeMock.tab)

    expect(answer.ok).toBe(false)
    expect(answer.error?.message).toMatch(/unexpected encoding/)
  })
})

describe('browser_screenshot follows the sharing policy', () => {
  it('does not prompt under auto', async () => {
    const chromeMock = mockChrome()
    const authorize = vi.fn(async () => 'denied' as const)

    const answer = await dispatchToolCall(screenshotCall(), 'auto', undefined, authorize, undefined, chromeMock.tab)

    expect(authorize).not.toHaveBeenCalled()
    expect(answer.ok).toBe(true)
  })

  it('prompts under ask and honours a denial', async () => {
    const chromeMock = mockChrome()
    const authorize = vi.fn(async (_prompt: ApprovalPrompt) => 'denied' as const)

    const answer = await dispatchToolCall(screenshotCall(), 'ask', undefined, authorize, undefined, chromeMock.tab)

    expect(authorize).toHaveBeenCalledTimes(1)
    expect(authorize.mock.calls[0]![0]).toMatchObject({ kind: 'read', action: 'browser_screenshot' })
    expect(answer.ok).toBe(false)
    // A denied capture must not reach the browser at all.
    expect(chromeMock.captureVisibleTab).not.toHaveBeenCalled()
  })

  it('captures under ask once approved', async () => {
    const chromeMock = mockChrome()
    const authorize = vi.fn(async () => 'approved' as const)

    const answer = await dispatchToolCall(screenshotCall(), 'ask', undefined, authorize, undefined, chromeMock.tab)

    expect(answer.ok).toBe(true)
    expect(chromeMock.captureVisibleTab).toHaveBeenCalled()
  })

  it('refuses outright when sharing is off', async () => {
    const chromeMock = mockChrome()

    const answer = await dispatchToolCall(screenshotCall(), 'off', undefined, undefined, undefined, chromeMock.tab)

    expect(answer.ok).toBe(false)
    expect(answer.error?.message).toMatch(/disabled in Settings/)
    expect(chromeMock.captureVisibleTab).not.toHaveBeenCalled()
  })
})
