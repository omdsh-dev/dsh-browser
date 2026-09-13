// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { autoApproved, type AutoApprovalState } from '../src/background/authorization.ts'
import type { ApprovalPrompt } from '../src/security/approval.ts'

/**
 * This predicate decides what the user is never asked about, so it is the one
 * place a silent disclosure can hide. The capture case is the reason it exists:
 * an earlier version returned early for unrestricted access, which meant anyone
 * running with that setting on had their screen photographed without ever being
 * asked, while the per-session consent built to prevent exactly that sat
 * unreachable behind the early return.
 */

function capture(): ApprovalPrompt {
  return {
    kind: 'read',
    action: 'browser_screenshot',
    summary: 'Capture screenshots of the visible page.',
    origins: ['https://app.example'],
    canTrust: false,
  }
}

function textRead(): ApprovalPrompt {
  return {
    kind: 'read',
    action: 'browser_snapshot',
    summary: 'Read the current page.',
    origins: ['https://app.example'],
    canTrust: false,
  }
}

function action(): ApprovalPrompt {
  return {
    kind: 'action',
    action: 'browser_click',
    summary: 'Click.',
    origins: ['https://app.example'],
    canTrust: true,
  }
}

function state(overrides: Partial<AutoApprovalState> = {}): AutoApprovalState {
  return {
    unrestrictedAccess: false,
    sessionTrustedOrigins: [],
    persistentTrustedOrigins: [],
    screenshotGranted: false,
    ...overrides,
  }
}

describe('autoApproved', () => {
  it('never inherits consent for a capture from unrestricted access', () => {
    // The regression: opting out of confirmation for page text is not agreeing
    // to photographs of the screen.
    expect(autoApproved(capture(), state({ unrestrictedAccess: true }))).toBe(false)
  })

  it('never inherits consent for a capture from an origin allowlist', () => {
    expect(autoApproved(capture(), state({
      sessionTrustedOrigins: ['https://app.example'],
      persistentTrustedOrigins: ['https://app.example'],
    }))).toBe(false)
  })

  it('proceeds for a capture once the session grants it', () => {
    expect(autoApproved(capture(), state({ screenshotGranted: true }))).toBe(true)
  })

  it('proceeds for a capture granted in a session running unrestricted', () => {
    expect(autoApproved(capture(), state({ unrestrictedAccess: true, screenshotGranted: true }))).toBe(true)
  })

  it('still lets unrestricted access cover text reads', () => {
    expect(autoApproved(textRead(), state({ unrestrictedAccess: true }))).toBe(true)
  })

  it('prompts for a text read when nothing covers it', () => {
    expect(autoApproved(textRead(), state())).toBe(false)
  })

  it('honours a trusted origin for a state-changing action', () => {
    expect(autoApproved(action(), state({ sessionTrustedOrigins: ['https://app.example'] }))).toBe(true)
    expect(autoApproved(action(), state({ persistentTrustedOrigins: ['https://app.example'] }))).toBe(true)
  })

  it('does not let a capture grant leak into other calls', () => {
    const granted = state({ screenshotGranted: true })
    expect(autoApproved(textRead(), granted)).toBe(false)
    expect(autoApproved(action(), granted)).toBe(false)
  })
})
