/**
 * Markdown → sanitized HTML for conversation bubbles.
 *
 * Model and user text is untrusted: the rendered output goes through
 * DOMPurify before touching the DOM, and http(s) links are forced to open in
 * a new tab (the side panel must never navigate away from the chat).
 *
 * Math is rendered locally with KaTeX. LaTeX inside code spans and fenced
 * blocks is left verbatim, and a `$…$` run only counts as math when it looks
 * like LaTeX (a backslash, `_`, `^`, `{`, or `=`), so prices such as
 * "$5 and $10" stay plain text.
 *
 * @module
 */

import DOMPurify, { type Config } from 'dompurify'
import katex from 'katex'
import { marked } from 'marked'

const MARKDOWN_SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    'a', 'blockquote', 'br', 'code', 'del', 'em', 'h1', 'h2', 'h3', 'h4',
    'h5', 'h6', 'hr', 'li', 'ol', 'p', 'pre', 'strong', 'table', 'tbody',
    'td', 'th', 'thead', 'tr', 'ul',
  ],
  ALLOWED_ATTR: ['align', 'href', 'start', 'title'],
  ALLOWED_URI_REGEXP: /^https?:\/\//i,
  ALLOW_ARIA_ATTR: false,
  ALLOW_DATA_ATTR: false,
} satisfies Config

marked.setOptions({
  gfm: true,
  // 聊天式文本：单个换行渲染为 <br>（与 DeepSeek 聊天界面的换行行为一致）。
  breaks: true,
})

/** Placeholder markers survive markdown parsing and sanitizing untouched. */
const MATH_SLOT = '@@KATEX'
const CODE_SLOT = '@@CODE'
const SLOT_SUFFIX = '@@'
const SLOT_RE = /@@(KATEX|CODE)(\d+)@@/gu

/** Fenced code blocks first, then inline code, then math in the order it appears. */
const FENCE_RE = /(^|\n)(```[\s\S]*?```|~~~[\s\S]*?~~~)/gu
const INLINE_CODE_RE = /`[^`\n]+`/gu
const MATH_RE = /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\$)[^$\n]+?\$/gu
/** A `$…$` run with none of these reads as currency, not math. */
const LATEX_HINT_RE = /[\\_^{}=]/

/** What one extracted run should be restored as. */
type Slot = { kind: 'math'; tex: string; display: boolean } | { kind: 'code'; text: string; block: boolean }

function escapeHtml(text: string): string {
  return text
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
}

/** Extract code and math runs, leaving placeholders behind. */
function extractSlots(source: string): { text: string; slots: Slot[] } {
  const slots: Slot[] = []
  const keep = (slot: Slot): string => {
    slots.push(slot)
    return `${slot.kind === 'math' ? MATH_SLOT : CODE_SLOT}${slots.length - 1}${SLOT_SUFFIX}`
  }

  let text = source.replace(FENCE_RE, (_match, lead: string, fence: string) => {
    const body = fence.replace(/^(`{3,}|~{3,})[^\n]*\n?/u, '').replace(/\n?(`{3,}|~{3,})$/u, '')
    return `${lead}${keep({ kind: 'code', text: body, block: true })}`
  })

  text = text.replace(INLINE_CODE_RE, (match) => keep({ kind: 'code', text: match.slice(1, -1), block: false }))

  text = text.replace(MATH_RE, (match) => {
    const isDisplay = match.startsWith('$$') || match.startsWith('\\[')
    const [open, close] = match.startsWith('$$')
      ? ['$$', '$$']
      : match.startsWith('\\[') ? ['\\[', '\\]']
        : match.startsWith('\\(') ? ['\\(', '\\)'] : ['$', '$']
    const tex = match.slice(open.length, match.length - close.length).trim()
    if (tex === '') return match
    if (!isDisplay && !LATEX_HINT_RE.test(tex)) return match
    return keep({ kind: 'math', tex, display: isDisplay })
  })

  return { text, slots }
}

/** Restore placeholders, rendering math with KaTeX and escaping code. */
function restoreSlots(html: string, slots: Slot[]): string {
  const renderSlot = (slot: Slot): { html: string; display: boolean } => {
    if (slot.kind === 'code') {
      const escaped = escapeHtml(slot.text)
      return { html: slot.block ? `<pre><code>${escaped}</code></pre>` : `<code>${escaped}</code>`, display: false }
    }
    try {
      return {
        html: katex.renderToString(slot.tex, { displayMode: slot.display, throwOnError: false, output: 'html' }),
        display: slot.display,
      }
    } catch {
      return { html: escapeHtml(slot.display ? `$$${slot.tex}$$` : `$${slot.tex}$`), display: false }
    }
  }

  // A display-math or fenced-code placeholder is usually the only child of its
  // paragraph, so the wrapper would nest a block element inside <p>.
  let output = html.replace(
    /<p>@@(KATEX|CODE)(\d+)@@<\/p>/gu,
    (match, _kind: string, index: string) => {
      const slot = slots[Number(index)]
      if (slot === undefined) return match
      if (slot.kind === 'math' && !slot.display) return match
      if (slot.kind === 'code' && !slot.block) return match
      return renderSlot(slot).html
    },
  )

  output = output.replace(SLOT_RE, (_match, _kind: string, index: string) => {
    const slot = slots[Number(index)]
    if (slot === undefined) return ''
    return renderSlot(slot).html
  })
  return output
}

/**
 * Render markdown source to sanitized HTML safe for `innerHTML`.
 *
 * @param source - markdown text (may be empty)
 * @returns sanitized HTML fragment
 */
export function renderMarkdown(source: string): string {
  const { text, slots } = extractSlots(source ?? '')
  const html = marked.parse(text, { async: false }) as string
  const template = document.createElement('template')
  template.innerHTML = DOMPurify.sanitize(html, MARKDOWN_SANITIZE_OPTIONS)
  for (const link of template.content.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href') ?? ''
    if (/^https?:\/\//i.test(href)) {
      link.setAttribute('target', '_blank')
      link.setAttribute('rel', 'noreferrer noopener')
    }
  }
  return restoreSlots(template.innerHTML, slots)
}
