/**
 * Offscreen clipboard writer.
 *
 * Chrome MV3 service workers have no DOM and no clipboard access, but an
 * offscreen document with the `CLIPBOARD` reason can perform the copy on the
 * extension's behalf. The background creates this document on demand and sends
 * one message per write; the document never runs page code.
 *
 * @module
 */

import {
  CLIPBOARD_WRITE_MESSAGE,
  type ClipboardWritePayload,
} from '../shared/clipboard.ts'
import { copyClipboardInDocument } from '../shared/clipboard-document.ts'

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse: (response: unknown) => void) => {
  if (typeof message !== 'object' || message === null) return
  const request = message as { type?: unknown; target?: unknown; payload?: ClipboardWritePayload }
  if (request.type !== CLIPBOARD_WRITE_MESSAGE || request.target !== 'offscreen' || request.payload === undefined) return
  try {
    sendResponse({ ok: true, outcome: copyClipboardInDocument(request.payload) })
  } catch (error: unknown) {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) })
  }
})
