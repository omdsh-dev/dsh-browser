/**
 * Internal content-script protocol for trusted input.
 *
 * Trusted input runs in the background (CDP), but focusing, selecting, and
 * measuring happen in the frame that owns the element. These request/result
 * shapes are the contract between the two halves; they never reach the model.
 *
 * @module
 */

/** Element geometry inside one frame's viewport. */
export interface ElementRect {
  x: number
  y: number
  width: number
  height: number
}

/** What the background asks a frame to prepare before trusted input. */
export type InputSetupRequest =
  | { op: 'measure'; index?: number; selector?: string }
  | { op: 'prepare'; index?: number; selector?: string; select?: 'none' | 'contents' | 'end' }
  | { op: 'upload-mark'; token: string; index?: number; selector?: string }
  | { op: 'upload-clear'; token: string }

/** A measured element, with everything a trusted pointer needs to hit it. */
export interface MeasuredTarget {
  rect: ElementRect
  selector: string
  editable: boolean
  focusable: boolean
  visible: boolean
}

/** Result of one setup request. */
export type InputSetupResult =
  | { op: 'measure'; measure: MeasuredTarget }
  | { op: 'prepare'; focused: boolean; selected: boolean }
  | { op: 'upload-mark'; selector: string }
  | { op: 'upload-clear'; cleared: boolean }
