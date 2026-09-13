/**
 * Browser smoke: the built MV3 extension connects through a real WebSocket to
 * the migrated bridge carrier. dsh 0.1.2 Remote semantics are covered by
 * remote-host-api.spec; this test deliberately owns no pre-0.1.2 Host shim.
 */

import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type BrowserContext } from 'playwright-core'
import { BridgeServer } from '../../src/server.ts'
import type { BrowserHostApi, HostRpcCall, HostRpcResult } from '../../src/host-api.ts'

const TOKEN = 'e2e0e2e0e2e0e2e0e2e0e2e0e2e0e2e0'
const EXTENSION_DIR = resolve(import.meta.dirname, '../../../../../extensions/dsh-browser/dist')

function chromiumExecutable(): string | undefined {
  const fromEnv = process.env.PLAYWRIGHT_CHROMIUM_PATH
  if (fromEnv !== undefined && existsSync(fromEnv)) return fromEnv
  const cacheRoot = join(process.env.HOME ?? '', 'Library', 'Caches', 'ms-playwright')
  if (!existsSync(cacheRoot)) return undefined
  for (const dir of ['chromium-1217', 'chromium-1226', 'chromium-1181']) {
    for (const candidate of [
      join(cacheRoot, dir, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
      join(cacheRoot, dir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
      join(cacheRoot, dir, 'chrome-linux', 'chrome'),
    ]) {
      if (existsSync(candidate)) return candidate
    }
  }
  return undefined
}

function abortWait(signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve()
  return new Promise<void>((resolveWait) => {
    signal.addEventListener('abort', () => { resolveWait() }, { once: true })
  })
}

let executable: string | undefined
let browser: BrowserContext | undefined
let profile: string | undefined
let http: Server | undefined
let bridge: BridgeServer | undefined
let port: number | undefined
const calls: HostRpcCall[] = []

beforeAll(async () => {
  executable = chromiumExecutable()
  if (executable === undefined || !existsSync(join(EXTENSION_DIR, 'manifest.json'))) return

  const api: BrowserHostApi = {
    async call(request): Promise<HostRpcResult> {
      calls.push(request)
      if (request.method === 'session.create') return { ok: true, value: { sessionId: 'session-browser-e2e' } }
      if (request.method === 'session.history') {
        return { ok: true, value: { events: [], hasMore: false } }
      }
      if (request.method === 'session.list') return { ok: true, value: { items: [] } }
      if (request.method === 'workspace.list') {
        return { ok: true, value: { items: [], archivedSessionIds: [] } }
      }
      return { ok: true, value: {} }
    },
    async *events(signal) { await abortWait(signal) },
    async respond() { return { accepted: false, reason: 'not-pending' } },
  }
  bridge = new BridgeServer({
    token: TOKEN,
    api,
    toolTimeoutMs: 10_000,
    caps: { textOnly: true, snapshotMaxChars: 32_000, maxInteractiveItems: 60 },
    injectBrowserSnapshot: () => {},
    purgeSession: async () => {},
  })
  http = createServer((req, res) => {
    if (req.url === '/ext/bridge-config') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ wsUrl: `ws://127.0.0.1:${String(port)}/ext/bridge` }))
      return
    }
    // A real rendered page for the capture test: blank documents can produce
    // tiny or uniform images that would not prove a screenshot was taken.
    if (req.url === '/page') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end([
        '<!doctype html><html><head><meta charset="utf-8"><title>Vision e2e</title></head>',
        '<body style="margin:0;background:#0b5">',
        '<h1 style="font:700 72px sans-serif;color:#fff;padding:40px">VISION-E2E</h1>',
        '</body></html>',
      ].join(''))
      return
    }
    res.writeHead(404)
    res.end('not found')
  })
  http.on('upgrade', (req, socket, head) => { bridge?.handleUpgrade(req, socket, head) })
  await new Promise<void>((resolveListen) => { http?.listen(0, '127.0.0.1', resolveListen) })
  port = (http.address() as AddressInfo).port

  profile = await mkdtemp(join(tmpdir(), 'dsh-browser-extension-e2e-'))
  browser = await chromium.launchPersistentContext(profile, {
    executablePath: executable,
    channel: 'chromium',
    headless: true,
    // The panel derives its UI locale from navigator.languages, and this spec
    // addresses the Chinese labels. Pinning the locale keeps the selectors
    // valid instead of depending on the machine the suite happens to run on.
    locale: 'zh-CN',
    args: [
      `--disable-extensions-except=${EXTENSION_DIR}`,
      `--load-extension=${EXTENSION_DIR}`,
    ],
  })
})

afterAll(async () => {
  await browser?.close()
  await bridge?.close()
  if (http !== undefined) {
    await new Promise<void>((resolveClose) => { http?.close(() => { resolveClose() }) })
  }
  if (profile !== undefined) await rm(profile, { recursive: true, force: true })
})

describe('extension ↔ migrated bridge smoke', () => {
  it('connects, negotiates caps, and initializes a Session through the private bridge protocol', { timeout: 60_000 }, async () => {
    if (executable === undefined) {
      console.warn('SKIP: no usable Chromium')
      return
    }
    if (browser === undefined || port === undefined) {
      console.warn('SKIP: extension dist not built')
      return
    }

    let worker = browser.serviceWorkers()[0]
    worker ??= await browser.waitForEvent('serviceworker', { timeout: 30_000 })
    const extensionId = new URL(worker.url()).host
    const panel = await browser.newPage()
    await panel.goto(`chrome-extension://${extensionId}/panel/index.html`)
    await panel.waitForSelector('header.topbar', { timeout: 15_000 })

    await panel.click('button[aria-label="打开设置"]')
    await panel.fill('input[placeholder*="自动检测"]', `ws://127.0.0.1:${String(port)}`)
    await panel.fill('input[type="password"]', TOKEN)
    await panel.click('text=保存并连接')

    await expect.poll(
      () => panel.locator('.connection').textContent(),
      { timeout: 30_000 },
    ).toContain('已连接')
    await expect.poll(
      () => calls.some(request => request.method === 'session.history'),
      { timeout: 15_000 },
    ).toBe(true)
    expect(calls.map(request => request.method)).toEqual(expect.arrayContaining([
      'session.create', 'session.history',
    ]))

    // The rebuilt extension must declare capture during hello, or the bridge
    // would never offer browser_screenshot. This is the one half of the
    // vision path a real browser can settle here: the capture itself needs a
    // controlled http(s) tab, and in this harness the side panel is itself a
    // tab, so it becomes the bound target and has no host permission to
    // photograph. A real side panel is not a tab, so that ordering artifact
    // does not exist in the product.
    expect(bridge.clientCapabilities()?.screenshots).toBe(true)

    await panel.close()
  })
})
