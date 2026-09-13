// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { approvalPromptForCall } from '../src/background/authorization.ts'
import { isApprovalDecision } from '../src/security/approval.ts'
import type { TabFrame } from '../src/background/frames.ts'
import type { ToolCall } from '../src/background/tools.ts'

/**
 * A screenshot ships raw pixels, which the masking that makes unconfirmed text
 * reads tolerable does not reach. So it does not inherit the page-sharing
 * policy: it always asks, and the caller suppresses the prompt only once the
 * session has been granted captures. These tests pin the always-ask half.
 */

const FRAMES: TabFrame[] = [
  { frameId: 0, parentFrameId: -1, documentId: 'top', url: 'https://app.example/page' },
  { frameId: 4, parentFrameId: 0, documentId: 'child', url: 'https://ads.example.net/banner' },
]

function call(name: string, args: Record<string, unknown> = {}): ToolCall {
  return { id: 'call', name, args }
}

describe('screenshot approval policy', () => {
  it('asks under every page-sharing mode, including the permissive one', () => {
    // Text reads are silent under 'auto'; a capture must not be, or the first
    // screenshot of a session would leave the user unasked.
    for (const mode of ['auto', 'ask', 'off'] as const) {
      expect(approvalPromptForCall(call('browser_screenshot'), mode, FRAMES, 'en')).toBeDefined()
    }
  })

  it('says that images are sent, not that text is read', () => {
    const prompt = approvalPromptForCall(call('browser_screenshot'), 'auto', FRAMES, 'en')

    expect(prompt).toMatchObject({ kind: 'read', action: 'browser_screenshot', canTrust: false })
    expect(prompt?.summary).toMatch(/image/i)
    expect(prompt?.summary).toMatch(/masks/i)
  })

  it('scopes the prompt to the visible top frame', () => {
    const prompt = approvalPromptForCall(call('browser_screenshot'), 'auto', FRAMES, 'en')

    // A viewport capture shows the top document, so a child frame's origin is
    // not what the user is being asked about.
    expect(prompt?.origins).toEqual(['https://app.example'])
  })

  it('never offers persistent trust for a capture', () => {
    // The session grant is the only trust a capture gets; a permanent origin
    // allowlist would silently authorise pixels forever.
    expect(approvalPromptForCall(call('browser_screenshot'), 'auto', FRAMES, 'en')?.canTrust).toBe(false)
  })

  it('leaves text reads following the sharing policy', () => {
    expect(approvalPromptForCall(call('browser_snapshot'), 'auto', FRAMES, 'en')).toBeUndefined()
    expect(approvalPromptForCall(call('browser_snapshot'), 'ask', FRAMES, 'en')).toBeDefined()
  })

  it('is localised rather than English-only', () => {
    const prompt = approvalPromptForCall(call('browser_screenshot'), 'auto', FRAMES, 'zh')

    expect(prompt?.summary).toContain('截图')
  })

  it('accepts its own session decision over the wire', () => {
    // The panel sends this string; a decision the background does not recognise
    // would be silently treated as a denial.
    expect(isApprovalDecision('allow-screenshots-session')).toBe(true)
    expect(isApprovalDecision('allow-screenshots')).toBe(false)
  })
})
