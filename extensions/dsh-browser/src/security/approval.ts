/** Shared panel/background contract for browser action approval. */

export type ApprovalKind = 'read' | 'action'
export type ApprovalDecision =
  | 'deny'
  | 'allow-once'
  | 'always-allow-reads'
  | 'trust-session'
  | 'trust-origin'
  /**
   * Cover every later capture in this session.
   *
   * A screenshot ships raw pixels, which the masking that makes per-read
   * confirmation tolerable does not reach, so it is consented to on its own
   * terms instead of borrowing the page-sharing policy: one decision, then
   * silence until the panel closes.
   */
  | 'allow-screenshots-session'
/** Background authorization result; transport failures must not masquerade as a user decision. */
export type ApprovalAuthorization = 'approved' | 'denied' | 'unavailable' | 'timed-out' | 'cancelled'

/** A policy decision awaiting a user response. */
export interface ApprovalPrompt {
  kind: ApprovalKind
  action: string
  summary: string
  origins: string[]
  /** True only when one stable origin can safely be added to the action allowlist. */
  canTrust: boolean
}

/** Correlated request delivered to every open side-panel view. */
export interface ApprovalRequest extends ApprovalPrompt {
  id: string
  /** Agent session that requested the browser operation, when known. */
  sessionId?: string
}

export function isApprovalDecision(value: unknown): value is ApprovalDecision {
  return value === 'deny'
    || value === 'allow-once'
    || value === 'always-allow-reads'
    || value === 'trust-session'
    || value === 'trust-origin'
    || value === 'allow-screenshots-session'
}
