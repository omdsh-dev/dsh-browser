/**
 * Trusted input dispatch over CDP.
 *
 * Sends keyboard events, inserts text, and attaches files. Target selection,
 * focus emulation, and approval are handled by the caller.
 *
 * @module
 */

import type { CdpClient } from './debugger-session.ts'
import { resolveFrameNode } from './debugger-frame.ts'
import {
  MODIFIER_BITS,
  modifierMask,
  strokeForKey,
  strokeInsertsText,
  type ModifierName,
  type KeyStroke,
} from './keys.ts'
import type { InputState } from './input-state.ts'

/** Stable failure codes for trusted input. */
export type InputErrorCode = 'input-unavailable' | 'bad-args' | 'action-failed'

/** One trusted-input failure. */
export class InputError extends Error {
  constructor(
    readonly code: InputErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'InputError'
  }
}

/** Largest single `Input.insertText` payload; longer text is chunked. */
const INSERT_TEXT_CHUNK = 8_192

/** One keyboard request. */
export interface KeyRequest {
  key: string
  action?: 'press' | 'down' | 'up'
  modifiers?: ModifierName[]
  repeat?: number
  /** Text this press inserts, overriding the key table's character (uppercase typing). */
  text?: string
}

/**
 * macOS editing shortcuts are application-menu commands, not renderer editing:
 * a plain CDP key event never reaches them. Naming the command on the key-down
 * is what Chrome's own DevTools does for these combinations.
 */
const MAC_EDITING_COMMANDS: Readonly<Record<string, string>> = {
  a: 'selectAll',
  c: 'copy',
  v: 'paste',
  x: 'cut',
  z: 'undo',
}

/**
 * The editing command a key-down should name, when the platform needs one.
 *
 * @param key - pressed key (KeyboardEvent.key semantics).
 * @param modifiers - active modifiers.
 * @param agent - user agent of the browser running the page.
 * @returns the command name, or undefined when a plain key event suffices.
 */
export function editingCommandFor(key: string, modifiers: readonly ModifierName[], agent: string): string | undefined {
  if (!/mac|iphone|ipad|ipod/i.test(agent)) return undefined
  if (!modifiers.includes('Meta')) return undefined
  const lower = key.toLowerCase()
  if (lower === 'z' && modifiers.includes('Shift')) return 'redo'
  return MAC_EDITING_COMMANDS[lower]
}

/** The platform string trusted input uses when the caller does not supply one. */
function defaultAgent(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent
}

/** Resolve a key name or fail with the supported vocabulary. */
function requireStroke(key: string): KeyStroke {
  const stroke = strokeForKey(key)
  if (stroke === undefined) {
    throw new InputError('bad-args', `Unsupported key "${key}".`)
  }
  return stroke
}

/** Union of held modifiers and the request's own modifiers. */
function combinedMask(state: InputState, modifiers: readonly ModifierName[] | undefined): number {
  return state.modifiersMask() | modifierMask(modifiers ?? [])
}

/** Keys that are modifiers themselves, so press/release updates the state. */
const MODIFIER_KEYS = new Set<ModifierName>(['Alt', 'Control', 'Meta', 'Shift'])

/**
 * Send one keyboard event sequence.
 *
 * @param client - attached CDP client.
 * @param state - per-tab input state.
 * @param request - key, action, and modifiers.
 */
export async function dispatchKey(
  client: CdpClient,
  state: InputState,
  request: KeyRequest,
  agent: string = defaultAgent(),
): Promise<void> {
  const stroke = requireStroke(request.key)
  const action = request.action ?? 'press'
  const repeat = request.repeat ?? 1
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 100) {
    throw new InputError('bad-args', 'repeat must be an integer between 1 and 100.')
  }
  const modifiers = request.modifiers ?? []
  const mask = combinedMask(state, modifiers)
  if (MODIFIER_KEYS.has(stroke.key as ModifierName)) {
    state.setModifier(stroke.key as ModifierName, action !== 'up')
  }
  const overridden = (mask & (MODIFIER_BITS.Control | MODIFIER_BITS.Meta | MODIFIER_BITS.Alt)) === 0
    ? request.text
    : undefined
  const text = overridden ?? (strokeInsertsText(stroke, mask) ? stroke.text : undefined)
  const command = action === 'up' ? undefined : editingCommandFor(stroke.key, modifiers, agent)
  for (let count = 0; count < repeat; count += 1) {
    if (action !== 'up') {
      await client.send('Input.dispatchKeyEvent', {
        type: text === undefined ? 'rawKeyDown' : 'keyDown',
        key: stroke.key,
        code: stroke.code,
        windowsVirtualKeyCode: stroke.windowsVirtualKeyCode,
        modifiers: mask,
        ...(text === undefined ? {} : { text }),
        ...(command === undefined ? {} : { commands: [command] }),
        ...(count > 0 ? { autoRepeat: true } : {}),
      })
    }
    if (action !== 'down') {
      await client.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: stroke.key,
        code: stroke.code,
        windowsVirtualKeyCode: stroke.windowsVirtualKeyCode,
        modifiers: mask,
      })
    }
  }
}

/**
 * Type text as a sequence of key events, one character at a time.
 *
 * Some pages react to `keydown`/`keyup` per character (autocomplete, shortcut
 * hints) and ignore a single insert. Characters the key table cannot express
 * (CJK, emoji, shifted punctuation) fall back to `insertText` one at a time.
 *
 * @param client - attached CDP client.
 * @param state - per-tab input state.
 * @param text - text to type.
 */
export async function typeAsKeystrokes(client: CdpClient, state: InputState, text: string): Promise<void> {
  for (const character of text) {
    const upper = character.length === 1 && character !== character.toLowerCase() && /^[A-Z]$/.test(character)
    const stroke = strokeForKey(character)
    if (stroke === undefined || stroke.text === undefined) {
      await insertTextAtCaret(client, character)
      continue
    }
    if (upper) {
      // Shift changes the physical key but CDP does not transform `text`; send
      // the uppercase character explicitly so the insertion matches the key.
      await dispatchKey(client, state, { key: character.toLowerCase(), modifiers: ['Shift'], text: character })
      continue
    }
    await dispatchKey(client, state, { key: character })
  }
}

/**
 * Insert text at the current caret, bypassing keyboard layout.
 *
 * @param client - attached CDP client.
 * @param text - text to insert; long strings are chunked.
 */
export async function insertTextAtCaret(client: CdpClient, text: string): Promise<void> {
  for (let offset = 0; offset < text.length; offset += INSERT_TEXT_CHUNK) {
    await client.send('Input.insertText', { text: text.slice(offset, offset + INSERT_TEXT_CHUNK) })
  }
}

/**
 * Whether this platform's paste shortcut uses Meta (macOS) or Control.
 *
 * @param agent - a `navigator.userAgent`-shaped string (or `navigator.platform`).
 * @returns the modifier to hold while pressing `v`.
 */
export function pasteShortcutModifier(agent: string): ModifierName {
  return /mac|iphone|ipad|ipod/i.test(agent) ? 'Meta' : 'Control'
}

/**
 * Send the platform's paste shortcut to the focused element.
 *
 * @param client - attached CDP client.
 * @param state - per-tab input state.
 * @param agent - platform string used to choose the modifier.
 */
export async function sendPasteShortcut(client: CdpClient, state: InputState, agent: string): Promise<void> {
  const modifier = pasteShortcutModifier(agent)
  await dispatchKey(client, state, { key: 'v', modifiers: [modifier], repeat: 1 })
}

/**
 * Toggle focus emulation around one trusted-input sequence.
 *
 * Background tabs report `document.hasFocus() === false`, and some editors
 * gate typing on it. Emulation makes the page behave as focused without
 * actually focusing the window; the switch is always restored.
 *
 * @param client - attached CDP client.
 * @param run - the input sequence.
 * @returns whatever `run` returns.
 */
export async function withFocusEmulation<T>(client: CdpClient, run: () => Promise<T>): Promise<T> {
  await client.send('Emulation.setFocusEmulationEnabled', { enabled: true })
  try {
    return await run()
  } finally {
    await client.send('Emulation.setFocusEmulationEnabled', { enabled: false })
  }
}

/**
 * Assign files to a file input addressed by a unique selector.
 *
 * The browser process reads the paths; the extension never reads file content.
 *
 * @param client - attached CDP client.
 * @param selector - selector produced by the content script's upload marker.
 * @param paths - host paths to attach.
 */
export async function setInputFiles(client: CdpClient, selector: string, paths: readonly string[], uniqueContextId?: string): Promise<void> {
  if (paths.length === 0) throw new InputError('bad-args', 'paths must contain at least one local file path.')
  if (uniqueContextId !== undefined) {
    const nodeId = await resolveFrameNode(client, selector, uniqueContextId)
    await client.send('DOM.setFileInputFiles', { files: [...paths], nodeId })
    return
  }
  const document = await client.send('DOM.getDocument', { depth: -1, pierce: true }) as { root?: { nodeId?: number } }
  const rootNodeId = document.root?.nodeId
  if (rootNodeId === undefined) throw new InputError('action-failed', 'The page document could not be resolved.')
  const found = await client.send('DOM.querySelector', { nodeId: rootNodeId, selector }) as { nodeId?: number }
  if (found.nodeId === undefined || found.nodeId === 0) {
    throw new InputError('action-failed', `No file input matched ${selector}.`)
  }
  await client.send('DOM.setFileInputFiles', { files: [...paths], nodeId: found.nodeId })
}
