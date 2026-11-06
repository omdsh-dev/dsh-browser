/**
 * Keyboard mapping for trusted key dispatch.
 *
 * `Input.dispatchKeyEvent` needs a DOM `key`, a physical `code`, and a Windows
 * virtual-key code; the model only names keys. This module is the single table
 * that translates the model-facing vocabulary and reports the supported set
 * when a name is unknown, so a typo fails with an actionable message instead of
 * a silently wrong keystroke.
 *
 * @module
 */

/** Modifier names as the model spells them (KeyboardEvent modifier keys). */
export type ModifierName = 'Alt' | 'Control' | 'Meta' | 'Shift'

/** CDP modifier bitmask values. */
export const MODIFIER_BITS: Readonly<Record<ModifierName, number>> = {
  Alt: 1,
  Control: 2,
  Meta: 4,
  Shift: 8,
}

/** One physical key description. */
export interface KeyStroke {
  key: string
  code: string
  windowsVirtualKeyCode: number
  /** Text a non-command key press produces; absent for named/control keys. */
  text?: string
}

/** Whether a string is one of the four modifier names. */
export function isModifierName(value: string): value is ModifierName {
  return value === 'Alt' || value === 'Control' || value === 'Meta' || value === 'Shift'
}

/**
 * Combine modifier names into the CDP bitmask.
 *
 * @param modifiers - model-supplied modifier list.
 * @returns the modifier bitmask (0 when none).
 */
export function modifierMask(modifiers: readonly ModifierName[]): number {
  let mask = 0
  for (const modifier of modifiers) mask |= MODIFIER_BITS[modifier]
  return mask
}

/** Aliases the model (or a keyboard layout) may use for the same key. */
const KEY_ALIASES: Readonly<Record<string, string>> = {
  esc: 'Escape',
  escape: 'Escape',
  return: 'Enter',
  enter: 'Enter',
  space: ' ',
  spacebar: ' ',
  del: 'Delete',
  delete: 'Delete',
  ins: 'Insert',
  insert: 'Insert',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  home: 'Home',
  end: 'End',
  backspace: 'Backspace',
  tab: 'Tab',
}

/** Named (non-printable) keys. */
const NAMED_KEYS: Readonly<Record<string, Omit<KeyStroke, 'key'>>> = {
  Enter: { code: 'Enter', windowsVirtualKeyCode: 13 },
  Tab: { code: 'Tab', windowsVirtualKeyCode: 9 },
  Escape: { code: 'Escape', windowsVirtualKeyCode: 27 },
  Backspace: { code: 'Backspace', windowsVirtualKeyCode: 8 },
  Delete: { code: 'Delete', windowsVirtualKeyCode: 46 },
  ArrowUp: { code: 'ArrowUp', windowsVirtualKeyCode: 38 },
  ArrowDown: { code: 'ArrowDown', windowsVirtualKeyCode: 40 },
  ArrowLeft: { code: 'ArrowLeft', windowsVirtualKeyCode: 37 },
  ArrowRight: { code: 'ArrowRight', windowsVirtualKeyCode: 39 },
  Home: { code: 'Home', windowsVirtualKeyCode: 36 },
  End: { code: 'End', windowsVirtualKeyCode: 35 },
  PageUp: { code: 'PageUp', windowsVirtualKeyCode: 33 },
  PageDown: { code: 'PageDown', windowsVirtualKeyCode: 34 },
  Insert: { code: 'Insert', windowsVirtualKeyCode: 45 },
  Shift: { code: 'ShiftLeft', windowsVirtualKeyCode: 16 },
  Control: { code: 'ControlLeft', windowsVirtualKeyCode: 17 },
  Alt: { code: 'AltLeft', windowsVirtualKeyCode: 18 },
  Meta: { code: 'MetaLeft', windowsVirtualKeyCode: 91 },
}

/** Printable punctuation: key → physical code and virtual-key code. */
const PUNCTUATION: Readonly<Record<string, { code: string; vk: number }>> = {
  '-': { code: 'Minus', vk: 189 },
  '=': { code: 'Equal', vk: 187 },
  '[': { code: 'BracketLeft', vk: 219 },
  ']': { code: 'BracketRight', vk: 221 },
  '\\': { code: 'Backslash', vk: 220 },
  ';': { code: 'Semicolon', vk: 186 },
  "'": { code: 'Quote', vk: 222 },
  ',': { code: 'Comma', vk: 188 },
  '.': { code: 'Period', vk: 190 },
  '/': { code: 'Slash', vk: 191 },
  '`': { code: 'Backquote', vk: 192 },
}

/** Keys the model may name, for an actionable `bad-args` message. */
export const SUPPORTED_KEYS: readonly string[] = [
  ...'abcdefghijklmnopqrstuvwxyz'.split(''),
  ...'0123456789'.split(''),
  ' ', ...Object.keys(PUNCTUATION),
  ...Object.keys(NAMED_KEYS),
  ...Array.from({ length: 12 }, (_, index) => `F${index + 1}`),
].sort()

/**
 * Translate one model-facing key name into a CDP key stroke.
 *
 * Letters are accepted in either case (a capital letter does not imply Shift;
 * the caller adds modifiers explicitly), and aliases such as `Esc` or `Space`
 * resolve to their canonical names.
 *
 * @param key - key name from the tool call.
 * @returns the stroke description, or undefined when the name is unknown.
 */
export function strokeForKey(key: string): KeyStroke | undefined {
  if (key === '') return undefined
  const alias = KEY_ALIASES[key.toLowerCase()]
  const name = alias ?? key
  const named = NAMED_KEYS[name]
  if (named !== undefined) {
    const printable = name === 'Tab' || name === 'Enter'
    return {
      key: name,
      code: named.code,
      windowsVirtualKeyCode: named.windowsVirtualKeyCode,
      ...(printable ? { text: name === 'Enter' ? '\r' : '\t' } : {}),
    }
  }
  if (/^F([1-9]|1[0-2])$/.test(name)) {
    const number = Number(name.slice(1))
    return { key: name, code: name, windowsVirtualKeyCode: 111 + number }
  }
  if (name.length === 1) {
    const lower = name.toLowerCase()
    if (/^[a-z]$/.test(lower)) {
      return { key: lower, code: `Key${lower.toUpperCase()}`, windowsVirtualKeyCode: lower.toUpperCase().charCodeAt(0), text: lower }
    }
    if (/^[0-9]$/.test(lower)) {
      return { key: lower, code: `Digit${lower}`, windowsVirtualKeyCode: lower.charCodeAt(0), text: lower }
    }
    if (lower === ' ') {
      return { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' }
    }
    const punctuation = PUNCTUATION[lower]
    if (punctuation !== undefined) {
      return { key: lower, code: punctuation.code, windowsVirtualKeyCode: punctuation.vk, text: lower }
    }
  }
  return undefined
}

/**
 * Whether a stroke inserts text; command chords (Control/Meta/Alt) must not.
 *
 * @param stroke - resolved stroke.
 * @param mask - active modifier bitmask.
 * @returns true when the stroke should carry `text`.
 */
export function strokeInsertsText(stroke: KeyStroke, mask: number): boolean {
  if (stroke.text === undefined) return false
  if ((mask & (MODIFIER_BITS.Control | MODIFIER_BITS.Meta | MODIFIER_BITS.Alt)) !== 0) return false
  // Shift+Tab moves focus backwards and Shift+Enter is a modified newline;
  // neither should insert the base key's text.
  if (stroke.key === 'Tab' || stroke.key === 'Enter') return mask === 0
  return true
}
