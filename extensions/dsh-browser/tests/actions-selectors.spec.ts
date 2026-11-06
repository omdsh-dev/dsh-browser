// @vitest-environment jsdom
/**
 * Selector-only and focus-only targets: a call without an index must resolve
 * the element and report a label instead of demanding a snapshot number.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runAction } from '../src/content/actions.ts'
import type { ElementIds } from '../src/content/ids.ts'

const BUDGET = { maxItems: 20, maxForms: 10, maxChars: 2_000 }

function emptyIds(): ElementIds {
  return {
    indexOf: () => undefined,
    elementByIndex: () => undefined,
    assign: () => ({ added: 0, removed: 0 }),
  } as unknown as ElementIds
}

beforeEach(() => {
  // jsdom has no layout, so scrollIntoView is missing from its Element.
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() })
})

afterEach(() => {
  document.body.innerHTML = ''
  delete (Element.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView
})

describe('selector targets', () => {
  it('clicks an element addressed only by selector', async () => {
    document.body.innerHTML = '<button id="go">Go</button>'
    const button = document.getElementById('go')!
    const clicked = vi.fn()
    button.addEventListener('click', clicked)
    const result = await runAction('browser_click', { selector: '#go' }, { ids: emptyIds(), budget: BUDGET })
    expect(clicked).toHaveBeenCalledTimes(1)
    expect(result.text).toContain('#go')
    expect(result.text).toContain('Clicked')
  })

  it('focuses a text field after a synthetic click', async () => {
    document.body.innerHTML = '<input id="comment">'
    const input = document.getElementById('comment') as HTMLInputElement
    await runAction('browser_click', { selector: '#comment' }, { ids: emptyIds(), budget: BUDGET })
    expect(document.activeElement).toBe(input)
  })

  it('types into a field addressed only by selector', async () => {
    document.body.innerHTML = '<input id="comment">'
    const input = document.getElementById('comment') as HTMLInputElement
    const result = await runAction(
      'browser_type',
      { selector: '#comment', text: 'hello' },
      { ids: emptyIds(), budget: BUDGET },
    )
    expect(input.value).toBe('hello')
    expect(result.text).toContain('#comment')
  })

  it('rejects an invalid selector with a stable code', async () => {
    await expect(runAction('browser_click', { selector: '##bad' }, { ids: emptyIds(), budget: BUDGET }))
      .rejects.toMatchObject({ code: 'bad-args' })
    await expect(runAction('browser_clipboard', { action: 'paste', selector: '##bad', text: 'x' }, { ids: emptyIds(), budget: BUDGET }))
      .rejects.toMatchObject({ code: 'bad-args' })
  })
})

describe('focus targets', () => {
  it('types into the focused element when no target is given', async () => {
    document.body.innerHTML = '<input id="comment">'
    const input = document.getElementById('comment') as HTMLInputElement
    input.focus()
    const result = await runAction('browser_type', { text: 'abc' }, { ids: emptyIds(), budget: BUDGET })
    expect(input.value).toBe('abc')
    expect(result.text).toContain('focused element')
  })
})

describe('region diagnostics', () => {
  it('says so when a region selector matches nothing', async () => {
    document.body.innerHTML = '<p>visible text</p>'
    const result = await runAction('browser_snapshot', { region: '#missing-region' }, { ids: emptyIds(), budget: BUDGET })
    expect(result.text).toContain('No element matched region selector')
    expect(result.text).toContain('visible text')
  })

  it('rejects an invalid region selector instead of silently reading the page', async () => {
    await expect(runAction('browser_snapshot', { region: '##bad' }, { ids: emptyIds(), budget: BUDGET }))
      .rejects.toMatchObject({ code: 'bad-args' })
  })

  it('wraps an invalid get_text selector in a stable error', async () => {
    await expect(runAction('browser_get_text', { selector: '##bad' }, { ids: emptyIds(), budget: BUDGET }))
      .rejects.toMatchObject({ code: 'bad-args' })
  })
})
