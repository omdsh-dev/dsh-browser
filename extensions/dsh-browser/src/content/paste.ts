/**
 * Rich clipboard paste for `browser_clipboard { action: 'paste' }`.
 *
 * The system clipboard is not touched here: the payload is placed on a
 * `DataTransfer` and delivered as a `paste` event, which is exactly the event
 * rich editors and canvas apps listen for. HTML is sanitized first so a page
 * cannot be handed active content through the model's clipboard.
 *
 * @module
 */

import { sanitizeClipboardHtml } from '../shared/clipboard.ts'

/** What the caller wants to paste. */
export interface PastePayload {
  text: string
  html?: string
}

/** Build a cancelable paste event carrying the payload. */
export function createPasteEvent(payload: PastePayload): ClipboardEvent {
  const clipboardData = new DataTransfer()
  clipboardData.setData('text/plain', payload.text)
  if (payload.html !== undefined) clipboardData.setData('text/html', sanitizeClipboardHtml(payload.html))
  return new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData })
}

/**
 * Dispatch a paste event at one element.
 *
 * @param target - element whose paste handler should run.
 * @param payload - text plus optional rich HTML.
 * @returns whether the page called `preventDefault` (a handler accepted it).
 */
export function dispatchPaste(target: Element, payload: PastePayload): boolean {
  const event = createPasteEvent(payload)
  target.dispatchEvent(event)
  return event.defaultPrevented
}
