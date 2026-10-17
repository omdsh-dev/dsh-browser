/**
 * Text extraction primitives for the text-only page snapshot: visibility,
 * accessible names, interactive inventory, main-content heuristic, and
 * truncation helpers.
 *
 * The snapshot is the model's entire view of the page (no screenshots), so
 * every helper is written to produce dense, model-usable text under a hard
 * character budget.
 *
 * @module
 */

/** Every element type the model may be asked to operate on. */
const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="menuitem"]',
  'summary',
  '[contenteditable="true"]',
  '[contenteditable=""]',
].join(', ')

/** Default cap on one item's rendered name/state text. */
const MAX_ITEM_NAME_CHARS = 80

/**
 * Whether an element is visible to the user: not display/visibility/opacity
 * hidden and occupying layout space.
 * @param el - candidate element.
 * @returns true when the element renders.
 */
export function isVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false
  const style = getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

/**
 * Whether the element is inside the current viewport (used to order the
 * inventory: what the user sees comes first).
 * @param el - element.
 * @returns true when any part is within the viewport.
 */
export function isInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  return rect.bottom >= 0 && rect.top <= window.innerHeight && rect.right >= 0 && rect.left <= window.innerWidth
}

/** Normalize whitespace and trim. */
function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Text of an element: innerText when available (browsers), textContent
 * otherwise (jsdom/edge cases).
 * @param el - element.
 * @returns the element's text.
 */
function elementText(el: Element): string {
  if (el instanceof HTMLElement && typeof el.innerText === 'string') return el.innerText
  return el.textContent ?? ''
}

/**
 * Truncate text at a character budget, marking the cut.
 * @param text - source text.
 * @param max - maximum characters.
 * @returns `{ text, truncated }` with `truncated` counting removed characters.
 */
export function truncate(text: string, max: number): { text: string; truncated: number } {
  if (text.length <= max) return { text, truncated: 0 }
  return { text: `${text.slice(0, max)}…`, truncated: text.length - max }
}

/**
 * The accessible name of an element, following the ARIA precedence chain
 * (aria-label → aria-labelledby → associated label → own text →
 * placeholder/alt).
 * @param el - element.
 * @returns a ≤80-char name, or the tag name as last resort.
 */
export function accessibleName(el: Element): string {
  const ariaLabel = el.getAttribute('aria-label')
  if (ariaLabel !== null && ariaLabel.trim() !== '') return truncate(clean(ariaLabel), MAX_ITEM_NAME_CHARS).text

  const labelledBy = el.getAttribute('aria-labelledby')
  if (labelledBy !== null) {
    const ref = document.getElementById(labelledBy.split(/\s+/)[0] ?? '')
    const refText = ref?.textContent
    if (refText !== undefined && refText.trim() !== '') return truncate(clean(refText), MAX_ITEM_NAME_CHARS).text
  }

  const labelable = el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement
  if (labelable) {
    if (el.id !== '') {
      const label = el.ownerDocument.querySelector<HTMLLabelElement>(`label[for="${cssEscape(el.id)}"]`)
      const labelText = label?.textContent
      if (labelText !== undefined && labelText.trim() !== '') return truncate(clean(labelText), MAX_ITEM_NAME_CHARS).text
    }
    const wrappingLabelText = el.closest('label')?.textContent
    if (wrappingLabelText !== undefined && wrappingLabelText.trim() !== '') {
      return truncate(clean(wrappingLabelText), MAX_ITEM_NAME_CHARS).text
    }
  }

  const ownText = el instanceof HTMLInputElement ? '' : el.textContent
  if (ownText !== undefined && ownText.trim() !== '') return truncate(clean(ownText), MAX_ITEM_NAME_CHARS).text

  if (el instanceof HTMLInputElement) {
    // Button-like inputs carry their label in `value`; other inputs never use
    // the current value as a name (it is data, not identity — and for
    // password/credit fields it would leak the secret into the snapshot).
    const buttonLike = el.type === 'submit' || el.type === 'button' || el.type === 'reset'
    if (buttonLike && el.value !== '') return truncate(clean(el.value), MAX_ITEM_NAME_CHARS).text
    if (el.placeholder !== '') return truncate(clean(el.placeholder), MAX_ITEM_NAME_CHARS).text
    if (el.alt !== '') return truncate(clean(el.alt), MAX_ITEM_NAME_CHARS).text
    return truncate(clean(el.type), MAX_ITEM_NAME_CHARS).text
  }

  return el.tagName.toLowerCase()
}

/** CSS.escape with a fallback for environments that lack it (jsdom). */
function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value)
  return value.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`)
}

/**
 * Collect the page's interactive elements in document order, deduplicated and
 * visibility-filtered.
 * @param root - document or element to scan.
 * @returns the interactive inventory.
 */
export function collectInteractive(root: Document | Element): Element[] {
  const seen = new Set<Element>()
  const result: Element[] = []
  for (const el of root.querySelectorAll(INTERACTIVE_SELECTOR)) {
    if (seen.has(el)) continue
    seen.add(el)
    if (isVisible(el)) result.push(el)
  }
  return result
}

/**
 * Best-effort main-content extraction (readability-lite): prefer a main
 * landmark, then a single standalone article, else the largest block
 * containing at least two paragraphs. Multiple articles commonly represent
 * cards or feed entries, so selecting only the first would hide page content.
 * @param doc - the document.
 * @returns the cleaned main text (unbounded; callers apply budgets).
 */
export function mainText(doc: Document): string {
  const main = doc.querySelector('main, [role="main"]')
  if (main !== null) return clean(elementText(main))
  const articles = doc.querySelectorAll('article')
  if (articles.length === 1) return clean(elementText(articles[0]!))

  let best: Element | null = null
  let bestScore = 0
  for (const candidate of doc.querySelectorAll('section, div, [role="main"]')) {
    const paragraphs = candidate.querySelectorAll('p').length
    if (paragraphs < 2) continue
    const text = elementText(candidate)
    const score = text.length * Math.min(paragraphs, 5)
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }
  if (best !== null) return clean(elementText(best))
  return clean(elementText(doc.body))
}

/**
 * The full text of an element (or the whole document).
 * @param root - element to read; defaults to the document body.
 * @returns normalized text.
 */
export function pageText(root?: Element | null): string {
  const source = root ?? document.body
  if (source === null || source === undefined) return ''
  return clean(elementText(source))
}

/** Which axes of one element hold more content than it currently shows. */
export interface Scrollability {
  vertical: boolean
  horizontal: boolean
}

/** CSS overflow values that make a scroll container user-scrollable. */
const SCROLLABLE_OVERFLOW = /(auto|scroll|overlay)/

/**
 * Whether an element is an inner scroll container: it clips overflowing
 * content and its overflow allows scrolling.
 *
 * App-shell layouts put the real document in a `div` and keep `body`
 * non-scrolling, so this is the test the page-level `window.scrollBy` path
 * misses.
 *
 * @param el - candidate element.
 * @returns per-axis scrollability.
 */
export function scrollabilityOf(el: Element): Scrollability {
  const verticalOverflow = el.scrollHeight > el.clientHeight + 4
  const horizontalOverflow = el.scrollWidth > el.clientWidth + 4
  if (!verticalOverflow && !horizontalOverflow) return { vertical: false, horizontal: false }
  const style = getComputedStyle(el)
  return {
    // A `hidden` axis still supports programmatic `scrollTop`/`scrollLeft`, but
    // annotating it as a scroll region would invite pointless scrolling.
    vertical: verticalOverflow && SCROLLABLE_OVERFLOW.test(style.overflowY),
    horizontal: horizontalOverflow && SCROLLABLE_OVERFLOW.test(style.overflowX),
  }
}

/**
 * The nearest inner scroll container at or above an element.
 * @param el - starting element.
 * @returns the scrollable element, or undefined when only the window scrolls.
 */
export function findScrollableContainer(el: Element): Element | undefined {
  for (let node: Element | null = el; node !== null; node = node.parentElement) {
    if (node === document.body || node === document.documentElement) return undefined
    const scroll = scrollabilityOf(node)
    if (scroll.vertical || scroll.horizontal) return node
  }
  return undefined
}

/** One inner scroll region, as rendered into the snapshot. */
export interface ScrollableRegionView {
  /** CSS selector that resolves to this element right now. */
  selector: string
  /** Short human/model-readable identity (aria-label, id, role, tag). */
  label: string
  /** True when the horizontal axis is the one with content left. */
  horizontal: boolean
  /** 0–100, rounded. */
  percent: number
  /** Pixels still scrollable in the reported axis. */
  remaining: number
}

/** Where a scroll container currently sits in its scrollable range. */
export interface ScrollPosition {
  percent: number
  remaining: number
  atStart: boolean
  atEnd: boolean
}

/**
 * Read a container's current scroll position.
 * @param el - scroll container.
 * @param horizontal - report the horizontal axis instead of the vertical one.
 * @returns rounded position facts.
 */
export function scrollPositionOf(el: Element, horizontal = false): ScrollPosition {
  const available = horizontal
    ? el.scrollWidth - el.clientWidth
    : el.scrollHeight - el.clientHeight
  const position = horizontal ? el.scrollLeft : el.scrollTop
  if (available <= 0) return { percent: 100, remaining: 0, atStart: true, atEnd: true }
  const clamped = Math.max(0, Math.min(available, position))
  const remaining = Math.max(0, available - clamped)
  return {
    percent: Math.round((clamped / available) * 100),
    remaining: Math.round(remaining),
    atStart: clamped <= 1,
    atEnd: remaining <= 1,
  }
}

/**
 * Short identity for a scroll container. Container text is unbounded, so this
 * never falls back to `textContent` (a whole page would leak into one line).
 * @param el - scroll container.
 * @returns a clean label of at most 48 characters.
 */
export function scrollRegionLabel(el: Element): string {
  const aria = el.getAttribute('aria-label')
  if (aria !== null && aria.trim() !== '') return truncate(clean(aria), 48).text
  if (el.id !== '') return truncate(`#${el.id}`, 48).text
  const role = el.getAttribute('role')
  if (role !== null && role !== '') return truncate(role, 48).text
  const className = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : undefined
  const tag = el.tagName.toLowerCase()
  return truncate(className === undefined || className === '' ? tag : `${tag}.${className}`, 48).text
}

/**
 * Build a selector that currently resolves to exactly one element.
 *
 * The model passes this selector back to `browser_scroll`, so it only has to
 * be unique for the snapshot it came from; ids and `nth-of-type` chains cover
 * the common cases without inventing a parallel addressing scheme.
 *
 * @param el - target element.
 * @param maxDepth - ancestor levels to consider before giving up.
 * @returns a CSS selector (best effort).
 */
export function cssPath(el: Element, maxDepth = 24): string {
  const parts: string[] = []
  let node: Element | null = el
  for (let depth = 0; node !== null && node !== document.documentElement && depth < maxDepth; depth += 1) {
    if (node.id !== '') {
      const idSelector = `#${cssEscape(node.id)}`
      if (document.querySelectorAll(idSelector).length === 1) {
        parts.unshift(idSelector)
        return parts.join(' > ')
      }
    }
    const parent: Element | null = node.parentElement
    if (parent === null) break
    const sameTag = [...parent.children].filter((child) => child.tagName === node!.tagName)
    parts.unshift(`${node.tagName.toLowerCase()}:nth-of-type(${sameTag.indexOf(node) + 1})`)
    const candidate = parts.join(' > ')
    if (document.querySelectorAll(candidate).length === 1) return candidate
    node = parent
  }
  return parts.join(' > ')
}

/** Upper bound on elements inspected for scroll regions in one snapshot. */
const MAX_SCROLL_SCAN = 6_000

/**
 * Find the inner scroll containers worth telling the model about.
 *
 * `body`/`documentElement` are excluded because `browser_scroll` without a
 * target already moves the window. Nested containers are kept: an app shell
 * often scrolls its sidebar and its content pane independently.
 *
 * @param root - document or subtree to scan.
 * @param limit - maximum regions returned.
 * @returns regions in document order.
 */
export function collectScrollableRegions(root: Document | Element, limit = 5): ScrollableRegionView[] {
  const regions: ScrollableRegionView[] = []
  let inspected = 0
  for (const el of root.querySelectorAll('*')) {
    if (inspected >= MAX_SCROLL_SCAN) break
    inspected += 1
    if (el === document.body || el === document.documentElement) continue
    if (!(el instanceof HTMLElement)) continue
    if (el.clientHeight === 0 && el.clientWidth === 0) continue
    const scroll = scrollabilityOf(el)
    if (!scroll.vertical && !scroll.horizontal) continue
    if (!isVisible(el)) continue
    const horizontal = !scroll.vertical && scroll.horizontal
    const position = scrollPositionOf(el, horizontal)
    regions.push({
      selector: cssPath(el),
      label: scrollRegionLabel(el),
      horizontal,
      percent: position.percent,
      remaining: position.remaining,
    })
    if (regions.length >= limit) break
  }
  return regions
}
