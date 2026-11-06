/**
 * Fixed-port discovery beacon: a loopback HTTP endpoint that tells the browser
 * extension where this dsh instance listens.
 *
 * DSH Desktop launches its host with `--port 0`, so every launch lands on a
 * different OS-assigned port and no fixed list of real ports can find it. The
 * beacon binds the first free port of {@link BEACON_PORTS} and answers
 * {@link BRIDGE_CONFIG_PATH} with the real bridge URL, so discovery becomes a
 * handful of bounded probes instead of an ephemeral-range scan. Ports are tried
 * in order, so a machine running several dsh instances keeps them all
 * discoverable.
 *
 * Hardening: binds loopback only, sends no CORS headers (a web page cannot read
 * the answer), rejects a foreign `Host` header (DNS rebinding), and carries
 * nothing secret — the bridge WebSocket still authenticates every client.
 *
 * @module @yuxianglin/dsh-bridge-browser/src/discovery-beacon
 */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import {
  BRIDGE_CONFIG_PATH,
  bridgeConfigPayload,
  type BridgeInstanceInfo,
} from './protocol.ts'

/** Options for {@link startDiscoveryBeacon}. */
export interface DiscoveryBeaconOptions {
  /** Real port the host webserver bound; a getter keeps late binding safe. */
  hostPort: number | (() => number | undefined)
  /** Candidate ports, tried in order until one binds. */
  ports: readonly number[]
  /** Instance metadata carried in every answer. */
  info?: BridgeInstanceInfo
  /** Diagnostics sink; silent by default so embedding stays quiet. */
  warn?: (message: string) => void
}

/** A bound beacon. */
export interface DiscoveryBeacon {
  /** Loopback port the beacon actually bound. */
  port: number
  /** Stop listening and release the port. */
  close(): Promise<void>
}

/** Loopback authorities a browser on this machine may send. */
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost'])

/**
 * Validate and deduplicate candidate beacon ports, preserving order.
 * @param ports - candidate ports from configuration.
 * @returns the usable ports; invalid entries are dropped.
 */
export function sanitizeBeaconPorts(ports: readonly number[]): number[] {
  const seen = new Set<number>()
  for (const port of ports) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) continue
    seen.add(port)
  }
  return [...seen]
}

/**
 * Whether a configured bind address names this machine's loopback interface.
 * Non-loopback binds (a remote deployment) get no beacon: their clients cannot
 * use a `127.0.0.1` answer anyway.
 * @param host - bind address from the host webserver configuration.
 * @returns true for `127/8`, `::1`, and their IPv4-mapped forms.
 */
export function isLoopbackBindAddress(host: unknown): boolean {
  if (typeof host !== 'string') return true // unknown shape: the beacon is loopback-only anyway
  const bare = host.replace(/%.*$/u, '').toLowerCase()
  return bare === '::1'
    || bare === '0:0:0:0:0:0:0:1'
    || bare === '::ffff:127.0.0.1'
    || /^127\./u.test(bare)
}

/**
 * Whether a request's `Host` header names this beacon. A page that resolves its
 * own hostname to 127.0.0.1 (DNS rebinding) sends its own name here and is
 * rejected; the browser's loopback probes always send the address.
 * @param header - raw `Host` header.
 * @param port - port the beacon bound.
 */
export function isBeaconHost(header: string | undefined, port: number): boolean {
  if (header === undefined) return false
  const parts = header.toLowerCase().split(':')
  if (parts.length > 2) return false
  const [name = '', rawPort = ''] = parts
  if (!LOOPBACK_HOSTS.has(name)) return false
  return rawPort === '' || Number(rawPort) === port
}

/**
 * Bind the first free discovery port and serve the config answer.
 *
 * Never throws: a host that cannot bind any candidate keeps running without a
 * beacon, and the extension still finds it by scanning.
 * @param options - ports, host port source, instance metadata, diagnostics sink.
 * @returns the bound beacon, or `undefined` when every candidate is taken.
 */
export async function startDiscoveryBeacon(
  options: DiscoveryBeaconOptions,
): Promise<DiscoveryBeacon | undefined> {
  const ports = sanitizeBeaconPorts(options.ports)
  const warn = options.warn ?? ((): void => {})
  for (const port of ports) {
    let server: Server | undefined
    server = createServer((req, res) => { answer(req, res, server as Server, options) })
    try {
      await listen(server, port)
    } catch (error) {
      server.close()
      if (!isPortBusy(error)) {
        warn(`browser bridge: discovery beacon cannot bind 127.0.0.1:${String(port)}: ${describeError(error)}`)
      }
      continue
    }
    // The beacon must never keep the process alive; the host server owns that.
    server.unref()
    const bound = boundPort(server)
    return {
      port: bound,
      close: () => closeServer(server),
    }
  }
  if (ports.length > 0) {
    warn(`browser bridge: every discovery beacon port is busy (${ports.join(', ')}); the extension has to scan for this instance`)
  }
  return undefined
}

/** Answer one beacon request. */
function answer(
  req: IncomingMessage,
  res: ServerResponse,
  server: Server,
  options: DiscoveryBeaconOptions,
): void {
  const port = boundPort(server)
  if (!isBeaconHost(req.headers.host, port)) {
    return finish(res, 403, { 'content-type': 'text/plain; charset=utf-8' }, 'forbidden')
  }
  let pathname: string
  try {
    pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname
  } catch {
    return finish(res, 400)
  }
  if (pathname !== BRIDGE_CONFIG_PATH) return finish(res, 404)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return finish(res, 405, { allow: 'GET, HEAD' })
  }
  const hostPort = typeof options.hostPort === 'function' ? options.hostPort() : options.hostPort
  if (hostPort === undefined || !Number.isInteger(hostPort) || hostPort < 1) return finish(res, 503)
  const body = JSON.stringify(bridgeConfigPayload(hostPort, options.info, true))
  finish(res, 200, {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    'content-length': String(Buffer.byteLength(body)),
  }, req.method === 'HEAD' ? undefined : body)
}

/** Write a minimal response and end it. */
function finish(
  res: ServerResponse,
  status: number,
  headers: Record<string, string> = {},
  body?: string,
): void {
  res.writeHead(status, headers)
  res.end(body)
}

/** Subscribe, bind, and settle once the socket is listening. */
function listen(server: Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error): void => {
      server.off('listening', onListening)
      reject(error)
    }
    const onListening = (): void => {
      server.off('error', onError)
      resolve()
    }
    server.once('error', onError)
    server.once('listening', onListening)
    server.listen(port, '127.0.0.1')
  })
}

/** Port a listening server bound. */
function boundPort(server: Server): number {
  const address = server.address()
  return typeof address === 'object' && address !== null ? address.port : 0
}

/** Close a beacon, dropping idle keep-alive sockets so the port frees at once. */
function closeServer(server: Server): Promise<void> {
  return new Promise<void>((resolve) => {
    server.close(() => { resolve() })
    server.closeAllConnections?.()
  })
}

/** Whether a bind attempt failed because the port is taken or privileged. */
function isPortBusy(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code
  return code === 'EADDRINUSE' || code === 'EACCES'
}

/** One-line error text for a diagnostic. */
function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
