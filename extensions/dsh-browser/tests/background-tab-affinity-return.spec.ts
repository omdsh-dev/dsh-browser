// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TabAffinityState } from '../src/background/tab-affinity.ts'

function chromeEvent<T extends unknown[]>() {
  const listeners = new Set<(...args: T) => void>()
  return {
    addListener: vi.fn((listener: (...args: T) => void) => { listeners.add(listener) }),
    emit: (...args: T) => { for (const listener of listeners) listener(...args) },
  }
}

function panelPort() {
  const onMessage = chromeEvent<[unknown]>()
  const onDisconnect = chromeEvent<[]>()
  const postMessage = vi.fn()
  const port = {
    name: 'dsh-panel',
    postMessage,
    onMessage,
    onDisconnect,
  } as unknown as chrome.runtime.Port
  return { onDisconnect, onMessage, port, postMessage }
}

function tab(tabId: number, windowId = 1): chrome.tabs.Tab {
  return {
    id: tabId,
    index: 0,
    pinned: false,
    highlighted: true,
    active: true,
    incognito: false,
    selected: true,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    windowId,
    title: `Tab ${tabId}`,
    url: `https://example.com/${tabId}`,
  }
}

function mockChrome() {
  const onConnect = chromeEvent<[chrome.runtime.Port]>()
  const onActivated = chromeEvent<[{ tabId: number; windowId: number }]>()
  const query = vi.fn(async () => [tab(1)])
  const get = vi.fn(async (tabId: number) => tab(tabId))
  const update = vi.fn(async (tabId: number) => tab(tabId))
  const focusWindow = vi.fn(async (windowId: number) => ({ id: windowId }))
  vi.stubGlobal('chrome', {
    alarms: {
      create: vi.fn(),
      clear: vi.fn(async () => true),
      onAlarm: chromeEvent<[chrome.alarms.Alarm]>(),
    },
    notifications: {
      create: vi.fn(async () => ''),
      clear: vi.fn(async () => true),
      onClicked: chromeEvent<[string]>(),
    },
    runtime: {
      id: 'test-extension',
      getURL: (path: string) => `chrome-extension://test/${path}`,
      onConnect,
      onMessage: chromeEvent<[unknown, chrome.runtime.MessageSender, (response: unknown) => void]>(),
    },
    sidePanel: {
      open: vi.fn(async () => {}),
      setPanelBehavior: vi.fn(async () => {}),
    },
    storage: {
      local: {
        get: vi.fn(async () => ({})),
        set: vi.fn(async () => {}),
      },
      session: {
        get: vi.fn(async () => ({})),
        set: vi.fn(async () => {}),
        remove: vi.fn(async () => {}),
      },
    },
    tabs: {
      get,
      query,
      update,
      sendMessage: vi.fn(async () => {}),
      onActivated,
      onUpdated: chromeEvent<[number, chrome.tabs.TabChangeInfo, chrome.tabs.Tab]>(),
      onReplaced: chromeEvent<[number, number]>(),
      onRemoved: chromeEvent<[number]>(),
    },
    webNavigation: {
      onCommitted: chromeEvent<[{ tabId: number; frameId: number }]>(),
    },
    windows: {
      WINDOW_ID_NONE: -1,
      update: focusWindow,
      onFocusChanged: chromeEvent<[number]>(),
      onRemoved: chromeEvent<[number]>(),
    },
  } as unknown as typeof chrome)
  return { focusWindow, get, onActivated, onConnect, query, update }
}

function lastAffinity(postMessage: ReturnType<typeof vi.fn>): TabAffinityState | undefined {
  for (let index = postMessage.mock.calls.length - 1; index >= 0; index -= 1) {
    const message = postMessage.mock.calls[index]?.[0] as { type?: string; state?: TabAffinityState } | undefined
    if (message?.type === 'tab-affinity') return message.state
  }
  return undefined
}

async function connectPanelForTest() {
  const chromeMock = mockChrome()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 503 })))
  await import('../src/background/index.ts')
  await vi.waitFor(() => { expect(chromeMock.query).toHaveBeenCalled() })

  const panel = panelPort()
  chromeMock.onConnect.emit(panel.port)
  await vi.waitFor(() => {
    expect(panel.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'tab-affinity' }))
  })

  // Establish the controlled page the way an approved first call would, then
  // let this panel declare the window it is docked in.
  panel.onMessage.emit({ type: 'tab-affinity.rebind', id: 'initial-bind' })
  await vi.waitFor(() => {
    expect(panel.postMessage).toHaveBeenCalledWith({ type: 'tab-affinity.rebind.result', id: 'initial-bind', ok: true })
  })
  panel.onMessage.emit({ type: 'panel.window', windowId: 1 })
  panel.postMessage.mockClear()
  return { ...chromeMock, ...panel }
}

/**
 * Move the user to another tab so the handoff prompt is on screen, and return
 * the revision the panel would send back with its choice.
 */
async function switchToOtherTab(harness: Awaited<ReturnType<typeof connectPanelForTest>>): Promise<number> {
  harness.onActivated.emit({ tabId: 2, windowId: 1 })
  await vi.waitFor(() => {
    expect(harness.postMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'tab-affinity',
      state: expect.objectContaining({ status: 'handoff' }),
    }))
  })
  const revision = lastAffinity(harness.postMessage)?.revision
  expect(revision).toBeTypeOf('number')
  harness.postMessage.mockClear()
  return revision as number
}

afterEach(() => {
  vi.useRealTimers()
  vi.resetModules()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('background jump back to the assistant page', () => {
  it('activates the assistant tab in place and reports the resolved handoff', async () => {
    const harness = await connectPanelForTest()
    const revision = await switchToOtherTab(harness)

    harness.onMessage.emit({ type: 'tab-affinity.return', id: 'return-1', revision })

    await vi.waitFor(() => {
      expect(harness.postMessage).toHaveBeenCalledWith({ type: 'tab-affinity.return.result', id: 'return-1', ok: true })
    })
    expect(harness.update).toHaveBeenCalledWith(1, { active: true })
    // Panel and assistant page share window 1, so no window has to be raised.
    expect(harness.focusWindow).not.toHaveBeenCalled()
    expect(lastAffinity(harness.postMessage)).toMatchObject({
      status: 'following',
      controlled: { tabId: 1 },
      active: { tabId: 1 },
    })
  })

  it('refuses a stale choice without touching the browser', async () => {
    const harness = await connectPanelForTest()
    const revision = await switchToOtherTab(harness)

    harness.onMessage.emit({ type: 'tab-affinity.return', id: 'stale', revision: revision + 1 })

    await vi.waitFor(() => {
      expect(harness.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        type: 'tab-affinity.return.result',
        id: 'stale',
        ok: false,
        error: expect.objectContaining({ code: 'stale-revision' }),
      }))
    })
    expect(harness.update).not.toHaveBeenCalled()
    expect(harness.focusWindow).not.toHaveBeenCalled()
    expect(lastAffinity(harness.postMessage)).toBeUndefined()
  })

  it('fails closed when the controlled tab has been closed', async () => {
    const harness = await connectPanelForTest()
    const revision = await switchToOtherTab(harness)
    harness.get.mockImplementationOnce(async () => { throw new Error('No tab with id: 1') })

    harness.onMessage.emit({ type: 'tab-affinity.return', id: 'gone', revision })

    await vi.waitFor(() => {
      expect(harness.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        type: 'tab-affinity.return.result',
        id: 'gone',
        ok: false,
        error: expect.objectContaining({ code: 'lost' }),
      }))
    })
    expect(harness.update).not.toHaveBeenCalled()
    expect(lastAffinity(harness.postMessage)).toMatchObject({ status: 'lost', controlled: null })
  })

  it('raises the window that holds the assistant page', async () => {
    const harness = await connectPanelForTest()
    const revision = await switchToOtherTab(harness)
    harness.get.mockImplementationOnce(async () => tab(1, 2))

    harness.onMessage.emit({ type: 'tab-affinity.return', id: 'other-window', revision })

    await vi.waitFor(() => {
      expect(harness.postMessage).toHaveBeenCalledWith({ type: 'tab-affinity.return.result', id: 'other-window', ok: true })
    })
    expect(harness.focusWindow).toHaveBeenCalledWith(2, { focused: true })
    expect(harness.update).toHaveBeenCalledWith(1, { active: true })
    expect(harness.focusWindow.mock.invocationCallOrder[0])
      .toBeLessThan(harness.update.mock.invocationCallOrder[0] as number)
  })

  it('stops before activating anything when the window cannot be focused', async () => {
    const harness = await connectPanelForTest()
    const revision = await switchToOtherTab(harness)
    harness.get.mockImplementationOnce(async () => tab(1, 2))
    harness.focusWindow.mockRejectedValueOnce(new Error('window is gone'))

    harness.onMessage.emit({ type: 'tab-affinity.return', id: 'focus-failed', revision })

    await vi.waitFor(() => {
      expect(harness.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        type: 'tab-affinity.return.result',
        id: 'focus-failed',
        ok: false,
        error: expect.objectContaining({ code: 'focus-failed' }),
      }))
    })
    expect(harness.update).not.toHaveBeenCalled()
    harness.onMessage.emit({ type: 'request-status' })
    expect(lastAffinity(harness.postMessage)).toMatchObject({ status: 'handoff', controlled: { tabId: 1 } })
  })
})
