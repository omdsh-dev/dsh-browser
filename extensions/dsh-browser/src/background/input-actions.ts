/**
 * Trusted input dispatch over CDP.
 *
 * These functions are the only place that produces real browser input. They
 * are deliberately thin: resolve a key or a point, send the protocol event,
 * and keep the per-tab state in sync. Orchestration (target measurement, frame
 * offsets, focus emulation, approval) lives one layer up.
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
import type { InputState, MouseButton } from './input-state.ts'
import type { Point } from '../shared/frame-geometry.ts'

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

/** Pointer actions the tool accepts. */
export type PointerAction = 'move' | 'down' | 'up' | 'click' | 'dblclick' | 'drag'

/** One pointer request, already translated into viewport coordinates. */
export interface PointerRequest {
  action: PointerAction
  point: Point
  button?: MouseButton
  clicks?: number
  modifiers?: ModifierName[]
  /** Drag destination, same coordinate space as `point`. */
  to?: Point
  steps?: number
}

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

/** One wheel request. */
export interface WheelRequest {
  point: Point
  deltaX: number
  deltaY: number
  modifiers?: ModifierName[]
}

/** Resolve a key name or fail with the supported vocabulary. */
function requireStroke(key: string): KeyStroke {
  const stroke = strokeForKey(key)
  if (stroke === undefined) {
    throw new InputError('bad-args', `Unsupported key "${key}".`)
  }
  return stroke
}

// 保留 CSS 像素的小数，避免框架缩放后放大取整误差。
function pointOf(point: Point): { x: number; y: number } {
  return { x: point.x, y: point.y }
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

/** Press or release one mouse button at a point. */
async function mouseButtonEvent(
  client: CdpClient,
  state: InputState,
  type: 'mousePressed' | 'mouseReleased',
  point: Point,
  button: MouseButton,
  mask: number,
  clickCount: number,
): Promise<void> {
  // CDP expects `buttons` as the state AFTER this event: a release reports
  // the remaining buttons, not the one being released.
  state.setButton(button, type === 'mousePressed')
  const buttons = state.buttonsMask()
  await client.send('Input.dispatchMouseEvent', {
    type,
    ...pointOf(point),
    button,
    buttons,
    clickCount,
    modifiers: mask,
  })
  state.setPointer(point)
}

/** Move the pointer without clicking. */
async function mouseMove(
  client: CdpClient,
  state: InputState,
  point: Point,
  mask: number,
): Promise<void> {
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    ...pointOf(point),
    button: 'none',
    buttons: state.buttonsMask(),
    modifiers: mask,
  })
  state.setPointer(point)
}

/**
 * Dispatch one pointer gesture.
 *
 * @param client - attached CDP client.
 * @param state - per-tab input state (buttons and last position).
 * @param request - gesture and coordinates.
 */
export async function dispatchPointer(client: CdpClient, state: InputState, request: PointerRequest): Promise<void> {
  const button = request.button ?? 'left'
  const mask = combinedMask(state, request.modifiers)
  const clicks = request.clicks ?? 1
  if (!Number.isInteger(clicks) || clicks < 1 || clicks > 3) {
    throw new InputError('bad-args', 'clicks must be 1, 2, or 3.')
  }
  switch (request.action) {
    case 'move':
      await mouseMove(client, state, request.point, mask)
      return
    case 'down':
      await mouseButtonEvent(client, state, 'mousePressed', request.point, button, mask, 1)
      return
    case 'up':
      await mouseButtonEvent(client, state, 'mouseReleased', request.point, button, mask, 1)
      return
    case 'click':
    case 'dblclick': {
      const count = request.action === 'dblclick' ? 2 : clicks
      for (let index = 1; index <= count; index += 1) {
        await mouseButtonEvent(client, state, 'mousePressed', request.point, button, mask, index)
        await mouseButtonEvent(client, state, 'mouseReleased', request.point, button, mask, index)
      }
      return
    }
    case 'drag': {
      if (request.to === undefined) {
        throw new InputError('bad-args', 'drag needs a destination point (to).')
      }
      const steps = Math.max(1, Math.min(120, request.steps ?? 8))
      await mouseMove(client, state, request.point, mask)
      await mouseButtonEvent(client, state, 'mousePressed', request.point, button, mask, 1)
      for (let step = 1; step <= steps; step += 1) {
        const ratio = step / steps
        const interpolation: Point = {
          x: request.point.x + (request.to.x - request.point.x) * ratio,
          y: request.point.y + (request.to.y - request.point.y) * ratio,
        }
        await mouseMove(client, state, interpolation, mask)
      }
      await mouseButtonEvent(client, state, 'mouseReleased', request.to, button, mask, 1)
      return
    }
    default: {
      const unreachable = request.action as string
      throw new InputError('bad-args', `Unknown pointer action "${unreachable}".`)
    }
  }
}

/**
 * Dispatch a real wheel event at a point.
 *
 * @param client - attached CDP client.
 * @param state - per-tab input state.
 * @param request - coordinates and deltas.
 */
export async function dispatchWheel(client: CdpClient, state: InputState, request: WheelRequest): Promise<void> {
  const mask = combinedMask(state, request.modifiers)
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseWheel',
    ...pointOf(request.point),
    deltaX: request.deltaX,
    deltaY: request.deltaY,
    button: 'none',
    buttons: state.buttonsMask(),
    modifiers: mask,
  })
  state.setPointer(request.point)
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
  let enabled = false
  try {
    await client.send('Emulation.setFocusEmulationEnabled', { enabled: true })
    enabled = true
  } catch {
    // Older protocol surfaces lack the command; the sequence still runs.
  }
  try {
    return await run()
  } finally {
    if (enabled) {
      await client.send('Emulation.setFocusEmulationEnabled', { enabled: false }).catch(() => undefined)
    }
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
