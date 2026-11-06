// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { PanelApi } from '../src/panel/api.ts'
import type { TabAffinityState } from '../src/background/tab-affinity.ts'

let panelApi: PanelApi

vi.mock('../src/panel/api.ts', () => ({
  connectPanel: (): PanelApi => panelApi,
}))

import { App } from '../src/panel/App.tsx'

const controlled = { tabId: 1, windowId: 1, title: 'Pull request #3', url: 'https://example.com/pr' }
const active = { tabId: 2, windowId: 1, title: 'README', url: 'https://example.com/readme' }

describe('tab handoff banner', () => {
  let root: Root
  let onStatus: ((state: 'connected', caps: null) => void) | undefined
  let onResumeHint: ((sessionId: string | null) => void) | undefined
  let onTabAffinity: ((state: TabAffinityState) => void) | undefined
  let rpc: Mock<(method: string, payload?: unknown) => Promise<unknown>>

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    HTMLElement.prototype.scrollTo = vi.fn()
    vi.stubGlobal('chrome', {
      storage: { local: { get: vi.fn(async () => ({ dshSettings: { autoResumeSession: false } })) } },
      windows: { getCurrent: vi.fn(async () => ({ id: 1 })) },
    })
    rpc = vi.fn(async (method: string) => {
      if (method === 'session.create') return { sessionId: 'session-current' }
      if (method === 'session.history') return { events: [] }
      if (method === 'session.list') return { items: [] }
      if (method === 'session.models') {
        return {
          current: { provider: 'provider', model: 'saved-model' },
          routable: true,
          groups: [{ id: 'provider', name: 'Provider', models: [{ id: 'saved-model', name: 'Saved model' }] }],
        }
      }
      if (method === 'session.permissions') {
        return {
          current: 'workspace-write',
          defaultPreset: 'workspace-write',
          routable: true,
          provisional: false,
          options: [{ value: 'workspace-write', name: 'Workspace edits' }],
        }
      }
      if (method === 'commands.list') return { provisional: true, commands: [] }
      if (method === 'skills.list') return { provisional: true, skills: [] }
      throw new Error(`unexpected RPC: ${method}`)
    })
    const unsubscribe = (): void => {}
    panelApi = {
      rpc: async <T = unknown>(method: string, payload?: unknown): Promise<T> =>
        await rpc(method, payload) as T,
      respond: vi.fn(async () => undefined),
      onStatus: vi.fn((callback) => { onStatus = callback as typeof onStatus; return unsubscribe }),
      onEvent: vi.fn(() => unsubscribe),
      onApprovalRequest: vi.fn(() => unsubscribe),
      onApprovalResolved: vi.fn(() => unsubscribe),
      onTabAffinity: vi.fn((callback) => { onTabAffinity = callback; return unsubscribe }),
      onSelection: vi.fn(() => unsubscribe),
      onSessionResumeHint: vi.fn((callback) => { onResumeHint = callback; return unsubscribe }),
      respondToApproval: vi.fn(async () => {}),
      resolveTabAffinity: vi.fn(async () => {}),
      rebindTabAffinity: vi.fn(async () => {}),
      returnToControlledTab: vi.fn(async () => {}),
      clearSelection: vi.fn(async () => {}),
      registerWindow: vi.fn(async () => {}),
      setActiveSession: vi.fn(async () => {}),
      updateSettings: vi.fn(async () => {}),
      onDevToolsStatus: vi.fn(() => unsubscribe),
      detachDevTools: vi.fn(async () => undefined),
      requestStatus: vi.fn(async () => {}),
      startDiscovery: vi.fn(async () => []),
      cancelDiscovery: vi.fn(async () => {}),
      onDiscoveryProgress: vi.fn(() => unsubscribe),
    }
    root = createRoot(document.querySelector('#root')!)
  })

  afterEach(async () => {
    await act(async () => { root.unmount() })
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  async function renderConnected(): Promise<void> {
    await act(async () => { root.render(createElement(App)) })
    await act(async () => {
      onStatus?.('connected', null)
      onResumeHint?.(null)
    })
    await vi.waitFor(() => {
      expect(rpc.mock.calls.some(([method]) => method === 'session.permissions')).toBe(true)
    })
  }

  async function pushAffinity(state: TabAffinityState): Promise<void> {
    await act(async () => { onTabAffinity?.(state) })
  }

  function actionLabels(): string[] {
    return [...document.querySelectorAll<HTMLButtonElement>('.tab-affinity-actions button')]
      .map((button) => button.textContent ?? '')
  }

  it('offers jumping back to the assistant page first, then the two binding answers', async () => {
    await renderConnected()

    await pushAffinity({
      revision: 3,
      status: 'handoff',
      controlled,
      active,
      pinned: false,
    })

    expect(actionLabels()).toEqual([
      'Jump back to the assistant page',
      'Assistant stays on the original page',
      'Assistant follows the current page',
      'Assistant stays & stop asking',
    ])
  })

  it('sends the choice against the revision it was shown for', async () => {
    await renderConnected()
    await pushAffinity({
      revision: 3,
      status: 'handoff',
      controlled,
      active,
      pinned: false,
    })

    const jumpBack = document.querySelector<HTMLButtonElement>('.tab-affinity-actions .return')!
    await act(async () => { jumpBack.click() })

    await vi.waitFor(() => { expect(panelApi.returnToControlledTab).toHaveBeenCalledTimes(1) })
    expect(vi.mocked(panelApi.returnToControlledTab).mock.calls[0]?.[0]).toBe(3)
  })

  it('drops the jump-back answer once the user has already chosen', async () => {
    await renderConnected()

    await pushAffinity({
      revision: 4,
      status: 'background',
      controlled,
      active,
      pinned: false,
    })

    expect(document.querySelector('.tab-affinity-actions .return')).toBeNull()
    // The background banner keeps its own wording: it offers to follow, not to answer.
    expect(actionLabels()).toEqual(['Follow the current page'])
  })
})
