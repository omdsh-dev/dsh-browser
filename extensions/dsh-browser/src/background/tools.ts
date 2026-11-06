/**
 * Tool dispatch: executes `tool.call` frames in an explicitly selected tab via
 * the content script and answers with the text-only result.
 *
 * The background service owns tab-affinity policy. Direct callers may omit a
 * target for backward-compatible active-tab dispatch in isolated tests.
 *
 * @module
 */

import { DEFAULT_SNAPSHOT_MAX_CHARS } from '@yuxianglin/dsh-bridge-browser/src/protocol.ts'
import type { ToolError, ToolErrorCode } from '@yuxianglin/dsh-bridge-browser/src/protocol.ts'
import {
  allocateFrameBudgets,
  frameDocumentKey,
  frameOrigin,
  listTabFrames,
  type TabFrame,
} from './frames.ts'
import { wrapUntrustedContent } from '../security/untrusted.ts'
import { approvalPromptForCall, originFromUrl } from './authorization.ts'
import { waitForNextDocumentReady } from './navigation.ts'
import type { ApprovalAuthorization, ApprovalPrompt } from '../security/approval.ts'
import { getUiLocale } from '../i18n.ts'
import { DevToolsError, type CdpClient } from './debugger-session.ts'
import { InputStateStore } from './input-state.ts'
import {
  InputError,
  dispatchKey,
  insertTextAtCaret,
  sendPasteShortcut,
  typeAsKeystrokes,
  setInputFiles,
  withFocusEmulation,
} from './input-actions.ts'
import { isModifierName, type ModifierName } from './keys.ts'
import type { InputSetupRequest, InputSetupResult } from '../shared/input-setup.ts'
import { writeClipboard } from './clipboard-write.ts'
import type { ClipboardWriteOutcome } from '../shared/clipboard.ts'
import { resolveDebuggerFrame } from './debugger-frame.ts'

/** A tool call from the bridge. */
export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  /** Server-authored wall-clock deadline; absent only in direct unit tests. */
  expiresAt?: number
  /** Owning Agent session, when supplied by a current bridge. */
  sessionId?: string
}

/** The wire answer for one tool call. */
export interface ToolAnswer {
  ok: boolean
  result?: unknown
  error?: ToolError
}

/** Snapshot limits negotiated with the bridge and forwarded after lazy injection. */
export interface ContentBudget {
  maxItems: number
  maxChars: number
}

const CONTENT_SCRIPT_FILE = 'content.js'
const ACTION_DELTA_TOOLS = new Set([
  'browser_click',
  'browser_type',
  'browser_press',
  'browser_scroll',
  'browser_clipboard',
  'browser_wait',
])
const ACTION_DELTA_GUIDANCE = 'The page settled and its current changes are included below. Continue from this state; take another snapshot only when broader page context is needed.'
const NAVIGATION_CANDIDATE_TOOLS = new Set([
  'browser_click',
  'browser_navigate',
  'browser_back',
  'browser_forward',
  'browser_reload',
  'browser_open_tab',
])
const TAB_NATIVE_TOOLS = new Set([
  'browser_snapshot',
  'browser_navigate',
  'browser_back',
  'browser_forward',
  'browser_reload',
])
const STATE_CHANGING_PAGE_TOOLS = new Set([
  'browser_click',
  'browser_type',
  'browser_press',
  'browser_scroll',
  'browser_clipboard',
  'browser_upload',
  'browser_navigate',
  'browser_back',
  'browser_forward',
  'browser_reload',
])
/** Tools that operate on the browser tab collection rather than one page document. */
export const TAB_MANAGEMENT_TOOL_NAMES = new Set([
  'browser_list_tabs',
  'browser_follow_tab',
  'browser_close_tab',
])
const NAVIGATION_SNAPSHOT_GUIDANCE = 'Navigation completed and the current page snapshot is included below. Use it directly instead of taking an immediate duplicate snapshot.'
const pendingInjections = new Map<number, Promise<void>>()
const snapshotDocumentsByTab = new Map<number, Map<number, string>>()

/** Forget delta/element state whenever the user explicitly follows a new tab. */
export function resetTabSnapshot(tabId: number): void {
  snapshotDocumentsByTab.delete(tabId)
}

/** Forget held modifiers for a tab that moved on. */
export function resetInputState(tabId: number): void {
  inputStates.reset(tabId)
}

/** Whether a successful tool may have changed the controlled tab's page URL. */
export function isNavigationCandidateTool(name: string): boolean {
  return NAVIGATION_CANDIDATE_TOOLS.has(name)
}

/** Whether a tool can run without first resolving the current controlled tab. */
export function isTabManagementTool(name: string): boolean {
  return TAB_MANAGEMENT_TOOL_NAMES.has(name)
}

/** Trusted input channel owned by the background entry point (debugger broker). */
export interface InputRuntime {
  /** Whether the platform can dispatch real browser input. */
  supported: boolean
  /** Run one operation against the tab's shared debugger attachment. */
  run<T>(tabId: number, operation: (client: CdpClient) => Promise<T>): Promise<T>
}

/** Tab-affinity services owned by the background entry point. */
export interface TabManagementContext {
  /** Skip all browser approval prompts after the user enables unrestricted access. */
  unrestrictedAccess: boolean
  /** Controlled tab for the calling session, when one still exists. */
  controlledTabId?: number
  /** Rebind subsequent tools to one existing tab without activating it. */
  followTab?: (tab: chrome.tabs.Tab) => void | Promise<void>
  /** Trusted input, when the platform and the user's browser allow it. */
  input?: InputRuntime
  /** Mark the point after which a state-changing operation cannot be withdrawn. */
  commitAction?: () => void
  /** Restore withdrawability when a content-script action was not delivered. */
  rollbackActionCommit?: () => void
}

function isToolAnswer(value: unknown): value is ToolAnswer {
  return typeof value === 'object'
    && value !== null
    && typeof (value as { ok?: unknown }).ok === 'boolean'
}

function isInjectablePage(url: string | undefined): boolean {
  return url !== undefined && /^https?:\/\//i.test(url)
}

/** Inject the packaged content script once per tab, coalescing concurrent recovery attempts. */
async function injectContentScript(tabId: number): Promise<void> {
  let pending = pendingInjections.get(tabId)
  if (pending === undefined) {
    pending = chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: [CONTENT_SCRIPT_FILE],
    }).then(() => undefined)
    pendingInjections.set(tabId, pending)
  }
  try {
    await pending
  } finally {
    if (pendingInjections.get(tabId) === pending) pendingInjections.delete(tabId)
  }
}

async function sendAction(
  tabId: number,
  call: ToolCall,
  frame: TabFrame,
  budget?: ContentBudget,
  includePageDelta: boolean = false,
): Promise<unknown> {
  return chrome.tabs.sendMessage(tabId, {
    type: 'DSH_ACTION',
    action: call.name,
    args: withoutFrame(call.args),
    ...budget === undefined ? {} : { budget },
    ...includePageDelta ? { includePageDelta: true } : {},
  }, frame.documentId === undefined ? { frameId: frame.frameId } : { documentId: frame.documentId })
}

function contentScriptReceiverMissing(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Receiving end does not exist')
}

function unavailable(message: string): ToolAnswer {
  return { ok: false, error: { code: 'content-unavailable', message } }
}

/** Map a debugger failure to the model-facing vocabulary instead of masking it. */
function devToolsFailure(error: unknown): ToolAnswer | undefined {
  if (!(error instanceof DevToolsError)) return undefined
  return {
    ok: false,
    error: {
      code: error.code === 'devtools-conflict' ? 'input-unavailable' : 'action-failed',
      message: error.message,
    },
  }
}

function tabMetadataSnapshot(
  tabId: number,
  windowId: number | undefined,
  title: string | undefined,
  url: string | undefined,
  maxChars: number,
): ToolAnswer {
  const status = 'The current tab is available only through browser-level controls because its page DOM is protected or inaccessible. DOM snapshot, click, type, press, scroll, wait, and text extraction are unavailable here. Navigate, back, forward, and reload remain available.'
  const separator = '\n\n'
  const remaining = maxChars - status.length - separator.length
  if (remaining <= 0) return { ok: true, result: { text: status.slice(0, maxChars) } }
  return {
    ok: true,
    result: {
      text: `${status}${separator}${wrapUntrustedContent([
        `Tab ID: ${tabId}`,
        `Window ID: ${windowId ?? '(unknown)'}`,
        `Title: ${title ?? '(unknown)'}`,
        `URL: ${url ?? '(unknown)'}`,
      ].join('\n'), remaining)}`,
    },
  }
}

async function dispatchTabNativeTool(
  tabId: number,
  tabUrl: string | undefined,
  tabTitle: string | undefined,
  windowId: number | undefined,
  call: ToolCall,
  budget: ContentBudget,
  signal?: AbortSignal,
  targetStillAllowed?: () => boolean,
  commitAction?: () => void,
): Promise<ToolAnswer | undefined> {
  if (call.name === 'browser_snapshot') return tabMetadataSnapshot(tabId, windowId, tabTitle, tabUrl, budget.maxChars)
  if (!TAB_NATIVE_TOOLS.has(call.name)) return undefined
  if (isCancelled(call, signal)) return cancelled()
  if (targetStillAllowed?.() === false) return targetChanged()

  let operation: Promise<unknown>
  let text: string
  try {
    switch (call.name) {
      case 'browser_navigate': {
        const requested = parseHttpUrl(call.args.url)
        if (requested === undefined) {
          return { ok: false, error: { code: 'action-failed', message: 'url must be a complete http or https URL.' } }
        }
        commitAction?.()
        operation = chrome.tabs.update(tabId, { url: requested.href })
        text = `Navigating to ${requested.href}. Call browser_snapshot again after the page loads.`
        break
      }
      case 'browser_back':
        commitAction?.()
        operation = chrome.tabs.goBack(tabId)
        text = 'Navigating through browser history. Call browser_snapshot again after the page loads.'
        break
      case 'browser_forward':
        commitAction?.()
        operation = chrome.tabs.goForward(tabId)
        text = 'Navigating through browser history. Call browser_snapshot again after the page loads.'
        break
      case 'browser_reload':
        commitAction?.()
        operation = chrome.tabs.reload(tabId)
        text = 'The page is reloading. Call browser_snapshot again after it loads.'
        break
      default:
        return undefined
    }
    resetTabSnapshot(tabId)
    await operation
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error)
    return unavailable(`The browser-level operation failed: ${detail}`)
  }
  if (isCancelled(call, signal)) return cancelled()
  if (targetStillAllowed?.() === false) return targetChanged()
  return { ok: true, result: { text, navigationPending: true } }
}

function cancelled(): ToolAnswer {
  return { ok: false, error: { code: 'bridge-closed', message: 'The browser tool call was cancelled.' } }
}

/** Preserve the factual approval outcome for the model without prescribing a response. */
function approvalFailure(approval: ApprovalPrompt, authorization: Exclude<ApprovalAuthorization, 'approved'>): ToolAnswer {
  switch (authorization) {
    case 'denied':
      return {
        ok: false,
        error: { code: 'action-failed', message: `The user denied the browser approval request for "${approval.action}".` },
      }
    case 'unavailable':
      return {
        ok: false,
        error: {
          code: 'action-failed',
          message: `No browser side panel was available to receive or complete the approval request for "${approval.action}".`,
        },
      }
    case 'timed-out':
      return {
        ok: false,
        error: { code: 'timeout', message: `The browser approval request for "${approval.action}" timed out before the user responded.` },
      }
    case 'cancelled':
      return {
        ok: false,
        error: { code: 'bridge-closed', message: `The browser approval request for "${approval.action}" was cancelled.` },
      }
  }
}

function targetChanged(): ToolAnswer {
  return unavailable('The controlled tab changed during the operation. Confirm the page in the side panel before retrying.')
}

function isCancelled(call: ToolCall, signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true
    || (call.expiresAt !== undefined && Date.now() >= call.expiresAt)
}

function withoutFrame(args: Record<string, unknown>): Record<string, unknown> {
  const { frame: _frame, ...rest } = args
  return rest
}

function requestedFrame(args: Record<string, unknown>): number {
  const value = args.frame
  if (value === undefined) return 0
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return -1
  return value
}

function answerText(answer: ToolAnswer): string | undefined {
  if (!answer.ok || typeof answer.result !== 'object' || answer.result === null) return undefined
  const text = (answer.result as { text?: unknown }).text
  return typeof text === 'string' ? text : undefined
}

function answerPageContent(answer: ToolAnswer): string | undefined {
  if (!answer.ok || typeof answer.result !== 'object' || answer.result === null) return undefined
  const pageContent = (answer.result as { pageContent?: unknown }).pageContent
  return typeof pageContent === 'string' ? pageContent : undefined
}

function answerNavigationPending(answer: ToolAnswer): boolean {
  return answer.ok
    && typeof answer.result === 'object'
    && answer.result !== null
    && (answer.result as { navigationPending?: unknown }).navigationPending === true
}

/** Keep extension-authored action status outside the nonce-bound page-data boundary. */
function wrapActionDelta(status: string, pageContent: string, frame: TabFrame, maxChars: number): string {
  const prefix = `${status}\n${ACTION_DELTA_GUIDANCE}`
  const separator = '\n\n'
  const boundaryBudget = maxChars - prefix.length - separator.length
  if (boundaryBudget < 500) return prefix.slice(0, maxChars)
  const framedContent = frame.frameId === 0 ? pageContent : `${frameHeader(frame)}\n${pageContent}`
  return `${prefix}${separator}${wrapUntrustedContent(framedContent, boundaryBudget)}`
}

/** Per-tab held modifier state. */
const inputStates = new InputStateStore()

/** Failure of an internal content-script input setup request. */
class InputSetupError extends Error {
  constructor(
    readonly code: ToolErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'InputSetupError'
  }
}

/** Content-script response envelope for one setup request. */
interface InputSetupEnvelope {
  ok?: boolean
  result?: InputSetupResult
  error?: { code?: string; message?: string }
}

/** Ask one frame to measure, focus, mark, or report its frame chain. */
async function sendInputSetup(tabId: number, frame: TabFrame, request: InputSetupRequest): Promise<InputSetupResult> {
  const response = await chrome.tabs.sendMessage(
    tabId,
    { type: 'DSH_INPUT_SETUP', request },
    frame.documentId === undefined ? { frameId: frame.frameId } : { documentId: frame.documentId },
  ) as InputSetupEnvelope | undefined
  if (typeof response !== 'object' || response === null || response.ok !== true || response.result === undefined) {
    const code = response?.error?.code
    const stable: ToolErrorCode = code === 'bad-args' || code === 'input-unavailable' || code === 'action-failed'
      ? code
      : 'action-failed'
    throw new InputSetupError(stable, response?.error?.message ?? 'The page did not answer the input setup request.')
  }
  return response.result
}

/** Validate the model-supplied modifier list. */
function requestedModifiers(args: Record<string, unknown>): ModifierName[] {
  if (args.modifiers === undefined) return []
  if (!Array.isArray(args.modifiers)) {
    throw new InputError('bad-args', 'modifiers must be a list of Alt, Control, Meta, or Shift.')
  }
  const modifiers: ModifierName[] = []
  for (const value of args.modifiers) {
    if (typeof value !== 'string' || !isModifierName(value)) {
      throw new InputError('bad-args', 'modifiers must be a list of Alt, Control, Meta, or Shift.')
    }
    modifiers.push(value)
  }
  return modifiers
}

/** Report what the clipboard actually holds, including derived plain text. */
function describeClipboardWrite(outcome: ClipboardWriteOutcome): string {
  if (!outcome.rich) return `Wrote ${outcome.plainText.length} character(s) to the system clipboard.`
  if (outcome.plainDerived) {
    return `Wrote rich HTML to the system clipboard; the plain-text flavor is derived from the HTML (${outcome.plainText.length} characters).`
  }
  return `Wrote rich HTML and ${outcome.plainText.length} plain-text character(s) to the system clipboard.`
}

/** Describe the target in a status line without echoing page text. */
function describeTarget(args: Record<string, unknown>): string {
  if (args.index !== undefined) return `element [${String(args.index)}]`
  if (typeof args.selector === 'string') return `element (${args.selector})`
  return 'the focused element'
}

/**
 * After trusted input, wait for the frame to settle and attach an authorized page delta.
 * The `browser_wait` action already owns both behaviors for content-script
 * actions; reusing it keeps the result shape identical for real input.
 */
async function settleAfterInput(
  tabId: number,
  frame: TabFrame,
  status: string,
  budget: ContentBudget,
  includePageDelta: boolean,
): Promise<ToolAnswer> {
  try {
    const response = await chrome.tabs.sendMessage(
      tabId,
      { type: 'DSH_ACTION', action: 'browser_wait', args: {}, budget, includePageDelta },
      frame.documentId === undefined ? { frameId: frame.frameId } : { documentId: frame.documentId },
    )
    if (isToolAnswer(response)) {
      const pageContent = answerPageContent(response)
      if (includePageDelta && pageContent !== undefined) {
        return { ok: true, result: { text: wrapActionDelta(`${status} (trusted)`, pageContent, frame, budget.maxChars) } }
      }
    }
  } catch {
    // The page may be navigating; the trusted action itself already succeeded.
  }
  return { ok: true, result: { text: `${status} (trusted)` } }
}

/**
 * Classify how one call reaches the page.
 *
 * `content` stays in the frame, `trusted` prefers real input but degrades to
 * the frame for calls that have a synthetic equivalent, and `required` has no
 * synthetic equivalent at all.
 */
function inputRoute(call: ToolCall): 'content' | 'trusted' | 'required' | 'host' {
  switch (call.name) {
    case 'browser_press':
      if (call.args.trusted === true) return 'required'
      if (call.args.trusted === false) return 'content'
      if (Array.isArray(call.args.modifiers) || call.args.action !== undefined) return 'trusted'
      return 'content'
    case 'browser_type':
      if (call.args.trusted === true) return 'required'
      if (call.args.trusted === false) return 'content'
      if (call.args.mode === 'insert' || call.args.mode === 'keystrokes') return 'trusted'
      return 'content'
    case 'browser_clipboard':
      if (call.args.action === 'write') return 'host'
      return call.args.method === 'system' ? 'required' : 'content'
    case 'browser_upload':
      return 'required'
    default:
      return 'content'
  }
}

/** Session text for a trusted-input failure. */
function trustedFailure(error: unknown): ToolAnswer | undefined {
  if (error instanceof InputError) {
    return { ok: false, error: { code: error.code, message: error.message } }
  }
  if (error instanceof InputSetupError) {
    return { ok: false, error: { code: error.code, message: error.message } }
  }
  return undefined
}

/** Map a page-side selector failure to a model-facing answer. */
function inputUnavailable(message: string): ToolAnswer {
  return { ok: false, error: { code: 'input-unavailable', message } }
}

/** Whether a runtime is present and supported. */
function usableInput(runtime: InputRuntime | undefined): runtime is InputRuntime {
  return runtime !== undefined && runtime.supported
}

/** A token that only marks one file input for one upload call. */
function uploadToken(): string {
  return crypto.randomUUID()
}

async function snapshotAllFrames(
  tabId: number,
  allFrames: TabFrame[],
  call: ToolCall,
  budget: ContentBudget,
): Promise<ToolAnswer> {
  // `frame` narrows the snapshot to one iframe: a canvas or editor frame is
  // usually bigger than the share it gets from a whole-page budget.
  const requested = call.args.frame
  let frames = allFrames
  let budgets: Map<number, ContentBudget>
  if (requested !== undefined) {
    if (typeof requested !== 'number' || !Number.isInteger(requested) || requested < 0) {
      return { ok: false, error: { code: 'bad-args', message: 'frame must be a non-negative integer.' } }
    }
    const single = allFrames.find((frame) => frame.frameId === requested)
    if (single === undefined) {
      return unavailable(`Frame ${requested} does not exist or has navigated. Call browser_snapshot again.`)
    }
    frames = [single]
    budgets = new Map([[single.frameId, { maxItems: budget.maxItems, maxChars: budget.maxChars }]])
  } else {
    budgets = allocateFrameBudgets(allFrames, budget)
  }
  const scoped = requested !== undefined
  const previous = snapshotDocumentsByTab.get(tabId) ?? new Map<number, string>()
  const deltaRequested = call.args.delta === true

  const settled = await Promise.allSettled(frames.map(async (frame) => {
    const sameDocument = previous.get(frame.frameId) === frameDocumentKey(frame)
    const frameCall: ToolCall = {
      ...call,
      args: deltaRequested && sameDocument ? call.args : { ...call.args, delta: false },
    }
    const response = await sendAction(tabId, frameCall, frame, budgets.get(frame.frameId))
    return { frame, response }
  }))

  const sections: string[] = []
  const capturedDocuments = new Map<number, string>()
  for (let index = 0; index < settled.length; index += 1) {
    const outcome = settled[index]!
    const frame = frames[index]!
    if (outcome.status === 'rejected') {
      if (frame.frameId === 0) throw outcome.reason
      sections.push(frameHeader(frame), '(This iframe was inaccessible or destroyed while loading.)')
      continue
    }
    const answer = outcome.value.response
    if (!isToolAnswer(answer)) {
      if (frame.frameId === 0) return unavailable('The page content script returned an invalid response.')
      sections.push(frameHeader(frame), '(This iframe returned an invalid response.)')
      continue
    }
    const text = answerText(answer)
    if (text === undefined) {
      if (frame.frameId === 0) return answer
      sections.push(frameHeader(frame), `(This iframe could not be read: ${answer.error?.message ?? 'unknown error'})`)
      continue
    }
    capturedDocuments.set(frame.frameId, frameDocumentKey(frame))
    if (frame.frameId === 0 && !scoped) sections.push(text)
    else sections.push(frameHeader(frame), text)
  }

  if (deltaRequested && !scoped) {
    const liveIds = new Set(frames.map((frame) => frame.frameId))
    const removed = [...previous.keys()].filter((frameId) => frameId !== 0 && !liveIds.has(frameId))
    if (removed.length > 0) sections.push(`\nRemoved iframes: ${removed.join(', ')}`)
  }

  // A scoped snapshot must not erase the other frames' delta baselines.
  const nextDocuments = scoped ? new Map(previous) : new Map<number, string>()
  for (const [frameId, key] of capturedDocuments) nextDocuments.set(frameId, key)
  snapshotDocumentsByTab.set(tabId, nextDocuments)
  return { ok: true, result: { text: wrapUntrustedContent(sections.join('\n'), budget.maxChars) } }
}

function frameHeader(frame: TabFrame): string {
  return `\n--- iframe frame=${frame.frameId} parent=${frame.parentFrameId} origin=${frameOrigin(frame)} ---`
}

function stripDuplicateSnapshotPrompt(status: string): string {
  return status.replace(/ Call browser_snapshot again after (?:navigation settles|the page loads|it loads)\.$/, '')
}

async function snapshotAfterNavigation(
  tabId: number,
  call: ToolCall,
  status: string,
  budget: ContentBudget,
  targetStillAllowed?: () => boolean,
): Promise<ToolAnswer | undefined> {
  const prefix = `${stripDuplicateSnapshotPrompt(status)}\n${NAVIGATION_SNAPSHOT_GUIDANCE}`
  const snapshotMaxChars = budget.maxChars - prefix.length - 2
  if (snapshotMaxChars < 500) return undefined
  const frames = await listTabFrames(tabId, undefined)
  if (targetStillAllowed?.() === false) return targetChanged()
  const answer = await snapshotAllFrames(
    tabId,
    frames,
    { ...call, name: 'browser_snapshot', args: {} },
    { ...budget, maxChars: snapshotMaxChars },
  )
  const snapshot = answerText(answer)
  if (snapshot === undefined) return undefined
  return { ok: true, result: { text: `${prefix}\n\n${snapshot}` } }
}

/** Require a usable trusted-input runtime, or fail with the stable code. */
function requireInput(runtime: InputRuntime | undefined): InputRuntime {
  if (!usableInput(runtime)) {
    throw new InputError(
      'input-unavailable',
      'This browser has no trusted input channel (it needs the Chrome debugger). '
      + 'Target elements by index or selector instead, or install the Chrome build.',
    )
  }
  return runtime
}

/** Focus (and optionally select) the addressed target before trusted input. */
async function prepareInputTarget(
  tabId: number,
  frame: TabFrame,
  args: Record<string, unknown>,
  select: 'none' | 'contents' | 'end',
): Promise<void> {
  if (args.index === undefined && typeof args.selector !== 'string') return
  await sendInputSetup(tabId, frame, {
    op: 'prepare',
    ...(args.index === undefined ? {} : { index: args.index as number }),
    ...(typeof args.selector === 'string' ? { selector: args.selector } : {}),
    select,
  })
}

/** Validated `paths` argument for `browser_upload`. */
function requestedPaths(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new InputError('bad-args', 'paths must be a non-empty list of local file paths.')
  }
  const paths: string[] = []
  for (const entry of value) {
    if (typeof entry !== 'string' || entry.trim() === '') {
      throw new InputError('bad-args', 'paths must be a non-empty list of local file paths.')
    }
    paths.push(entry)
  }
  return paths
}

/** Trusted keyboard: real key events, including held modifiers. */
async function trustedPress(
  tabId: number,
  frame: TabFrame,
  call: ToolCall,
  budget: ContentBudget,
  runtime: InputRuntime | undefined,
  includePageDelta: boolean,
): Promise<ToolAnswer | undefined> {
  const args = call.args
  const key = typeof args.key === 'string' && args.key !== '' ? args.key : ''
  if (key === '') throw new InputError('bad-args', 'key must not be empty.')
  if (args.action !== undefined && args.action !== 'press' && args.action !== 'down' && args.action !== 'up') {
    throw new InputError('bad-args', 'action must be press, down, or up.')
  }
  const action = args.action === 'down' || args.action === 'up' ? args.action : 'press'
  const modifiers = requestedModifiers(args)
  const repeat = args.repeat === undefined ? 1 : args.repeat
  if (typeof repeat !== 'number' || !Number.isInteger(repeat) || repeat < 1 || repeat > 100) {
    throw new InputError('bad-args', 'repeat must be an integer between 1 and 100.')
  }
  const input = requireInput(runtime)
  await prepareInputTarget(tabId, frame, args, 'none')
  await input.run(tabId, async (client) => {
    await withFocusEmulation(client, async () => {
      await dispatchKey(client, inputStates.get(tabId), { key, action, modifiers, repeat })
    })
  })
  const chord = modifiers.length === 0 ? key : `${modifiers.join('+')}+${key}`
  return settleAfterInput(tabId, frame, `sent key "${chord}"${repeat > 1 ? ` x${repeat}` : ''}`, budget, includePageDelta)
}

/** Trusted text: a caret insertion or per-character key events. */
async function trustedType(
  tabId: number,
  frame: TabFrame,
  call: ToolCall,
  budget: ContentBudget,
  runtime: InputRuntime | undefined,
  includePageDelta: boolean,
): Promise<ToolAnswer | undefined> {
  const args = call.args
  const text = typeof args.text === 'string' ? args.text : ''
  if (text === '') throw new InputError('bad-args', 'text must not be empty.')
  const mode = args.mode === 'keystrokes' ? 'keystrokes' : 'insert'
  const input = requireInput(runtime)
  const selection = args.replace === true ? 'contents' : args.mode === 'insert' || args.mode === 'keystrokes' ? 'none' : 'end'
  await prepareInputTarget(tabId, frame, args, selection)
  await input.run(tabId, async (client) => {
    await withFocusEmulation(client, async () => {
      if (mode === 'keystrokes') await typeAsKeystrokes(client, inputStates.get(tabId), text)
      else await insertTextAtCaret(client, text)
    })
  })
  return settleAfterInput(
    tabId,
    frame,
    `entered ${text.length} characters into ${describeTarget(args)} (${mode})`,
    budget,
    includePageDelta,
  )
}

/** Clipboard write (host path) and system-clipboard paste (trusted path). */
async function trustedClipboard(
  tabId: number,
  frame: TabFrame,
  call: ToolCall,
  budget: ContentBudget,
  runtime: InputRuntime | undefined,
  includePageDelta: boolean,
): Promise<ToolAnswer | undefined> {
  const args = call.args
  const text = typeof args.text === 'string' ? args.text : ''
  const html = typeof args.html === 'string' && args.html !== '' ? args.html : undefined
  if (args.action === 'write') {
    if (text === '' && html === undefined) throw new InputError('bad-args', 'text or html is required for a clipboard write.')
    const outcome = await writeClipboard({ text, ...(html === undefined ? {} : { html }) })
    return { ok: true, result: { text: describeClipboardWrite(outcome) } }
  }
  const input = requireInput(runtime)
  if (text !== '' || html !== undefined) {
    await writeClipboard({ text, ...(html === undefined ? {} : { html }) })
  }
  await prepareInputTarget(tabId, frame, args, 'none')
  await input.run(tabId, async (client) => {
    await withFocusEmulation(client, async () => {
      await sendPasteShortcut(client, inputStates.get(tabId), navigator.userAgent)
    })
  })
  return settleAfterInput(tabId, frame, `pasted the system clipboard into ${describeTarget(args)}`, budget, includePageDelta)
}

/** File attachment: mark the input, let the browser process read the paths. */
async function trustedUpload(
  tabId: number,
  frame: TabFrame,
  call: ToolCall,
  runtime: InputRuntime | undefined,
): Promise<ToolAnswer | undefined> {
  const args = call.args
  if (args.index === undefined && typeof args.selector !== 'string') {
    throw new InputError('bad-args', 'browser_upload needs index or selector for the file input.')
  }
  const paths = requestedPaths(args.paths)
  const input = requireInput(runtime)
  const token = uploadToken()
  const mark = await sendInputSetup(tabId, frame, {
    op: 'upload-mark',
    token,
    ...(args.index === undefined ? {} : { index: args.index as number }),
    ...(typeof args.selector === 'string' ? { selector: args.selector } : {}),
  })
  if (mark.op !== 'upload-mark') {
    throw new InputSetupError('action-failed', 'The page returned an unexpected upload result.')
  }
  try {
    await input.run(tabId, async (client) => {
      if (frame.frameId === 0) {
        await setInputFiles(client, mark.selector, paths)
        return
      }
      const target = await resolveDebuggerFrame(client, tabId, frame)
      await setInputFiles(target.client, mark.selector, paths, target.uniqueId)
    })
  } finally {
    void sendInputSetup(tabId, frame, { op: 'upload-clear', token }).catch(() => undefined)
  }
  return {
    ok: true,
    result: { text: `Attached ${paths.length} file(s) to ${describeTarget(args)}.` },
  }
}

/**
 * Dispatch one call through the trusted input channel.
 *
 * @returns the answer, or undefined when the call should fall back to the
 *   content script's synthetic path.
 */
async function dispatchTrustedInput(
  tabId: number,
  frame: TabFrame,
  call: ToolCall,
  budget: ContentBudget,
  runtime: InputRuntime | undefined,
  includePageDelta: boolean,
): Promise<ToolAnswer | undefined> {
  const route = inputRoute(call)
  if (route === 'content') return undefined
  if (route === 'trusted' && !usableInput(runtime)) return undefined
  try {
    switch (call.name) {
      case 'browser_clipboard':
        return await trustedClipboard(tabId, frame, call, budget, runtime, includePageDelta)
      case 'browser_upload':
        return await trustedUpload(tabId, frame, call, runtime)
      case 'browser_press':
        return await trustedPress(tabId, frame, call, budget, runtime, includePageDelta)
      case 'browser_type':
        return await trustedType(tabId, frame, call, budget, runtime, includePageDelta)
      default:
        return undefined
    }
  } catch (error: unknown) {
    const mapped = trustedFailure(error)
    if (mapped !== undefined) return mapped
    throw error
  }
}

async function dispatchOnce(
  tabId: number,
  frames: TabFrame[],
  call: ToolCall,
  budget: ContentBudget,
  signal?: AbortSignal,
  targetStillAllowed?: () => boolean,
  includeActionDelta: boolean = false,
  commitAction?: () => void,
  rollbackActionCommit?: () => void,
  inputRuntime?: InputRuntime,
): Promise<ToolAnswer> {
  if (isCancelled(call, signal)) return cancelled()
  if (targetStillAllowed?.() === false) return targetChanged()
  if (call.name === 'browser_snapshot') return snapshotAllFrames(tabId, frames, call, budget)

  const frameId = requestedFrame(call.args)
  if (frameId < 0) return { ok: false, error: { code: 'action-failed', message: 'frame must be a non-negative integer.' } }
  const frame = frames.find((candidate) => candidate.frameId === frameId)
  if (frame === undefined) {
    return unavailable(`Frame ${frameId} does not exist or has navigated. Call browser_snapshot again.`)
  }
  const route = inputRoute(call)
  const syntheticFallback = route === 'trusted'
  const hasSnapshotBaseline = snapshotDocumentsByTab.get(tabId)?.get(frameId) === frameDocumentKey(frame)
  if (route !== 'content') {
    // Commit before dispatching: a trusted gesture cannot be withdrawn once the
    // browser has delivered it, so the deadline must not abort it mid-flight.
    if (STATE_CHANGING_PAGE_TOOLS.has(call.name)) commitAction?.()
    const trusted = await dispatchTrustedInput(tabId, frame, call, budget, inputRuntime, includeActionDelta && hasSnapshotBaseline)
    if (trusted !== undefined) return trusted
    if (!syntheticFallback) {
      return inputUnavailable('This browser has no trusted input channel for this action.')
    }
  }
  // No await occurs between this guard and tabs.sendMessage, so an expired
  // approval cannot cross the final state-changing dispatch boundary.
  if (isCancelled(call, signal)) return cancelled()
  if (targetStillAllowed?.() === false) return targetChanged()
  const requestPageDelta = includeActionDelta && hasSnapshotBaseline && ACTION_DELTA_TOOLS.has(call.name)
  const navigationWait = includeActionDelta && isNavigationCandidateTool(call.name)
    ? waitForNextDocumentReady(tabId, frameId, frame.documentId, signal)
    : undefined
  let response: unknown
  const stateChanging = STATE_CHANGING_PAGE_TOOLS.has(call.name)
  try {
    if (stateChanging) commitAction?.()
    response = await sendAction(
      tabId,
      call,
      frame,
      requestPageDelta ? budget : undefined,
      requestPageDelta,
    )
  } catch (error: unknown) {
    if (stateChanging && contentScriptReceiverMissing(error)) rollbackActionCommit?.()
    navigationWait?.cancel()
    throw error
  }
  if (isCancelled(call, signal)) {
    navigationWait?.cancel()
    return cancelled()
  }
  if (!isToolAnswer(response)) {
    navigationWait?.cancel()
    return unavailable('The page content script returned an invalid response.')
  }
  const rawText = answerText(response)
  if (rawText === undefined) {
    navigationWait?.cancel()
    return response
  }
  const text = syntheticFallback ? `${rawText} (synthetic)` : rawText
  if (answerNavigationPending(response) && navigationWait !== undefined) {
    const ready = await navigationWait.ready
    if (isCancelled(call, signal)) return cancelled()
    if (targetStillAllowed?.() === false) return targetChanged()
    if (ready) {
      try {
        const snapshot = await snapshotAfterNavigation(tabId, call, text, budget, targetStillAllowed)
        if (snapshot !== undefined) return snapshot
      } catch {
        // Preserve the successful navigation status when the replacement page
        // becomes unavailable before its opportunistic snapshot completes.
      }
    }
  } else {
    navigationWait?.cancel()
  }
  if (call.name === 'browser_get_text') {
    return { ok: true, result: { text: wrapUntrustedContent(text, budget.maxChars) } }
  }
  const pageContent = requestPageDelta ? answerPageContent(response) : undefined
  return {
    ok: true,
    result: {
      text: pageContent === undefined ? text : wrapActionDelta(text, pageContent, frame, budget.maxChars),
    },
  }
}

function requestedTabId(args: Record<string, unknown>): number | undefined {
  const value = args.tabId
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined
}

function tabUrl(tab: chrome.tabs.Tab): string {
  return tab.url ?? tab.pendingUrl ?? ''
}

function approvalDisplayUrl(value: string): string {
  try {
    const url = new URL(value)
    const display = url.protocol === 'http:' || url.protocol === 'https:'
      ? `${url.origin}${url.pathname}`
      : `${url.protocol}//${url.host}${url.pathname}`
    return display.replace(/\s+/g, ' ').slice(0, 160)
  } catch {
    return '(unknown URL)'
  }
}

function tabManagementApproval(call: ToolCall, tab?: chrome.tabs.Tab): ApprovalPrompt {
  const locale = getUiLocale()
  if (call.name === 'browser_list_tabs') {
    return {
      kind: 'read',
      action: call.name,
      summary: locale === 'zh' ? '读取所有已打开标签页的标题和链接' : 'Read the titles and URLs of all open tabs',
      origins: [],
      canTrust: false,
    }
  }
  const url = tab === undefined ? '' : tabUrl(tab)
  const origin = originFromUrl(url)
  const display = approvalDisplayUrl(url)
  return {
    kind: 'action',
    action: call.name,
    summary: call.name === 'browser_follow_tab'
      ? (call.args.activate === true
        ? (locale === 'zh' ? `跟随并切换到标签页 ${tab?.id ?? '?'}：${display}` : `Follow and activate tab ${tab?.id ?? '?'}: ${display}`)
        : (locale === 'zh' ? `跟随标签页 ${tab?.id ?? '?'}：${display}` : `Follow tab ${tab?.id ?? '?'}: ${display}`))
      : (locale === 'zh' ? `关闭标签页 ${tab?.id ?? '?'}：${display}` : `Close tab ${tab?.id ?? '?'}: ${display}`),
    origins: origin === undefined ? [] : [origin],
    canTrust: false,
  }
}

async function authorizeTabManagement(
  prompt: ApprovalPrompt,
  unrestrictedAccess: boolean,
  authorize: ((prompt: ApprovalPrompt) => Promise<ApprovalAuthorization>) | undefined,
  call: ToolCall,
  signal: AbortSignal | undefined,
): Promise<ToolAnswer | undefined> {
  if (unrestrictedAccess) return undefined
  const authorization = authorize === undefined ? 'unavailable' : await authorize(prompt)
  if (isCancelled(call, signal)) return cancelled()
  return authorization === 'approved' ? undefined : approvalFailure(prompt, authorization)
}

async function findTab(tabId: number): Promise<chrome.tabs.Tab | undefined> {
  try {
    return await chrome.tabs.get(tabId)
  } catch {
    return undefined
  }
}

async function dispatchTabManagementTool(
  call: ToolCall,
  budget: ContentBudget,
  authorize: ((prompt: ApprovalPrompt) => Promise<ApprovalAuthorization>) | undefined,
  signal: AbortSignal | undefined,
  context: TabManagementContext,
): Promise<ToolAnswer> {
  if (call.name === 'browser_list_tabs') {
    const approval = tabManagementApproval(call)
    const rejected = await authorizeTabManagement(approval, context.unrestrictedAccess, authorize, call, signal)
    if (rejected !== undefined) return rejected
    const tabs = await chrome.tabs.query({})
    if (isCancelled(call, signal)) return cancelled()
    const records = tabs
      .filter((tab): tab is chrome.tabs.Tab & { id: number } => tab.id !== undefined)
      .sort((left, right) => left.windowId - right.windowId || left.index - right.index)
      .map((tab) => ({
        tabId: tab.id,
        windowId: tab.windowId,
        index: tab.index,
        active: tab.active,
        controlled: tab.id === context.controlledTabId,
        title: tab.title ?? '',
        url: tabUrl(tab),
      }))
    return {
      ok: true,
      result: { text: wrapUntrustedContent(JSON.stringify({ tabs: records }, null, 2), budget.maxChars) },
    }
  }

  const tabId = requestedTabId(call.args)
  if (tabId === undefined) {
    return { ok: false, error: { code: 'action-failed', message: 'tabId must be a non-negative safe integer returned by browser_list_tabs.' } }
  }
  const before = await findTab(tabId)
  if (before === undefined) return unavailable(`Tab ${tabId} is no longer open. Call browser_list_tabs again.`)
  const approval = tabManagementApproval(call, before)
  const rejected = await authorizeTabManagement(approval, context.unrestrictedAccess, authorize, call, signal)
  if (rejected !== undefined) return rejected
  const current = await findTab(tabId)
  if (current === undefined) return unavailable(`Tab ${tabId} closed while approval was pending. Call browser_list_tabs again.`)
  if (tabUrl(current) !== tabUrl(before)) {
    return unavailable(`Tab ${tabId} navigated while approval was pending. Call browser_list_tabs again before retrying.`)
  }
  if (isCancelled(call, signal)) return cancelled()

  if (call.name === 'browser_follow_tab') {
    if (context.followTab === undefined) return unavailable('The browser could not bind the selected tab in this session.')
    const activate = call.args.activate === true
    context.commitAction?.()
    await context.followTab(current)
    if (activate) {
      if (current.windowId !== undefined) {
        try {
          await chrome.windows.update(current.windowId, { focused: true })
        } catch {
          return unavailable(`Tab ${tabId} was followed but its window could not be focused.`)
        }
      }
      try {
        await chrome.tabs.update(tabId, { active: true })
      } catch {
        return unavailable(`Tab ${tabId} was followed but could not be activated.`)
      }
    }
    return {
      ok: true,
      result: {
        text: activate
          ? `Tab ${tabId} is now the controlled and active tab. Call browser_snapshot before operating its page.`
          : `Tab ${tabId} is now the controlled tab. Call browser_snapshot before operating its page.`,
      },
    }
  }
  if (call.name === 'browser_close_tab') {
    try {
      context.commitAction?.()
      await chrome.tabs.remove(tabId)
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error)
      return unavailable(`Tab ${tabId} could not be closed: ${detail}`)
    }
    return {
      ok: true,
      result: {
        text: tabId === context.controlledTabId
          ? `Closed controlled tab ${tabId}. Call browser_list_tabs and browser_follow_tab before the next page operation.`
          : `Closed tab ${tabId}.`,
      },
    }
  }
  return unavailable(`Unsupported tab-management tool: ${call.name}`)
}

/** Parse the model-supplied screenshot capture options. */
function screenshotCaptureOptions(call: ToolCall): { format: 'png' | 'jpeg'; quality: number } | ToolAnswer {
  const format = call.args.format === undefined ? 'png' : call.args.format
  if (format !== 'png' && format !== 'jpeg') {
    return { ok: false, error: { code: 'action-failed', message: 'format must be "png" or "jpeg".' } }
  }
  const quality = call.args.quality === undefined ? 85 : call.args.quality
  if (typeof quality !== 'number' || !Number.isInteger(quality) || quality < 1 || quality > 100) {
    return { ok: false, error: { code: 'action-failed', message: 'quality must be an integer between 1 and 100.' } }
  }
  return { format, quality }
}

/** Decode a captureVisibleTab data URL into base64 pixels and media type. */
function decodeCaptureDataUrl(dataUrl: string): { data: string; mediaType: string } | undefined {
  const comma = dataUrl.indexOf(',')
  if (comma === -1) return undefined
  const header = /^data:([^;,]+);base64$/.exec(dataUrl.slice(0, comma))
  if (header === null) return undefined
  const data = dataUrl.slice(comma + 1)
  return data === '' ? undefined : { data, mediaType: header[1] ?? '' }
}

async function measureImageBytes(data: string, mediaType: string): Promise<{ width: number; height: number } | undefined> {
  try {
    const binary = atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    const bitmap = await createImageBitmap(new Blob([bytes as BlobPart], { type: mediaType }))
    try {
      return { width: bitmap.width, height: bitmap.height }
    } finally {
      bitmap.close()
    }
  } catch {
    // Dimensions are advisory metadata; the capture stays deliverable.
    return undefined
  }
}

/**
 * Capture the controlled tab's viewport. `captureVisibleTab` photographs the
 * active tab of the window, so a controlled-but-inactive tab is a hard error
 * rather than a silent capture of the wrong page.
 */
async function dispatchScreenshot(
  tab: Pick<chrome.tabs.Tab, 'id' | 'url'> & { active?: boolean; windowId?: number },
  call: ToolCall,
  signal?: AbortSignal,
  targetStillAllowed?: () => boolean,
): Promise<ToolAnswer> {
  if (isCancelled(call, signal)) return cancelled()
  if (targetStillAllowed?.() === false) return targetChanged()
  const options = screenshotCaptureOptions(call)
  if ('ok' in options) return options
  let active = tab.active
  let windowId = tab.windowId
  if (active === undefined || windowId === undefined) {
    const fresh = await findTab(tab.id!)
    if (fresh === undefined) return unavailable('The controlled tab closed before the screenshot was captured.')
    active = fresh.active
    windowId = fresh.windowId
  }
  if (isCancelled(call, signal)) return cancelled()
  if (targetStillAllowed?.() === false) return targetChanged()
  if (active !== true) {
    return unavailable('The controlled tab is not the active tab of its window, so its viewport cannot be captured. Activate the tab first, then retry.')
  }
  if (windowId === undefined) {
    return unavailable('The controlled tab has no window, so its viewport cannot be captured.')
  }
  // `captureVisibleTab` photographs the last composited frame. A window that is
  // not focused can hand back a stale image that no longer matches the DOM, so
  // fail clearly instead of presenting old pixels as the current state.
  const windowsApi = (globalThis as {
    chrome?: { windows?: { get?: (id: number) => Promise<{ focused?: boolean }> } }
  }).chrome?.windows
  if (typeof windowsApi?.get === 'function') {
    try {
      const win = await windowsApi.get(windowId)
      if (win.focused === false) {
        return unavailable('The browser window is not focused, so a captured frame could be stale. Bring it to the front (browser_follow_tab { activate: true }) and retry.')
      }
    } catch {
      // A closed window is reported by the capture call itself.
    }
  }
  let dataUrl: string
  try {
    dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
      format: options.format,
      ...(options.format === 'jpeg' ? { quality: options.quality } : {}),
    })
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error)
    return unavailable(`The screenshot could not be captured: ${detail}`)
  }
  if (isCancelled(call, signal)) return cancelled()
  if (targetStillAllowed?.() === false) return targetChanged()
  const captured = decodeCaptureDataUrl(dataUrl)
  if (captured === undefined) return unavailable('The browser returned the screenshot in an unsupported format.')
  const dimensions = await measureImageBytes(captured.data, captured.mediaType)
  return {
    ok: true,
    result: {
      image: {
        data: captured.data,
        mediaType: captured.mediaType,
        ...dimensions === undefined ? {} : dimensions,
      },
    },
  }
}

/**
 * Dispatch one tool call to the selected tab's content script.
 * @param call - the tool call to execute.
 * @param sharePageContent - the user's page-sharing preference ('off' blocks
 *   every page-content read).
 * @param budget - snapshot limits to restore after on-demand content-script injection.
 * @param signal - bridge lifetime; cancellation prevents any not-yet-sent page action.
 * @param targetTab - tab selected by the background affinity controller.
 * @param targetStillAllowed - final fail-closed guard after asynchronous approval/navigation checks.
 * @param tabManagement - access mode and affinity callbacks for tab collection tools.
 * @returns the content script's answer, or a stable error when no tab or
 *   content script is available.
 */
export async function dispatchToolCall(
  call: ToolCall,
  sharePageContent: 'ask' | 'auto' | 'off',
  budget?: ContentBudget,
  authorize?: (prompt: ApprovalPrompt) => Promise<ApprovalAuthorization>,
  signal?: AbortSignal,
  targetTab?: Pick<chrome.tabs.Tab, 'id' | 'url' | 'title'> & { windowId?: number },
  targetStillAllowed?: () => boolean,
  tabManagement: TabManagementContext = { unrestrictedAccess: false },
): Promise<ToolAnswer> {
  if (call.name === 'browser_open_tab') {
    return unavailable('browser_open_tab must be dispatched through the background open-tab path.')
  }
  if (isCancelled(call, signal)) return cancelled()
  const effectiveBudget = budget ?? { maxItems: 60, maxChars: DEFAULT_SNAPSHOT_MAX_CHARS }
  if (isTabManagementTool(call.name)) {
    return dispatchTabManagementTool(call, effectiveBudget, authorize, signal, tabManagement)
  }
  // Privacy boundary: with sharing off, no page content may leave the page.
  if (!tabManagement.unrestrictedAccess
    && sharePageContent === 'off'
    && (call.name === 'browser_snapshot' || call.name === 'browser_get_text' || call.name === 'browser_screenshot')) {
    return { ok: false, error: { code: 'action-failed', message: 'Page content sharing is disabled in Settings > Page content sharing.' } }
  }
  const tab = targetTab ?? (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0]
  if (isCancelled(call, signal)) return cancelled()
  if (tab?.id === undefined) {
    return { ok: false, error: { code: 'no-active-tab', message: 'No active tab is available for browser operations.' } }
  }
  if (targetStillAllowed?.() === false) return targetChanged()
  const frames = await listTabFrames(tab.id, tab.url)
  if (isCancelled(call, signal)) return cancelled()
  if (targetStillAllowed?.() === false) return targetChanged()
  const frameError = validateFrameTarget(call, frames)
  if (frameError !== undefined) return frameError
  if (!isInjectablePage(tab.url) && !TAB_NATIVE_TOOLS.has(call.name) && call.name !== 'browser_screenshot') {
    return unavailable('The current page DOM is protected by the browser. Only snapshot metadata, navigate, back, forward, and reload are available on this page.')
  }
  const targetError = validateElementTarget(call, tab.id, frames)
  if (targetError !== undefined) return targetError
  const approval = tabManagement.unrestrictedAccess
    ? undefined
    : approvalPromptForCall(call, sharePageContent, frames)
  if (approval !== undefined) {
    const authorization = authorize === undefined ? 'unavailable' : await authorize(approval)
    if (isCancelled(call, signal)) return cancelled()
    if (targetStillAllowed?.() === false) return targetChanged()
    if (authorization !== 'approved') {
      return approvalFailure(approval, authorization)
    }
  }
  let executionFrames = frames
  if (approval !== undefined) {
    executionFrames = await listTabFrames(tab.id, tab.url)
    if (isCancelled(call, signal)) return cancelled()
    if (targetStillAllowed?.() === false) return targetChanged()
    const refreshedApproval = approvalPromptForCall(call, sharePageContent, executionFrames)
    if (refreshedApproval === undefined
      || !sameApprovalBoundary(approval, refreshedApproval)
      || (approval.kind === 'action' && !sameTargetDocument(call, frames, executionFrames))) {
      return unavailable('The page changed while approval was pending. Call browser_snapshot again before retrying.')
    }
    const refreshedTargetError = validateElementTarget(call, tab.id, executionFrames)
    if (refreshedTargetError !== undefined) return refreshedTargetError
  }
  if (!isInjectablePage(tab.url)) {
    if (call.name === 'browser_screenshot') {
      return unavailable('A screenshot cannot be captured on this page: the browser protects pages outside http and https.')
    }
    return await dispatchTabNativeTool(tab.id, tab.url, tab.title, tab.windowId, call, effectiveBudget, signal, targetStillAllowed, tabManagement.commitAction)
      ?? unavailable('The current page DOM is protected by the browser.')
  }
  if (call.name === 'browser_screenshot') {
    return await dispatchScreenshot(tab, call, signal, targetStillAllowed)
  }
  try {
    return await dispatchOnce(
      tab.id,
      executionFrames,
      call,
      effectiveBudget,
      signal,
      targetStillAllowed,
      tabManagement.unrestrictedAccess || sharePageContent === 'auto',
      tabManagement.commitAction,
      tabManagement.rollbackActionCommit,
      tabManagement.input,
    )
  } catch (error: unknown) {
    if (isCancelled(call, signal)) return cancelled()
    const trustedFailureAnswer = devToolsFailure(error)
    if (trustedFailureAnswer !== undefined) return trustedFailureAnswer
    if (!contentScriptReceiverMissing(error)) {
      const detail = error instanceof Error ? error.message : String(error)
      return unavailable(`The browser operation failed after it was dispatched: ${detail}`)
    }
    // Manifest content scripts do not run retroactively in tabs that were
    // already open when an unpacked extension was installed or reloaded.
    // Recover in place so the user never has to refresh and lose page state.
    try {
      await injectContentScript(tab.id)
    } catch {
      return await dispatchTabNativeTool(tab.id, tab.url, tab.title, tab.windowId, call, effectiveBudget, signal, targetStillAllowed, tabManagement.commitAction)
        ?? unavailable('The content script could not be loaded on this page. Its DOM does not support browser operations.')
    }
    try {
      if (isCancelled(call, signal)) return cancelled()
      if (targetStillAllowed?.() === false) return targetChanged()
      const refreshedFrames = await listTabFrames(tab.id, tab.url)
      if (isCancelled(call, signal)) return cancelled()
      if (targetStillAllowed?.() === false) return targetChanged()
      const refreshedTargetError = validateElementTarget(call, tab.id, refreshedFrames)
      if (refreshedTargetError !== undefined) return refreshedTargetError
      if (approval !== undefined) {
        const refreshedApproval = approvalPromptForCall(call, sharePageContent, refreshedFrames)
        if (refreshedApproval === undefined
          || !sameApprovalBoundary(approval, refreshedApproval)
          || (approval.kind === 'action' && !sameTargetDocument(call, executionFrames, refreshedFrames))) {
          return unavailable('The page changed while the content script was loading. Call browser_snapshot again before retrying.')
        }
      }
      return await dispatchOnce(
        tab.id,
        refreshedFrames,
        call,
        effectiveBudget,
        signal,
        targetStillAllowed,
        tabManagement.unrestrictedAccess || sharePageContent === 'auto',
        tabManagement.commitAction,
        tabManagement.rollbackActionCommit,
        tabManagement.input,
      )
    } catch (error: unknown) {
      const trustedFailureAnswer = devToolsFailure(error)
      if (trustedFailureAnswer !== undefined) return trustedFailureAnswer
      const detail = error instanceof Error ? error.message : String(error)
      return unavailable(`The content script did not answer after it was loaded (${detail}). Call browser_snapshot again before retrying.`)
    }
  }
}

function validateFrameTarget(call: ToolCall, frames: TabFrame[]): ToolAnswer | undefined {
  if (call.name === 'browser_snapshot') return undefined
  const frameId = requestedFrame(call.args)
  if (frameId < 0) return { ok: false, error: { code: 'action-failed', message: 'frame must be a non-negative integer.' } }
  if (!frames.some((frame) => frame.frameId === frameId)) {
    return unavailable(`Frame ${frameId} does not exist or has navigated. Call browser_snapshot again.`)
  }
  return undefined
}

const INDEX_TARGETED_TOOLS = new Set([
  'browser_click',
  'browser_type',
  'browser_press',
  'browser_scroll',
  'browser_clipboard',
  'browser_upload',
])

function validateElementTarget(call: ToolCall, tabId: number, frames: TabFrame[]): ToolAnswer | undefined {
  // A selector or "the focused element" is self-contained; only
  // a snapshot index needs a snapshot of the same document to resolve.
  if (!INDEX_TARGETED_TOOLS.has(call.name)) return undefined
  if (call.args.index === undefined) return undefined
  const frameId = requestedFrame(call.args)
  const frame = frames.find((candidate) => candidate.frameId === frameId)
  const snapshotted = snapshotDocumentsByTab.get(tabId)?.get(frameId)
  if (frame === undefined || snapshotted === undefined || snapshotted !== frameDocumentKey(frame)) {
    return unavailable('The element reference does not belong to the current document. Call browser_snapshot again for current frame and index values.')
  }
  return undefined
}

function sameApprovalBoundary(before: ApprovalPrompt, after: ApprovalPrompt): boolean {
  return before.kind === after.kind
    && before.action === after.action
    && before.origins.length === after.origins.length
    && before.origins.every((origin, index) => origin === after.origins[index])
}

function sameTargetDocument(call: ToolCall, before: TabFrame[], after: TabFrame[]): boolean {
  const frameId = requestedFrame(call.args)
  const beforeFrame = before.find((frame) => frame.frameId === frameId)
  const afterFrame = after.find((frame) => frame.frameId === frameId)
  return beforeFrame !== undefined
    && afterFrame !== undefined
    && frameDocumentKey(beforeFrame) === frameDocumentKey(afterFrame)
}

/** Parse a model-supplied http(s) URL for tab creation / navigation. */
export function parseHttpUrl(value: unknown): URL | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : undefined
  } catch {
    return undefined
  }
}

async function removeCreatedTab(tabId: number): Promise<void> {
  try {
    await chrome.tabs.remove(tabId)
  } catch {
    // The tab may already have been closed by the user or another tool.
  }
}

/**
 * Open a URL in a new tab, then optionally snapshot it once the document is ready.
 * Affinity rebinding is owned by the caller via `bindCreatedTab`.
 *
 * Creates a blank tab first, arms the readiness listener, then navigates so a
 * fast `document_idle` cannot announce readiness before the listener exists.
 * Cancellation before affinity bind rolls the orphan tab back; after bind the
 * open is treated as committed and reported as success even if the call expires.
 */
export async function dispatchOpenTab(
  call: ToolCall,
  windowId: number,
  sharePageContent: 'ask' | 'auto' | 'off',
  budget: ContentBudget | undefined,
  authorize: ((prompt: ApprovalPrompt) => Promise<ApprovalAuthorization>) | undefined,
  signal: AbortSignal | undefined,
  bindCreatedTab: (tab: chrome.tabs.Tab) => boolean,
  targetStillAllowed: (tabId: number) => boolean,
  commitAction?: () => void,
): Promise<ToolAnswer> {
  if (isCancelled(call, signal)) return cancelled()
  const parsed = parseHttpUrl(call.args.url)
  if (parsed === undefined) {
    return { ok: false, error: { code: 'action-failed', message: 'url must be a complete http or https URL.' } }
  }
  const active = call.args.active !== false

  const approval = approvalPromptForCall(call, sharePageContent, [])
  if (approval !== undefined) {
    const authorization = authorize === undefined ? 'unavailable' : await authorize(approval)
    if (isCancelled(call, signal)) return cancelled()
    if (authorization !== 'approved') return approvalFailure(approval, authorization)
  }

  let created: chrome.tabs.Tab
  try {
    // No URL yet: register the readiness wait before the http(s) navigation.
    created = await chrome.tabs.create({ active, windowId })
  } catch (error: unknown) {
    return {
      ok: false,
      error: {
        code: 'action-failed',
        message: error instanceof Error ? error.message : 'Failed to open a new browser tab.',
      },
    }
  }
  if (created.id === undefined) {
    return { ok: false, error: { code: 'action-failed', message: 'Chrome created a tab without an id.' } }
  }
  const tabId = created.id
  if (isCancelled(call, signal)) {
    await removeCreatedTab(tabId)
    return cancelled()
  }

  const navigationWait = waitForNextDocumentReady(tabId, 0, undefined, signal)
  try {
    created = await chrome.tabs.update(tabId, { url: parsed.href })
  } catch (error: unknown) {
    navigationWait.cancel()
    await removeCreatedTab(tabId)
    return {
      ok: false,
      error: {
        code: 'action-failed',
        message: error instanceof Error ? error.message : 'Failed to navigate the new browser tab.',
      },
    }
  }

  const ready = await navigationWait.ready
  if (isCancelled(call, signal)) {
    await removeCreatedTab(tabId)
    return cancelled()
  }
  commitAction?.()
  if (!bindCreatedTab(created.id === undefined ? { ...created, id: tabId } : created)) {
    await removeCreatedTab(tabId)
    return {
      ok: false,
      error: { code: 'action-failed', message: 'The new tab could not become the controlled browser target.' },
    }
  }

  // Affinity is committed: further cancellation must not claim the tab was never opened.
  resetTabSnapshot(tabId)
  if (!targetStillAllowed(tabId)) return targetChanged()

  const status = active
    ? `Opened a new tab at ${parsed.href}.`
    : `Opened a new background tab at ${parsed.href}.`
  if (!ready || sharePageContent === 'off' || isCancelled(call, signal)) {
    return {
      ok: true,
      result: {
        text: sharePageContent === 'off'
          ? `${status} Page content sharing is disabled, so no snapshot was captured.`
          : `${status} Call browser_snapshot again after the page loads.`,
      },
    }
  }

  try {
    const snapshot = await snapshotAfterNavigation(
      tabId,
      call,
      status,
      budget ?? { maxItems: 60, maxChars: DEFAULT_SNAPSHOT_MAX_CHARS },
      () => targetStillAllowed(tabId),
    )
    if (snapshot !== undefined) return snapshot
  } catch {
    // Keep the successful open when the replacement page is not yet readable.
  }
  return {
    ok: true,
    result: { text: `${status} Call browser_snapshot again after the page loads.` },
  }
}
