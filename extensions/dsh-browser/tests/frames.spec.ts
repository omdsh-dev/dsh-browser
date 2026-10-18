// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { allocateFrameBudgets, sortTabFrames, type TabFrame } from '../src/background/frames.ts'

function frames(count: number): TabFrame[] {
  return Array.from({ length: count }, (_, frameId) => ({
    frameId,
    parentFrameId: frameId === 0 ? -1 : 0,
    url: `https://frame-${frameId}.example/`,
  }))
}

describe('allocateFrameBudgets', () => {
  it('gives a single main frame the complete negotiated budget', () => {
    expect(allocateFrameBudgets(frames(1), { maxItems: 60, maxChars: 12_000 }).get(0))
      .toEqual({ maxItems: 60, maxChars: 12_000 })
  })

  it('reserves 80% for the main frame and divides the exact remainder', () => {
    const allocated = allocateFrameBudgets(frames(3), { maxItems: 10, maxChars: 100 })

    expect(allocated.get(0)).toEqual({ maxItems: 8, maxChars: 80 })
    expect(allocated.get(1)).toEqual({ maxItems: 1, maxChars: 10 })
    expect(allocated.get(2)).toEqual({ maxItems: 1, maxChars: 10 })
  })

  it('partitions the negotiated form cap only when the caller supplied one', () => {
    expect(allocateFrameBudgets(frames(1), { maxItems: 60, maxChars: 12_000 }).get(0))
      .toEqual({ maxItems: 60, maxChars: 12_000 })

    const allocated = allocateFrameBudgets(frames(3), { maxItems: 10, maxChars: 100, maxForms: 10 })

    expect(allocated.get(0)).toEqual({ maxItems: 8, maxChars: 80, maxForms: 8 })
    expect(allocated.get(1)).toEqual({ maxItems: 1, maxChars: 10, maxForms: 1 })
    expect(allocated.get(2)).toEqual({ maxItems: 1, maxChars: 10, maxForms: 1 })
    expect([...allocated.values()].reduce((sum, entry) => sum + (entry.maxForms ?? 0), 0)).toBe(10)
  })

  it('uses zero-item child allocations when the negotiated cap is exhausted', () => {
    const allocated = allocateFrameBudgets(frames(6), { maxItems: 1, maxChars: 3 })

    expect(allocated.get(0)).toEqual({ maxItems: 1, maxChars: 2 })
    expect([...allocated.values()].slice(1).map((entry) => entry.maxItems)).toEqual([0, 0, 0, 0, 0])
    expect([...allocated.values()].reduce((sum, entry) => sum + entry.maxItems, 0)).toBe(1)
    expect([...allocated.values()].reduce((sum, entry) => sum + entry.maxChars, 0)).toBe(3)
  })

  it('never exceeds either cap across iframe-heavy pages', () => {
    for (const frameCount of [2, 3, 25, 100]) {
      for (const maxItems of [1, 2, 10, 60]) {
        const budget = { maxItems, maxChars: maxItems * 7 }
        const allocated = [...allocateFrameBudgets(frames(frameCount), budget).values()]
        expect(allocated.reduce((sum, entry) => sum + entry.maxItems, 0)).toBeLessThanOrEqual(budget.maxItems)
        expect(allocated.reduce((sum, entry) => sum + entry.maxChars, 0)).toBeLessThanOrEqual(budget.maxChars)
      }
    }
  })
})

describe('sortTabFrames', () => {
  it('orders parents before nested descendants without mutating the input', () => {
    const input: TabFrame[] = [
      { frameId: 9, parentFrameId: 4, url: 'https://deep.example/' },
      { frameId: 4, parentFrameId: 0, url: 'https://child.example/' },
      { frameId: 0, parentFrameId: -1, url: 'https://top.example/' },
      { frameId: 2, parentFrameId: 0, url: 'https://sibling.example/' },
    ]

    expect(sortTabFrames(input).map((frame) => frame.frameId)).toEqual([0, 2, 4, 9])
    expect(input.map((frame) => frame.frameId)).toEqual([9, 4, 0, 2])
  })
})
