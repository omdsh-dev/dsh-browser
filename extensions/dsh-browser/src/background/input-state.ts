/**
 * Tracks held keyboard modifiers per tab and resets them on navigation.
 *
 * @module
 */

import { MODIFIER_BITS, modifierMask, type ModifierName } from './keys.ts'

/** One tab's input state. */
export class InputState {
  private heldModifiers = new Set<ModifierName>()

  /** Record a modifier key going down or up. */
  setModifier(modifier: ModifierName, pressed: boolean): void {
    if (pressed) this.heldModifiers.add(modifier)
    else this.heldModifiers.delete(modifier)
  }

  /** @returns whether the modifier is currently held. */
  isModifierHeld(modifier: ModifierName): boolean {
    return this.heldModifiers.has(modifier)
  }

  /** @returns the held modifiers as a CDP bitmask. */
  modifiersMask(): number {
    return modifierMask([...this.heldModifiers])
  }

  /** @returns held modifier names (for status text). */
  modifiers(): ModifierName[] {
    return [...this.heldModifiers]
  }

  /** Release held modifiers on navigation, detach, or tab close. */
  reset(): void {
    this.heldModifiers.clear()
  }
}

/** One `InputState` per tab, created on demand. */
export class InputStateStore {
  private readonly states = new Map<number, InputState>()

  /** @returns the state for a tab, creating an empty one when needed. */
  get(tabId: number): InputState {
    let state = this.states.get(tabId)
    if (state === undefined) {
      state = new InputState()
      this.states.set(tabId, state)
    }
    return state
  }

  /** Reset and forget one tab's state. */
  reset(tabId: number): void {
    this.states.delete(tabId)
  }

  /** Reset and forget every tab's state. */
  clear(): void {
    this.states.clear()
  }
}

/** Modifier bitmask constant re-exported for callers that build chords. */
export { MODIFIER_BITS }
