// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { approvalPromptForCall } from '../src/background/authorization.ts'
import type { TabFrame } from '../src/background/frames.ts'
import type { ToolCall } from '../src/background/tools.ts'

/**
 * Screenshot gating follows the existing page-content sharing policy, so the
 * settings the user already understands govern capture too. The one thing the
 * policy must add is honest wording: a capture ships every visible pixel,
 * including content the text channel masks, and the prompt has to say so.
 */

const FRAMES: TabFrame[] = [
  { frameId: 0, parentFrameId: -1, documentId: 'top', url: 'https://app.example/page' },
  { frameId: 4, parentFrameId: 0, documentId: 'child', url: 'https://ads.example.net/banner' },
]

function call(name: string, args: Record<string, unknown> = {}): ToolCall {
  return { id: 'call', name, args }
}

describe('screenshot approval policy', () => {
  it('is silent under the default auto sharing policy', () => {
    expect(approvalPromptForCall(call('browser_screenshot'), 'auto', FRAMES, 'en')).toBeUndefined()
  })

  it('asks under ask, and says the capture is unmasked', () => {
    const prompt = approvalPromptForCall(call('browser_screenshot'), 'ask', FRAMES, 'en')

    expect(prompt).toMatchObject({ kind: 'read', action: 'browser_screenshot', canTrust: false })
    expect(prompt?.summary).toMatch(/unmasked/)
  })

  it('scopes the prompt to the visible top frame', () => {
    const prompt = approvalPromptForCall(call('browser_screenshot'), 'ask', FRAMES, 'en')

    // A viewport capture shows the top document, so a child frame's origin is
    // not what the user is being asked about.
    expect(prompt?.origins).toEqual(['https://app.example'])
  })

  it('never offers persistent trust for a capture', () => {
    const prompt = approvalPromptForCall(call('browser_screenshot'), 'ask', FRAMES, 'en')

    expect(prompt?.canTrust).toBe(false)
  })

  it('is localised rather than English-only', () => {
    const prompt = approvalPromptForCall(call('browser_screenshot'), 'ask', FRAMES, 'zh')

    expect(prompt?.summary).toContain('截图')
  })
})
