// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { sanitizeClipboardHtml } from '../src/shared/clipboard.ts'

describe('sanitizeClipboardHtml', () => {
  it('removes executable elements and event handlers', () => {
    const cleaned = sanitizeClipboardHtml(
      '<p onclick="steal()">Hi</p><script>alert(1)</script><iframe src="x"></iframe>'
      + '<img src="x" onerror="alert(2)"><a href="javascript:alert(3)">link</a>',
    )
    expect(cleaned).not.toContain('<script')
    expect(cleaned).not.toContain('<iframe')
    expect(cleaned).not.toContain('onclick')
    expect(cleaned).not.toContain('onerror')
    expect(cleaned).not.toContain('javascript:')
    expect(cleaned).toContain('Hi')
    expect(cleaned).toContain('link')
  })

  it('keeps presentational markup and inline styles', () => {
    const cleaned = sanitizeClipboardHtml('<h2 style="color:red">Title</h2><table><tr><td>A</td></tr></table>')
    expect(cleaned).toContain('<h2 style="color:red">Title</h2>')
    expect(cleaned).toContain('<table>')
    expect(cleaned).toContain('<td>A</td>')
  })

  it('returns an empty string for empty input', () => {
    expect(sanitizeClipboardHtml('')).toBe('')
  })
})
