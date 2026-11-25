#!/usr/bin/env node
/**
 * Native messaging host for the dsh browser extension.
 *
 * The side panel cannot spawn processes itself, so it asks this host to make
 * sure the local dsh web server is running. The host answers as soon as it has
 * spawned the server (it does not wait for the port to bind) and the extension
 * keeps retrying discovery while the server boots.
 *
 * Windows: Chromium can only launch an .exe, so DshNativeHost.exe relays its
 * stdio to this file. macOS/Linux can execute this file directly (shebang).
 *
 * Protocol: 4-byte little-endian length + UTF-8 JSON, in both directions.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
/** The dsh CLI this checkout pins; the server is started from it directly so
 * no shell wrapper sits between the browser and the host. */
const DSH_BIN = path.join(ROOT, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
const BEACON_PORT = 43189
const BEACON_PATH = '/ext/bridge-config'
/** Remembers a spawn whose beacon has not answered yet, so a second
 * "start" request within the boot window does not spawn a duplicate. */
const LOCK_PATH = path.join(HERE, 'host-lock.json')
/** A lock older than this is stale even if its pid still happens to exist. */
const LOCK_MAX_AGE_MS = 10 * 60_000
/** Append-only log for spawn failures; useful when auto-start misbehaves. */
const LAUNCH_LOG = path.join(HERE, 'host-launch.log')

function readFrame() {
  return new Promise((resolve) => {
    let buffer = Buffer.alloc(0)
    process.stdin.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk])
      if (buffer.length < 4) return
      const length = buffer.readUInt32LE(0)
      if (buffer.length < 4 + length) return
      const body = buffer.subarray(4, 4 + length).toString('utf8')
      try {
        resolve(JSON.parse(body))
      } catch {
        resolve(undefined)
      }
    })
    process.stdin.on('end', () => resolve(undefined))
  })
}

function writeFrame(message) {
  const body = Buffer.from(JSON.stringify(message), 'utf8')
  const header = Buffer.alloc(4)
  header.writeUInt32LE(body.length, 0)
  let exited = false
  const exit = () => { if (!exited) { exited = true; process.exit(0) } }
  // Exit from the write callback so a small reply is never cut off; the timer
  // is a backstop for streams that never report completion.
  process.stdout.write(Buffer.concat([header, body]), exit)
  setTimeout(exit, 1_000)
}

/** Query the loopback discovery beacon; undefined when no host answers. */
function beacon() {
  return new Promise((resolve) => {
    const request = http.get({
      host: '127.0.0.1',
      port: BEACON_PORT,
      path: BEACON_PATH,
      headers: { host: `127.0.0.1:${BEACON_PORT}` },
      timeout: 1500,
    }, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { body += chunk })
      response.on('end', () => {
        if (response.statusCode !== 200) return resolve(undefined)
        try {
          resolve(JSON.parse(body))
        } catch {
          resolve(undefined)
        }
      })
    })
    request.on('timeout', () => { request.destroy(); resolve(undefined) })
    request.on('error', () => resolve(undefined))
  })
}

/** The lock's pid when it is fresh and that process is alive; otherwise undefined. */
function liveLockPid() {
  try {
    const lock = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'))
    if (typeof lock?.pid !== 'number' || typeof lock?.at !== 'number') return undefined
    if (Date.now() - lock.at > LOCK_MAX_AGE_MS) return undefined
    process.kill(lock.pid, 0)
    return lock.pid
  } catch {
    return undefined
  }
}

/** Persist the pid of a server we just spawned (best effort). */
function writeLock(pid) {
  try {
    fs.writeFileSync(LOCK_PATH, JSON.stringify({ pid, at: Date.now() }), 'utf8')
  } catch {
    /* diagnostics only */
  }
}

/** Drop the lock (best effort). */
function clearLock() {
  try { fs.rmSync(LOCK_PATH, { force: true }) } catch { /* best effort */ }
}

/**
 * Start the pinned dsh web server detached from this (short-lived) process.
 * @returns the child pid, or undefined when the spawn failed.
 */
function launch() {
  const fd = fs.openSync(LAUNCH_LOG, 'a')
  fs.writeSync(fd, `\n=== ${new Date().toISOString()} launch ${DSH_BIN}\n`)
  try {
    const child = spawn(process.execPath, [DSH_BIN, 'web', '--port', '0', '--no-open'], {
      cwd: ROOT,
      detached: true,
      stdio: ['ignore', fd, fd],
      windowsHide: true,
      env: process.env,
    })
    child.unref()
    if (typeof child.pid === 'number') writeLock(child.pid)
    return typeof child.pid === 'number' ? child.pid : undefined
  } catch (error) {
    fs.writeSync(fd, `launch error: ${String(error)}\n`)
    return undefined
  } finally {
    try { fs.closeSync(fd) } catch { /* best effort */ }
  }
}

const message = await readFrame()
const command = typeof message?.type === 'string' ? message.type : 'ensure-host'
const running = await beacon()
const lockedPid = liveLockPid()

if (command === 'status') {
  writeFrame({ ok: true, running: running !== undefined, beacon: running, booting: running === undefined && lockedPid !== undefined })
} else if (command === 'stop-host') {
  // The beacon advertises the host's pid; a host that is still booting has no
  // beacon yet, so fall back to the lock written at spawn time.
  const pid = typeof running?.pid === 'number' ? running.pid : (lockedPid ?? undefined)
  let stopped = false
  if (pid !== undefined) {
    try {
      process.kill(pid)
      stopped = true
    } catch {
      stopped = false
    }
  }
  clearLock()
  writeFrame({ ok: true, running: running !== undefined, stopped, ...(pid === undefined ? {} : { pid }) })
} else if (running !== undefined) {
  writeFrame({ ok: true, running: true, spawned: false, beacon: running })
} else if (lockedPid !== undefined) {
  // A previous request already spawned a server that has not bound its beacon
  // yet; do not spawn a second one.
  writeFrame({ ok: true, running: false, spawned: false, booting: true, pid: lockedPid })
} else {
  clearLock()
  const pid = launch()
  writeFrame({ ok: pid !== undefined, running: false, spawned: pid !== undefined, ...(pid === undefined ? {} : { pid }) })
}
