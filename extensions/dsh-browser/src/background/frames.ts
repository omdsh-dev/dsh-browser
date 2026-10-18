/**
 * Frame discovery and budget allocation for one browser tab.
 *
 * Frame ids identify a frame slot and are the routing half of the model-facing
 * `(frame, index)` element address. They can survive navigation, so security
 * checks additionally bind element ids and message delivery to `documentId`.
 * Element ids remain local to each content script, so a re-render in one
 * iframe cannot invalidate otherwise-stable ids in the rest of the page.
 *
 * @module
 */

import type { ContentBudget } from './tools.ts'

/** A live document frame in one tab. Main frame id is always zero. */
export interface TabFrame {
  frameId: number
  parentFrameId: number
  documentId?: string
  url: string
}

/** Per-frame limits whose sum never exceeds the negotiated tab budget. */
export interface FrameBudget extends ContentBudget {}

const MAIN_FRAME_SHARE = 0.8

/**
 * Discover all frames, falling back to the main frame when webNavigation is
 * unavailable or the tab is between navigations.
 */
export async function listTabFrames(tabId: number, mainUrl: string | undefined): Promise<TabFrame[]> {
  try {
    const discovered = await chrome.webNavigation.getAllFrames({ tabId })
    if (discovered !== null && discovered !== undefined && discovered.length > 0) {
      return sortTabFrames(discovered.map((frame) => ({
        frameId: frame.frameId,
        parentFrameId: frame.parentFrameId,
        documentId: frame.documentId,
        url: frame.url,
      })))
    }
  } catch {
    // A main-frame message still gives a useful result while the frame tree is
    // unavailable during a navigation or in older test/browser environments.
  }
  return [{ frameId: 0, parentFrameId: -1, url: mainUrl ?? '' }]
}

/** Sort parents before descendants without rebuilding the frame graph per comparison. */
export function sortTabFrames(frames: TabFrame[]): TabFrame[] {
  const parents = new Map(frames.map((frame) => [frame.frameId, frame.parentFrameId]))
  const depths = new Map<number, number>()
  for (const frame of frames) depths.set(frame.frameId, frameDepth(frame.frameId, parents))
  return [...frames].sort((a, b) => depths.get(a.frameId)! - depths.get(b.frameId)! || a.frameId - b.frameId)
}

function frameDepth(frameId: number, parents: Map<number, number>): number {
  const visited = new Set<number>()
  let depth = 0
  let parent = parents.get(frameId) ?? -1
  while (parent !== -1 && !visited.has(parent)) {
    visited.add(parent)
    depth += 1
    parent = parents.get(parent) ?? -1
  }
  return depth
}

/** Give the main document 80% of the budget and divide the exact remainder. */
export function allocateFrameBudgets(frames: TabFrame[], budget: ContentBudget): Map<number, FrameBudget> {
  if (frames.length <= 1) return new Map([[frames[0]?.frameId ?? 0, { ...budget }]])

  const mainFrame = frames.find((frame) => frame.frameId === 0) ?? frames[0]!
  const childFrames = frames.filter((frame) => frame !== mainFrame)
  const childIndex = new Map(childFrames.map((frame, index) => [frame.frameId, index]))
  const chars = allocateDimension(budget.maxChars, childFrames.length)
  const items = allocateDimension(budget.maxItems, childFrames.length)
  // Form fields are only partitioned when the caller negotiated a cap; an
  // absent value must stay absent so the content script keeps its own default.
  const forms = budget.maxForms === undefined
    ? undefined
    : allocateDimension(budget.maxForms, childFrames.length)

  const frameBudget = (isMain: boolean, index: number): FrameBudget => {
    const base: FrameBudget = isMain
      ? { maxChars: chars.main, maxItems: items.main }
      : { maxChars: chars.children[index]!, maxItems: items.children[index]! }
    if (forms !== undefined) base.maxForms = isMain ? forms.main : forms.children[index]!
    return base
  }

  return new Map(frames.map((frame) => [
    frame.frameId,
    frameBudget(frame === mainFrame, childIndex.get(frame.frameId) ?? 0),
  ]))
}

function allocateDimension(total: number, childCount: number): { main: number; children: number[] } {
  const boundedTotal = Math.max(0, Math.floor(total))
  const main = Math.min(boundedTotal, Math.max(1, Math.floor(boundedTotal * MAIN_FRAME_SHARE)))
  const remaining = boundedTotal - main
  const perChild = Math.floor(remaining / childCount)
  const remainder = remaining % childCount
  return {
    main,
    children: Array.from({ length: childCount }, (_, index) => perChild + (index < remainder ? 1 : 0)),
  }
}

/** A stable key for detecting frame navigation between delta snapshots. */
export function frameDocumentKey(frame: TabFrame): string {
  return frame.documentId ?? frame.url
}

/** Human-readable origin label; unsupported/opaque URLs stay visibly distinct. */
export function frameOrigin(frame: TabFrame): string {
  try {
    return new URL(frame.url).origin
  } catch {
    return frame.url === '' ? '(unknown)' : frame.url
  }
}
