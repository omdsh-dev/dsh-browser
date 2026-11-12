/**
 * Track session ids that the browser extension has driven through the bridge.
 * Desktop-native sessions must keep the host userQuestions waterfall so the
 * Desktop UI can render ask_user_question cards.
 * @module @yuxianglin/dsh-bridge-browser/src/extension-sessions
 */

/** Mutable registry of extension-owned session ids. */
export class ExtensionSessionRegistry {
  private readonly ids = new Set<string>()

  /** Remember a session the extension successfully created or prompted. */
  note(sessionId: string | undefined): void {
    if (typeof sessionId === 'string' && sessionId.length > 0) this.ids.add(sessionId)
  }

  /** Whether the extension has touched this session over the bridge. */
  has(sessionId: string | undefined): boolean {
    return typeof sessionId === 'string' && this.ids.has(sessionId)
  }
}
