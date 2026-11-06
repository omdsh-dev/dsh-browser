/**
 * Clipboard contract shared by the background and the offscreen document.
 *
 * The background creates the offscreen page on demand; keeping the message
 * name and payload type here prevents the two halves from drifting.
 *
 * @module
 */

import DOMPurify from 'dompurify'

/** 保留粘贴内容的排版，移除可执行内容和表单控件。 */
export function sanitizeClipboardHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'select', 'textarea', 'template', 'noscript'],
    FORBID_ATTR: ['srcdoc', 'formaction'],
  })
}

/** Payload for one clipboard write. */
export interface ClipboardWritePayload {
  text: string
  html?: string
}

/** Message type the background sends to the offscreen document. */
export const CLIPBOARD_WRITE_MESSAGE = 'DSH_CLIPBOARD_WRITE'

/** What one clipboard write actually put on the clipboard. */
export interface ClipboardWriteOutcome {
  /** A rich HTML flavor was written (a plain-text flavor may be derived from it). */
  rich: boolean
  /** The plain-text flavor was derived from the HTML instead of the caller's text. */
  plainDerived: boolean
  /** The plain text the clipboard now carries (or the text flavor's content). */
  plainText: string
}

/** Packaged URL of the offscreen clipboard document. */
export const OFFSCREEN_CLIPBOARD_URL = 'offscreen/index.html'
