// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import type { CdpClient } from '../src/background/debugger-session.ts'
import { InputState } from '../src/background/input-state.ts'
import {
  InputError,
  dispatchKey,
  dispatchPointer,
  dispatchWheel,
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

describe('dispatchPointer', () => {
  it('clicks a point with a real press/release pair', async () => {
    const { client, calls } = fakeClient()
    const state = new InputState()
    await dispatchPointer(client, state, { action: 'click', point: { x: 10.4, y: 20.6 } })
    expect(calls.map((call) => call.method)).toEqual(['Input.dispatchMouseEvent', 'Input.dispatchMouseEvent'])
    expect(calls[0]!.params).toMatchObject({ type: 'mousePressed', x: 10.4, y: 20.6, button: 'left', buttons: 1, clickCount: 1 })
    expect(calls[1]!.params).toMatchObject({ type: 'mouseReleased', buttons: 0 })
    expect(state.buttonsMask()).toBe(0)
  })

  it('emits increasing click counts for a double click', async () => {
    const { client, calls } = fakeClient()
    await dispatchPointer(client, new InputState(), { action: 'dblclick', point: { x: 0, y: 0 } })
    expect(calls.map((call) => call.params.clickCount)).toEqual([1, 1, 2, 2])
  })

  it('drags through every interpolation step and releases at the destination', async () => {
    const { client, calls } = fakeClient()
    await dispatchPointer(client, new InputState(), {
      action: 'drag',
      point: { x: 0, y: 0 },
      to: { x: 100, y: 50 },
      steps: 2,
    })
    expect(calls.map((call) => call.params.type)).toEqual([
      'mouseMoved',
      'mousePressed',
      'mouseMoved',
      'mouseMoved',
      'mouseReleased',
    ])
    expect(calls[3]!.params).toMatchObject({ x: 100, y: 50 })
    expect(calls[4]!.params).toMatchObject({ x: 100, y: 50, buttons: 0 })
  })

  it('carries held modifiers and pressed buttons', async () => {
    const { client, calls } = fakeClient()
    const state = new InputState()
    state.setModifier('Shift', true)
    await dispatchPointer(client, state, { action: 'click', point: { x: 5, y: 5 }, button: 'right' })
    expect(calls[0]!.params).toMatchObject({ modifiers: 8, button: 'right', buttons: 2 })
    expect(calls[1]!.params).toMatchObject({ modifiers: 8, button: 'right', buttons: 0 })
  })

  it('rejects a drag without a destination', async () => {
    const { client } = fakeClient()
    await expect(dispatchPointer(client, new InputState(), { action: 'drag', point: { x: 0, y: 0 } }))
      .rejects.toThrow(/destination/)
  })
})

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

describe('dispatchWheel', () => {
  it('sends a wheel event with deltas at the point', async () => {
    const { client, calls } = fakeClient()
    await dispatchWheel(client, new InputState(), { point: { x: 3, y: 4 }, deltaX: 0, deltaY: 120 })
    expect(calls[0]!.params).toMatchObject({ type: 'mouseWheel', x: 3, y: 4, deltaX: 0, deltaY: 120 })
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

  it('runs the sequence when focus emulation is unavailable', async () => {
    const send = vi.fn()
      .mockRejectedValueOnce(new Error('method not found'))
      .mockResolvedValueOnce({})
    const client = { send } as unknown as CdpClient
    await expect(withFocusEmulation(client, async () => 'ok')).resolves.toBe('ok')
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
