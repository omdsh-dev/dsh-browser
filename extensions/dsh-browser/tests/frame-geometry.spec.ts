// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { framePointMapper } from '../src/shared/frame-geometry.ts'

describe('framePointMapper', () => {
  it('maps a translated viewport with unequal scaling', () => {
    const map = framePointMapper([100, 50, 500, 50, 500, 350, 100, 350], 200, 100)
    expect(map({ x: 40, y: 20 })).toEqual({ x: 180, y: 110 })
  })

  it('maps a rotated viewport', () => {
    const map = framePointMapper([300, 100, 300, 300, 200, 300, 200, 100], 200, 100)
    expect(map({ x: 40, y: 20 })).toEqual({ x: 280, y: 140 })
  })

  it('uses perspective division inside a trapezoid', () => {
    const map = framePointMapper([0, 0, 100, 0, 80, 100, 20, 100], 100, 100)
    const center = map({ x: 50, y: 50 })
    expect(center.x).toBeCloseTo(50)
    expect(center.y).toBeCloseTo(62.5)
    expect(map({ x: 100, y: 100 }).x).toBeCloseTo(80)
  })

  it('rejects missing, collapsed, and non-finite geometry', () => {
    expect(() => framePointMapper([], 100, 100)).toThrow()
    expect(() => framePointMapper([0, 0, 0, 0, 0, 0, 0, 0], 100, 100)).toThrow()
    expect(() => framePointMapper([0, 0, 100, 0, 100, 100, 0, 100], 0, 100)).toThrow()
    expect(() => framePointMapper([0, 0, Infinity, 0, 100, 100, 0, 100], 100, 100)).toThrow()
  })
})
