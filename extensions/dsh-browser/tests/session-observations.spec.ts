// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { SessionObservations, type SessionState } from '../src/panel/session-observations.ts'

const idle: SessionState = { cursor: 12, active: true, running: false, queue: [], pendingInput: [] }

describe('session observations', () => {
  it('merges a delayed history baseline with changes received while opening the session', () => {
    const observations = new SessionObservations()
    observations.change('a', 12, [
      { key: 'conversationContinuation', val: 12 },
      { key: 'modelSelection', val: { next: { provider: 'deepseek', model: 'new' } } },
    ])
    observations.baseline('a', { asOfSeq: 8, values: {
      conversationContinuation: null,
      modelSelection: { next: { provider: 'deepseek', model: 'old' } },
      imageLimits: { maxImageBytes: 50 * 1024 * 1024 },
    } })
    observations.setState('a', idle)
    expect(observations.canContinue('a')).toBe(true)
    expect(observations.value('a', 'modelSelection')).toEqual({ next: { provider: 'deepseek', model: 'new' } })
    expect(observations.value('a', 'imageLimits')).toEqual({ maxImageBytes: 50 * 1024 * 1024 })
    observations.baseline('a', { asOfSeq: 13, values: { conversationContinuation: null } })
    expect(observations.canContinue('a')).toBe(false)
    expect(observations.value('a', 'imageLimits')).toBeUndefined()
  })

  it('requires host eligibility and quiescence, including the pending queue', () => {
    const observations = new SessionObservations()
    observations.baseline('a', { asOfSeq: 12, values: { conversationContinuation: 12 } })
    expect(observations.canContinue('a')).toBe(false)
    observations.setState('a', { ...idle, running: true })
    expect(observations.canContinue('a')).toBe(false)
    observations.setState('a', { ...idle, pendingInput: ['question'] })
    expect(observations.canContinue('a')).toBe(false)
    for (const placement of ['queued', 'steering'] as const) {
      observations.setState('a', { ...idle, queue: [{ id: 'user-input', placement, content: [] }] })
      expect(observations.canContinue('a')).toBe(false)
    }
    observations.setState('a', { ...idle, queue: [{ id: 'page', placement: 'context', content: [] }] })
    expect(observations.canContinue('a')).toBe(true)
    observations.setState('a', { ...idle, active: false, queue: null })
    expect(observations.canContinue('a')).toBe(true)
    expect(observations.canContinue('b')).toBe(false)
    observations.clear()
    expect(observations.canContinue('a')).toBe(false)
  })
})
