// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  LocatorError,
  findElements,
  parseLocatorQuery,
  renderFound,
  roleOfElement,
  uniqueSelectorFor,
} from '../src/content/find.ts'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
})

describe('parseLocatorQuery', () => {
  it('accepts a text query and applies the default limit', () => {
    expect(parseLocatorQuery({ text: 'Save' })).toEqual({ text: 'Save', limit: 10 })
  })

  it('accepts a selector query with includeHidden', () => {
    expect(parseLocatorQuery({ selector: '.item', includeHidden: true, limit: 3 }))
      .toEqual({ selector: '.item', includeHidden: true, limit: 3 })
  })

  it('rejects text plus selector, empty queries, and out-of-range limits', () => {
    expect(() => parseLocatorQuery({ text: 'a', selector: '.b' })).toThrow(LocatorError)
    expect(() => parseLocatorQuery({})).toThrow(/at least one of/)
    expect(() => parseLocatorQuery({ text: 'a', limit: 0 })).toThrow(/limit/)
    expect(() => parseLocatorQuery({ text: 'a', limit: 31 })).toThrow(/limit/)
    expect(() => parseLocatorQuery(null)).toThrow(LocatorError)
  })
})

describe('findElements', () => {
  it('finds a non-semantic element by its own text and reports geometry', () => {
    document.body.innerHTML = '<div class="bar"><div class="item" id="file-item">File</div><div class="item">Edit</div></div>'
    const found = findElements({ text: 'File', limit: 10 })
    expect(found).toHaveLength(1)
    expect(found[0]!.label).toBe('File')
    expect(found[0]!.selector).toBe('#file-item')
    expect(found[0]!.visible).toBe(true)
  })

  it('matches a short labelled container once and never a page-sized wrapper', () => {
    document.body.innerHTML = `<div id="wrapper"><span>${'x'.repeat(300)}</span><button id="go">Save</button></div>`
    const found = findElements({ text: 'Save', limit: 10 })
    expect(found).toHaveLength(1)
    expect(found[0]!.element.id).toBe('go')
  })

  it('locates by selector and rejects an invalid selector', () => {
    document.body.innerHTML = '<input id="field" type="text" value="secret">'
    const found = findElements({ selector: '#field', limit: 10 })
    expect(found.map((item) => item.element.id)).toEqual(['field'])
    expect(found[0]!.editable).toBe(true)
    expect(() => findElements({ selector: '##bad', limit: 10 })).toThrow(/valid CSS selector/)
  })

  it('hides invisible elements unless includeHidden is set', () => {
    document.body.innerHTML = '<div id="gone" style="display: none">File</div><div id="here">File</div>'
    expect(findElements({ text: 'File', limit: 10 }).map((item) => item.element.id)).toEqual(['here'])
    const hidden = findElements({ text: 'File', includeHidden: true, limit: 10 })
    expect(hidden.map((item) => item.element.id).sort()).toEqual(['gone', 'here'])
    expect(hidden.find((item) => item.element.id === 'gone')!.visible).toBe(false)
  })

  it('matches explicit and implicit roles', () => {
    document.body.innerHTML = '<div role="menuitem" id="menu">Open</div><button id="btn">Go</button>'
    expect(roleOfElement(document.getElementById('menu')!)).toBe('menuitem')
    expect(roleOfElement(document.getElementById('btn')!)).toBe('button')
    const found = findElements({ role: 'menuitem', limit: 10 })
    expect(found.map((item) => item.element.id)).toEqual(['menu'])
  })

  it('respects the limit', () => {
    document.body.innerHTML = Array.from({ length: 5 }, () => `<div class="row">Row</div>`).join('')
    expect(findElements({ text: 'Row', limit: 2 })).toHaveLength(2)
  })

  it('builds selectors that resolve back to the element', () => {
    document.body.innerHTML = '<section><div><span id="target">x</span></div></section><div><span>y</span></div>'
    const target = document.getElementById('target')!
    expect(uniqueSelectorFor(target)).toBe('#target')
    const sibling = document.querySelectorAll('div')[1]!
    const selector = uniqueSelectorFor(sibling)
    expect(document.querySelector(selector)).toBe(sibling)
  })
})

describe('renderFound', () => {
  it('renders index and selector for each match', () => {
    document.body.innerHTML = '<div id="item">File</div>'
    const found = findElements({ text: 'File', limit: 10 })
    const text = renderFound(found, { text: 'File', limit: 10 }, () => 7)
    expect(text).toContain('Found 1 element(s) matching text "File"')
    expect(text).toContain('[7] generic "File"')
    expect(text).toContain('selector=#item')
  })

  it('explains an empty result', () => {
    const text = renderFound([], { text: 'Nope', limit: 10 }, () => undefined)
    expect(text).toContain('No elements matched')
    expect(text).toContain('browser_snapshot')
  })
})
