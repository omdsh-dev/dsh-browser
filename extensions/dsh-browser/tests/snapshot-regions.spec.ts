// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectScrollableRegions, cssPath } from '../src/content/extract.ts'
import { ElementIds } from '../src/content/ids.ts'
import { buildSnapshot, renderSnapshot } from '../src/content/snapshot.ts'

const BUDGET = { maxItems: 40, maxForms: 20, maxChars: 12_000 }

function stubOverflow(overflows: Element[]): void {
  vi.spyOn(window, 'getComputedStyle').mockImplementation(((element: Element) => {
    const scrolls = overflows.includes(element)
    return {
      display: 'block',
      visibility: 'visible',
      opacity: '1',
      overflowX: scrolls ? 'auto' : 'visible',
      overflowY: scrolls ? 'auto' : 'visible',
      cursor: 'default',
    } as unknown as CSSStyleDeclaration
  }) as typeof window.getComputedStyle)
}

function fakeScroller(element: HTMLElement, metrics: { scrollHeight: number; clientHeight: number }): { scrollTo: (value: number) => void } {
  let top = 0
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: metrics.scrollHeight })
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: metrics.clientHeight })
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: 400 })
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 400 })
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: (value: number) => { top = value },
  })
  return { scrollTo: (value: number) => { top = value } }
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('scrollable region discovery', () => {
  it('finds an inner app-shell scroller and skips the window scroller', () => {
    document.body.innerHTML = '<div id="pane"><div id="content"></div></div>'
    const pane = document.getElementById('pane') as HTMLElement
    fakeScroller(pane, { scrollHeight: 2_000, clientHeight: 500 })
    stubOverflow([pane])

    const regions = collectScrollableRegions(document)

    expect(regions).toHaveLength(1)
    expect(regions[0]).toMatchObject({
      selector: '#pane',
      label: '#pane',
      horizontal: false,
      percent: 0,
      remaining: 1_500,
    })
  })

  it('reports horizontal scrollers and their remaining width', () => {
    document.body.innerHTML = '<div id="strip"></div>'
    const strip = document.getElementById('strip') as HTMLElement
    Object.defineProperty(strip, 'scrollHeight', { configurable: true, value: 100 })
    Object.defineProperty(strip, 'clientHeight', { configurable: true, value: 100 })
    Object.defineProperty(strip, 'scrollWidth', { configurable: true, value: 900 })
    Object.defineProperty(strip, 'clientWidth', { configurable: true, value: 300 })
    Object.defineProperty(strip, 'scrollLeft', { configurable: true, value: 300, writable: true })
    stubOverflow([strip])

    const [region] = collectScrollableRegions(document)

    expect(region).toMatchObject({ selector: '#strip', horizontal: true, percent: 50, remaining: 300 })
  })

  it('produces a selector that resolves to exactly one element', () => {
    document.body.innerHTML = '<main><div class="wrap"><div class="pane"></div></div></main><div class="pane"></div>'
    const pane = document.querySelector('main .wrap .pane') as HTMLElement
    const selector = cssPath(pane)
    expect(document.querySelectorAll(selector)).toHaveLength(1)
  })
})

describe('snapshot scrollable regions', () => {
  it('renders the region with its selector for browser_scroll', () => {
    document.body.innerHTML = '<div id="pane"><p>line</p></div>'
    const pane = document.getElementById('pane') as HTMLElement
    fakeScroller(pane, { scrollHeight: 1_000, clientHeight: 200 })
    stubOverflow([pane])

    const view = buildSnapshot(new ElementIds(), { budget: BUDGET }, null)
    const text = renderSnapshot(view, false)

    expect(text).toContain('Scrollable regions')
    expect(text).toContain('selector: #pane')
    expect(text).toContain('remaining')
  })

  it('omits the section when the page has no inner scroller', () => {
    document.body.innerHTML = '<main><p>plain page</p></main>'
    stubOverflow([])

    const view = buildSnapshot(new ElementIds(), { budget: BUDGET }, null)

    expect(renderSnapshot(view, false)).not.toContain('Scrollable regions')
  })

  it('reports a scrolled region in delta mode', () => {
    document.body.innerHTML = '<div id="pane"><p>line</p></div>'
    const pane = document.getElementById('pane') as HTMLElement
    const scroller = fakeScroller(pane, { scrollHeight: 1_000, clientHeight: 200 })
    stubOverflow([pane])
    const ids = new ElementIds()

    const first = buildSnapshot(ids, { budget: BUDGET, delta: true }, null)
    expect(first.regionsChanged).toBe(true)

    scroller.scrollTo(400)
    const second = buildSnapshot(ids, { budget: BUDGET, delta: true }, first)

    expect(second.regionsChanged).toBe(true)
    expect(renderSnapshot(second, true)).toContain('50% down')
  })

  it('keeps the region unchanged when nothing scrolled', () => {
    document.body.innerHTML = '<div id="pane"><p>line</p></div>'
    const pane = document.getElementById('pane') as HTMLElement
    fakeScroller(pane, { scrollHeight: 1_000, clientHeight: 200 })
    stubOverflow([pane])
    const ids = new ElementIds()

    const first = buildSnapshot(ids, { budget: BUDGET, delta: true }, null)
    const second = buildSnapshot(ids, { budget: BUDGET, delta: true }, first)

    expect(second.regionsChanged).toBe(false)
    expect(renderSnapshot(second, true)).toContain('No visible changes')
  })
})
