/**
 * Text-only page snapshot: the model's entire view of the page.
 *
 * The browser tools use text snapshots, so the snapshot renders the page as
 * structured text under a hard character budget: URL/title, main content, a
 * numbered interactive inventory, and form fields (sensitive values masked).
 * `delta` mode returns only what changed since the last snapshot, and stable
 * element ids keep the model's addressing valid across snapshots.
 *
 * @module
 */

import { accessibleName, collectInteractive, isInViewport, isVisible, mainText, pageText, truncate } from './extract.ts'
import { ElementIds } from './ids.ts'
import { isSensitiveField, maskValue } from './privacy.ts'

/** Role label per element kind (model-facing vocabulary). */
function roleOf(el: Element): string {
  const role = el.getAttribute('role')
  if (role !== null && role !== '') return role
  if (el instanceof HTMLAnchorElement) return 'link'
  if (el instanceof HTMLButtonElement) return 'button'
  if (el instanceof HTMLInputElement) {
    switch (el.type) {
      case 'checkbox': return 'checkbox'
      case 'radio': return 'radio'
      default: return 'input'
    }
  }
  if (el instanceof HTMLSelectElement) return 'select'
  if (el instanceof HTMLTextAreaElement) return 'textarea'
  if (el instanceof HTMLElement && el.isContentEditable) return 'contenteditable'
  return el.tagName.toLowerCase()
}

/** One numbered interactive element. */
interface InventoryItem {
  index: number
  role: string
  name: string
  disabled?: boolean
  checked?: boolean
  selected?: boolean
  href?: string
  inViewport: boolean
}

/** One numbered form field with its (masked) value. */
interface FormFieldView {
  index: number
  label: string
  kind: string
  value: string
  masked: boolean
  checked?: boolean
  required?: boolean
}

/** One page snapshot. */
export interface SnapshotView {
  version: number
  url: string
  title: string
  ready: 'complete' | 'loading'
  main: string
  items: InventoryItem[]
  forms: FormFieldView[]
  /** ids that changed since the last snapshot (delta mode). */
  changed: number[]
  /** ids that disappeared since the last snapshot (delta mode). */
  removed: number[]
  /** true when the inventory was renumbered (model should re-read ids). */
  reindexed: boolean
  /** Budget accounting: characters cut from main text and items/forms dropped by count caps. */
  truncated: { mainChars: number; itemsDropped: number; formsDropped: number }
  /** 总预算（渲染封顶用）。 */
  budgetChars: number
}

/** Snapshot budgets: negotiated with the plugin via hello caps. */
export interface SnapshotBudget {
  maxItems: number
  maxForms: number
  maxChars: number
}

/** Options for one snapshot build. */
export interface SnapshotOptions {
  delta?: boolean
  region?: string
  budget: SnapshotBudget
}

/** Headline for a link: same-origin relative path, else host + path. */
function hrefHeadline(href: string): string {
  try {
    const url = new URL(href, document.baseURI)
    return url.origin === location.origin ? `${url.pathname}${url.search}` : `${url.host}${url.pathname}`
  } catch {
    return href
  }
}

/**
 * Whether no ancestor hides the subtree by opacity.
 *
 * `opacity` does not inherit, so an element inside a faded-out subtree still
 * reports its own `opacity: 1` and keeps a non-zero rectangle. That is exactly
 * how a dismissable modal looks while it is closing or pre-rendered, so a
 * check that reads only the dialog itself would treat it as open and let its
 * invisible controls evict the ones actually on screen.
 *
 * The walk covers every `Element`, not only HTML: an HTML dialog can sit
 * inside an SVG `foreignObject`, and an SVG ancestor that fades the subtree
 * out hides it just as effectively. `display: none` and `visibility: hidden`
 * need no walk here: the first collapses the rectangle `isVisible` already
 * measures, and the second is inherited, so it is already visible in the
 * dialog's own computed style.
 *
 * @param el - candidate element.
 * @returns true when no ancestor fades the subtree out.
 */
function ancestorsRendered(el: Element): boolean {
  for (let node = el.parentElement; node !== null; node = node.parentElement) {
    if (getComputedStyle(node).opacity === '0') return false
  }
  return true
}

/**
 * Build a memoized "is this dialog open?" test.
 *
 * Openness depends only on the dialog, so the ancestor walk is evaluated once
 * per dialog rather than once per candidate element.
 *
 * @returns a predicate over dialog elements.
 */
function openDialogTest(): (dialog: Element) => boolean {
  const seen = new Map<Element, boolean>()
  return (dialog) => {
    let open = seen.get(dialog)
    if (open === undefined) {
      open = isVisible(dialog) && ancestorsRendered(dialog)
      seen.set(dialog, open)
    }
    return open
  }
}

/**
 * The open modal surface an element belongs to, if any.
 *
 * A modal makes everything behind it inert, so its controls are the real
 * interaction surface. It is also appended late in the DOM, which would
 * otherwise push it past the inventory cap on element-heavy pages and hide
 * the very controls the caller needs. A closed pre-rendered dialog is not
 * visible and must not be promoted.
 *
 * @param el - candidate element.
 * @param isOpen - memoized openness test for a dialog element.
 * @returns the owning open dialog, or null.
 */
function openDialogOf(el: Element, isOpen: (dialog: Element) => boolean): Element | null {
  const dialog = el.closest('[role="dialog"], [aria-modal="true"]')
  return dialog !== null && isOpen(dialog) ? dialog : null
}

/**
 * Build a snapshot of the current page.
 *
 * Reconciles the stable id registry, collects the inventory (dialog-first,
 * then viewport-first, capped), extracts main content (budgeted), and — in
 * delta mode — diffs against the previous snapshot.
 *
 * @param ids - the stable id registry (one per content-script lifetime).
 * @param options - delta flag, region selector, and negotiated budgets.
 * @param last - previous snapshot view, or null for the first snapshot.
 * @returns the snapshot view.
 */
export function buildSnapshot(ids: ElementIds, options: SnapshotOptions, last: SnapshotView | null): SnapshotView {
  const elements = collectInteractive(document)
  const { added, removed } = ids.assign(elements)
  // A renumbering is only meaningful relative to a previous snapshot: the
  // first snapshot on a fresh document always adds everything.
  const reindexed = last !== null && added + removed > elements.length * 0.5

  // Measure viewport and dialog membership once. Calling getBoundingClientRect
  // from a sort comparator forces repeated layout reads on large pages.
  const isOpenDialog = openDialogTest()
  const elementViews = elements.map((element) => ({
    element,
    inViewport: isInViewport(element),
    inDialog: openDialogOf(element, isOpenDialog) !== null,
  }))
  const ordered = [...elementViews].sort((a, b) =>
    Number(b.inDialog) - Number(a.inDialog) || Number(b.inViewport) - Number(a.inViewport))
  const names = new Map<Element, string>()
  const nameOf = (element: Element): string => {
    let name = names.get(element)
    if (name === undefined) {
      name = accessibleName(element)
      names.set(element, name)
    }
    return name
  }

  const items: InventoryItem[] = []
  for (const { element: el, inViewport } of ordered.slice(0, options.budget.maxItems)) {
    const index = ids.indexOf(el)
    if (index === undefined) continue
    const item: InventoryItem = {
      index,
      role: roleOf(el),
      name: nameOf(el),
      inViewport,
    }
    if (el instanceof HTMLButtonElement && el.disabled) item.disabled = true
    if (el instanceof HTMLInputElement) {
      if (el.disabled) item.disabled = true
      if (el.type === 'checkbox' || el.type === 'radio') item.checked = el.checked
    }
    const ariaChecked = el.getAttribute('aria-checked')
    if (ariaChecked === 'true' || ariaChecked === 'false') item.checked = ariaChecked === 'true'
    if (el instanceof HTMLOptionElement && el.selected) item.selected = true
    if (el instanceof HTMLAnchorElement && el.href !== '') item.href = hrefHeadline(el.href)
    items.push(item)
  }

  // Form controls are already part of the visible interactive inventory, so
  // reuse that scan instead of querying, styling, and measuring them again.
  const formElements = elements.filter((el) => el instanceof HTMLInputElement
    || el instanceof HTMLSelectElement
    || el instanceof HTMLTextAreaElement)
  const forms: FormFieldView[] = []
  for (const el of formElements.slice(0, options.budget.maxForms)) {
    const index = ids.indexOf(el)
    if (index === undefined) continue
    const masked = isSensitiveField(el)
    const checkable = el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')
    const value = checkable
      ? ''
      : el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      ? el.value
      : el instanceof HTMLSelectElement
        ? selectedText(el)
        : ''
    forms.push({
      index,
      label: nameOf(el),
      kind: el instanceof HTMLInputElement ? el.type : el.tagName.toLowerCase(),
      value: masked ? maskValue(value) : value.slice(0, 120),
      masked,
      ...checkable ? { checked: el.checked } : {},
      ...el instanceof HTMLInputElement && el.required ? { required: true } : {},
    })
  }

  const regionEl = options.region !== undefined && options.region !== ''
    ? document.querySelector(options.region)
    : null
  const mainSource = regionEl !== null ? pageText(regionEl) : mainText(document)
  const mainBudget = Math.floor(options.budget.maxChars * 0.5)
  const main = truncate(mainSource, mainBudget)

  const lastItems = last === null ? new Map<number, InventoryItem>() : new Map(last.items.map((item) => [item.index, item]))
  const lastForms = last === null ? new Map<number, FormFieldView>() : new Map(last.forms.map((form) => [form.index, form]))

  const changed = new Set<number>()
  const removedIds: number[] = []
  if (options.delta === true && last !== null) {
    if (last.main !== main.text || last.url !== location.href || last.title !== document.title) {
      changed.add(-1) // -1 = 正文/标题/URL 变化（渲染时说明）
    }
    for (const item of items) {
      const before = lastItems.get(item.index)
      if (before === undefined || !sameItem(before, item)) changed.add(item.index)
    }
    const currentItemIds = new Set(items.map((item) => item.index))
    for (const index of lastItems.keys()) {
      if (!currentItemIds.has(index)) removedIds.push(index)
    }
    for (const form of forms) {
      const before = lastForms.get(form.index)
      if (before === undefined || !sameForm(before, form)) changed.add(form.index)
    }
  }

  return {
    version: (last?.version ?? 0) + 1,
    url: location.href,
    title: document.title,
    ready: document.readyState === 'complete' ? 'complete' : 'loading',
    main: main.text,
    items,
    forms,
    changed: options.delta === true ? [...changed] : [],
    removed: options.delta === true ? removedIds : [],
    reindexed,
    truncated: {
      mainChars: main.truncated,
      itemsDropped: Math.max(0, elements.length - options.budget.maxItems),
      formsDropped: Math.max(0, formElements.length - options.budget.maxForms),
    },
    budgetChars: options.budget.maxChars,
  }
}

function selectedText(select: HTMLSelectElement): string {
  return [...select.selectedOptions].map((option) => option.textContent ?? '').join(', ')
}

function sameItem(a: InventoryItem, b: InventoryItem): boolean {
  return a.role === b.role && a.name === b.name && a.href === b.href
    && a.disabled === b.disabled && a.checked === b.checked && a.inViewport === b.inViewport
}

function sameForm(a: FormFieldView, b: FormFieldView): boolean {
  return a.label === b.label && a.kind === b.kind && a.value === b.value && a.masked === b.masked
    && a.checked === b.checked && a.required === b.required
}

/**
 * Render a snapshot as the model-facing text (the whole snapshot is one text
 * block; no images anywhere).
 * @param view - snapshot to render.
 * @param delta - whether this is a delta render (changes only).
 * @param maxChars - optional render cap for compact derivative responses.
 * @returns the text payload.
 */
/** 渲染结果的整体预算：主文/清单之外的部分（标题、URL、包装行）也计入。 */
function capRendered(text: string, budgetChars: number): string {
  if (text.length <= budgetChars) return text
  return `${text.slice(0, budgetChars)}…(truncated to the snapshot character budget)`
}

function renderItem(item: InventoryItem): string {
  const state = [
    item.disabled === true ? 'disabled' : undefined,
    item.checked === undefined ? undefined : item.checked ? 'checked' : 'unchecked',
    item.inViewport ? undefined : 'outside viewport',
  ].filter((value) => value !== undefined).join('/')
  const stateText = state === '' ? '' : ` [${state}]`
  const hrefText = item.href !== undefined ? ` → ${item.href}` : ''
  return `  [${item.index}] ${item.role} "${item.name}"${stateText}${hrefText}`
}

function renderForm(form: FormFieldView, includeIdentity: boolean): string {
  const identity = includeIdentity ? `${form.label} (${form.kind}) ` : ''
  const state = form.checked === undefined
    ? `value="${form.masked ? '••••' : form.value}"`
    : `checked=${String(form.checked)}`
  return `  [${form.index}] ${identity}${state}${form.required === true ? ' required' : ''}`
}

function appendTruncationNotes(lines: string[], view: SnapshotView): void {
  const notes: string[] = []
  if (view.truncated.mainChars > 0) notes.push(`Main content truncated by ${view.truncated.mainChars} characters`)
  if (view.truncated.itemsDropped > 0) notes.push(`${view.truncated.itemsDropped} additional elements omitted`)
  if (view.truncated.formsDropped > 0) notes.push(`${view.truncated.formsDropped} additional form fields omitted`)
  if (notes.length > 0) lines.push(`\n(${notes.join('; ')}. Use browser_get_text or specify region for more content.)`)
}

export function renderSnapshot(view: SnapshotView, delta: boolean, maxChars: number = view.budgetChars): string {
  const lines: string[] = []
  if (delta) {
    lines.push(`Page change v${view.version} (${view.url})`)
    const elementChanges = view.changed.filter((id) => id !== -1)
    const changedIds = new Set(elementChanges)
    const changedItems = view.items.filter((item) => changedIds.has(item.index))
    const changedForms = view.forms.filter((form) => changedIds.has(form.index))

    lines.push(`Status: ${view.ready}${view.reindexed ? ' (element indices were reassigned; use the indices in this snapshot)' : ''}`)
    if (view.changed.includes(-1)) {
      lines.push(`Title: ${view.title || '(untitled)'}`)
      if (view.main.length > 0) {
        lines.push('')
        lines.push('Changed main content:')
        lines.push(view.main)
      }
    }
    if (changedItems.length > 0) {
      lines.push('')
      lines.push('Changed interactive elements:')
      for (const item of changedItems) lines.push(renderItem(item))
    }
    if (changedForms.length > 0) {
      lines.push('')
      lines.push('Changed form fields:')
      const renderedItems = new Set(changedItems.map((item) => item.index))
      for (const form of changedForms) lines.push(renderForm(form, !renderedItems.has(form.index)))
    }
    if (view.removed.length > 0) lines.push(`Removed elements: ${view.removed.join(', ')}`)
    if (view.changed.length === 0 && view.removed.length === 0) lines.push('(No visible changes.)')
    appendTruncationNotes(lines, view)
    return capRendered(lines.join('\n'), maxChars)
  }
  lines.push(`Title: ${view.title || '(untitled)'}`)
  lines.push(`URL: ${view.url}`)
  lines.push(`Status: ${view.ready}${view.reindexed ? ' (element indices were reassigned; use the indices in this snapshot)' : ''}`)
  if (view.main.length > 0) {
    lines.push('')
    lines.push('Main content:')
    lines.push(view.main)
  }
  if (view.items.length > 0) {
    lines.push('')
    lines.push('Interactive elements:')
    for (const item of view.items) lines.push(renderItem(item))
  }
  if (view.forms.length > 0) {
    lines.push('')
    lines.push('Form fields:')
    const renderedItems = new Set(view.items.map((item) => item.index))
    for (const form of view.forms) {
      lines.push(renderForm(form, !renderedItems.has(form.index)))
    }
  }
  appendTruncationNotes(lines, view)
  return capRendered(lines.join('\n'), maxChars)
}
