// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import type { TabAffinityState, TabAffinityStatus } from '../src/background/tab-affinity.ts'
import { canReturnToControlledTab } from '../src/panel/tab-handoff.ts'

const controlled = { tabId: 1, windowId: 2, title: 'Pull request', url: 'https://example.com/pr' }
const active = { tabId: 3, windowId: 2, title: 'README', url: 'https://example.com/readme' }

function state(status: TabAffinityStatus, options: Partial<TabAffinityState> = {}): TabAffinityState {
  return {
    revision: 1,
    status,
    controlled: status === 'lost' ? null : controlled,
    active: status === 'unbound' ? null : active,
    pinned: false,
    ...options,
  }
}

describe('jump back to the assistant page', () => {
  it('is offered while a handoff is unresolved', () => {
    expect(canReturnToControlledTab(state('handoff'))).toBe(true)
  })

  it('is not offered once the user already answered the handoff', () => {
    expect(canReturnToControlledTab(state('background'))).toBe(false)
    expect(canReturnToControlledTab(state('background', { pinned: true }))).toBe(false)
  })

  it('is not offered when the assistant page is already active', () => {
    expect(canReturnToControlledTab(state('following'))).toBe(false)
  })

  it('is not offered without a controlled page to return to', () => {
    expect(canReturnToControlledTab(state('lost'))).toBe(false)
    expect(canReturnToControlledTab(state('unbound'))).toBe(false)
    expect(canReturnToControlledTab(state('handoff', { controlled: null }))).toBe(false)
    expect(canReturnToControlledTab(null)).toBe(false)
  })
})
