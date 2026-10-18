// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { approvalPromptForCall, originFromUrl } from '../src/background/authorization.ts'
import type { TabFrame } from '../src/background/frames.ts'
import type { ToolCall } from '../src/background/tools.ts'

const FRAMES: TabFrame[] = [
  { frameId: 0, parentFrameId: -1, documentId: 'top', url: 'https://app.example/page' },
  { frameId: 4, parentFrameId: 0, documentId: 'child', url: 'https://login.example.net/form' },
  { frameId: 5, parentFrameId: 4, documentId: 'about', url: 'about:blank' },
]

function call(name: string, args: Record<string, unknown> = {}): ToolCall {
  return { id: 'call', name, args }
}

describe('approvalPromptForCall', () => {
  it('asks before reading and names every effective frame origin', () => {
    expect(approvalPromptForCall(call('browser_snapshot'), 'ask', FRAMES, 'zh')).toMatchObject({
      kind: 'read',
      origins: ['https://app.example', 'https://login.example.net'],
      canTrust: false,
    })
    expect(approvalPromptForCall(call('browser_snapshot'), 'auto', FRAMES, 'zh')).toBeUndefined()
  })

  it('scopes a frame-local action to the frame origin and redacts typed text', () => {
    const prompt = approvalPromptForCall(call('browser_type', {
      frame: 4,
      index: 7,
      text: 'my-password-must-not-appear',
    }), 'auto', FRAMES, 'zh')

    expect(prompt).toMatchObject({
      kind: 'action',
      origins: ['https://login.example.net'],
      canTrust: true,
    })
    expect(prompt?.summary).toContain('27 个字符')
    expect(prompt?.summary).not.toContain('my-password')
  })

  it('never offers persistent trust for cross-origin navigation', () => {
    const prompt = approvalPromptForCall(call('browser_navigate', {
      url: 'https://bank.example/transfer?token=secret#confirm',
    }), 'auto', FRAMES, 'zh')

    expect(prompt).toMatchObject({
      origins: ['https://app.example', 'https://bank.example'],
      canTrust: false,
      summary: '导航到 https://bank.example/transfer',
    })
    expect(prompt?.summary).not.toContain('secret')
  })

  it('approves opening a new tab against only the destination origin', () => {
    const prompt = approvalPromptForCall(call('browser_open_tab', {
      url: 'https://docs.example/guide?token=secret#section',
    }), 'auto', FRAMES, 'zh')

    expect(prompt).toMatchObject({
      origins: ['https://docs.example'],
      canTrust: true,
      summary: '在新标签页打开 https://docs.example/guide',
    })
    expect(prompt?.summary).not.toContain('secret')
  })

  it('labels background tab opens in the approval summary', () => {
    const prompt = approvalPromptForCall(call('browser_open_tab', {
      url: 'https://docs.example/guide',
      active: false,
    }), 'auto', FRAMES, 'zh')

    expect(prompt).toMatchObject({
      origins: ['https://docs.example'],
      canTrust: true,
      summary: '在后台新标签页打开 https://docs.example/guide',
    })
  })

  it('does not offer trust for invalid navigation and keeps key summaries on one bounded line', () => {
    expect(approvalPromptForCall(call('browser_navigate', { url: 'javascript:alert(1)' }), 'auto', FRAMES, 'zh'))
      .toMatchObject({ canTrust: false })

    const prompt = approvalPromptForCall(call('browser_press', { key: `Enter\n${'x'.repeat(100)}` }), 'auto', FRAMES, 'zh')
    expect(prompt?.summary).not.toContain('\n')
    expect(prompt?.summary.length).toBeLessThan(70)
  })

  it('keeps read-only viewport tools outside the approval path', () => {
    expect(approvalPromptForCall(call('browser_scroll', { direction: 'down' }), 'auto', FRAMES, 'zh')).toBeUndefined()
    expect(approvalPromptForCall(call('browser_wait'), 'auto', FRAMES, 'zh')).toBeUndefined()
  })

  it('asks before reading page storage and never offers persistent trust', () => {
    expect(approvalPromptForCall(call('browser_get_storage', {}), 'ask', FRAMES, 'zh')).toMatchObject({
      kind: 'read',
      origins: ['https://app.example'],
      canTrust: false,
      summary: '读取当前页面的 localStorage',
    })
    expect(approvalPromptForCall(call('browser_get_storage', { key: 'access_token' }), 'ask', FRAMES, 'en')?.summary)
      .toContain('localStorage key "access_token"')
    expect(approvalPromptForCall(call('browser_get_storage', {}), 'auto', FRAMES, 'zh')).toBeUndefined()
  })

  it('never offers persistent trust for code execution', () => {
    const prompt = approvalPromptForCall(call('browser_eval', { code: 'document.cookie' }), 'auto', FRAMES, 'zh')

    expect(prompt).toMatchObject({
      kind: 'action',
      origins: ['https://app.example'],
      canTrust: false,
    })
    expect(prompt?.summary).toContain('JavaScript')
    expect(prompt?.summary).toContain('document.cookie')
    expect(prompt?.summary).not.toContain('\n')
  })

  it('names both origins for a page-origin request and redacts the query string', () => {
    const prompt = approvalPromptForCall(call('browser_fetch', {
      url: 'https://api.example.com/lines?token=secret',
      method: 'POST',
      body: '{"id":7}',
    }), 'auto', FRAMES, 'zh')

    expect(prompt).toMatchObject({
      kind: 'action',
      origins: ['https://api.example.com', 'https://app.example'],
      canTrust: false,
    })
    expect(prompt?.summary).toContain('POST https://api.example.com/lines')
    expect(prompt?.summary).toContain('8 字符')
    expect(prompt?.summary).not.toContain('secret')
  })

  it('resolves a relative request path against the page before prompting', () => {
    const prompt = approvalPromptForCall(call('browser_fetch', { url: '/api/lines?page=2' }), 'auto', FRAMES, 'en')

    expect(prompt).toMatchObject({
      origins: ['https://app.example'],
      canTrust: false,
      summary: 'Send GET https://app.example/api/lines from the current page',
    })
  })

  it('describes selector/text clicks and modifier combinations', () => {
    const byText = approvalPromptForCall(call('browser_click', { text: '下一页' }), 'auto', FRAMES, 'zh')
    expect(byText?.summary).toBe('点击 文本「下一页」')

    const bySelector = approvalPromptForCall(call('browser_click', { selector: '.pager > a:nth-of-type(2)' }), 'auto', FRAMES, 'en')
    expect(bySelector?.summary).toBe('Click selector ".pager > a:nth-of-type(2)"')

    const combo = approvalPromptForCall(call('browser_press', { key: 'Enter', modifiers: ['ctrl', 'shift'] }), 'auto', FRAMES, 'en')
    expect(combo?.summary).toBe('Press “ctrl+shift+Enter”')
  })

  it('renders approval summaries in English for non-Chinese browsers', () => {
    expect(approvalPromptForCall(call('browser_type', {
      index: 3,
      text: 'secret',
    }), 'auto', FRAMES, 'en')?.summary).toBe(
      'Enter 6 characters in element [3] (the text is not shown in this dialog)',
    )
    expect(approvalPromptForCall(call('browser_snapshot'), 'ask', FRAMES, 'en')?.summary)
      .toBe('Read the current page and accessible iframes')
  })
})

describe('originFromUrl', () => {
  it('accepts web/blob origins and rejects browser-internal or invalid URLs', () => {
    expect(originFromUrl('https://example.com/path?q=1')).toBe('https://example.com')
    expect(originFromUrl('blob:https://example.com/id')).toBe('https://example.com')
    expect(originFromUrl('chrome://settings')).toBeUndefined()
    expect(originFromUrl('not a url')).toBeUndefined()
  })
})
