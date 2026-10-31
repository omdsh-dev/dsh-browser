/**
 * Content-script half of trusted input.
 *
 * The background dispatches real keyboard and pointer events, but only the
 * frame can focus a target, select its contents, measure it, or report the
 * iframe chain that maps its coordinates into the tab viewport. These handlers
 * are internal plumbing: they never reach the model and return structured data
 * rather than text.
 *
 * @module
 */

import type { FrameEdge } from '../shared/frame-geometry.ts'
import type { InputSetupRequest, InputSetupResult, MeasuredTarget } from '../shared/input-setup.ts'
import { ActionError, resolveActionTarget } from './actions.ts'
import { isEditableElement, isFocusableElement, uniqueSelectorFor } from './find.ts'
import type { ElementIds } from './ids.ts'

/** Attribute used to hand one file input to the debugger without ambiguity. */
const UPLOAD_ATTRIBUTE = 'data-dsh-upload'

/** Measure one element inside the current frame. */
function measure(args: { index?: number; selector?: string }, ids: ElementIds): MeasuredTarget {
  const element = resolveActionTarget(args, ids)
  const rect = element.getBoundingClientRect()
  return {
    rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
    selector: uniqueSelectorFor(element),
    editable: isEditableElement(element),
    focusable: isFocusableElement(element),
    visible: rect.width > 0 && rect.height > 0,
  }
}

/** Focus one element and optionally select everything it contains. */
function prepare(
  args: { index?: number; selector?: string; select?: 'none' | 'contents' | 'end' },
  ids: ElementIds,
): { focused: boolean; selected: boolean } {
  const focusedOnly = args.index === undefined && args.selector === undefined
  const element = focusedOnly ? document.activeElement : resolveActionTarget(args, ids)
  if (!(element instanceof Element)) {
    throw new ActionError('action-failed', 'No element has focus; click the target first or pass index or selector.')
  }
  if (element instanceof HTMLElement) element.focus()
  let selected = false
  const selectAll = args.select === 'contents'
  const selectEnd = args.select === 'end'
  if (selectAll || selectEnd) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      if (selectAll) {
        element.select()
        selected = element.selectionStart === 0 && element.selectionEnd === element.value.length
      } else {
        const end = element.value.length
        element.setSelectionRange(end, end)
      }
    } else if (element instanceof HTMLElement && element.isContentEditable) {
      // Selecting a child would replace only that child; the editable host is
      // the element whose contents the caller means.
      const host = element.closest('[contenteditable]')
      const target = host instanceof HTMLElement ? host : element
      const selection = target.ownerDocument.getSelection()
      if (selection !== null) {
        const range = target.ownerDocument.createRange()
        range.selectNodeContents(target)
        if (selectEnd) range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
        selected = selectAll
      }
    }
  }
  const active = document.activeElement
  return {
    focused: active === element || (active !== null && (element.contains(active) || active.contains(element))),
    selected,
  }
}

/**
 * Report the placement of every frame between this document and the tab's
 * top-level viewport, innermost first.
 *
 * A cross-origin ancestor hides `window.frameElement`; the coordinates then
 * cannot be translated and the caller must not guess.
 */
function offsetChain(): FrameEdge[] {
  const edges: FrameEdge[] = []
  let current: Window = window
  try {
    while (current !== current.parent) {
      const owner = current.frameElement
      if (owner === null) {
        throw new ActionError('input-unavailable', 'The frame placement is unavailable across origins.')
      }
      const rect = owner.getBoundingClientRect()
      edges.push({
        left: rect.left,
        top: rect.top,
        clientLeft: owner.clientLeft,
        clientTop: owner.clientTop,
      })
      current = current.parent
    }
  } catch {
    throw new ActionError(
      'input-unavailable',
      'A cross-origin frame between this document and the tab hides its placement, so coordinates cannot be translated. '
      + 'Target the element by index or selector instead of by point.',
    )
  }
  return edges
}

/** Tag a file input so the debugger can address it by a unique selector. */
function markUpload(args: { token: string; index?: number; selector?: string }, ids: ElementIds): string {
  const element = resolveActionTarget(args, ids)
  if (!(element instanceof HTMLInputElement) || element.type !== 'file') {
    throw new ActionError('action-failed', 'browser_upload needs an input element with type="file".')
  }
  const token = args.token.replace(/[^a-zA-Z0-9-]/g, '')
  if (token === '') throw new ActionError('bad-args', 'upload token must not be empty.')
  element.setAttribute(UPLOAD_ATTRIBUTE, token)
  return `input[${UPLOAD_ATTRIBUTE}="${token}"]`
}

/** Remove the temporary upload marker. */
function clearUpload(token: string): boolean {
  const safe = token.replace(/"/g, '\\"')
  const element = document.querySelector(`input[${UPLOAD_ATTRIBUTE}="${safe}"]`)
  if (element === null) return false
  element.removeAttribute(UPLOAD_ATTRIBUTE)
  return true
}

/**
 * Handle one internal trusted-input setup request.
 *
 * @param request - the operation and its target.
 * @param ids - the frame's element registry.
 * @returns the structured result for the background.
 */
export function handleInputSetup(request: InputSetupRequest, ids: ElementIds): InputSetupResult {
  switch (request.op) {
    case 'measure':
      return { op: 'measure', measure: measure(request, ids) }
    case 'prepare':
      return { op: 'prepare', ...prepare(request, ids) }
    case 'offset':
      return { op: 'offset', edges: offsetChain() }
    case 'upload-mark':
      return { op: 'upload-mark', selector: markUpload(request, ids) }
    case 'upload-clear':
      return { op: 'upload-clear', cleared: clearUpload(request.token) }
    default: {
      const unknown = request as { op?: unknown }
      throw new ActionError('bad-args', `Unknown input setup operation: ${String(unknown.op)}.`)
    }
  }
}
