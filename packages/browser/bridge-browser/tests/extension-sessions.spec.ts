import { describe, expect, it } from 'vitest'
import { ExtensionSessionRegistry } from '../src/extension-sessions.ts'

describe('ExtensionSessionRegistry', () => {
  it('tracks non-empty session ids only', () => {
    const registry = new ExtensionSessionRegistry()
    registry.note(undefined)
    registry.note('')
    registry.note('session-1')
    expect(registry.has(undefined)).toBe(false)
    expect(registry.has('')).toBe(false)
    expect(registry.has('session-1')).toBe(true)
    expect(registry.has('other')).toBe(false)
  })
})
