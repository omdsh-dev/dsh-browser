// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runAction, type ActionContext } from '../src/content/actions.ts'
import { ElementIds } from '../src/content/ids.ts'

const BUDGET = { maxItems: 40, maxForms: 20, maxChars: 12_000 }

function context(): ActionContext {
  return { ids: new ElementIds(), budget: BUDGET }
}

/** jsdom has no layout engine and no scrollIntoView; stub the pieces actions touch. */
beforeEach(() => {
  document.body.innerHTML = ''
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  window.localStorage.clear()
  window.sessionStorage.clear()
})

describe('browser_click addressing', () => {
  it('clicks a JS-only pagination control by visible text', async () => {
    document.body.innerHTML = '<nav class="pager"><div class="page" role="button"><span>2</span></div></nav>'
    const control = document.querySelector('.page') as HTMLElement
    const clicked = vi.fn()
    control.addEventListener('click', clicked)

    const result = await runAction('browser_click', { text: '2' }, context())

    expect(clicked).toHaveBeenCalledOnce()
    expect(result.text).toContain('Clicked text "2"')
  })

  it('clicks by accessible name for an icon-only control', async () => {
    document.body.innerHTML = '<button type="button" aria-label="下一页">›</button>'
    const button = document.querySelector('button') as HTMLButtonElement
    const clicked = vi.fn()
    button.addEventListener('click', clicked)

    const result = await runAction('browser_click', { text: '下一页' }, context())

    expect(clicked).toHaveBeenCalledOnce()
    expect(result.text).toContain('text "下一页"')
  })

  it('resolves a control nested under a clickable row', async () => {
    document.body.innerHTML = '<table><tbody><tr class="line" role="button"><td><span>线路 A</span></td></tr></tbody></table>'
    const row = document.querySelector('tr') as HTMLElement
    const clicked = vi.fn()
    row.addEventListener('click', clicked)

    await runAction('browser_click', { text: '线路 A' }, context())

    expect(clicked).toHaveBeenCalledOnce()
  })

  it('reports ambiguous text with candidate positions instead of clicking the wrong control', async () => {
    document.body.innerHTML = '<nav><button type="button">下一页</button></nav><footer><button type="button">下一页</button></footer>'
    const buttons = [...document.querySelectorAll('button')]
    const clicked = vi.fn()
    for (const button of buttons) button.addEventListener('click', clicked)

    await expect(runAction('browser_click', { text: '下一页' }, context())).rejects.toMatchObject({
      code: 'action-failed',
      message: expect.stringContaining('Pass nth'),
    })
    expect(clicked).not.toHaveBeenCalled()

    const result = await runAction('browser_click', { text: '下一页', nth: 1 }, context())
    expect(clicked).toHaveBeenCalledTimes(1)
    expect(clicked.mock.instances[0]).toBe(buttons[1])
    expect(result.text).toContain('Clicked text "下一页"')
  })

  it('clicks by CSS selector and honours a role filter', async () => {
    document.body.innerHTML = '<div class="row" role="button">保存</div>'
    const row = document.querySelector('.row') as HTMLElement
    const clicked = vi.fn()
    row.addEventListener('click', clicked)

    await runAction('browser_click', { selector: '.row', role: 'button' }, context())

    expect(clicked).toHaveBeenCalledOnce()
  })

  it('rejects role filters that no selector match satisfies', async () => {
    document.body.innerHTML = '<div class="row" role="button">保存</div>'
    await expect(runAction('browser_click', { selector: '.row', role: 'link' }, context())).rejects.toMatchObject({
      code: 'action-failed',
      message: expect.stringContaining('No visible element matched selector'),
    })
  })

  it('accepts exactly one addressing mode', async () => {
    document.body.innerHTML = '<button type="button">保存</button>'
    await expect(runAction('browser_click', {}, context())).rejects.toMatchObject({ code: 'bad-args' })
    await expect(runAction('browser_click', { index: 1, text: '保存' }, context())).rejects.toMatchObject({
      code: 'bad-args',
      message: expect.stringContaining('exactly one'),
    })
  })
})

describe('browser_press modifiers', () => {
  it('sends modifier flags on keydown and keyup', async () => {
    const events: KeyboardEvent[] = []
    document.body.addEventListener('keydown', (event) => { events.push(event) })
    document.body.addEventListener('keyup', (event) => { events.push(event) })

    const result = await runAction('browser_press', { key: 'Enter', modifiers: ['ctrl', 'shift'] }, context())

    expect(events).toHaveLength(2)
    for (const event of events) {
      expect(event.key).toBe('Enter')
      expect(event.ctrlKey).toBe(true)
      expect(event.shiftKey).toBe(true)
      expect(event.metaKey).toBe(false)
    }
    expect(result.text).toContain('ctrl+shift+Enter')
  })

  it('rejects unknown modifiers', async () => {
    await expect(runAction('browser_press', { key: 'Enter', modifiers: ['hyper'] }, context())).rejects.toMatchObject({
      code: 'bad-args',
      message: expect.stringContaining('modifiers supports'),
    })
  })
})

describe('browser_scroll inner containers', () => {
  function fakeScroller(element: HTMLElement, metrics: { scrollHeight: number; clientHeight: number }): { read: () => number } {
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
    return { read: () => top }
  }

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

  it('scrolls the addressed inner pane rather than the window', async () => {
    document.body.innerHTML = '<div id="shell"><div id="pane"></div></div>'
    const pane = document.getElementById('pane') as HTMLElement
    const scroller = fakeScroller(pane, { scrollHeight: 1_000, clientHeight: 400 })
    stubOverflow([pane])

    const result = await runAction('browser_scroll', { direction: 'down', selector: '#pane', amount: 300 }, context())

    expect(scroller.read()).toBe(300)
    expect(result.text).toContain('Scrolled down #pane')
    expect(result.text).toContain('50%')
    expect(result.text).toContain('remaining')
  })

  it('scrolls the pane above an element index', async () => {
    document.body.innerHTML = '<div id="pane"><button type="button">row</button></div>'
    const pane = document.getElementById('pane') as HTMLElement
    const scroller = fakeScroller(pane, { scrollHeight: 1_000, clientHeight: 400 })
    stubOverflow([pane])
    const ids = new ElementIds()
    ids.assign([document.querySelector('button') as Element])
    const index = ids.indexOf(document.querySelector('button') as Element)!

    await runAction('browser_scroll', { direction: 'bottom', index }, { ids, budget: BUDGET })

    expect(scroller.read()).toBe(600)
  })

  it('explains when the addressed element has no scrollable ancestor', async () => {
    document.body.innerHTML = '<div id="plain"></div>'
    stubOverflow([])
    await expect(runAction('browser_scroll', { direction: 'down', selector: '#plain' }, context())).rejects.toMatchObject({
      code: 'action-failed',
      message: expect.stringContaining('No inner scrollable container'),
    })
  })
})

describe('browser_get_storage', () => {
  it('masks sensitive values in a bulk listing', async () => {
    window.localStorage.setItem('userId', '42')
    window.localStorage.setItem('access_token', 'super-secret-value')

    const result = await runAction('browser_get_storage', {}, context())

    expect(result.text).toContain('userId = 42')
    expect(result.text).toContain('access_token = ••••')
    expect(result.text).not.toContain('super-secret-value')
  })

  it('returns the real value when the key is named explicitly', async () => {
    window.localStorage.setItem('access_token', 'super-secret-value')

    const result = await runAction('browser_get_storage', { key: 'access_token' }, context())

    expect(result.text).toContain('super-secret-value')
  })

  it('reads sessionStorage and reports a missing key', async () => {
    window.sessionStorage.setItem('draft', 'hello')

    const found = await runAction('browser_get_storage', { area: 'session' }, context())
    expect(found.text).toContain('sessionStorage')
    expect(found.text).toContain('draft = hello')

    const missing = await runAction('browser_get_storage', { area: 'session', key: 'nope' }, context())
    expect(missing.text).toContain('No sessionStorage entry named "nope"')
  })
})

describe('browser_fetch', () => {
  it('sends the method, headers, and body with page credentials', async () => {
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await runAction('browser_fetch', {
      url: '/api/lines?page=2',
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"id":7}',
    }, context())

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(new URL('/api/lines?page=2', location.href).href)
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"id":7}',
      credentials: 'include',
    })
    expect(result.text).toContain('200 OK')
    expect(result.text).toContain('content-type: application/json')
    expect(result.text).toContain('{"ok":true}')
  })

  it('resolves a relative URL against the page and defaults to GET', async () => {
    const fetchMock = vi.fn(async () => new Response('ok'))
    vi.stubGlobal('fetch', fetchMock)

    await runAction('browser_fetch', { url: '/api/state' }, context())

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(new URL('/api/state', location.href).href)
    expect(init.method).toBe('GET')
  })

  it('rejects non-HTTP URLs and unknown methods before sending anything', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(runAction('browser_fetch', { url: 'file:///etc/passwd' }, context())).rejects.toMatchObject({ code: 'bad-args' })
    await expect(runAction('browser_fetch', { url: '/api', method: 'TRACE' }, context())).rejects.toMatchObject({ code: 'bad-args' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('surfaces a network failure with the CORS hint', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))

    await expect(runAction('browser_fetch', { url: 'https://api.example.com/x' }, context())).rejects.toMatchObject({
      code: 'action-failed',
      message: expect.stringContaining('CORS'),
    })
  })
})
