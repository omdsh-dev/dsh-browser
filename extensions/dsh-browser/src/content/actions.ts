/**
 * Page actions: click/type/press/scroll/navigate/get_text/wait/storage/fetch,
 * executed in the content script against the real page (preserving login
 * state), each returning a short text status. Navigations return a fresh full
 * snapshot because the document — and the id registry — reset.
 *
 * All browser action results use structured text, so a
 * status line tells the model what happened and what state remains.
 *
 * Two addressing modes exist on purpose. Snapshot indices are the cheap, stable
 * path for everything in the inventory; selector/text addressing reaches the
 * controls that never enter it (JS-only pagination rows, `cursor: pointer`
 * cells), which is why a page can be fully readable yet impossible to operate
 * with indices alone.
 *
 * @module
 */

import {
  accessibleName,
  collectInteractive,
  findScrollableContainer,
  isVisible,
  pageText,
  scrollabilityOf,
  scrollPositionOf,
  scrollRegionLabel,
  truncate,
} from './extract.ts'
import { isSensitiveStorageKey, maskValue } from './privacy.ts'
import type { ElementIds } from './ids.ts'
import type { SnapshotBudget } from './snapshot.ts'
import { buildSnapshot, renderSnapshot, roleOf } from './snapshot.ts'

/** A settled action result. */
export interface ActionResult {
  text: string
  /** Page-authored snapshot delta; the background must wrap it as untrusted. */
  pageContent?: string
  /** A same-frame document navigation was scheduled after this response. */
  navigationPending?: boolean
}

/** How long an action should observe a ready document before returning. */
export interface PageSettlePolicy {
  /** Earliest return after the document becomes ready. */
  minimumMs: number
  /** Required DOM-quiet period before returning. */
  quietMs: number
  /** Hard cap after readiness; continuously animated pages cannot stall tools. */
  maxAfterReadyMs: number
  /** Hard cap while waiting for document readiness. */
  timeoutMs: number
}

const TYPE_SETTLE: PageSettlePolicy = { minimumMs: 32, quietMs: 32, maxAfterReadyMs: 100, timeoutMs: 5_000 }
const ACTION_SETTLE: PageSettlePolicy = { minimumMs: 100, quietMs: 50, maxAfterReadyMs: 250, timeoutMs: 5_000 }
const SCROLL_SETTLE: PageSettlePolicy = { minimumMs: 50, quietMs: 50, maxAfterReadyMs: 150, timeoutMs: 5_000 }
const EXPLICIT_WAIT_SETTLE: PageSettlePolicy = { minimumMs: 100, quietMs: 100, maxAfterReadyMs: 1_000, timeoutMs: 5_000 }
/** Keep automatic action context focused while preserving the negotiated full snapshot budget. */
const ACTION_DELTA_MAX_CHARS = 4_000

/** Page fetch is bounded so one slow endpoint cannot stall the tool call. */
const FETCH_TIMEOUT_MS = 30_000
/** Upper bound on a response body echoed back to the model. */
const FETCH_BODY_MAX_CHARS = 8_000
/** Upper bound on a bulk storage listing. */
const STORAGE_MAX_KEYS = 80
/** Upper bound on one listed storage value. */
const STORAGE_VALUE_MAX_CHARS = 120
/** Upper bound on an explicitly requested storage value. */
const STORAGE_EXPLICIT_MAX_CHARS = 4_000
/** Upper bound on elements inspected by a text click. */
const MAX_TEXT_SCAN = 8_000
/** HTTP methods browser_fetch accepts. */
const FETCH_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'])

/**
 * Wait for document readiness and a mutation-free window. The old fixed delay
 * charged every action equally and still returned too early when a late DOM
 * update landed near its boundary. This observer returns early on already
 * stable pages, extends only for real mutations, and stays bounded on pages
 * with continuous animation.
 */
export function waitForPageSettled(policy: PageSettlePolicy = ACTION_SETTLE): Promise<boolean> {
  const startedAt = performance.now()
  let readyAt = document.readyState === 'complete' ? startedAt : undefined
  let lastMutationAt = startedAt
  let timer: ReturnType<typeof setTimeout> | undefined
  let finished = false
  let observer: MutationObserver | undefined

  return new Promise((resolve) => {
    const finish = (settled: boolean): void => {
      if (finished) return
      finished = true
      if (timer !== undefined) clearTimeout(timer)
      observer?.disconnect()
      document.removeEventListener('readystatechange', schedule)
      window.removeEventListener('load', schedule)
      resolve(settled)
    }
    const check = (): void => {
      timer = undefined
      const now = performance.now()
      if (readyAt === undefined && document.readyState === 'complete') {
        readyAt = now
        lastMutationAt = now
      }
      if (readyAt !== undefined) {
        const afterReady = now - readyAt
        const quietFor = now - lastMutationAt
        if ((afterReady >= policy.minimumMs && quietFor >= policy.quietMs)
          || afterReady >= policy.maxAfterReadyMs) {
          finish(true)
          return
        }
        const untilMinimum = Math.max(0, policy.minimumMs - afterReady)
        const untilQuiet = Math.max(0, policy.quietMs - quietFor)
        timer = setTimeout(check, Math.max(1, Math.min(policy.maxAfterReadyMs - afterReady, Math.max(untilMinimum, untilQuiet))))
        return
      }
      const elapsed = now - startedAt
      if (elapsed >= policy.timeoutMs) {
        finish(false)
        return
      }
      timer = setTimeout(check, Math.max(1, Math.min(100, policy.timeoutMs - elapsed)))
    }
    function schedule(): void {
      if (finished) return
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(check, 0)
    }

    if (document.documentElement !== null) {
      observer = new MutationObserver(() => {
        lastMutationAt = performance.now()
        schedule()
      })
      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      })
    }
    document.addEventListener('readystatechange', schedule)
    window.addEventListener('load', schedule)
    schedule()
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => { setTimeout(resolve, ms) })
}

function elementOrThrow(ids: ElementIds, index: number): Element {
  const el = ids.elementByIndex(index)
  if (el === undefined) {
    throw new ActionError('action-failed', `Element [${index}] does not exist; the page may have changed. Call browser_snapshot again to get current indices.`)
  }
  return el
}

/** Error carrying a stable wire code. */
export class ActionError extends Error {
  constructor(
    readonly code: 'action-failed' | 'bad-args',
    message: string,
  ) {
    super(message)
    this.name = 'ActionError'
  }
}

/** React-compatible value write: native setter + input/change events. */
function setNativeValue(input: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const prototype = input instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  if (setter === undefined) {
    input.value = value
  } else {
    setter.call(input, value)
  }
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

/** Action implementations; each returns a text result. */
export interface ActionContext {
  ids: ElementIds
  budget: SnapshotBudget
  /** Enabled only when the background may share page content without another approval. */
  includePageDelta?: boolean
}

/** Run one named action with its args. */
export async function runAction(action: string, args: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  switch (action) {
    case 'browser_snapshot':
      return snapshotAction(args, ctx)
    case 'browser_click':
      return clickAction(args, ctx)
    case 'browser_type':
      return typeAction(args, ctx)
    case 'browser_press':
      return pressAction(args, ctx)
    case 'browser_scroll':
      return scrollAction(args, ctx)
    case 'browser_navigate':
      return navigateAction(args)
    case 'browser_back':
      return historyAction(-1)
    case 'browser_forward':
      return historyAction(1)
    case 'browser_reload':
      return reloadAction()
    case 'browser_get_text':
      return getTextAction(args)
    case 'browser_get_storage':
      return getStorageAction(args)
    case 'browser_fetch':
      return fetchAction(args)
    case 'browser_wait':
      return waitAction(args, ctx)
    default:
      throw new ActionError('bad-args', `Unknown action: ${action}`)
  }
}

function snapshotAction(args: Record<string, unknown>, ctx: ActionContext): ActionResult {
  const delta = args.delta === true
  const region = typeof args.region === 'string' && args.region !== '' ? args.region : undefined
  // 基线在每次快照后都更新：delta 调用才能相对上一次（无论是否 delta）比较。
  const view = buildSnapshot(ctx.ids, { delta, region, budget: ctx.budget }, lastSnapshot)
  lastSnapshot = view
  return { text: renderSnapshot(view, delta) }
}

/** Module-level last snapshot state for delta mode (content-script lifetime). */
let lastSnapshot: ReturnType<typeof buildSnapshot> | null = null

/** Invalidate delta state after navigation (new document). */
function resetDeltaState(): void {
  lastSnapshot = null
}

/** Attach the settled page change while retaining the full view as the next delta baseline. */
function withPageDelta(text: string, ctx: ActionContext): ActionResult {
  if (ctx.includePageDelta !== true || lastSnapshot === null) return { text }
  const view = buildSnapshot(ctx.ids, { delta: true, budget: ctx.budget }, lastSnapshot)
  lastSnapshot = view
  return {
    text,
    pageContent: renderSnapshot(view, true, Math.min(ctx.budget.maxChars, ACTION_DELTA_MAX_CHARS)),
  }
}

/* ------------------------------------------------------------------ click - */

/** Normalize whitespace and trim without changing case. */
function normalizeInline(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** The element's own text nodes, excluding descendants. */
function directText(el: Element): string {
  let text = ''
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) text += child.textContent ?? ''
  }
  return normalizeInline(text)
}

/** Whether an element is an actionable control (native or pointer-styled). */
function isClickableControl(el: Element): boolean {
  if (el.matches('a[href], button, summary, input, select, textarea, [onclick], [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="radio"], [role="option"]')) {
    return true
  }
  try {
    return getComputedStyle(el).cursor === 'pointer'
  } catch {
    return false
  }
}

/**
 * The nearest actionable ancestor of a text node's element.
 *
 * Pagination and table rows frequently carry the handler on an `<li>`, `<tr>`
 * or `cursor: pointer` wrapper while the visible label is a nested `<span>`.
 * Clicking that wrapper is what a user does; dispatching on the leaf happens to
 * bubble for delegated handlers but silently skips native form activation.
 */
function clickableAncestor(el: Element): Element {
  for (let node: Element | null = el; node !== null && node !== document.body; node = node.parentElement) {
    if (isClickableControl(node) && isVisible(node)) return node
  }
  return el
}

/** Role comparison that accepts both explicit roles and implied tag roles. */
function roleMatches(el: Element, role: string): boolean {
  const wanted = role.trim().toLowerCase()
  if (wanted === '') return true
  return roleOf(el).toLowerCase() === wanted
}

/** One candidate produced by selector or text resolution. */
interface ClickCandidate {
  element: Element
  /** Higher is a better match: 2 exact, 1 prefix, 0 substring. */
  score: number
}

/** Describe one candidate for an ambiguity error the model can act on. */
function describeCandidate(candidate: ClickCandidate, position: number): string {
  const name = truncate(normalizeInline(accessibleName(candidate.element)), 48).text
  return `[${position}] ${roleOf(candidate.element)} "${name}"`
}

function resolveBySelector(selector: string, role: string | undefined, nth: number | undefined): Element {
  let matches: Element[]
  try {
    matches = [...document.querySelectorAll(selector)]
  } catch {
    throw new ActionError('bad-args', `selector is not valid CSS: ${selector}`)
  }
  const visible = matches.filter((el) => isVisible(el) && (role === undefined || roleMatches(el, role)))
  if (visible.length === 0) {
    throw new ActionError('action-failed', `No visible element matched selector "${selector}". Call browser_snapshot to read the current page.`)
  }
  if (nth !== undefined) {
    const picked = visible[nth]
    if (picked === undefined) {
      throw new ActionError('action-failed', `selector "${selector}" matched ${visible.length} elements; nth ${nth} is out of range.`)
    }
    return picked
  }
  if (visible.length > 1) {
    const listed = visible.slice(0, 5)
      .map((el, position) => describeCandidate({ element: el, score: 0 }, position))
      .join('; ')
    throw new ActionError('action-failed', `selector "${selector}" matched ${visible.length} elements: ${listed}. Pass nth or a more specific selector.`)
  }
  return visible[0]!
}

function resolveByText(text: string, role: string | undefined, nth: number | undefined): Element {
  const needle = normalizeInline(text).toLowerCase()
  if (needle === '') throw new ActionError('bad-args', 'text must not be empty.')
  const candidates = new Map<Element, ClickCandidate>()
  const consider = (el: Element, value: string): void => {
    const haystack = normalizeInline(value).toLowerCase()
    if (haystack === '') return
    const score = haystack === needle ? 2 : haystack.startsWith(needle) ? 1 : haystack.includes(needle) ? 0 : -1
    if (score < 0) return
    const target = clickableAncestor(el)
    if (!isVisible(target)) return
    if (role !== undefined && !roleMatches(target, role)) return
    const existing = candidates.get(target)
    if (existing === undefined || score > existing.score) candidates.set(target, { element: target, score })
  }

  let inspected = 0
  for (const el of document.querySelectorAll('*')) {
    if (inspected >= MAX_TEXT_SCAN) break
    inspected += 1
    const own = directText(el)
    if (own !== '') consider(el, own)
  }
  // Accessible names cover icon-only buttons and aria-labelled controls whose
  // visible text never carries the label the caller reads from the snapshot.
  for (const el of collectInteractive(document)) consider(el, accessibleName(el))

  const ordered = [...candidates.values()].sort((left, right) => right.score - left.score)
  if (ordered.length === 0) {
    throw new ActionError('action-failed', `No visible clickable element matched text "${text}". Call browser_snapshot to read the current page, or pass a CSS selector.`)
  }
  if (nth !== undefined) {
    const picked = ordered[nth]
    if (picked === undefined) {
      throw new ActionError('action-failed', `text "${text}" matched ${ordered.length} elements; nth ${nth} is out of range.`)
    }
    return picked.element
  }
  if (ordered.length === 1) return ordered[0]!.element
  const topScore = ordered[0]!.score
  const best = ordered.filter((candidate) => candidate.score === topScore)
  if (best.length === 1) return best[0]!.element
  const listed = ordered.slice(0, 5)
    .map((candidate, position) => describeCandidate(candidate, position))
    .join('; ')
  throw new ActionError('action-failed', `text "${text}" matched ${ordered.length} elements: ${listed}. Pass nth to pick one.`)
}

/** Element plus the address text used in result messages. */
interface ResolvedClick {
  element: Element
  /** `[3]`, `selector "…"`, or `text "…"`. */
  address: string
}

function resolveClickTarget(args: Record<string, unknown>, ids: ElementIds): ResolvedClick {
  const hasIndex = args.index !== undefined
  const hasSelector = typeof args.selector === 'string' && args.selector !== ''
  const hasText = typeof args.text === 'string' && args.text !== ''
  if (args.selector !== undefined && !hasSelector) throw new ActionError('bad-args', 'selector must be a non-empty string.')
  if (args.text !== undefined && !hasText) throw new ActionError('bad-args', 'text must be a non-empty string.')
  const modes = [hasIndex, hasSelector, hasText].filter(Boolean).length
  if (modes === 0) {
    throw new ActionError('bad-args', 'browser_click needs index, selector, or text (one addressing mode).')
  }
  if (modes > 1) {
    throw new ActionError('bad-args', 'browser_click accepts exactly one of index, selector, or text.')
  }
  const role = typeof args.role === 'string' && args.role !== '' ? args.role : undefined
  if (args.role !== undefined && role === undefined) throw new ActionError('bad-args', 'role must be a non-empty string.')
  const nth = args.nth === undefined ? undefined : numberArg(args, 'nth')
  if (hasIndex) {
    if (role !== undefined || nth !== undefined) {
      throw new ActionError('bad-args', 'role and nth apply to selector/text addressing, not index.')
    }
    const index = numberArg(args, 'index')
    return { element: elementOrThrow(ids, index), address: `[${index}]` }
  }
  if (hasSelector) {
    return {
      element: resolveBySelector(args.selector as string, role, nth),
      address: `selector "${truncate(normalizeInline(args.selector as string), 60).text}"`,
    }
  }
  return {
    element: resolveByText(args.text as string, role, nth),
    address: `text "${truncate(normalizeInline(args.text as string), 60).text}"`,
  }
}

async function clickAction(args: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const resolved = resolveClickTarget(args, ctx.ids)
  const el = resolved.element
  const address = resolved.address
  el.scrollIntoView({ block: 'center', behavior: 'instant' })
  if (el instanceof HTMLAnchorElement) {
    const target = el.target.trim().toLowerCase()
    const sameFrameTarget = target === '' || target === '_self'
    let href: URL | undefined
    try { href = new URL(el.href) } catch { /* let the native click handle unusual links */ }
    const controlledNavigation = sameFrameTarget
      && !el.hasAttribute('download')
      && (href?.protocol === 'http:' || href?.protocol === 'https:')
    if (controlledNavigation && href !== undefined) {
      // Manual location assignment cannot preserve browser-managed link
      // semantics such as referrer suppression, hyperlink auditing, or
      // attribution registration. Keep native activation for those links,
      // but do not claim a replacement document is guaranteed: an SPA may
      // still cancel the click and remain in this document.
      const hasReferrerPolicy = typeof el.referrerPolicy === 'string' && el.referrerPolicy !== ''
      const requiresNativeActivation = el.relList.contains('noreferrer')
        || hasReferrerPolicy
        || el.hasAttribute('ping')
        || el.hasAttribute('attributionsrc')
      if (requiresNativeActivation) {
        setTimeout(() => { el.click() }, 0)
        return {
          text: `Clicked link ${address} using native browser activation. Call browser_snapshot to read the resulting state.`,
        }
      }
      // Dispatch the click handlers without its default navigation so a
      // client-side router can cancel synchronously and keep this document.
      const shouldNavigate = el.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
      }))
      if (!shouldNavigate) {
        await waitForPageSettled(ACTION_SETTLE)
        return withPageDelta(`Clicked link ${address}.`, ctx)
      }
      const sameDocument = href.origin === location.origin
        && href.pathname === location.pathname
        && href.search === location.search
      if (sameDocument) {
        if (href.hash !== location.hash) location.hash = href.hash
        await waitForPageSettled(ACTION_SETTLE)
        return withPageDelta(`Clicked link ${address}.`, ctx)
      }
      // A cross-document navigation can unload this content script before an
      // awaited response. Answer first and navigate in the next task.
      setTimeout(() => { location.href = href.href }, 0)
      return {
        text: `Clicked link ${address}. Call browser_snapshot again after navigation settles.`,
        navigationPending: true,
      }
    }
    setTimeout(() => { el.click() }, 0)
    return { text: `Clicked link ${address}. The link may open outside the controlled frame.` }
  }
  if (el instanceof HTMLButtonElement && el.disabled) {
    throw new ActionError('action-failed', `Button ${address} is disabled.`)
  }
  ;(el as HTMLElement).click()
  await waitForPageSettled(ACTION_SETTLE)
  return withPageDelta(`Clicked ${address}.`, ctx)
}

/* ------------------------------------------------------------------- type - */

/**
 * The nearest editable host, or null when a `contenteditable="false"` island
 * blocks editing.
 *
 * The walk must stop at the nearest `[contenteditable]` boundary instead of
 * skipping disabled ones: an element inside a non-editable island nested in an
 * editable composer belongs to the island, and resolving past it would type
 * into the surrounding composer rather than refusing the target.
 *
 * @param el - element addressed by the action.
 * @returns the owning editable host, or null when editing is blocked.
 */
function editingHost(el: HTMLElement): HTMLElement | null {
  const boundary = el.closest('[contenteditable]')
  if (!(boundary instanceof HTMLElement)) return null
  return boundary.getAttribute('contenteditable') === 'false' ? null : boundary
}

/**
 * Whether the element can receive rich-text input.
 *
 * `isContentEditable` is the browser's own answer; the boundary walk covers the
 * attribute case, which is unimplemented in jsdom, where these tests run.
 *
 * @param el - element addressed by the action.
 * @returns true when the element can receive rich-text input.
 */
function isEditable(el: Element): el is HTMLElement {
  return el instanceof HTMLElement && (el.isContentEditable || editingHost(el) !== null)
}

/**
 * Insert text into a rich-text host through the browser's editing pipeline.
 *
 * Editors such as Lexical, Draft.js and ProseMirror keep their own document
 * model and reconcile away foreign DOM writes, so assigning `textContent`
 * silently reverts and the caller's success report becomes a lie.
 * `execCommand('insertText')` is deprecated but remains the only path that
 * produces the `beforeinput`/`input` sequence those editors listen for. Hosts
 * without it keep the direct-write fallback.
 *
 * @param el - element addressed by the action.
 * @param text - text to insert.
 * @param replace - whether to replace the host's current contents.
 */
function typeIntoContentEditable(el: HTMLElement, text: string, replace: boolean): void {
  // `isEditable` already refused a disabled island, so a null host here means
  // the element is editable without the attribute; address it directly.
  const host = editingHost(el) ?? el
  host.focus()
  const selection = host.ownerDocument.getSelection()
  if (selection !== null) {
    const range = host.ownerDocument.createRange()
    range.selectNodeContents(host)
    // A caret collapsed to the end appends; a full selection is replaced by insertText.
    if (!replace) range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }
  const doc = host.ownerDocument
  if (typeof doc.execCommand === 'function') {
    try {
      if (doc.execCommand('insertText', false, text)) return
    } catch {
      // Fall through to the direct-write path below.
    }
  }
  if (replace) host.textContent = ''
  host.textContent = `${host.textContent ?? ''}${text}`
  host.dispatchEvent(new Event('input', { bubbles: true }))
}

async function typeAction(args: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const index = numberArg(args, 'index')
  const text = typeof args.text === 'string' ? args.text : ''
  if (text === '') throw new ActionError('bad-args', 'text must not be empty.')
  const replace = args.replace === true
  const el = elementOrThrow(ctx.ids, index)
  if (isEditable(el)) {
    typeIntoContentEditable(el, text, replace)
  } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (replace) setNativeValue(el, '')
    setNativeValue(el, `${el.value}${text}`)
  } else {
    throw new ActionError('action-failed', `Element [${index}] is not editable (${el.tagName.toLowerCase()}).`)
  }
  await waitForPageSettled(TYPE_SETTLE)
  return withPageDelta(`Entered ${text.length} characters into [${index}].`, ctx)
}

/* ------------------------------------------------------------------ press - */

/** Modifier aliases accepted by browser_press. */
const MODIFIER_FIELDS = new Map<string, 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>([
  ['ctrl', 'ctrlKey'],
  ['control', 'ctrlKey'],
  ['meta', 'metaKey'],
  ['cmd', 'metaKey'],
  ['command', 'metaKey'],
  ['shift', 'shiftKey'],
  ['alt', 'altKey'],
  ['option', 'altKey'],
])

/** Keys whose `KeyboardEvent.code` differs from their `key`. */
const KEY_CODES = new Map<string, string>([
  [' ', 'Space'],
  ['Enter', 'Enter'],
  ['Escape', 'Escape'],
  ['Esc', 'Escape'],
  ['Tab', 'Tab'],
  ['Backspace', 'Backspace'],
  ['Delete', 'Delete'],
  ['ArrowUp', 'ArrowUp'],
  ['ArrowDown', 'ArrowDown'],
  ['ArrowLeft', 'ArrowLeft'],
  ['ArrowRight', 'ArrowRight'],
  ['Home', 'Home'],
  ['End', 'End'],
  ['PageUp', 'PageUp'],
  ['PageDown', 'PageDown'],
])

/** Build the modifier half of a KeyboardEvent from the wire argument. */
function modifierInit(value: unknown): {
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
} {
  if (value === undefined) return {}
  if (!Array.isArray(value)) throw new ActionError('bad-args', 'modifiers must be an array of ctrl, meta, shift, or alt.')
  const init: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {}
  for (const raw of value) {
    const name = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
    const field = MODIFIER_FIELDS.get(name)
    if (field === undefined) {
      throw new ActionError('bad-args', `modifiers supports ctrl, meta, shift, and alt; received "${String(raw)}".`)
    }
    init[field] = true
  }
  return init
}

/** `KeyboardEvent.code` for a key value, when it is derivable. */
function keyCodeFor(key: string): string | undefined {
  if (/^[a-zA-Z]$/.test(key)) return `Key${key.toUpperCase()}`
  if (/^[0-9]$/.test(key)) return `Digit${key}`
  return KEY_CODES.get(key)
}

async function pressAction(args: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const key = typeof args.key === 'string' && args.key !== '' ? args.key : ''
  if (key === '') throw new ActionError('bad-args', 'key must not be empty.')
  const modifiers = modifierInit(args.modifiers)
  const plain = Object.keys(modifiers).length === 0
  const target = document.activeElement instanceof HTMLElement ? document.activeElement : document.body
  const init: KeyboardEventInit = {
    key,
    ...keyCodeFor(key) === undefined ? {} : { code: keyCodeFor(key) },
    bubbles: true,
    cancelable: true,
    composed: true,
    ...modifiers,
  }
  target.dispatchEvent(new KeyboardEvent('keydown', init))
  target.dispatchEvent(new KeyboardEvent('keyup', init))
  if (plain && key === 'Enter' && target instanceof HTMLInputElement && target.form !== null) {
    target.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  }
  await waitForPageSettled(ACTION_SETTLE)
  const label = plain
    ? `"${key}"`
    : `${Object.entries(modifiers).map(([field]) => field.replace('Key', '')).join('+')}+${key}`
  return withPageDelta(`Sent key ${label}.`, ctx)
}

/* ----------------------------------------------------------------- scroll - */

/** Scroll the window and report whether it actually moved. */
function scrollWindow(direction: string, amount: number): { moved: boolean; position: string } {
  const scroller = document.scrollingElement ?? document.documentElement
  const before = scroller.scrollTop
  switch (direction) {
    case 'top':
      window.scrollTo({ top: 0, behavior: 'instant' })
      break
    case 'bottom':
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
      break
    case 'up':
      window.scrollBy({ top: -amount, behavior: 'instant' })
      break
    default:
      window.scrollBy({ top: amount, behavior: 'instant' })
      break
  }
  const moved = Math.abs(scroller.scrollTop - before) > 1
  const position = scrollPositionOf(scroller)
  return {
    moved,
    position: position.remaining <= 1 ? `at the end (${position.percent}%)` : `${position.percent}% down, ${position.remaining}px remaining`,
  }
}

/** Resolve the container browser_scroll should move, when one was addressed. */
function scrollContainerFor(args: Record<string, unknown>, ids: ElementIds): Element | undefined {
  const hasSelector = typeof args.selector === 'string' && args.selector !== ''
  const hasIndex = args.index !== undefined
  if (args.selector !== undefined && !hasSelector) throw new ActionError('bad-args', 'selector must be a non-empty string.')
  if (hasSelector && hasIndex) throw new ActionError('bad-args', 'browser_scroll accepts selector or index, not both.')
  if (!hasSelector && !hasIndex) return undefined
  let target: Element
  if (hasSelector) {
    let found: Element | null
    try {
      found = document.querySelector(args.selector as string)
    } catch {
      throw new ActionError('bad-args', `selector is not valid CSS: ${String(args.selector)}`)
    }
    if (found === null) {
      throw new ActionError('action-failed', `No element matched selector "${String(args.selector)}". Call browser_snapshot to read the scrollable region selectors.`)
    }
    target = found
  } else {
    target = elementOrThrow(ids, numberArg(args, 'index'))
  }
  // Addressing the document scroller explicitly means "scroll the window".
  if (target === document.body || target === document.documentElement) return undefined
  const container = findScrollableContainer(target)
  if (container === undefined) {
    throw new ActionError('action-failed', 'No inner scrollable container surrounds that element; call browser_scroll without selector or index to scroll the page itself.')
  }
  return container
}

async function scrollAction(args: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const direction = typeof args.direction === 'string' ? args.direction : ''
  const container = scrollContainerFor(args, ctx.ids)
  const amount = typeof args.amount === 'number' ? args.amount : Math.floor(window.innerHeight * 0.8)
  if (!['up', 'down', 'top', 'bottom'].includes(direction)) {
    throw new ActionError('bad-args', `direction must be up, down, top, or bottom; received "${direction}".`)
  }
  if (container === undefined) {
    const result = scrollWindow(direction, amount)
    await waitForPageSettled(SCROLL_SETTLE)
    const hint = result.moved || direction === 'top'
      ? ''
      : ' The page itself did not move; it has inner scrollable regions — pass one of their selectors from browser_snapshot.'
    return withPageDelta(`Scrolled ${direction}; now ${result.position}.${hint}`, ctx)
  }
  const scroll = scrollabilityOf(container)
  const horizontal = !scroll.vertical && scroll.horizontal
  const available = horizontal
    ? Math.max(0, container.scrollWidth - container.clientWidth)
    : Math.max(0, container.scrollHeight - container.clientHeight)
  const current = horizontal ? container.scrollLeft : container.scrollTop
  const next = direction === 'top'
    ? 0
    : direction === 'bottom'
      ? available
      : Math.max(0, Math.min(available, current + (direction === 'up' ? -amount : amount)))
  if (horizontal) container.scrollLeft = next
  else container.scrollTop = next
  await waitForPageSettled(SCROLL_SETTLE)
  const position = scrollPositionOf(container, horizontal)
  const label = scrollRegionLabel(container)
  const state = position.remaining <= 1
    ? `at the end (${position.percent}%)`
    : `${position.percent}% ${horizontal ? 'right' : 'down'}, ${position.remaining}px remaining`
  return withPageDelta(`Scrolled ${direction} ${label}; now ${state}.`, ctx)
}

/* ------------------------------------------------------- navigation/reads - */

async function navigateAction(args: Record<string, unknown>): Promise<ActionResult> {
  const url = typeof args.url === 'string' && args.url !== '' ? args.url : ''
  if (url === '') throw new ActionError('bad-args', 'url must not be empty.')
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new ActionError('bad-args', `url is not valid: ${url}`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ActionError('bad-args', `Only http and https URLs are supported; received ${parsed.protocol}.`)
  }
  resetDeltaState()
  // Cross-document navigation unloads this content script and destroys the
  // tabs.sendMessage response port before any await settles — so answer
  // FIRST, then navigate in a fresh task. The model re-snapshots after load.
  setTimeout(() => { location.href = parsed.href }, 0)
  return {
    text: `Navigating to ${parsed.href}. Call browser_snapshot again after the page loads.`,
    navigationPending: true,
  }
}

async function historyAction(delta: 1 | -1): Promise<ActionResult> {
  resetDeltaState()
  // 同 navigate：先响应再导航（文档卸载会销毁响应端口）。
  setTimeout(() => { if (delta === -1) history.back(); else history.forward() }, 0)
  return {
    text: 'Navigating through browser history. Call browser_snapshot again after the page loads.',
    navigationPending: true,
  }
}

function reloadAction(): ActionResult {
  resetDeltaState()
  setTimeout(() => { location.reload() }, 0)
  return {
    text: 'The page is reloading. Call browser_snapshot again after it loads.',
    navigationPending: true,
  }
}

async function getTextAction(args: Record<string, unknown>): Promise<ActionResult> {
  const selector = typeof args.selector === 'string' && args.selector !== '' ? args.selector : undefined
  const source = selector !== undefined ? document.querySelector(selector) : null
  const text = source !== null ? pageText(source) : selector !== undefined ? `No element matched selector: ${selector}` : pageText()
  const truncated = truncate(text, 8_000)
  return { text: truncated.text + (truncated.truncated > 0 ? `\n(Truncated ${truncated.truncated} characters.)` : '') }
}

/* ---------------------------------------------------------------- storage - */

/** One storage area, resolved defensively (opaque origins deny access). */
function storageArea(name: 'local' | 'session'): Storage {
  try {
    return name === 'local' ? window.localStorage : window.sessionStorage
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new ActionError('action-failed', `The browser blocked ${name}Storage access for this page: ${detail}`)
  }
}

async function getStorageAction(args: Record<string, unknown>): Promise<ActionResult> {
  const areaName = args.area === undefined ? 'local' : args.area
  if (areaName !== 'local' && areaName !== 'session') {
    throw new ActionError('bad-args', `area must be "local" or "session"; received "${String(args.area)}".`)
  }
  const area = storageArea(areaName)
  const key = typeof args.key === 'string' && args.key !== '' ? args.key : undefined
  if (args.key !== undefined && key === undefined) throw new ActionError('bad-args', 'key must be a non-empty string.')
  const label = `${areaName}Storage`

  if (key !== undefined) {
    const value = area.getItem(key)
    if (value === null) {
      return { text: `No ${label} entry named "${truncate(key, 80).text}" for this origin.` }
    }
    const bounded = truncate(value, STORAGE_EXPLICIT_MAX_CHARS)
    const note = bounded.truncated > 0 ? `\n(Truncated ${bounded.truncated} characters.)` : ''
    return { text: `${label}["${truncate(key, 80).text}"] (${value.length} chars) =\n${bounded.text}${note}` }
  }

  const keys: string[] = []
  for (let position = 0; position < area.length; position += 1) {
    const name = area.key(position)
    if (name !== null) keys.push(name)
  }
  keys.sort()
  if (keys.length === 0) return { text: `No ${label} entries for this origin.` }
  const shown = keys.slice(0, STORAGE_MAX_KEYS)
  const lines: string[] = [`${label} for ${location.origin} — ${keys.length} entries:`]
  for (const name of shown) {
    const value = area.getItem(name) ?? ''
    if (isSensitiveStorageKey(name)) {
      lines.push(`  - ${name} = ${maskValue(value)} (${value.length} chars, masked; pass key to read)`)
      continue
    }
    const bounded = truncate(value, STORAGE_VALUE_MAX_CHARS)
    lines.push(`  - ${name} = ${bounded.truncated > 0 ? `${bounded.text}… (${value.length} chars)` : bounded.text}`)
  }
  if (keys.length > shown.length) lines.push(`  … ${keys.length - shown.length} more keys omitted.`)
  return { text: lines.join('\n') }
}

/* ------------------------------------------------------------------ fetch - */

/** Parse and bound the header object the model supplied. */
function fetchHeaders(value: unknown): Record<string, string> {
  if (value === undefined) return {}
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ActionError('bad-args', 'headers must be an object of header name to string value.')
  }
  const headers: Record<string, string> = {}
  for (const [name, headerValue] of Object.entries(value)) {
    if (typeof headerValue !== 'string') {
      throw new ActionError('bad-args', `header "${name}" must be a string.`)
    }
    headers[name] = headerValue
  }
  return headers
}

/** Render a response for the model under the snapshot character budget. */
function renderFetchResponse(request: { method: string; url: string }, response: Response, body: string): string {
  const headers = [...response.headers].slice(0, 20)
    .map(([name, value]) => `${name}: ${truncate(value, 200).text}`)
  const bounded = truncate(body, FETCH_BODY_MAX_CHARS)
  const lines = [
    `${request.method} ${request.url} → ${response.status} ${response.statusText}`.trimEnd(),
    `Final URL: ${response.url === '' ? request.url : response.url}`,
  ]
  if (headers.length > 0) {
    lines.push('Response headers:')
    for (const header of headers) lines.push(`  ${header}`)
  }
  if (request.method === 'HEAD') {
    lines.push('Body: (not read for HEAD)')
  } else if (body === '') {
    lines.push('Body: (empty)')
  } else {
    lines.push(`Body (${body.length} chars):`)
    lines.push(bounded.text)
    if (bounded.truncated > 0) lines.push(`(Truncated ${bounded.truncated} characters.)`)
  }
  return lines.join('\n')
}

async function fetchAction(args: Record<string, unknown>): Promise<ActionResult> {
  const rawUrl = typeof args.url === 'string' ? args.url.trim() : ''
  if (rawUrl === '') throw new ActionError('bad-args', 'url must not be empty.')
  let url: URL
  try {
    // A relative path resolves against the page, which keeps same-origin API
    // calls short ("/api/lines") and still lands on the right host.
    url = new URL(rawUrl, location.href)
  } catch {
    throw new ActionError('bad-args', `url is not valid: ${rawUrl}`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ActionError('bad-args', `Only http and https URLs are supported; received ${url.protocol}.`)
  }
  const method = typeof args.method === 'string' ? args.method.trim().toUpperCase() : 'GET'
  if (!FETCH_METHODS.has(method)) {
    throw new ActionError('bad-args', `method must be one of ${[...FETCH_METHODS].join(', ')}; received "${method}".`)
  }
  const headers = fetchHeaders(args.headers)
  const body = typeof args.body === 'string' ? args.body : undefined
  if (args.body !== undefined && body === undefined) {
    throw new ActionError('bad-args', 'body must be a string.')
  }
  const init: RequestInit = {
    method,
    headers,
    // Same-origin requests run with the page's cookies, which is what makes an
    // authenticated admin API callable without re-authenticating. Cross-origin
    // requests stay subject to the page's CORS policy.
    credentials: 'include',
    redirect: 'follow',
  }
  if (body !== undefined && method !== 'GET' && method !== 'HEAD') init.body = body

  const controller = new AbortController()
  const timeout = setTimeout(() => { controller.abort() }, FETCH_TIMEOUT_MS)
  try {
    init.signal = controller.signal
    let response: Response
    try {
      response = await fetch(url.href, init)
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error)
      const hint = controller.signal.aborted
        ? ` The request timed out after ${FETCH_TIMEOUT_MS}ms.`
        : ' Cross-origin requests must be allowed by the page CORS policy.'
      throw new ActionError('action-failed', `The request failed: ${detail}.${hint}`)
    }
    let responseBody = ''
    if (method !== 'HEAD') {
      try {
        responseBody = await response.text()
      } catch (error: unknown) {
        const detail = error instanceof Error ? error.message : String(error)
        throw new ActionError('action-failed', `The response body could not be read: ${detail}`)
      }
    }
    return { text: renderFetchResponse({ method, url: url.href }, response, responseBody) }
  } finally {
    clearTimeout(timeout)
  }
}

/* ------------------------------------------------------------------- wait - */

async function waitAction(args: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const ms = typeof args.ms === 'number' && args.ms > 0 ? args.ms : 0
  await waitForPageSettled(EXPLICIT_WAIT_SETTLE)
  if (ms > 0) await sleep(ms)
  return withPageDelta(`The page is stable${ms > 0 ? ` after an additional ${ms}ms wait` : ''}.`, ctx)
}

function numberArg(args: Record<string, unknown>, name: string): number {
  const value = args[name]
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ActionError('bad-args', `${name} must be a non-negative integer; received ${String(value)}.`)
  }
  return value
}
