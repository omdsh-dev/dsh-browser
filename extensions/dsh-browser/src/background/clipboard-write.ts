/**
 * System clipboard writes for `browser_clipboard { action: 'write' }`.
 *
 * Chrome runs the write in a packaged offscreen document: an MV3 service
 * worker has no DOM and cannot touch the clipboard itself. Firefox has no
 * offscreen API, but its event page still has a document, so the same payload
 * is copied through a hidden editable host. When neither path is available the
 * call fails with a stable code instead of silently doing nothing.
 *
 * @module
 */

import { InputError } from './input-actions.ts'
import { copyClipboardInDocument } from '../shared/clipboard-document.ts'
import {
  CLIPBOARD_WRITE_MESSAGE,
  OFFSCREEN_CLIPBOARD_URL,
  type ClipboardWriteOutcome,
  type ClipboardWritePayload,
} from '../shared/clipboard.ts'

let creating: Promise<void> | undefined

/** Create the offscreen document unless it already exists. */
async function ensureOffscreenDocument(): Promise<void> {
  if (creating !== undefined) return creating
  creating = (async () => {
    if (await chrome.offscreen.hasDocument()) return
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_CLIPBOARD_URL,
      reasons: ['CLIPBOARD' as chrome.offscreen.Reason],
      justification: 'Write text or rich HTML to the clipboard at the user\'s request.',
    })
  })()
  try {
    await creating
  } finally {
    creating = undefined
  }
}

/**
 * Write text and optional rich HTML to the system clipboard.
 *
 * @param payload - clipboard content.
 * @throws {InputError} with `input-unavailable` when the platform cannot copy.
 */
export async function writeClipboard(payload: ClipboardWritePayload): Promise<ClipboardWriteOutcome> {
  if (payload.text === '' && payload.html === undefined) {
    throw new InputError('bad-args', 'text or html is required for a clipboard write.')
  }
  if (chrome.offscreen === undefined) {
    if (typeof document === 'undefined') throw new InputError('input-unavailable', 'The browser has no clipboard document.')
    return copyClipboardInDocument(payload)
  }
  await ensureOffscreenDocument()
  const response: unknown = await chrome.runtime.sendMessage({ type: CLIPBOARD_WRITE_MESSAGE, target: 'offscreen', payload })
  if (typeof response === 'object' && response !== null && (response as { ok?: unknown }).ok === true) {
    const outcome = (response as { outcome?: unknown }).outcome
    if (typeof outcome === 'object' && outcome !== null) {
      const record = outcome as { rich?: unknown; plainDerived?: unknown; plainText?: unknown }
      if (typeof record.rich === 'boolean' && typeof record.plainDerived === 'boolean' && typeof record.plainText === 'string') {
        return { rich: record.rich, plainDerived: record.plainDerived, plainText: record.plainText }
      }
    }
  }
  if (typeof response === 'object' && response !== null && typeof (response as { error?: unknown }).error === 'string') {
    throw new InputError('action-failed', (response as { error: string }).error)
  }
  throw new InputError('action-failed', 'The offscreen document did not confirm the clipboard write.')
}
