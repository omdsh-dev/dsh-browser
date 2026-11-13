/**
 * Bridge bearer-token lifecycle: generation, constant-time verification, and
 * file persistence under the dsh home directory.
 *
 * The token authenticates the browser extension against the bridge WebSocket.
 * It is NOT the /api trust fence (that stays untouched); it is the bridge
 * path's own auth because the bridge route lives outside the fence by design.
 *
 * @module
 */

import { randomBytes, timingSafeEqual } from 'node:crypto'
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { dshHomePath } from '@deepseek-ai/dsh-home-paths'

/** File name of the persisted token inside the dsh home. */
export const TOKEN_FILE_NAME = 'ext-bridge-token'

/**
 * Generate a fresh token as lowercase hex.
 * @param bytes - 随机数据的字节数，默认 32（256 位）。
 * @returns the hex token string.
 */
export function generateToken(bytes: number = 32): string {
  return randomBytes(bytes).toString('hex')
}

/**
 * Constant-time token comparison. Length mismatch fails fast (still constant
 * time on the compared prefix) — a wrong-length token can never verify.
 * @param expected - the configured token.
 * @param actual - the token presented by the client.
 * @returns true only when both are equal-length hex and byte-equal.
 */
export function verifyToken(expected: string, actual: string): boolean {
  // UTF-8 byte comparison, not hex decoding: hex would silently truncate
  // non-hex configured tokens (Buffer.from('fixed-token','hex') is empty)
  // and collapse 'deadbeef-team' to 'deadbeef', losing token entropy.
  const expectedBuf = Buffer.from(expected, 'utf8')
  const actualBuf = Buffer.from(actual, 'utf8')
  if (expectedBuf.length === 0 || expectedBuf.length !== actualBuf.length) return false
  return timingSafeEqual(expectedBuf, actualBuf)
}

/**
 * Path of the persisted token file under the dsh home.
 * @returns absolute path like `~/.dsh/ext-bridge-token`.
 */
export function tokenFilePath(): string {
  return dshHomePath(TOKEN_FILE_NAME)
}

/**
 * Read the persisted token; returns undefined when absent or unreadable.
 * @param file - token file path.
 * @returns the stored hex token, trimmed.
 */
export async function readTokenFile(file: string = tokenFilePath()): Promise<string | undefined> {
  try {
    return (await readFile(file, 'utf8')).trim()
  } catch {
    return undefined
  }
}

/**
 * Persist a token atomically (temp file + rename) with 0600 permissions.
 * @param token - hex token to persist.
 * @param file - token file path.
 */
export async function writeTokenFile(token: string, file: string = tokenFilePath()): Promise<void> {
  await mkdir(dirname(file), { recursive: true })
  const temp = `${file}.tmp-${process.pid}`
  await writeFile(temp, `${token}\n`, { mode: 0o600 })
  await chmod(temp, 0o600)
  await rename(temp, file)
}

/**
 * Resolve the bridge token: an explicitly configured token wins; otherwise the
 * persisted file is reused when present, and a fresh token is generated and
 * persisted otherwise.
 * @param configured - token from plugin config, or undefined.
 * @param file - token file path (injectable for tests).
 * @returns `{ token, file, generated }` where `generated` records whether a new token was minted.
 */
export async function resolveToken(
  configured: string | undefined,
  file: string = tokenFilePath(),
): Promise<{ token: string; file: string; generated: boolean }> {
  if (configured !== undefined && configured.length > 0) {
    return { token: configured, file, generated: false }
  }
  const persisted = await readTokenFile(file)
  if (persisted !== undefined && persisted.length > 0) return { token: persisted, file, generated: false }
  const token = generateToken()
  await writeTokenFile(token, file)
  return { token, file, generated: true }
}
