// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import type { CdpClient } from '../src/background/debugger-session.ts'
import { InputState } from '../src/background/input-state.ts'
import {
  InputError,
  dispatchKey,
  editingCommandFor,
  insertTextAtCaret,
  pasteShortcutModifier,
  sendPasteShortcut,
  setInputFiles,
  typeAsKeystrokes,
  withFocusEmulation,
} from '../src/background/input-actions.ts'

type Call = { method: string; params: Record<string, unknown> }

function fakeClient(handlers: Record<string, (params: Record<string, unknown>) => unknown> = {}): {
  client: CdpClient
  calls: Call[]
} {
  const calls: Call[] = []
  return {
    calls,
    client: {
      async send(method: string, params: Record<string, unknown> = {}) {
        calls.push({ method, params })
        return handlers[method]?.(params) ?? {}
      },
    },
  }
}

describe('editingCommandFor', () => {
  it('names the macOS editing commands a CDP key event does not reach', () => {
    expect(editingCommandFor('a', ['Meta'], 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)')).toBe('selectAll')
    expect(editingCommandFor('v', ['Meta'], 'Macintosh')).toBe('paste')
    expect(editingCommandFor('z', ['Meta', 'Shift'], 'Macintosh')).toBe('redo')
    expect(editingCommandFor('z', ['Meta'], 'Macintosh')).toBe('undo')
  })

  it('does not name a command without Meta or on other platforms', () => {
    expect(editingCommandFor('a', ['Control'], 'Mozilla/5.0 (Windows NT 10.0)')).toBeUndefined()
    expect(editingCommandFor('a', ['Meta'], 'Mozilla/5.0 (X11; Linux x86_64)')).toBeUndefined()
    expect(editingCommandFor('b', ['Meta'], 'Macintosh')).toBeUndefined()
  })
})

describe('dispatchKey', () => {
  it('sends a command chord without text', async () => {
    const { client, calls } = fakeClient()
    await dispatchKey(client, new InputState(), { key: 'a', modifiers: ['Meta'] })
    expect(calls.map((call) => call.params.type)).toEqual(['rawKeyDown', 'keyUp'])
    expect(calls[0]!.params).toMatchObject({ key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 4 })
    expect(calls[0]!.params.text).toBeUndefined()
  })

  it('inserts text for a plain character', async () => {
    const { client, calls } = fakeClient()
    await dispatchKey(client, new InputState(), { key: 'a' })
    expect(calls[0]!.params).toMatchObject({ type: 'keyDown', text: 'a' })
  })

  it('does not insert text for Shift+Tab', async () => {
    const { client, calls } = fakeClient()
    await dispatchKey(client, new InputState(), { key: 'Tab', modifiers: ['Shift'] })
    expect(calls[0]!.params).toMatchObject({ type: 'rawKeyDown', modifiers: 8 })
    expect(calls[0]!.params.text).toBeUndefined()
  })

  it('tracks a held modifier key across calls', async () => {
    const { client } = fakeClient()
    const state = new InputState()
    await dispatchKey(client, state, { key: 'Shift', action: 'down' })
    expect(state.modifiersMask()).toBe(8)
    await dispatchKey(client, state, { key: 'Shift', action: 'up' })
    expect(state.modifiersMask()).toBe(0)
  })

  it('rejects unknown keys', async () => {
    const { client } = fakeClient()
    await expect(dispatchKey(client, new InputState(), { key: 'Hyper' })).rejects.toBeInstanceOf(InputError)
  })

  it('adds the macOS editing command to the key-down', async () => {
    const { client, calls } = fakeClient()
    await dispatchKey(client, new InputState(), { key: 'a', modifiers: ['Meta'] }, 'Mozilla/5.0 (Macintosh)')
    expect(calls[0]!.params).toMatchObject({ type: 'rawKeyDown', modifiers: 4, commands: ['selectAll'] })
    expect(calls[1]!.params.commands).toBeUndefined()
  })

  it('leaves the command off on other platforms', async () => {
    const { client, calls } = fakeClient()
    await dispatchKey(client, new InputState(), { key: 'a', modifiers: ['Control'] }, 'Mozilla/5.0 (X11; Linux)')
    expect(calls[0]!.params.commands).toBeUndefined()
  })
})

describe('typeAsKeystrokes', () => {
  it('inserts the uppercase character with a Shift key event', async () => {
    const { client, calls } = fakeClient()
    await typeAsKeystrokes(client, new InputState(), 'K1')
    expect(calls[0]!.params).toMatchObject({ type: 'keyDown', key: 'k', text: 'K', modifiers: 8 })
    expect(calls[1]!.params).toMatchObject({ type: 'keyUp', key: 'k' })
    expect(calls[2]!.params).toMatchObject({ type: 'keyDown', key: '1', text: '1' })
  })
})

describe('insertTextAtCaret', () => {
  it('chunks long text under the protocol limit', async () => {
    const { client, calls } = fakeClient()
    await insertTextAtCaret(client, 'x'.repeat(20_000))
    expect(calls).toHaveLength(3)
    const lengths = calls.map((call) => (call.params.text as string).length)
    expect(lengths).toEqual([8_192, 8_192, 3_616])
    expect(calls.every((call) => call.method === 'Input.insertText')).toBe(true)
  })
})

describe('paste shortcut', () => {
  it('chooses Meta on macOS and Control elsewhere', () => {
    expect(pasteShortcutModifier('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)')).toBe('Meta')
    expect(pasteShortcutModifier('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Control')
  })

  it('presses the platform paste chord', async () => {
    const { client, calls } = fakeClient()
    await sendPasteShortcut(client, new InputState(), 'Mozilla/5.0 (Macintosh)')
    expect(calls[0]!.params).toMatchObject({ key: 'v', modifiers: 4 })
  })
})

describe('withFocusEmulation', () => {
  it('enables and disables focus emulation around the sequence', async () => {
    const { client, calls } = fakeClient()
    const result = await withFocusEmulation(client, async () => 'done')
    expect(result).toBe('done')
    expect(calls.map((call) => [call.method, call.params.enabled])).toEqual([
      ['Emulation.setFocusEmulationEnabled', true],
      ['Emulation.setFocusEmulationEnabled', false],
    ])
  })

  it('restores the switch when the sequence throws', async () => {
    const { client, calls } = fakeClient()
    await expect(withFocusEmulation(client, async () => { throw new Error('boom') })).rejects.toThrow('boom')
    expect(calls.at(-1)!.params.enabled).toBe(false)
  })

})

describe('setInputFiles', () => {
  it('resolves the marked input and attaches the files', async () => {
    const { client, calls } = fakeClient({
      'DOM.getDocument': () => ({ root: { nodeId: 1 } }),
      'DOM.querySelector': () => ({ nodeId: 42 }),
    })
    await setInputFiles(client, 'input[data-dsh-upload="abc"]', ['/tmp/a.pdf'])
    expect(calls.map((call) => call.method)).toEqual(['DOM.getDocument', 'DOM.querySelector', 'DOM.setFileInputFiles'])
    expect(calls[2]!.params).toEqual({ files: ['/tmp/a.pdf'], nodeId: 42 })
  })

  it('fails clearly when the marker is gone', async () => {
    const { client } = fakeClient({
      'DOM.getDocument': () => ({ root: { nodeId: 1 } }),
      'DOM.querySelector': () => ({ nodeId: 0 }),
    })
    await expect(setInputFiles(client, 'input[data-dsh-upload="abc"]', ['/tmp/a.pdf']))
      .rejects.toThrow(/No file input matched/)
  })
})
