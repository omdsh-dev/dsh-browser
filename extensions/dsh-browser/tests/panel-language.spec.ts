// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PanelApi } from '../src/panel/api.ts'

let panelApi: PanelApi

vi.mock('../src/panel/api.ts', () => ({
  connectPanel: (): PanelApi => panelApi,
}))

import { App } from '../src/panel/App.tsx'
import { setUiLocalePreference } from '../src/i18n.ts'

describe('panel UI language setting', () => {
  let root: Root
  let set: ReturnType<typeof vi.fn>

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    HTMLElement.prototype.scrollTo = vi.fn()
    set = vi.fn(async () => {})
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn(async () => ({ dshSettings: { autoResumeSession: false } })),
          set,
        },
        onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      windows: { getCurrent: vi.fn(async () => ({ id: 1 })) },
      runtime: {
        getManifest: () => ({ version: '0.1.8' }),
        getURL: (path: string) => `chrome-extension://test/${path}`,
      },
    })
    const unsubscribe = (): void => {}
    panelApi = {
      rpc: async <T = unknown>(): Promise<T> => ({ events: [] }) as T,
      respond: vi.fn(async () => undefined),
      onStatus: vi.fn(() => unsubscribe),
      onEvent: vi.fn(() => unsubscribe),
      onApprovalRequest: vi.fn(() => unsubscribe),
      onApprovalResolved: vi.fn(() => unsubscribe),
      onTabAffinity: vi.fn(() => unsubscribe),
      onSelection: vi.fn(() => unsubscribe),
      onSessionResumeHint: vi.fn(() => unsubscribe),
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
    setUiLocalePreference('auto')
    vi.stubGlobal('navigator', { languages: ['en-US'], language: 'en-US' })
    root = createRoot(document.querySelector('#root')!)
  })

  afterEach(async () => {
    await act(async () => { root.unmount() })
    setUiLocalePreference('auto')
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  async function openSettings(): Promise<HTMLSelectElement> {
    await act(async () => { root.render(createElement(App)) })
    const trigger = document.querySelector<HTMLButtonElement>('.settings-trigger')
    expect(trigger).not.toBeNull()
    await act(async () => { trigger!.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
    const select = document.querySelector<HTMLSelectElement>('.settings-panel select')
    expect(select).not.toBeNull()
    return select!
  }

  async function choose(select: HTMLSelectElement, value: string): Promise<void> {
    await act(async () => {
      select.value = value
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
  }

  it('offers automatic plus the two supported languages', async () => {
    const select = await openSettings()
    expect(select.value).toBe('auto')
    expect([...select.options].map((option) => option.textContent)).toEqual([
      'Automatic (follow Chrome)',
      'English',
      '中文',
    ])
  })

  it('applies a manual choice immediately and persists it', async () => {
    const select = await openSettings()
    await choose(select, 'zh')

    expect(set).toHaveBeenCalledWith({ dshPanelUiLocale: 'zh' })
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(document.title).toBe('dsh 浏览器助手')
    expect(document.body.textContent).toContain('界面语言')

    const chinese = document.querySelector<HTMLSelectElement>('.settings-panel select')!
    expect(chinese.value).toBe('zh')

    await choose(chinese, 'en')
    expect(set).toHaveBeenLastCalledWith({ dshPanelUiLocale: 'en' })
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe('dsh Browser Assistant')
    expect(document.body.textContent).toContain('Language')
  })
})
