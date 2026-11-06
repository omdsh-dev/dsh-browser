// @vitest-environment jsdom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { BridgeState } from '../src/background/bridge.ts'
import type { PanelApi } from '../src/panel/api.ts'
import type { ServerFrame } from '@yuxianglin/dsh-bridge-browser/src/protocol.ts'

let panelApi: PanelApi

vi.mock('../src/panel/api.ts', () => ({
  connectPanel: (): PanelApi => panelApi,
}))

import { App } from '../src/panel/App.tsx'

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

const commandDirectory = {
  provisional: false,
  commands: [
    { name: 'compact', description: 'Compact the conversation' },
    { name: 'permission', description: 'Switch preset', hint: '<preset>' },
  ],
}

const skillDirectory = {
  provisional: false,
  skills: [
    { name: 'office-docx', description: 'Word documents', modelInvocable: false },
  ],
}

describe('composer controls', () => {
  let root: Root
  let onStatus: ((state: BridgeState, caps: null) => void) | undefined
  let onEvent: ((frame: ServerFrame) => void) | undefined
  let onResumeHint: ((sessionId: string | null) => void) | undefined
  let rpc: Mock<(method: string, payload?: unknown) => Promise<unknown>>
  let permissions: Record<string, unknown>

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    HTMLElement.prototype.scrollTo = vi.fn()
    vi.stubGlobal('chrome', {
      storage: { local: { get: vi.fn(async () => ({ dshSettings: { autoResumeSession: false } })) } },
      windows: { getCurrent: vi.fn(async () => ({ id: 1 })) },
    })
    permissions = {
      current: 'workspace-write',
      defaultPreset: 'workspace-write',
      routable: true,
      provisional: false,
      options: permissionCatalog.options,
    }
    rpc = vi.fn(async (method: string, payload?: unknown) => {
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
      if (method === 'session.permissions') return permissions
      if (method === 'commands.list') return commandDirectory
      if (method === 'skills.list') return skillDirectory
      if (method === 'session.setPermission') {
        const preset = (payload as { preset: string }).preset
        permissions = { ...permissions, current: preset }
        return { preset, commandId: 'command-1', result: { kind: 'success' } }
      }
      if (method === 'commands.execute') return { commandId: 'command-2', result: { kind: 'success', text: 'done' } }
      if (method === 'session.prompt') return { accepted: true }
      throw new Error(`unexpected RPC: ${method}`)
    })
    const unsubscribe = (): void => {}
    panelApi = {
      rpc: async <T = unknown>(method: string, payload?: unknown): Promise<T> =>
        await rpc(method, payload) as T,
      respond: vi.fn(async () => undefined),
      onStatus: vi.fn((callback) => { onStatus = callback; return unsubscribe }),
      onEvent: vi.fn((callback) => { onEvent = callback; return unsubscribe }),
      onApprovalRequest: vi.fn(() => unsubscribe),
      onApprovalResolved: vi.fn(() => unsubscribe),
      onTabAffinity: vi.fn(() => unsubscribe),
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
      // `ready` with no hint is the signal that the page owns no session yet.
      onResumeHint?.(null)
    })
    await vi.waitFor(() => {
      expect(rpc.mock.calls.some(([method]) => method === 'session.permissions')).toBe(true)
    })
  }

  function chipTrigger(): HTMLButtonElement {
    return document.querySelector<HTMLButtonElement>('.composer-chip .composer-chip-trigger')!
  }

  function chipOption(label: string): HTMLButtonElement | undefined {
    return [...document.querySelectorAll<HTMLButtonElement>('.composer-chip-menu button')]
      .find((button) => button.textContent?.includes(label))
  }

  function textarea(): HTMLTextAreaElement {
    return document.querySelector<HTMLTextAreaElement>('textarea')!
  }

  async function type(value: string): Promise<void> {
    await act(async () => {
      const field = textarea()
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
      setter?.call(field, value)
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  it('shows the current preset and switches a safe preset without confirmation', async () => {
    await renderConnected()

    expect(chipTrigger().textContent).toContain('Workspace edits')
    await act(async () => { chipTrigger().click() })
    const readOnly = chipOption('Read only')!
    expect(readOnly).toBeDefined()

    await act(async () => { readOnly.click() })
    await vi.waitFor(() => {
      expect(rpc).toHaveBeenCalledWith('session.setPermission', { sessionId: 'session-current', preset: 'read-only' })
    })
    await vi.waitFor(() => { expect(chipTrigger().textContent).toContain('Read only') })
    // No risk dialog was needed for a non-dangerous preset.
    expect(document.querySelector('.approval-dialog')).toBeNull()
  })

  it('requires an explicit confirmation before full access', async () => {
    await renderConnected()

    await act(async () => { chipTrigger().click() })
    await act(async () => { chipOption('Full access')!.click() })

    const dialog = document.querySelector('.approval-dialog')
    expect(dialog?.textContent).toContain('Full access')
    expect(rpc).not.toHaveBeenCalledWith('session.setPermission', expect.anything())

    const accept = [...document.querySelectorAll<HTMLButtonElement>('.approval-actions button')]
      .find((button) => button.textContent === 'Switch')!
    await act(async () => { accept.click() })
    await vi.waitFor(() => {
      expect(rpc).toHaveBeenCalledWith('session.setPermission', {
        sessionId: 'session-current',
        preset: 'danger-full-access',
      })
    })
  })

  it('cancels a risky switch without touching the host', async () => {
    await renderConnected()

    await act(async () => { chipTrigger().click() })
    await act(async () => { chipOption('Full access')!.click() })
    const cancel = [...document.querySelectorAll<HTMLButtonElement>('.approval-actions button')]
      .find((button) => button.textContent === 'Cancel')!
    await act(async () => { cancel.click() })

    expect(document.querySelector('.approval-dialog')).toBeNull()
    expect(rpc).not.toHaveBeenCalledWith('session.setPermission', expect.anything())
    expect(chipTrigger().textContent).toContain('Workspace edits')
  })

  it('keeps the model chip usable while a turn is running', async () => {
    await renderConnected()
    await act(async () => { onEvent?.({
      t: 'event',
      frame: {
        rpcId: 'event-1',
        method: 'session/event',
        payload: { type: 'session/event', sessionId: 'session-current', event: { type: 'turn/start', seq: 1, data: {} } },
      },
    }) })
    // The stop button proves the panel knows the turn is running.
    expect(document.querySelector('.composer-actions .stop-button')).not.toBeNull()

    const modelTrigger = document.querySelector<HTMLButtonElement>('.composer-model .composer-chip-trigger')!
    expect(modelTrigger.disabled).toBe(false)
    await act(async () => { modelTrigger.click() })
    expect(document.querySelector('.composer-model-menu')).not.toBeNull()
  })

  it('opens the slash menu, inserts a command row, and runs it through commands.execute', async () => {
    await renderConnected()

    // An empty query lists every directory; typing narrows it.
    await type('/')
    expect(document.querySelector('.slash-menu')?.textContent).toContain('/compact')
    expect(document.querySelector('.slash-menu')?.textContent).toContain('/permission')
    expect(document.querySelector('.slash-menu')?.textContent).toContain('/office-docx')

    await type('/co')
    expect(document.querySelector('.slash-menu')?.textContent).toContain('/compact')
    expect(document.querySelector('.slash-menu')?.textContent).not.toContain('/permission')

    await act(async () => {
      textarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    expect(textarea().value).toBe('/compact')

    await act(async () => {
      textarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    await vi.waitFor(() => {
      expect(rpc).toHaveBeenCalledWith('commands.execute', { sessionId: 'session-current', line: '/compact' })
    })
    expect(rpc).not.toHaveBeenCalledWith('session.prompt', expect.anything())
    expect(document.querySelector('.notice')?.textContent).toContain('done')
  })

  it('lists user-only skills and sends a skill line as an ordinary prompt', async () => {
    await renderConnected()

    await type('/office')
    const menu = document.querySelector('.slash-menu')
    expect(menu?.textContent).toContain('/office-docx')
    expect(menu?.textContent).toContain('User only')

    await act(async () => {
      textarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    await act(async () => {
      textarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    await vi.waitFor(() => {
      expect(rpc).toHaveBeenCalledWith('session.prompt', expect.objectContaining({
        sessionId: 'session-current',
        content: [{ type: 'text', text: '/office-docx' }],
      }))
    })
  })

  it('refuses an unknown slash line instead of sending it as a prompt', async () => {
    await renderConnected()

    await type('/nope')
    await act(async () => {
      textarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(document.querySelector('.error')?.textContent).toContain('/nope')
    expect(rpc).not.toHaveBeenCalledWith('session.prompt', expect.anything())
    // The draft survives so the user can fix it.
    expect(textarea().value).toBe('/nope')
  })

  it('offers the reasoning efforts the current model declares', async () => {
    rpc.mockImplementation(async (method: string) => {
      if (method === 'session.create') return { sessionId: 'session-current' }
      if (method === 'session.history') return { events: [] }
      if (method === 'session.list') return { items: [] }
      if (method === 'session.models') {
        return {
          current: { provider: 'provider', model: 'saved-model', reasoningEffort: 'high' },
          routable: true,
          groups: [{
            id: 'provider',
            name: 'Provider',
            models: [{
              id: 'saved-model',
              name: 'Saved model',
              reasoning: { efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }] },
            }],
          }],
        }
      }
      if (method === 'session.permissions') return permissions
      if (method === 'commands.list') return commandDirectory
      if (method === 'skills.list') return skillDirectory
      if (method === 'session.selectModel') {
        return { selected: { provider: 'provider', model: 'saved-model', reasoningEffort: 'low' } }
      }
      throw new Error(`unexpected RPC: ${method}`)
    })
    await renderConnected()

    const trigger = document.querySelector<HTMLButtonElement>('.composer-model .composer-chip-trigger')!
    await vi.waitFor(() => { expect(trigger.textContent).toContain('High') })
    await act(async () => { trigger.click() })
    expect(document.querySelector('.composer-model-menu')?.textContent).toContain('Reasoning effort')

    const low = [...document.querySelectorAll<HTMLButtonElement>('.composer-model-menu button')]
      .find((button) => button.textContent === 'Low')!
    await act(async () => { low.click() })

    await vi.waitFor(() => {
      expect(rpc).toHaveBeenCalledWith('session.selectModel', {
        sessionId: 'session-current',
        provider: 'provider',
        model: 'saved-model',
        reasoningEffort: 'low',
      })
    })
    await vi.waitFor(() => { expect(trigger.textContent).toContain('Low') })
  })

  it('keeps shift+enter as a newline while the slash menu is open', async () => {
    await renderConnected()
    await type('/co')
    expect(document.querySelector('.slash-menu')).not.toBeNull()

    await act(async () => {
      textarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }))
    })
    // The draft is untouched and the menu stays open for the next token.
    expect(textarea().value).toBe('/co')
    expect(document.querySelector('.slash-menu')).not.toBeNull()
  })

  it('explains a provisional command directory instead of pretending it is empty', async () => {
    rpc.mockImplementation(async (method: string) => {
      if (method === 'session.create') return { sessionId: 'session-current' }
      if (method === 'session.history') return { events: [] }
      if (method === 'session.list') return { items: [] }
      if (method === 'session.models') {
        return { current: { provider: 'p', model: 'm' }, routable: true, groups: [] }
      }
      if (method === 'session.permissions') return permissions
      if (method === 'commands.list') return { commands: [], provisional: true }
      if (method === 'skills.list') return { skills: [], provisional: true }
      throw new Error(`unexpected RPC: ${method}`)
    })
    await renderConnected()

    await type('/')
    const menu = document.querySelector('.slash-menu')
    // Only panel-owned rows are known yet, and the menu says when that changes.
    expect(menu?.textContent).toContain('/model')
    expect(menu?.textContent).toContain('first message')
  })

  it('trusts the Host running flag again when the panel becomes visible', async () => {
    await renderConnected()
    // The panel believes a turn is running, but the Host says it finished.
    await act(async () => { onEvent?.({
      t: 'event',
      frame: {
        rpcId: 'event-3',
        method: 'session/event',
        payload: { type: 'session/event', sessionId: 'session-current', event: { type: 'turn/start', seq: 1, data: {} } },
      },
    }) })
    expect(document.querySelector('.composer-actions .stop-button')).not.toBeNull()
    rpc.mockImplementation(async (method: string) => {
      if (method === 'session.list') return { items: [{ sessionId: 'session-current', running: false, blank: false }] }
      if (method === 'workspace.list') return { archivedSessionIds: [] }
      throw new Error(`unexpected RPC: ${method}`)
    })

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await vi.waitFor(() => {
      expect(document.querySelector('.composer-actions .stop-button')).toBeNull()
    })
  })

  it('re-reads the preset when another client changes it', async () => {
    await renderConnected()
    const before = rpc.mock.calls.filter(([method]) => method === 'session.permissions').length

    permissions = { ...permissions, current: 'read-only' }
    await act(async () => { onEvent?.({
      t: 'event',
      frame: {
        rpcId: 'event-2',
        method: 'session/event',
        payload: {
          type: 'session/event',
          sessionId: 'session-current',
          event: { type: 'permission/preset', seq: 9, data: { preset: 'read-only' } },
        },
      },
    }) })

    await vi.waitFor(() => {
      expect(rpc.mock.calls.filter(([method]) => method === 'session.permissions').length).toBeGreaterThan(before)
    })
    await vi.waitFor(() => { expect(chipTrigger().textContent).toContain('Read only') })
  })
})
