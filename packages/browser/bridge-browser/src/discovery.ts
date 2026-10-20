/**
 * Fixed-port discovery listener.
 *
 * DSH Desktop starts its web server with `--port 0`, so the port that carries
 * `/ext/bridge` is assigned by the OS on every boot. The extension can only
 * probe a fixed port list, which makes a dynamically assigned port invisible:
 * the side panel stays on "disconnected" while the bridge itself is healthy.
 *
 * This listener publishes the current bridge URL on one stable loopback port
 * that the extension already probes. It does not move the real transport and
 * does not widen the bridge's attack surface: the published URL carries no
 * token, the listener answers one read-only route, and non-loopback deployment
 * still authenticate the WebSocket with the bearer token.
 *
 * @module @yuxianglin/dsh-bridge-browser/src/discovery
 */

import { createServer } from 'node:http'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { BRIDGE_CONFIG_PATH, BRIDGE_PATH } from './protocol.ts'

/**
 * Stable loopback port the bundled extension probes for zero-config
 * discovery. It matches the port the desktop user guide recommends pinning, so
 * a deployment that already pins its web port keeps working unchanged.
 */
export const DEFAULT_DISCOVERY_PORT = 43189

/** Inputs for {@link startDiscoveryListener}. */
export interface DiscoveryListenerOptions {
  /** Port to bind. `0` asks the OS for a free port (tests); the plugin never passes 0. */
  port: number
  /** Live web-server port; read per request so a restarted listener republishes itself. */
  webPort: () => number
  /** Bind address. Loopback only by design; defaults to `127.0.0.1`. */
  host?: string
  /** Warning sink. Discovery degrades instead of failing the boot. */
  warn?: (message: string) => void
}

/**
 * Build the bridge WebSocket URL published by the discovery route.
 * @param webPort - port carrying `/ext/bridge`.
 * @param host - loopback host to publish.
 * @returns an absolute `ws://` URL.
 */
export function discoveryUrl(webPort: number, host = '127.0.0.1'): string {
  return `ws://${host}:${String(webPort)}${BRIDGE_PATH}`
}

/**
 * Create the request handler for the discovery route.
 *
 * Only `GET`/`HEAD` on `BRIDGE_CONFIG_PATH` answer; everything else is a plain
 * 404 so the listener never becomes a general-purpose proxy of the host.
 *
 * @param webPort - live web-server port.
 * @param host - loopback host to publish.
 * @returns a Node request handler.
 */
export function createDiscoveryHandler(
  webPort: () => number,
  host = '127.0.0.1',
): (req: IncomingMessage, res: ServerResponse) => void {
  return (req, res) => {
    const method = req.method ?? 'GET'
    if (method !== 'GET' && method !== 'HEAD') {
      res.writeHead(405, { allow: 'GET, HEAD' }).end()
      return
    }
    const pathname = (req.url ?? '/').split('?')[0] ?? '/'
    if (pathname !== BRIDGE_CONFIG_PATH) {
      res.writeHead(404).end()
      return
    }
    const body = JSON.stringify({ wsUrl: discoveryUrl(webPort(), host) })
    res.writeHead(200, {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'content-length': String(Buffer.byteLength(body)),
    })
    res.end(method === 'HEAD' ? undefined : body)
  }
}

/**
 * Bind the discovery listener.
 *
 * Resolves `undefined` when discovery is unavailable: the port is already the
 * web port (the ordinary route answers there), the port is taken by another
 * process, or the bind fails. The caller keeps booting — a bridge without
 * discovery still works once the extension is pointed at it manually.
 *
 * @param options - bind port, live web port, host, and warning sink.
 * @returns the listening server, or `undefined` when discovery is skipped.
 */
export async function startDiscoveryListener(options: DiscoveryListenerOptions): Promise<Server | undefined> {
  const host = options.host ?? '127.0.0.1'
  const webPort = options.webPort()
  if (options.port !== 0 && options.port === webPort) {
    options.warn?.(
      `bridge-browser: discovery port ${String(options.port)} is the web port; ${BRIDGE_CONFIG_PATH} already answers there`,
    )
    return undefined
  }
  const server = createServer(createDiscoveryHandler(options.webPort, host))
  try {
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error): void => { reject(error) }
      server.once('error', onError)
      server.listen(options.port, host, () => {
        server.off('error', onError)
        resolve()
      })
    })
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    options.warn?.(
      `bridge-browser: discovery listener ${host}:${String(options.port)} unavailable (${reason});`
      + ' set the extension bridge address manually',
    )
    return undefined
  }
  return server
}
