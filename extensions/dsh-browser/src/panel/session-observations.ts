export interface SessionState {
  cursor: number
  active: boolean
  running: boolean
  queue: readonly { id: string; placement: 'queued' | 'steering' | 'context'; content: readonly unknown[] }[] | null
  pendingInput: readonly string[]
}

export interface ProjectionBaseline {
  asOfSeq: number
  values: Record<string, unknown>
}

export interface ProjectionChange {
  key: string
  val: unknown
}

/** 保存打开会话期间收到的状态，并按每个投影的序号合并历史基线。 */
export class SessionObservations {
  private readonly states = new Map<string, SessionState>()
  private readonly projections = new Map<string, Map<string, { seq: number; value: unknown }>>()

  setState(sessionId: string, state: SessionState): void {
    this.states.set(sessionId, state)
  }

  state(sessionId: string): SessionState | undefined {
    return this.states.get(sessionId)
  }

  baseline(sessionId: string, baseline: ProjectionBaseline): void {
    const keys = new Set([...this.projections.get(sessionId)?.keys() ?? [], ...Object.keys(baseline.values)])
    this.change(sessionId, baseline.asOfSeq, [...keys].map(key => ({ key, val: baseline.values[key] })))
  }

  change(sessionId: string, seq: number, changes: readonly ProjectionChange[]): void {
    const current = this.projections.get(sessionId) ?? new Map<string, { seq: number; value: unknown }>()
    for (const { key, val } of changes) {
      const previous = current.get(key)
      if (previous === undefined || seq > previous.seq) current.set(key, { seq, value: val })
    }
    this.projections.set(sessionId, current)
  }

  value(sessionId: string, key: string): unknown {
    return this.projections.get(sessionId)?.get(key)?.value
  }

  canContinue(sessionId: string): boolean {
    const ending = this.value(sessionId, 'conversationContinuation')
    const state = this.states.get(sessionId)
    return typeof ending === 'number' && Number.isSafeInteger(ending) && ending >= 0
      && state !== undefined && !state.running && state.pendingInput.length === 0
      && (state.queue === null || state.queue.every(item => item.placement === 'context'))
  }

  clear(): void {
    this.states.clear()
    this.projections.clear()
  }
}
