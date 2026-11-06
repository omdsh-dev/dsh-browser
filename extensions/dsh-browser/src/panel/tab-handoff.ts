/**
 * Panel-side handoff rules that do not need React.
 *
 * The banner offers three answers. Whether the "jump back to the assistant
 * page" answer applies is a pure function of the broadcast affinity state, so
 * it stays testable without a browser runtime and cannot drift from the
 * background's own status machine.
 *
 * @module
 */

import type { TabAffinityState } from '../background/tab-affinity.ts'

/**
 * The jump-back action exists only while a tab handoff is unresolved.
 *
 * It moves the user's own visible tab back to the page the assistant is still
 * bound to. Once that page is already active the state is `following`, and in
 * `background`/`pinned`/`lost` states the user has either accepted the split or
 * lost the controlled page, so offering the jump again would mislead.
 */
export function canReturnToControlledTab(state: TabAffinityState | null): boolean {
  return state !== null && state.status === 'handoff' && state.controlled !== null
}
