import type { ServerFrame } from '@yuxianglin/dsh-bridge-browser/src/protocol.ts'

type EventFrame = Extract<ServerFrame, { t: 'event' }>

/**
 * Service-worker cache for mux state that is not durable session history.
 * A newly opened panel requests this baseline after installing its listeners.
 */
export class TransientEventCache {
  private readonly questions = new Map<string, EventFrame>()
  private readonly states = new Map<string, EventFrame>()

  ingest(frame: ServerFrame): void {
    if (frame.t !== 'event' || !isRecord(frame.frame.payload)) return
    const payload = frame.frame.payload
    const sessionId = payload.sessionId
    if (typeof sessionId !== 'string') return

    if (frame.frame.method === 'question/requested') {
      this.questions.set(questionKey(sessionId, frame.frame.rpcId), frame)
      return
    }
    if (frame.frame.method === 'question/resolved') {
      if (typeof payload.questionRpcId === 'string') {
        this.questions.delete(questionKey(sessionId, payload.questionRpcId))
      }
      return
    }
    if (frame.frame.method === 'session/state') {
      this.states.set(sessionId, frame)
      return
    }
    if (frame.frame.method !== 'session/event' || !isRecord(payload.event)) return
    if (payload.event.type === 'turn/end') {
      this.deleteSessionQuestions(sessionId)
    }
  }

  replay(): EventFrame[] {
    return [...this.states.values(), ...this.questions.values()]
  }

  clear(): void {
    this.states.clear()
    this.questions.clear()
  }

  private deleteSessionQuestions(sessionId: string): void {
    const prefix = `${sessionId}\0`
    for (const key of this.questions.keys()) {
      if (key.startsWith(prefix)) this.questions.delete(key)
    }
  }
}

function questionKey(sessionId: string, rpcId: string): string {
  return `${sessionId}\0${rpcId}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
