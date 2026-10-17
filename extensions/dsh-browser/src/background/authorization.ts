/** Pure authorization policy for model-requested browser tools. */

import type { ToolCall } from './tools.ts'
import type { TabFrame } from './frames.ts'
import type { ApprovalPrompt } from '../security/approval.ts'
import { getUiLocale, type UiLocale } from '../i18n.ts'

const PAGE_READS = new Set(['browser_snapshot', 'browser_get_text', 'browser_get_storage'])
const STATE_CHANGING_ACTIONS = new Set([
  'browser_click',
  'browser_type',
  'browser_press',
  'browser_navigate',
  'browser_open_tab',
  'browser_back',
  'browser_forward',
  'browser_reload',
  'browser_fetch',
  'browser_eval',
])

/** Return an approval prompt, or undefined when this call needs no prompt. */
export function approvalPromptForCall(
  call: ToolCall,
  sharePageContent: 'ask' | 'auto' | 'off',
  frames: TabFrame[],
  locale: UiLocale = getUiLocale(),
): ApprovalPrompt | undefined {
  if (PAGE_READS.has(call.name)) {
    if (sharePageContent !== 'ask') return undefined
    const targetFrames = call.name === 'browser_snapshot'
      ? frames
      : frames.filter((frame) => frame.frameId === requestedFrame(call.args))
    return {
      kind: 'read',
      action: call.name,
      summary: summarizeAction(call, locale),
      origins: uniqueOrigins(targetFrames, frames),
      canTrust: false,
    }
  }

  if (!STATE_CHANGING_ACTIONS.has(call.name)) return undefined
  if (call.name === 'browser_open_tab') {
    const destination = originFromUrl(typeof call.args.url === 'string' ? call.args.url : '')
    return {
      kind: 'action',
      action: call.name,
      summary: summarizeAction(call, locale),
      // A new tab does not mutate the current page; only the destination matters.
      origins: destination === undefined ? [] : [destination],
      canTrust: destination !== undefined,
    }
  }
  const frameId = requestedFrame(call.args)
  const target = frames.find((frame) => frame.frameId === frameId) ?? frames.find((frame) => frame.frameId === 0)
  const origins = uniqueOrigins(target === undefined ? [] : [target], frames)
  if (call.name === 'browser_eval') {
    // Code execution is never remembered as an origin trust: every call must be
    // approved against the document it will run in.
    return {
      kind: 'action',
      action: call.name,
      summary: summarizeAction(call, locale),
      origins,
      canTrust: false,
    }
  }
  if (call.name === 'browser_fetch') {
    // browser_fetch resolves relative paths against the page, so resolve here
    // too: the prompt must name the real destination and the origin check must
    // see through "/api/lines".
    const requested = typeof call.args.url === 'string' ? call.args.url : ''
    const absolute = resolveAgainst(requested, target?.url)
    const destination = originFromUrl(absolute)
    if (destination !== undefined && !origins.includes(destination)) origins.push(destination)
    origins.sort()
    return {
      kind: 'action',
      action: call.name,
      summary: summarizeAction({ ...call, args: { ...call.args, url: absolute } }, locale),
      origins,
      // A request can carry a body and mutate state, so it is never covered by
      // a persistent "trust this origin" decision.
      canTrust: false,
    }
  }
  let canTrust = origins.length === 1 && call.name !== 'browser_back' && call.name !== 'browser_forward'
  if (call.name === 'browser_navigate') {
    const destination = originFromUrl(typeof call.args.url === 'string' ? call.args.url : '')
    if (destination !== undefined && !origins.includes(destination)) origins.push(destination)
    // Do not let an invalid, opaque, or cross-origin navigation become a
    // back door for adding the current page to the persistent allowlist.
    canTrust = destination !== undefined && origins.length === 1 && origins[0] === destination
  }
  return {
    kind: 'action',
    action: call.name,
    summary: summarizeAction(call, locale),
    origins,
    // Cross-origin/invalid navigation and unknown history destinations always
    // require a fresh decision; they must never expand trust implicitly.
    canTrust,
  }
}

function requestedFrame(args: Record<string, unknown>): number {
  return typeof args.frame === 'number' && Number.isInteger(args.frame) && args.frame >= 0 ? args.frame : 0
}

function uniqueOrigins(targets: TabFrame[], allFrames: TabFrame[]): string[] {
  const origins = new Set<string>()
  for (const frame of targets) {
    const origin = effectiveFrameOrigin(frame, allFrames)
    if (origin !== undefined) origins.add(origin)
  }
  return [...origins].sort()
}

function effectiveFrameOrigin(frame: TabFrame, frames: TabFrame[], visited = new Set<number>()): string | undefined {
  if (visited.has(frame.frameId)) return undefined
  visited.add(frame.frameId)
  const direct = originFromUrl(frame.url)
  if (direct !== undefined) return direct
  const parent = frames.find((candidate) => candidate.frameId === frame.parentFrameId)
  return parent === undefined ? undefined : effectiveFrameOrigin(parent, frames, visited)
}

export function originFromUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:' && url.protocol !== 'blob:') return undefined
    return url.origin === 'null' ? undefined : url.origin
  } catch {
    return undefined
  }
}

/** Address text for one click, whichever addressing mode the caller used. */
function clickAddress(call: ToolCall, locale: UiLocale): string {
  if (typeof call.args.index === 'number') {
    return localized(locale, `element [${call.args.index}]`, `元素 [${call.args.index}]`)
  }
  if (typeof call.args.selector === 'string' && call.args.selector !== '') {
    return localized(
      locale,
      `selector "${safeInline(call.args.selector, 60)}"`,
      `选择器「${safeInline(call.args.selector, 60)}」`,
    )
  }
  if (typeof call.args.text === 'string' && call.args.text !== '') {
    return localized(
      locale,
      `text "${safeInline(call.args.text, 60)}"`,
      `文本「${safeInline(call.args.text, 60)}」`,
    )
  }
  return localized(locale, 'element', '元素')
}

function summarizeAction(call: ToolCall, locale: UiLocale): string {
  const frame = typeof call.args.frame === 'number' && call.args.frame !== 0
    ? localized(locale, `, iframe ${call.args.frame}`, `，iframe ${call.args.frame}`)
    : ''
  const index = typeof call.args.index === 'number' ? call.args.index : '?'
  switch (call.name) {
    case 'browser_click': return localized(locale, `Click ${clickAddress(call, locale)}${frame}`, `点击 ${clickAddress(call, locale)}${frame}`)
    case 'browser_type': {
      const length = typeof call.args.text === 'string' ? call.args.text.length : 0
      return localized(
        locale,
        `Enter ${length} characters in element [${index}]${frame} (the text is not shown in this dialog)`,
        `向元素 [${index}] 输入 ${length} 个字符${frame}（文本内容不会显示在确认框）`,
      )
    }
    case 'browser_press': {
      const key = safeInline(typeof call.args.key === 'string' ? call.args.key : '')
      const modifiers = Array.isArray(call.args.modifiers)
        ? call.args.modifiers.filter((modifier): modifier is string => typeof modifier === 'string').join('+')
        : ''
      const combo = modifiers === '' ? key : `${modifiers}+${key}`
      return localized(locale, `Press “${combo}”${frame}`, `发送按键「${combo}」${frame}`)
    }
    case 'browser_scroll': {
      const direction = typeof call.args.direction === 'string' ? safeInline(call.args.direction, 20) : ''
      const target = typeof call.args.selector === 'string' && call.args.selector !== ''
        ? localized(locale, ` inside selector "${safeInline(call.args.selector, 60)}"`, `（选择器「${safeInline(call.args.selector, 60)}」内）`)
        : typeof call.args.index === 'number'
          ? localized(locale, ` inside element [${call.args.index}]`, `（元素 [${call.args.index}] 内）`)
          : ''
      return localized(locale, `Scroll ${direction}${target}${frame}`, `滚动 ${direction}${target}${frame}`)
    }
    case 'browser_navigate': return localized(
      locale,
      `Navigate to ${displayUrl(typeof call.args.url === 'string' ? call.args.url : '', locale)}`,
      `导航到 ${displayUrl(typeof call.args.url === 'string' ? call.args.url : '', locale)}`,
    )
    case 'browser_open_tab': {
      const destination = displayUrl(typeof call.args.url === 'string' ? call.args.url : '', locale)
      return call.args.active === false
        ? localized(
          locale,
          `Open a background tab at ${destination}`,
          `在后台新标签页打开 ${destination}`,
        )
        : localized(
          locale,
          `Open a new tab at ${destination}`,
          `在新标签页打开 ${destination}`,
        )
    }
    case 'browser_back': return localized(locale, 'Go back in browser history (destination domain unknown)', '返回浏览历史上一页（目标域名未知）')
    case 'browser_forward': return localized(locale, 'Go forward in browser history (destination domain unknown)', '前进到浏览历史下一页（目标域名未知）')
    case 'browser_reload': return localized(locale, 'Reload the current page', '重新加载当前页面')
    case 'browser_snapshot': return localized(locale, 'Read the current page and accessible iframes', '读取当前页面及可访问 iframe')
    case 'browser_get_text': return localized(locale, 'Read text from the specified area of the current page', '读取当前页面的指定文本区域')
    case 'browser_get_storage': {      const area = call.args.area === 'session' ? 'sessionStorage' : 'localStorage'
      const key = typeof call.args.key === 'string' && call.args.key !== ''
        ? localized(locale, ` key "${safeInline(call.args.key, 60)}"`, ` 键「${safeInline(call.args.key, 60)}」`)
        : ''
      return localized(locale, `Read ${area}${key} of the current page${frame}`, `读取当前页面的 ${area}${key}${frame}`)
    }
    case 'browser_fetch': {
      const method = typeof call.args.method === 'string' ? safeInline(call.args.method.toUpperCase(), 10) : 'GET'
      const destination = displayUrl(typeof call.args.url === 'string' ? call.args.url : '', locale)
      const bodyLength = typeof call.args.body === 'string' ? call.args.body.length : 0
      const body = bodyLength > 0
        ? localized(locale, ` with a ${bodyLength}-character body`, `，请求体 ${bodyLength} 字符`)
        : ''
      return localized(
        locale,
        `Send ${method} ${destination}${body} from the current page${frame}`,
        `从当前页面发送 ${method} ${destination}${body}${frame}`,
      )
    }
    case 'browser_eval': {
      const length = typeof call.args.code === 'string' ? call.args.code.length : 0
      const preview = typeof call.args.code === 'string' ? safeInline(call.args.code, 80) : ''
      return localized(
        locale,
        `Run ${length} characters of JavaScript in the page${frame}: “${preview}”`,
        `在页面中执行 ${length} 个字符的 JavaScript${frame}：「${preview}」`,
      )
    }
    default: return call.name
  }
}

/** Resolve a possibly-relative URL against the owning frame's URL. */
function resolveAgainst(value: string, base: string | undefined): string {
  try {
    return new URL(value).href
  } catch {
    if (base === undefined || base === '') return value
    try {
      return new URL(value, base).href
    } catch {
      return value
    }
  }
}

function displayUrl(value: string, locale: UiLocale): string {  try {
    const url = new URL(value)
    return safeInline(`${url.origin}${url.pathname}`, 160)
  } catch {
    return localized(locale, '(invalid URL)', '(无效 URL)')
  }
}

function localized(locale: UiLocale, english: string, chinese: string): string {
  return locale === 'zh' ? chinese : english
}

function safeInline(value: string, maxLength = 40): string {
  const inline = value.replace(/\s+/g, ' ').trim()
  return inline.length <= maxLength ? inline : `${inline.slice(0, maxLength - 1)}…`
}
