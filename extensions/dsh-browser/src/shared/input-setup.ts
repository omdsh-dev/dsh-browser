/**
 * Internal content-script protocol for trusted input.
 *
 * Trusted input runs in the background (CDP), but focusing and selecting
 * happen in the frame that owns the element. These request/result
 * shapes are the contract between the two halves; they never reach the model.
 *
 * @module
 */

/** What the background asks a frame to prepare before trusted input. */
export type InputSetupRequest =
  | { op: 'prepare'; index?: number; selector?: string; select?: 'none' | 'contents' | 'end' }
  | { op: 'upload-mark'; token: string; index?: number; selector?: string }
  | { op: 'upload-clear'; token: string }

/** Result of one setup request. */
export type InputSetupResult =
  | { op: 'prepare'; focused: boolean; selected: boolean }
  | { op: 'upload-mark'; selector: string }
  | { op: 'upload-clear'; cleared: boolean }
