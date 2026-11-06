/**
 * Page actions: click/type/press/scroll/navigate/get_text/wait, executed in
 * the content script against the real page (preserving login state), each
 * returning a short text status. Navigations return a fresh full snapshot
 * because the document — and the id registry — reset.
 *
 * All browser action results use structured text, so a
 * status line tells the model what happened and what state remains.
 *
 * @module
 */

import { pageText, truncate } from './extract.ts'
import { findElements, LocatorError, parseLocatorQuery, renderFound } from './find.ts'
import type { ElementIds } from './ids.ts'
import { dispatchPaste } from './paste.ts'
import type { SnapshotBudget } from './snapshot.ts'
import { buildSnapshot, renderSnapshot } from './snapshot.ts'

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
    readonly code: 'action-failed' | 'bad-args' | 'input-unavailable',
    message: string,
  ) {
    super(message)
    this.name = 'ActionError'
  }
}

/**
 * Resolve the element a model action refers to: a stable inventory index or a
 * CSS selector. Exactly one form is allowed; both and neither are caller bugs.
 *
 * @param args - raw tool arguments.
 * @param ids - the frame's element registry.
 * @returns the addressed element.
 */
export function resolveActionTarget(args: Record<string, unknown>, ids: ElementIds): Element {
  const hasIndex = args.index !== undefined
  const selector = typeof args.selector === 'string' && args.selector !== '' ? args.selector : undefined
  if (hasIndex && selector !== undefined) {
    throw new ActionError('bad-args', 'Provide either index or selector, not both.')
  }
  if (!hasIndex && selector === undefined) {
    throw new ActionError('bad-args', 'Provide index or selector.')
  }
  if (hasIndex) return elementOrThrow(ids, numberArg(args, 'index'))
  let found: Element | null
  try {
    found = document.querySelector(selector as string)
  } catch {
    throw new ActionError('bad-args', `selector is not a valid CSS selector: ${String(selector)}`)
  }
  if (found === null) {
    throw new ActionError('action-failed', `No element matched selector: ${String(selector)}`)
  }
  return found
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
    case 'browser_clipboard':
      if (args.action !== 'paste') {
        throw new ActionError('bad-args', 'Only clipboard paste runs in the page; clipboard writes are dispatched by the browser background.')
      }
      return clipboardPasteAction(args, ctx)
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
    case 'browser_wait':
      return waitAction(args, ctx)
    default:
      throw new ActionError('bad-args', `Unknown action: ${action}`)
  }
}

function snapshotAction(args: Record<string, unknown>, ctx: ActionContext): ActionResult {
  if (args.query !== undefined) {
    try {
      const query = parseLocatorQuery(args.query)
      const found = findElements(query)
      return { text: renderFound(found, query, (el) => ctx.ids.indexOf(el)) }
    } catch (error: unknown) {
      if (error instanceof LocatorError) throw new ActionError('bad-args', error.message)
      throw error instanceof Error ? error : new ActionError('action-failed', String(error))
    }
  }
  const delta = args.delta === true
  const region = typeof args.region === 'string' && args.region !== '' ? args.region : undefined
  // A region that matches nothing must not look like an empty page.
  let regionMiss = false
  if (region !== undefined) {
    try {
      regionMiss = document.querySelector(region) === null
    } catch {
      throw new ActionError('bad-args', `region is not a valid CSS selector: ${region}`)
    }
  }
  // 基线在每次快照后都更新：delta 调用才能相对上一次（无论是否 delta）比较。
  const view = buildSnapshot(ctx.ids, { delta, region, budget: ctx.budget }, lastSnapshot)
  lastSnapshot = view
  const rendered = renderSnapshot(view, delta)
  return {
    text: regionMiss
      ? `No element matched region selector "${region}"; showing the whole page.\n${rendered}`
      : rendered,
  }
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

/** A short, model-facing description of the addressed element. */
function targetLabel(args: Record<string, unknown>, el: Element): string {
  // Selector- and focus-targeted calls have no index at all; reading through
  // `numberArg` here used to throw before the action even ran.
  const index = args.index
  if (typeof index === 'number' && Number.isInteger(index) && index >= 0) return `[${index}]`
  const selector = typeof args.selector === 'string' ? args.selector : ''
  return `${el.tagName.toLowerCase()} (${selector})`
}

/**
 * Dispatch the full pointer/mouse sequence at an element's center.
 *
 * Menus and custom controls bind `pointerdown`/`mousedown` rather than only
 * `click`; a bare `el.click()` leaves them inert. Clicking with a synthetic
 * `MouseEvent` still runs the browser's activation behavior for buttons,
 * checkboxes and labels.
 *
 * @param el - target element.
 * @param clicks - 1, 2, or 3 clicks; 2 also emits `dblclick`.
 */
function dispatchPointerClick(el: Element, clicks: number, button: number, modifiers: readonly string[]): void {
  const rect = el.getBoundingClientRect()
  const clientX = rect.left + rect.width / 2
  const clientY = rect.top + rect.height / 2
  const base = {
    bubbles: true, cancelable: true, composed: true, clientX, clientY, button,
    altKey: modifiers.includes('Alt'), ctrlKey: modifiers.includes('Control'),
    metaKey: modifiers.includes('Meta'), shiftKey: modifiers.includes('Shift'),
  }
  const buttons = button === 0 ? 1 : button === 1 ? 4 : 2
  for (let count = 1; count <= clicks; count += 1) {
    if (typeof PointerEvent === 'function') {
      el.dispatchEvent(new PointerEvent('pointerdown', {
        ...base, pointerId: 1, pointerType: 'mouse', isPrimary: true, buttons,
      }))
    }
    el.dispatchEvent(new MouseEvent('mousedown', { ...base, buttons, detail: count }))
    if (typeof PointerEvent === 'function') {
      el.dispatchEvent(new PointerEvent('pointerup', {
        ...base, pointerId: 1, pointerType: 'mouse', isPrimary: true, buttons: 0,
      }))
    }
    el.dispatchEvent(new MouseEvent('mouseup', { ...base, buttons: 0, detail: count }))
    if (button === 2) el.dispatchEvent(new MouseEvent('contextmenu', { ...base, buttons: 0, detail: count }))
    el.dispatchEvent(new MouseEvent(button === 0 ? 'click' : 'auxclick', { ...base, buttons: 0, detail: count }))
  }
  if (clicks >= 2 && button === 0) el.dispatchEvent(new MouseEvent('dblclick', { ...base, buttons: 0, detail: 2 }))
}

async function clickAction(args: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const action = args.action
  if (action !== undefined && action !== 'click' && action !== 'dblclick') {
    throw new ActionError(
      'bad-args',
      'action must be click or dblclick.',
    )
  }
  const el = resolveActionTarget(args, ctx.ids)
  const label = targetLabel(args, el)
  if (el.matches(':disabled') || el.closest('button:disabled') !== null) {
    throw new ActionError('action-failed', `Element ${label} is disabled.`)
  }
  const buttonName = args.button ?? 'left'
  if (buttonName !== 'left' && buttonName !== 'middle' && buttonName !== 'right') {
    throw new ActionError('bad-args', 'button must be left, middle, or right.')
  }
  const button = buttonName === 'left' ? 0 : buttonName === 'middle' ? 1 : 2
  const modifiers = args.modifiers ?? []
  if (!Array.isArray(modifiers) || modifiers.some(value => typeof value !== 'string' || !PRESS_MODIFIERS.has(value))) {
    throw new ActionError('bad-args', 'modifiers must be a list of Alt, Control, Meta, or Shift.')
  }
  const clicks = action === 'dblclick' ? 2 : args.clicks === undefined ? 1 : numberArg(args, 'clicks')
  if (clicks < 1 || clicks > 3) {
    throw new ActionError('bad-args', 'clicks must be 1, 2, or 3.')
  }
  el.scrollIntoView({ block: 'center', behavior: 'instant' })
  if (el instanceof HTMLAnchorElement && clicks === 1 && button === 0 && modifiers.length === 0) {
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
          text: `Clicked link ${label} using native browser activation. Call browser_snapshot to read the resulting state.`,
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
        return withPageDelta(`Clicked link ${label}.`, ctx)
      }
      const sameDocument = href.origin === location.origin
        && href.pathname === location.pathname
        && href.search === location.search
      if (sameDocument) {
        if (href.hash !== location.hash) location.hash = href.hash
        await waitForPageSettled(ACTION_SETTLE)
        return withPageDelta(`Clicked link ${label}.`, ctx)
      }
      // A cross-document navigation can unload this content script before an
      // awaited response. Answer first and navigate in the next task.
      setTimeout(() => { location.href = href.href }, 0)
      return {
        text: `Clicked link ${label}. Call browser_snapshot again after navigation settles.`,
        navigationPending: true,
      }
    }
    setTimeout(() => { el.click() }, 0)
    return { text: `Clicked link ${label}. The link may open outside the controlled frame.` }
  }
  dispatchPointerClick(el, clicks, button, modifiers)
  // An untrusted click runs no focus default action; text fields and editors
  // still expect a click to place the caret, which the next type/press relies on.
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
    || el instanceof HTMLSelectElement || (el instanceof HTMLElement && el.isContentEditable)) {
    el.focus()
  }
  await waitForPageSettled(ACTION_SETTLE)
  return withPageDelta(`Clicked ${label}.`, ctx)
}

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
function typeIntoContentEditable(el: HTMLElement, text: string, replace: boolean, insert: boolean): void {
  // `isEditable` already refused a disabled island, so a null host here means
  // the element is editable without the attribute; address it directly.
  const host = editingHost(el) ?? el
  host.focus()
  const selection = host.ownerDocument.getSelection()
  const selectionInside = selection !== null && selection.rangeCount > 0
    && host.contains(selection.anchorNode) && host.contains(selection.focusNode)
  if (selection !== null && (replace || !insert || !selectionInside)) {
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
  const text = typeof args.text === 'string' ? args.text : ''
  if (text === '') throw new ActionError('bad-args', 'text must not be empty.')
  const mode = args.mode
  if (mode !== undefined && mode !== 'auto' && mode !== 'insert') {
    throw new ActionError(
      'input-unavailable',
      `type mode "${String(mode)}" needs the trusted input channel, which the browser routes through its debugger.`,
    )
  }
  const replace = args.replace === true
  const focusedOnly = args.index === undefined && args.selector === undefined
  const el = focusedOnly ? document.activeElement : resolveActionTarget(args, ctx.ids)
  if (!(el instanceof Element)) {
    throw new ActionError('action-failed', 'No element has focus; click the target first or pass index or selector.')
  }
  const label = focusedOnly ? 'the focused element' : targetLabel(args, el)
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (mode === 'insert' && !replace) {
      const start = el.selectionStart
      const end = el.selectionEnd
      if (start === null || end === null) throw new ActionError('action-failed', 'This input does not expose a text selection.')
      setNativeValue(el, `${el.value.slice(0, start)}${text}${el.value.slice(end)}`)
      el.setSelectionRange(start + text.length, start + text.length)
    } else {
      setNativeValue(el, replace ? text : `${el.value}${text}`)
    }
  } else if (isEditable(el)) {
    typeIntoContentEditable(el, text, replace, mode === 'insert')
  } else {
    throw new ActionError('action-failed', `Element ${label} is not editable (${el.tagName.toLowerCase()}).`)
  }
  await waitForPageSettled(TYPE_SETTLE)
  return withPageDelta(`Entered ${text.length} characters into ${label}.`, ctx)
}

/** Wire modifier names accepted by `browser_press`. */
const PRESS_MODIFIERS = new Set(['Alt', 'Control', 'Meta', 'Shift'])

async function pressAction(args: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const key = typeof args.key === 'string' && args.key !== '' ? args.key : ''
  if (key === '') throw new ActionError('bad-args', 'key must not be empty.')
  const action = args.action === 'down' || args.action === 'up' ? args.action : 'press'
  if (args.action !== undefined && args.action !== 'press' && action !== args.action) {
    throw new ActionError('bad-args', `action must be "press", "down", or "up"; received "${String(args.action)}".`)
  }
  const repeat = args.repeat === undefined ? 1 : args.repeat
  if (typeof repeat !== 'number' || !Number.isInteger(repeat) || repeat < 1 || repeat > 100) {
    throw new ActionError('bad-args', 'repeat must be an integer between 1 and 100.')
  }
  const modifiers: string[] = []
  if (Array.isArray(args.modifiers)) {
    for (const value of args.modifiers) {
      if (typeof value !== 'string' || !PRESS_MODIFIERS.has(value)) {
        throw new ActionError('bad-args', 'modifiers must be a list of Alt, Control, Meta, or Shift.')
      }
      modifiers.push(value)
    }
  }
  if (args.index !== undefined || args.selector !== undefined) {
    const el = resolveActionTarget(args, ctx.ids)
    if (el instanceof HTMLElement) el.focus()
  }
  const target = document.activeElement instanceof HTMLElement ? document.activeElement : document.body
  const init: KeyboardEventInit = {
    key,
    bubbles: true,
    cancelable: true,
    altKey: modifiers.includes('Alt'),
    ctrlKey: modifiers.includes('Control'),
    metaKey: modifiers.includes('Meta'),
    shiftKey: modifiers.includes('Shift'),
  }
  for (let count = 0; count < repeat; count += 1) {
    if (action !== 'up') target.dispatchEvent(new KeyboardEvent('keydown', init))
    if (action !== 'down') target.dispatchEvent(new KeyboardEvent('keyup', init))
  }
  if (key === 'Enter' && action !== 'up' && target instanceof HTMLInputElement && target.form !== null) {
    target.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  }
  const chord = modifiers.length === 0 ? key : `${modifiers.join('+')}+${key}`
  await waitForPageSettled(ACTION_SETTLE)
  return withPageDelta(`Sent key "${chord}"${repeat > 1 ? ` ×${repeat}` : ''}.`, ctx)
}

/**
 * Dispatch a paste event carrying text and optional sanitized HTML.
 *
 * The page's own paste handler consumes the event; no system clipboard is
 * touched, so this works in every supported browser and never overwrites what
 * the user has copied.
 */
async function clipboardPasteAction(args: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const text = typeof args.text === 'string' ? args.text : ''
  if (text === '') throw new ActionError('bad-args', 'text must not be empty when pasting.')
  const html = typeof args.html === 'string' && args.html !== '' ? args.html : undefined
  const focusedOnly = args.index === undefined && args.selector === undefined
  const el = focusedOnly ? document.activeElement : resolveActionTarget(args, ctx.ids)
  if (!(el instanceof Element)) {
    throw new ActionError('action-failed', 'No element has focus; click the paste target first or pass index or selector.')
  }
  if (el instanceof HTMLElement) el.focus()
  const accepted = dispatchPaste(el, { text, ...(html === undefined ? {} : { html }) })
  const label = focusedOnly ? 'the focused element' : targetLabel(args, el)
  // Plain form controls have no paste handler and an untrusted paste event has
  // no default insertion; fall back to a caret insertion so the intent lands.
  let fallback = false
  if (!accepted && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    setNativeValue(el, `${el.value.slice(0, start)}${text}${el.value.slice(end)}`)
    fallback = true
  }
  await waitForPageSettled(TYPE_SETTLE)
  const detail = html === undefined ? 'text' : 'text+html'
  const note = accepted
    ? ''
    : fallback
      ? '; the page did not consume the paste event, so the text was inserted at the caret'
      : '; the page did not consume the paste event'
  return withPageDelta(`Pasted ${text.length} characters (${detail}) into ${label}${note}.`, ctx)
}

async function scrollAction(args: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const direction = typeof args.direction === 'string' ? args.direction : ''
  const amount = typeof args.amount === 'number' ? args.amount : Math.floor(window.innerHeight * 0.8)
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
    case 'down':
      window.scrollBy({ top: amount, behavior: 'instant' })
      break
    default:
      throw new ActionError('bad-args', `direction must be up, down, top, or bottom; received "${direction}".`)
  }
  await waitForPageSettled(SCROLL_SETTLE)
  return withPageDelta(`Scrolled ${direction}.`, ctx)
}

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
  let source: Element | null = null
  if (selector !== undefined) {
    try {
      source = document.querySelector(selector)
    } catch {
      throw new ActionError('bad-args', `selector is not a valid CSS selector: ${selector}`)
    }
  }
  const text = source !== null ? pageText(source) : selector !== undefined ? `No element matched selector: ${selector}` : pageText()
  const truncated = truncate(text, 8_000)
  return { text: truncated.text + (truncated.truncated > 0 ? `\n(Truncated ${truncated.truncated} characters.)` : '') }
}

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
