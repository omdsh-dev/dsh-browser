// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { MODIFIER_BITS, SUPPORTED_KEYS, modifierMask, strokeForKey, strokeInsertsText } from '../src/background/keys.ts'

describe('strokeForKey', () => {
  it('maps letters in either case to a physical key', () => {
    expect(strokeForKey('a')).toEqual({ key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, text: 'a' })
    expect(strokeForKey('A')).toEqual(strokeForKey('a'))
  })

  it('maps digits, space, and punctuation', () => {
    expect(strokeForKey('7')).toMatchObject({ code: 'Digit7', windowsVirtualKeyCode: 55, text: '7' })
    expect(strokeForKey(' ')).toMatchObject({ code: 'Space', windowsVirtualKeyCode: 32, text: ' ' })
    expect(strokeForKey('-')).toMatchObject({ code: 'Minus', windowsVirtualKeyCode: 189 })
  })

  it('maps named keys and aliases', () => {
    expect(strokeForKey('Enter')).toMatchObject({ code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
    expect(strokeForKey('Return')).toEqual(strokeForKey('Enter'))
    expect(strokeForKey('Esc')).toMatchObject({ code: 'Escape', windowsVirtualKeyCode: 27 })
    expect(strokeForKey('ArrowUp')).toMatchObject({ code: 'ArrowUp', windowsVirtualKeyCode: 38 })
    expect(strokeForKey('up')).toEqual(strokeForKey('ArrowUp'))
    expect(strokeForKey('F5')).toMatchObject({ code: 'F5', windowsVirtualKeyCode: 116 })
    expect(strokeForKey('Meta')).toMatchObject({ code: 'MetaLeft', windowsVirtualKeyCode: 91 })
  })

  it('rejects unknown names', () => {
    expect(strokeForKey('Hyper')).toBeUndefined()
    expect(strokeForKey('')).toBeUndefined()
    expect(strokeForKey('F13')).toBeUndefined()
  })

  it('advertises the supported vocabulary', () => {
    expect(SUPPORTED_KEYS).toContain('Enter')
    expect(SUPPORTED_KEYS).toContain('F12')
    expect(SUPPORTED_KEYS).toContain('a')
  })
})

describe('modifier masks', () => {
  it('combines modifier names into CDP bits', () => {
    expect(modifierMask([])).toBe(0)
    expect(modifierMask(['Shift'])).toBe(MODIFIER_BITS.Shift)
    expect(modifierMask(['Control', 'Shift'])).toBe(MODIFIER_BITS.Control | MODIFIER_BITS.Shift)
    expect(modifierMask(['Alt', 'Control', 'Meta', 'Shift'])).toBe(15)
  })
})

describe('strokeInsertsText', () => {
  const letter = strokeForKey('a')!
  const enter = strokeForKey('Enter')!
  const tab = strokeForKey('Tab')!

  it('inserts plain printable text', () => {
    expect(strokeInsertsText(letter, 0)).toBe(true)
  })

  it('lets Shift produce an uppercase character', () => {
    expect(strokeInsertsText(letter, MODIFIER_BITS.Shift)).toBe(true)
  })

  it('never inserts text for command chords', () => {
    for (const name of ['Control', 'Meta', 'Alt'] as const) {
      expect(strokeInsertsText(letter, MODIFIER_BITS[name])).toBe(false)
    }
  })

  it('treats modified Enter and Tab as commands, not characters', () => {
    expect(strokeInsertsText(enter, 0)).toBe(true)
    expect(strokeInsertsText(enter, MODIFIER_BITS.Shift)).toBe(false)
    expect(strokeInsertsText(tab, 0)).toBe(true)
    expect(strokeInsertsText(tab, MODIFIER_BITS.Shift)).toBe(false)
  })
})
