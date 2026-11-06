// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { InputState, InputStateStore } from '../src/background/input-state.ts'
import { MODIFIER_BITS } from '../src/background/keys.ts'

describe('InputState', () => {
  it('tracks held modifiers until released', () => {
    const state = new InputState()
    state.setModifier('Shift', true)
    state.setModifier('Meta', true)
    expect(state.modifiersMask()).toBe(MODIFIER_BITS.Shift | MODIFIER_BITS.Meta)
    expect(state.modifiers()).toEqual(['Shift', 'Meta'])
    state.setModifier('Shift', false)
    expect(state.modifiersMask()).toBe(MODIFIER_BITS.Meta)
    expect(state.isModifierHeld('Shift')).toBe(false)
  })

  it('resets held modifiers', () => {
    const state = new InputState()
    state.setModifier('Control', true)
    state.reset()
    expect(state.modifiersMask()).toBe(0)
  })
})

describe('InputStateStore', () => {
  it('keeps one state per tab', () => {
    const store = new InputStateStore()
    store.get(1).setModifier('Alt', true)
    expect(store.get(1).modifiersMask()).toBe(MODIFIER_BITS.Alt)
    expect(store.get(2).modifiersMask()).toBe(0)
    store.reset(1)
    expect(store.get(1).modifiersMask()).toBe(0)
  })

  it('clears every tab', () => {
    const store = new InputStateStore()
    store.get(1).setModifier('Shift', true)
    store.get(2).setModifier('Alt', true)
    store.clear()
    expect(store.get(1).modifiersMask()).toBe(0)
    expect(store.get(2).modifiersMask()).toBe(0)
  })
})
