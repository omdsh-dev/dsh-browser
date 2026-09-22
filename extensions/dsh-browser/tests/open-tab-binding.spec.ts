// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { bindOpenedTabAffinity } from '../src/background/open-tab-binding.ts'
import { TabAffinityController, type AffinityTab } from '../src/background/tab-affinity.ts'

function tab(tabId: number, title = `Tab ${tabId}`): AffinityTab {
  return {
    tabId,
    windowId: 1,
    title,
    url: `https://example.test/${tabId}`,
  }
}

describe('bindOpenedTabAffinity', () => {
  it('rebinds active for a foreground open so later tools follow the new tab', () => {
    const affinity = new TabAffinityController()
    affinity.observeActive(tab(1))
    affinity.bindInitial(tab(1), 'session-1')

    expect(bindOpenedTabAffinity(affinity, tab(42, 'Docs'), {
      active: true,
      sessionId: 'session-1',
    })).toBe(true)

    expect(affinity.snapshot()).toMatchObject({
      status: 'following',
      active: { tabId: 42 },
      controlled: { tabId: 42 },
    })
    expect(affinity.resolveTarget('session-1')).toMatchObject({
      kind: 'target',
      tab: { tabId: 42 },
    })
    expect(affinity.allowsTarget(42)).toBe(true)
  })

  it('rebinds controlled for a background open so tools target the new tab without activating it', () => {
    const affinity = new TabAffinityController()
    affinity.observeActive(tab(1, 'Current'))
    affinity.bindInitial(tab(1, 'Current'), 'session-1')

    expect(bindOpenedTabAffinity(affinity, tab(42, 'Docs'), {
      active: false,
      sessionId: 'session-1',
    })).toBe(true)

    expect(affinity.snapshot()).toMatchObject({
      status: 'background',
      active: { tabId: 1 },
      controlled: { tabId: 42 },
    })
    // Route-level target selection: later browser tools must hit the opened tab,
    // not the still-visible active tab.
    expect(affinity.resolveTarget('session-1')).toMatchObject({
      kind: 'target',
      tab: { tabId: 42 },
    })
    expect(affinity.resolveTarget()).toMatchObject({
      kind: 'target',
      tab: { tabId: 42 },
    })
    expect(affinity.allowsTarget(42)).toBe(true)
    expect(affinity.allowsTarget(1)).toBe(false)
  })

  it('defaults missing active to a foreground rebind', () => {
    const affinity = new TabAffinityController()
    affinity.observeActive(tab(1))
    affinity.bindInitial(tab(1))

    expect(bindOpenedTabAffinity(affinity, tab(7))).toBe(true)
    expect(affinity.snapshot()).toMatchObject({
      status: 'following',
      active: { tabId: 7 },
      controlled: { tabId: 7 },
    })
  })
})
