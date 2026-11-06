// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { BridgeInstance, DiscoveryProgress, DiscoveryStatus, PanelApi, PanelSettings } from '../src/panel/api.ts'
import type { BridgeState } from '../src/background/bridge.ts'
import { getUiLocale } from '../src/i18n.ts'
import { PANEL_COPY } from '../src/panel/strings.ts'

let panelApi: PanelApi

vi.mock('../src/panel/api.ts', () => ({
  connectPanel: (): PanelApi => panelApi,
}))

import { App } from '../src/panel/App.tsx'

const copy = PANEL_COPY[getUiLocale()]

describe('discovery settings', () => {
  let root: Root
  let onStatus: ((state: BridgeState, caps: null, discovery: DiscoveryStatus, address?: string) => void) | undefined
  let onDiscoveryProgress: ((progress: DiscoveryProgress) => void) | undefined
  let startDiscovery: Mock<() => Promise<BridgeInstance[]>>
  let cancelDiscovery: Mock<() => Promise<void>>
  let updateSettings: Mock<(settings: Partial<PanelSettings>) => Promise<void>>

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    HTMLElement.prototype.scrollTo = vi.fn()
    vi.stubGlobal('chrome', {
      storage: { local: { get: vi.fn(async () => ({ dshSettings: {} })) } },
      windows: { getCurrent: vi.fn(async () => ({ id: 1 })) },
      runtime: {
        getManifest: () => ({ version: '0.1.6' }),
        getURL: (path: string) => `chrome-extension://test/${path}`,
      },
    })
    // The update card reads its installer provenance; there is none in tests.
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const unsubscribe = (): void => {}
    startDiscovery = vi.fn(async () => [])
    cancelDiscovery = vi.fn(async () => {})
    updateSettings = vi.fn(async () => {})
    panelApi = {
      rpc: vi.fn(async () => ({ items: [], events: [] })) as unknown as PanelApi['rpc'],
      respond: vi.fn(async () => undefined),
      onStatus: vi.fn((callback) => { onStatus = callback; return unsubscribe }),
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
      updateSettings,
      onDevToolsStatus: vi.fn(() => unsubscribe),
      detachDevTools: vi.fn(async () => undefined),
      requestStatus: vi.fn(async () => {}),
      startDiscovery,
      cancelDiscovery,
      onDiscoveryProgress: vi.fn((callback) => { onDiscoveryProgress = callback; return unsubscribe }),
    }
    root = createRoot(document.querySelector('#root')!)
  })

  afterEach(async () => {
    await act(async () => { root.unmount() })
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  async function openSettings(): Promise<void> {
    await act(async () => { root.render(createElement(App)) })
    await act(async () => {
      document.querySelector<HTMLButtonElement>('.settings-trigger')!.click()
    })
  }

  function detectButton(): HTMLButtonElement {
    return [...document.querySelectorAll<HTMLButtonElement>('.bridge-detection-actions button')][0]!
  }

  function addressInput(): HTMLInputElement {
    return document.querySelector<HTMLInputElement>('.settings-panel input')!
  }

  const instance = (port: number, extra: Partial<BridgeInstance> = {}): BridgeInstance => ({
    wsUrl: `ws://127.0.0.1:${port}/ext/bridge`,
    port,
    sources: ['beacon'],
    ...extra,
  })

  it('scans only when the user asks, then lists the instances it found', async () => {
    await openSettings()
    expect(startDiscovery).not.toHaveBeenCalled()

    startDiscovery.mockImplementationOnce(async () => {
      onDiscoveryProgress?.({ done: 3, total: 16_384, instances: [instance(60222)] })
      return [instance(60222), instance(43189, { sources: ['fixed'] })]
    })
    await act(async () => { detectButton().click() })
    await vi.waitFor(() => {
      expect(document.querySelectorAll('.device-row')).toHaveLength(2)
    })

    expect(startDiscovery).toHaveBeenCalledOnce()
    const rows = [...document.querySelectorAll<HTMLButtonElement>('.device-row')]
    expect(rows[0]?.textContent).toContain('ws://127.0.0.1:60222/ext/bridge')
    expect(rows[1]?.textContent).toContain('ws://127.0.0.1:43189/ext/bridge')
  })

  it('fills the address field with the instance the user picked', async () => {
    await openSettings()
    startDiscovery.mockImplementationOnce(async () => [instance(60222)])
    await act(async () => { detectButton().click() })
    await vi.waitFor(() => { expect(document.querySelectorAll('.device-row')).toHaveLength(1) })

    await act(async () => {
      document.querySelector<HTMLButtonElement>('.device-row')!.click()
    })

    expect(addressInput().value).toBe('ws://127.0.0.1:60222/ext/bridge')
  })

  it('reports a scan that found nothing', async () => {
    await openSettings()
    await act(async () => { detectButton().click() })

    await vi.waitFor(() => {
      expect(document.querySelector('.bridge-detection')?.textContent).toContain(copy.settings.detectEmpty)
    })
  })

  it('shows the cancelled scan as a normal state, not an error', async () => {
    await openSettings()
    // The button turns into Cancel while the scan is in flight.
    let release!: (instances: BridgeInstance[]) => void
    startDiscovery.mockImplementationOnce(async () => await new Promise<BridgeInstance[]>((resolve) => {
      release = resolve
    }))
    await act(async () => { detectButton().click() })
    expect(detectButton().textContent).toBe(copy.settings.detectCancel)

    await act(async () => { detectButton().click() })
    expect(cancelDiscovery).toHaveBeenCalledOnce()
    await act(async () => { release([]) })
    await vi.waitFor(() => { expect(detectButton().textContent).toBe(copy.settings.detect) })
  })

  it('says "no service found" when the startup pass came up empty', async () => {
    await act(async () => { root.render(createElement(App)) })
    await act(async () => { onStatus?.('stopped', null, 'not-found') })

    expect(document.body.textContent).toContain(copy.statusNotFound)
  })

  it('shows the address the bridge actually connected to', async () => {
    await openSettings()
    await act(async () => { onStatus?.('connected', null, 'found', 'ws://127.0.0.1:60222/ext/bridge') })

    expect(document.querySelector('.device-connected')?.textContent)
      .toBe(copy.settings.detectConnected('ws://127.0.0.1:60222/ext/bridge'))
  })
})
