/**
 * Native-messaging bridge to the local launcher.
 *
 * The side panel cannot spawn processes itself, so when no dsh host answers
 * discovery the background asks a tiny native host (registered under the
 * browser) to start one. That host answers as soon as it has spawned the
 * server; the caller keeps retrying discovery while the server boots.
 *
 * @module
 */

/** Native host name; must match the manifest registered with the browser. */
export const NATIVE_HOST_NAME = 'com.dsh.browser_host'

/** Answer of one ensure-host request. */
export interface HostStartResult {
  /** Whether the request reached the native host and it did its job. */
  ok: boolean
  /** True when a dsh host was already answering the discovery beacon. */
  running?: boolean
  /** True when this request started a new host process. */
  spawned?: boolean
  /** True when a previously spawned host is still booting (no beacon yet). */
  booting?: boolean
  /** Diagnostic text when the native host could not be reached. */
  error?: string
}

/** Answer of one stop-host request. */
export interface HostStopResult {
  /** Whether the request reached the native host. */
  ok: boolean
  /** True when a host was answering the beacon before the stop. */
  running?: boolean
  /** True when the host process was actually signalled. */
  stopped?: boolean
  /** Process id the stop targeted. */
  pid?: number
  /** Diagnostic text when the native host could not be reached. */
  error?: string
}

/** One native-messaging round trip. */
function ask(message: Record<string, unknown>, timeoutMs: number): Promise<Record<string, unknown> & { ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (result: Record<string, unknown> & { ok: boolean; error?: string }): void => {
      if (settled) return
      settled = true
      resolve(result)
    }
    try {
      chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, message, (response: unknown) => {
        // Reading lastError inside the callback keeps Chrome from logging an
        // unchecked-runtime-error warning when the host is not installed.
        const error = chrome.runtime.lastError
        if (error) {
          finish({ ok: false, error: error.message })
          return
        }
        if (typeof response !== 'object' || response === null) {
          finish({ ok: false, error: 'empty native host response' })
          return
        }
        finish(response as Record<string, unknown> & { ok: boolean })
      })
    } catch (error) {
      finish({ ok: false, error: String(error) })
    }
    // A wedged native host must not stall the caller forever.
    setTimeout(() => finish({ ok: false, error: 'native host timed out' }), timeoutMs)
  })
}

/**
 * Ask the native host to make sure a local dsh host is running.
 *
 * Never rejects: a missing, denied, or wedged native host resolves
 * `{ ok: false }` so the panel keeps its normal "not found" behaviour.
 *
 * @returns the native host's answer
 */
export async function requestHostStart(): Promise<HostStartResult> {
  return await ask({ type: 'ensure-host' }, 15_000) as HostStartResult
}

/**
 * Ask the native host to stop the dsh host it knows about.
 *
 * @returns the native host's answer
 */
export async function requestHostStop(): Promise<HostStopResult> {
  return await ask({ type: 'stop-host' }, 15_000) as HostStopResult
}
