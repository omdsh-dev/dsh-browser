import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createConnection, createServer as createTcpServer } from 'node:net'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const bridge = join(root, 'packages/browser/bridge-browser')
const extension = join(root, 'extensions/dsh-browser/dist')
const require = createRequire(join(root, 'package.json'))
const bridgeRequire = createRequire(join(bridge, 'package.json'))
const { chromium } = bridgeRequire('playwright-core')
const cli = join(dirname(require.resolve('@deepseek-ai/dsh/package.json')), 'lib/bin.js')
const artifacts = join(root, '.artifacts/browser-smoke')
await mkdir(artifacts, { recursive: true })
const directory = await mkdtemp(join(artifacts, 'run-'))
const runtimeTmp = join(directory, 'tmp')
await mkdir(runtimeTmp)
const token = randomUUID()
const env = { ...process.env, DSH_HOME: join(directory, 'home'), TMPDIR: runtimeTmp, DSH_TELEMETRY_DISABLED: '1' }
delete env.DSH_EXT_TOKEN
delete env.DSH_BROWSER_SESSION_WORKSPACE
let host
let browser
let hostLog = ''
const results = []
let bridgeProxy
let bridgeOnline = true
const bridgeSockets = new Set()
const pendingSockets = new Set()
let pendingRequests = 0

async function waitFor(check, label, timeout = 60_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (host && (host.exitCode !== null || host.signalCode !== null)) throw new Error(`Host exited while waiting for ${label}: ${hostLog}`)
    const result = await check()
    if (result) return result
    await delay(100)
  }
  throw new Error(`Timed out waiting for ${label}: ${hostLog}`)
}

async function command(args) {
  const child = spawn(process.execPath, [cli, ...args], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', data => { output += data })
  child.stderr.on('data', data => { output += data })
  const [code] = await once(child, 'exit')
  assert.equal(code, 0, output)
}

const inner = `<!doctype html><body style="margin:0;min-height:1000px"><button id="inner" style="position:absolute;left:20px;top:20px;width:100px;height:50px">Inner target</button>
  <input id="upload" type="file" style="position:absolute;left:10px;top:100px;width:130px">
  <input id="input" value="abcd" style="position:absolute;left:150px;top:20px;width:100px">
  <script>
    window.innerClicks=0;window.pageMarker='frame-world';
    document.querySelector('#inner').addEventListener('click',()=>window.innerClicks++);
  </script></body>`
const childServer = createServer((request, response) => {
  response.setHeader('content-type', 'text/html')
  if (request.url === '/nested') {
    response.end(`<!doctype html><body style="margin:0">
      <iframe id="nestedSame" src="/inner?nested-same" style="position:absolute;left:20px;top:20px;width:280px;height:160px;border:7px solid;padding:3px;transform:scale(.9) rotate(4deg);transform-origin:0 0"></iframe>
      <iframe id="nestedCross" src="${origin}/inner?nested-cross" style="position:absolute;left:390px;top:20px;width:280px;height:160px;border:7px solid;padding:3px"></iframe></body>`)
    return
  }
  response.end(inner)
})
childServer.listen(0, '127.0.0.1')
await once(childServer, 'listening')
const crossOrigin = `http://127.0.0.1:${childServer.address().port}`
const crossSiteOrigin = `http://localhost:${childServer.address().port}`
const server = createServer((request, response) => {
  response.setHeader('content-type', 'text/html')
  if (request.url.startsWith('/inner')) { response.end(inner); return }
  response.end(`<!doctype html><style>#button { color: rgb(1, 2, 3); background-color: rgb(240, 240, 240); margin: 2px 3px 4px 5px; }
    #unrelated { color: rgb(4, 5, 6) }</style><body>
    <button id="button" style="position:absolute;left:20px;top:20px;width:100px;height:50px">Target</button>
    <input id="text" value="abcd" style="position:absolute;top:90px">
    <input id="disabled" type="button" disabled value="Disabled" style="position:absolute;top:120px">
    <fieldset disabled style="position:absolute;top:150px"><legend><input id="legend" type="button" value="Legend"></legend><input id="inherited" type="button" value="Inherited"></fieldset>
    <div id="editor" contenteditable="true" style="position:absolute;top:230px">abcd</div>
    <iframe id="same" src="/inner" style="position:absolute;left:300px;top:200px;width:280px;height:160px;border:0"></iframe>
    <iframe id="cross" src="${crossOrigin}/inner" style="position:absolute;left:600px;top:200px;width:280px;height:160px;border:0"></iframe>
    <iframe id="crossSite" src="${crossSiteOrigin}/inner" style="position:absolute;left:900px;top:200px;width:280px;height:160px;border:0"></iframe>
    <iframe id="nested" src="${crossSiteOrigin}/nested" style="position:absolute;left:300px;top:480px;width:740px;height:240px;border:5px solid;padding:4px"></iframe>
    <p style="position:absolute;top:400px">Public page text</p><span id="unrelated" style="position:absolute;top:440px">Unrelated</span>
    <script>
      window.executed=0;window.events=[];window.disabledClicks=0;
      for(const type of ['click','auxclick','contextmenu']) document.querySelector('#button').addEventListener(type,event=>window.events.push({type,button:event.button,shift:event.shiftKey}));
      for(const id of ['disabled','inherited']) document.getElementById(id).addEventListener('click',()=>window.disabledClicks++);
    </script></body>`)
})
server.listen(0, '127.0.0.1')
await once(server, 'listening')
const origin = `http://127.0.0.1:${server.address().port}`
const unavailableServer = createTcpServer()
unavailableServer.listen(0, '127.0.0.1')
await once(unavailableServer, 'listening')
const unavailablePort = unavailableServer.address().port
await new Promise(resolve => unavailableServer.close(resolve))
// 保持真实 TCP 请求未响应，用于验证停止生成和断线期间的状态变化。
const pendingServer = createTcpServer(socket => {
  pendingSockets.add(socket)
  socket.once('data', () => { pendingRequests += 1 })
  socket.on('close', () => { pendingSockets.delete(socket) })
})
pendingServer.listen(0, '127.0.0.1')
await once(pendingServer, 'listening')
const pendingPort = pendingServer.address().port

try {
  await command(['plugin', '--profile', 'web', 'add', '-w', `@yuxianglin/dsh-bridge-browser@link:${bridge}`])
  const patch = join(directory, 'host.patch.yml')
  await writeFile(patch, [
    '- id: bridge-browser', '  config:', `    token: ${JSON.stringify(token)}`,
    '    sessionWorkspacePath: ""',
    '- id: tool-executor-native', '  disabled: false',
    '- id: tool-executor-ptc', '  disabled: true',
    '- id: agent-default-model', '  config:',
    '    provider: connection-check', '    model: connection-check',
    '- id: llm-pi-ai', '  config:', '    providers:', '      connection-check:',
    '        api: openai-completions',
    `        baseURL: http://127.0.0.1:${unavailablePort}/v1`,
    '        headers:', '          Authorization: Bearer local-connection-check',
    '        models:', '          - id: connection-check', '            input: [text, image]',
    '          - id: connection-check-next', '            input: [text, image]',
    '        retryPolicy:', '          mode: normal', '          maxRetries: 0',
    '      pending-check:', '        api: openai-completions',
    `        baseURL: http://127.0.0.1:${pendingPort}/v1`,
    '        headers:', '          Authorization: Bearer local-pending-check',
    '        models:', '          - id: pending-check',
    '        retryPolicy:', '          mode: normal', '          maxRetries: 0',
    '- insert:', '    - id: browser-smoke-probe',
    `      name: ${JSON.stringify(pathToFileURL(join(root, 'scripts/fixtures/browser-probe.mjs')).href)}`,
    '      config:', `        token: ${JSON.stringify(token)}`, '',
  ].join('\n'))
  host = spawn(process.execPath, [cli, 'web', '--patch', patch, '--no-open', '--port', '0'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] })
  host.stdout.on('data', data => { hostLog += data })
  host.stderr.on('data', data => { hostLog += data })
  const base = await waitFor(() => hostLog.match(/dsh web: (http:\/\/127\.0\.0\.1:\d+)/)?.[1], 'DSH startup')
  const probe = await waitFor(() => hostLog.match(/Browser smoke probe: (http:\/\/127\.0\.0\.1:\d+)/)?.[1], 'tool probe startup')
  const configResponse = await fetch(`${base}/ext/bridge-config`)
  assert.equal(configResponse.status, 200)
  const config = await configResponse.json()
  const hostPort = Number(new URL(config.wsUrl).port)
  bridgeProxy = createTcpServer(client => {
    if (!bridgeOnline) { client.destroy(); return }
    const upstream = createConnection({ host: '127.0.0.1', port: hostPort })
    bridgeSockets.add(client)
    bridgeSockets.add(upstream)
    client.on('close', () => { bridgeSockets.delete(client); upstream.destroy() })
    upstream.on('close', () => { bridgeSockets.delete(upstream); client.destroy() })
    client.pipe(upstream).pipe(client)
  })
  bridgeProxy.listen(0, '127.0.0.1')
  await once(bridgeProxy, 'listening')
  config.wsUrl = `ws://127.0.0.1:${bridgeProxy.address().port}/ext/bridge`
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' }
  const hostRpc = async (namespace, method, request) => {
    const response = await fetch(probe, {
      method: 'POST', headers, body: JSON.stringify({ rpc: { namespace, method, args: { request } } }),
      signal: AbortSignal.timeout(35_000),
    })
    assert.equal(response.ok, true)
    return response.json()
  }
  const tool = async (name, args, cancelAfterMs) => {
    const response = await fetch(probe, { method: 'POST', headers, body: JSON.stringify({ name, args, cancelAfterMs }), signal: AbortSignal.timeout(35_000) })
    assert.equal(response.status, 200)
    return response.json()
  }
  const text = result => result.content.filter(block => block.type === 'text').map(block => block.text).join('\n')
  const succeed = result => { assert.equal(result.isError, false, JSON.stringify(result)); return text(result) }

  browser = await chromium.launchPersistentContext(join(directory, 'chromium'), {
    executablePath: process.env.CHROMIUM_PATH ?? chromium.executablePath(),
    channel: 'chromium', headless: true,
    env: { ...process.env, TMPDIR: runtimeTmp },
    viewport: { width: 1280, height: 900 },
    args: ['--site-per-process', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  })
  const worker = browser.serviceWorkers()[0] ?? await browser.waitForEvent('serviceworker')
  const extensionId = new URL(worker.url()).host
  const page = await browser.newPage()
  await page.goto(`${origin}/`)
  const panel = await browser.newPage()
  await panel.goto(`chrome-extension://${extensionId}/offscreen/index.html`)

  const openPanel = async () => panel.evaluate(async ({ config, origin }) => {
    // 使用正式侧栏端口提交设置和审批，后台 worker 保持生产构建。
    globalThis.messages = []
    globalThis.panelPort = chrome.runtime.connect({ name: 'dsh-panel' })
    panelPort.onMessage.addListener(message => messages.push(message))
    const [tab] = await chrome.tabs.query({ url: `${origin}/*` })
    assertTab(tab)
    panelPort.postMessage({ type: 'panel.window', windowId: tab.windowId })
    globalThis.sendSettings = settings => {
      const id = crypto.randomUUID()
      panelPort.postMessage({ type: 'settings', id, settings })
      return id
    }
    return sendSettings({ bridgeUrl: config.wsUrl, token: config.token, autoResumeSession: false, trustedActionOrigins: [origin] })
    function assertTab(tab) { if (tab?.id === undefined) throw new Error('Fixture tab missing') }
  }, { config: { wsUrl: config.wsUrl, token }, origin })
  const settingsDone = async id => {
    const answer = await waitFor(() => panel.evaluate(id => messages.find(message => message.type === 'settings.result' && message.id === id), id), 'settings response')
    assert.equal(answer.ok, true, JSON.stringify(answer))
  }
  const settings = async value => settingsDone(await panel.evaluate(value => sendSettings(value), value))
  await settingsDone(await openPanel())
  await waitFor(() => panel.evaluate(() => messages.some(message => message.type === 'status' && message.state === 'connected')), 'extension connection')
  await waitFor(async () => (await (await fetch(probe, { headers })).json()).includes('browser_console_eval'), 'developer tools registration')
  await page.bringToFront()
  const tabId = await panel.evaluate(async origin => (await chrome.tabs.query({ url: `${origin}/*` }))[0].id, origin)
  await settings({ unrestrictedBrowserAccess: true })
  succeed(await tool('browser_follow_tab', { tabId }))
  await settings({ unrestrictedBrowserAccess: false })

  succeed(await tool('browser_snapshot', {}))
  for (const sharing of ['off', 'ask']) {
    await settings({ sharePageContent: sharing })
    await page.locator('p').evaluate((element, sharing) => { element.textContent = `PRIVATE_${sharing}` }, sharing)
    const result = succeed(await tool('browser_type', { selector: '#text', text: 'X', trusted: true }))
    assert.doesNotMatch(result, /PRIVATE_|UNTRUSTED_PAGE_CONTENT|Changed form fields/)
  }
  await settings({ sharePageContent: 'auto' })
  assert.match(succeed(await tool('browser_type', { selector: '#text', text: 'Y', trusted: true })), /PRIVATE_ask/)
  results.push('trusted input obeys off, ask, and automatic page sharing')

  const approve = async (pending, decision, duringApproval) => {
    const request = await waitFor(() => panel.evaluate(() => messages.find(message => message.type === 'approval.request')?.request), 'developer-tools approval')
    assert.equal(request.devTools, true)
    if (duringApproval) await duringApproval()
    await panel.evaluate(({ id, decision }) => {
      messages = messages.filter(message => message.type !== 'approval.request')
      panelPort.postMessage({ type: 'approval.response', id, decision })
    }, { id: request.id, decision })
    return pending
  }
  const navigation = await approve(tool('browser_console_eval', { expression: 'window.executed++' }), 'allow-once', () => page.goto(`${origin}/next`))
  assert.equal(navigation.isError, true, JSON.stringify(navigation))
  assert.equal(await page.evaluate(() => window.executed), 0)
  results.push('navigation invalidates pending developer-tools approval')

  succeed(await approve(tool('browser_console_eval', { expression: 'window.executed++' }), 'trust-session'))
  succeed(await tool('browser_console_eval', { expression: 'window.executed++' }))
  await panel.evaluate(() => panelPort.disconnect())
  await settingsDone(await openPanel())
  const renewal = await approve(tool('browser_console_eval', { expression: 'window.executed++' }), 'allow-once')
  succeed(renewal)
  assert.equal(await page.evaluate(() => window.executed), 3)
  results.push('closing the last panel expires developer-tools session trust')

  await settings({ unrestrictedBrowserAccess: true, allowDevTools: true })
  for (const selector of ['#disabled', '#inherited']) {
    assert.equal((await tool('browser_click', { selector })).isError, true)
  }
  assert.equal(await page.evaluate(() => window.disabledClicks), 0)
  succeed(await tool('browser_click', { selector: '#legend' }))
  succeed(await tool('browser_click', { selector: '#button', button: 'right', modifiers: ['Shift'] }))
  assert.deepEqual(await page.evaluate(() => window.events), [
    { type: 'contextmenu', button: 2, shift: true }, { type: 'auxclick', button: 2, shift: true },
  ])
  succeed(await tool('browser_click', { selector: '#button', button: 'middle' }))
  assert.deepEqual(await page.evaluate(() => window.events.at(-1)), { type: 'auxclick', button: 1, shift: false })
  results.push('disabled controls, fieldset exceptions, right clicks, and modifier keys')

  for (const trusted of [true, false]) {
    await page.locator('#text').evaluate(input => { input.value = 'abcd'; input.focus(); input.setSelectionRange(2, 2) })
    succeed(await tool('browser_type', { selector: '#text', mode: 'insert', text: 'X', trusted }))
    assert.equal(await page.locator('#text').inputValue(), 'abXcd')
    await page.locator('#editor').evaluate(editor => {
      editor.textContent = 'abcd'; editor.focus(); const range = document.createRange(); range.setStart(editor.firstChild, 2); range.collapse(true);
      const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
    })
    succeed(await tool('browser_type', { selector: '#editor', mode: 'insert', text: 'X', trusted }))
    assert.equal(await page.locator('#editor').textContent(), 'abXcd')
  }
  results.push('caret insertion preserves selections in native and contenteditable fields')

  succeed(await tool('browser_clipboard', { action: 'write', text: 'Plain clipboard text', html: '<b>Rich clipboard text</b>' }))
  await page.locator('#text').evaluate(input => { input.value = '' })
  succeed(await tool('browser_clipboard', { action: 'paste', method: 'system', selector: '#text' }))
  assert.equal(await page.locator('#text').inputValue(), 'Plain clipboard text')
  await page.locator('#editor').evaluate(editor => { editor.textContent = '' })
  succeed(await tool('browser_clipboard', { action: 'paste', method: 'system', selector: '#editor' }))
  assert.equal(await page.locator('#editor b').textContent(), 'Rich clipboard text')
  succeed(await tool('browser_clipboard', { action: 'write', html: '<b>HTML &amp; &#20013;&#25991;</b>' }))
  await page.locator('#text').evaluate(input => { input.value = '' })
  succeed(await tool('browser_clipboard', { action: 'paste', method: 'system', selector: '#text' }))
  assert.equal(await page.locator('#text').inputValue(), 'HTML & 中文')
  results.push('system clipboard preserves independent plain-text and HTML formats and decodes HTML entities')

  await page.locator('#editor').evaluate(editor => {
    editor.addEventListener('paste', event => {
      window.eventPaste = {
        text: event.clipboardData.getData('text/plain'), html: event.clipboardData.getData('text/html'),
        bubbles: event.bubbles, cancelable: event.cancelable,
      }
      event.preventDefault()
    })
  })
  succeed(await tool('browser_clipboard', { action: 'paste', selector: '#editor', text: 'Event text', html: '<b onclick="alert(1)">Event HTML</b><script>alert(2)</script>' }))
  assert.deepEqual(await page.evaluate(() => window.eventPaste), {
    text: 'Event text', html: '<b>Event HTML</b>', bubbles: true, cancelable: true,
  })
  succeed(await tool('browser_clipboard', { action: 'paste', selector: '#editor', text: 'Plain event' }))
  assert.equal(await page.evaluate(() => window.eventPaste.html), '')
  await page.locator('#text').evaluate(input => { input.value = '' })
  succeed(await tool('browser_clipboard', { action: 'paste', selector: '#text', text: 'Unhandled event' }))
  assert.equal(await page.locator('#text').inputValue(), 'Unhandled event')
  results.push('native clipboard events deliver sanitized HTML and plain text, including ordinary input fields')

  const frameUrls = {
    same: `${origin}/inner`, cross: `${crossOrigin}/inner`, crossSite: `${crossSiteOrigin}/inner`,
    nestedSame: `${crossSiteOrigin}/inner?nested-same`, nestedCross: `${origin}/inner?nested-cross`,
  }
  const frameIds = await panel.evaluate(async ({ tabId, frameUrls }) => {
    const frames = await chrome.webNavigation.getAllFrames({ tabId })
    return Object.fromEntries(Object.entries(frameUrls).map(([kind, url]) => [kind, frames.find(frame => frame.url === url).frameId]))
  }, { tabId, frameUrls })
  for (const url of [frameUrls.crossSite, `${crossSiteOrigin}/nested`, frameUrls.nestedCross]) {
    const session = await browser.newCDPSession(page.frame({ url }))
    assert.equal((await session.send('Page.getFrameTree')).frameTree.frame.url, url)
    await session.detach()
  }
  results.push('site isolation creates verified separate CDP targets for cross-site and nested cross-site frames')
  const beforeEvents = await page.evaluate(() => window.events.length)
  for (const [kind, frame] of Object.entries(frameIds)) {
    const document = page.frame({ url: frameUrls[kind] })
    succeed(await tool('browser_snapshot', { frame }))
    const index = Number(await document.locator('#inner').getAttribute('data-dsh-el'))
    assert.ok(Number.isSafeInteger(index) && index > 0, kind)
    succeed(await tool('browser_click', { frame, index }))
    assert.equal(await document.evaluate(() => window.innerClicks), 1, kind)
    succeed(await tool('browser_click', { frame, selector: '#inner' }))
    assert.equal(await document.evaluate(() => window.innerClicks), 2, kind)
    succeed(await tool('browser_type', { frame, selector: '#input', text: kind, replace: true }))
    assert.equal(await document.locator('#input').inputValue(), kind)
    succeed(await tool('browser_scroll', { frame, direction: 'down', amount: 100 }))
    await waitFor(() => document.evaluate(() => scrollY > 0), `${kind} page scroll`)
    succeed(await tool('browser_scroll', { frame, direction: 'top' }))
    await waitFor(() => document.evaluate(() => scrollY === 0), `${kind} scroll to top`)
  }
  assert.equal(await page.evaluate(() => window.events.length), beforeEvents)
  results.push('element indices, selectors, text input, and page scrolling work in all five frame types without clicking the outer page')

  const upload = join(directory, 'upload.txt')
  await writeFile(upload, 'Browser upload regression fixture')
  for (const [kind, frame] of Object.entries(frameIds)) {
    succeed(await tool('browser_upload', { frame, selector: '#upload', paths: [upload] }))
    const url = frameUrls[kind]
    assert.equal(await page.frame({ url }).locator('#upload').evaluate(input => input.files[0].name), 'upload.txt')
    assert.match(succeed(await tool('browser_console_eval', { frame, expression: 'window.pageMarker' })), /frame-world/)
    succeed(await tool('browser_devtools_set_element_attribute', { frame, selector: '#inner', name: 'data-tested', value: kind }))
    assert.equal(await page.frame({ url }).locator('#inner').getAttribute('data-tested'), kind)
  }
  results.push('uploads and developer tools use Chrome frame identities across same-process and out-of-process iframes')

  succeed(await tool('browser_devtools_set_element_style', { selector: '#button', mode: 'rule', properties: [{ name: 'color', value: 'rgb(9, 8, 7)' }] }))
  assert.deepEqual(await page.locator('#button').evaluate(element => {
    const style = getComputedStyle(element); return [style.color, style.backgroundColor, style.marginLeft]
  }), ['rgb(9, 8, 7)', 'rgb(240, 240, 240)', '5px'])
  assert.equal(await page.locator('#unrelated').evaluate(element => getComputedStyle(element).color), 'rgb(4, 5, 6)')
  succeed(await tool('browser_devtools_set_element_style', { selector: '#button', mode: 'rule', properties: [{ name: 'margin-top', value: '12px' }] }))
  assert.deepEqual(await page.locator('#button').evaluate(element => {
    const style = getComputedStyle(element); return [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft]
  }), ['12px', '3px', '4px', '5px'])
  results.push('stylesheet rule edits preserve unrelated declarations and rules')
  const cancelStarted = performance.now()
  const canceled = await tool('browser_wait', { ms: 10_000 }, 500)
  assert.equal(canceled.isError, true, JSON.stringify(canceled))
  assert.ok(performance.now() - cancelStarted < 5_000, 'browser cancellation must settle before the requested wait')
  succeed(await tool('browser_get_text', { selector: '#unrelated' }))
  results.push('canceling an executing browser tool releases the next call')

  // 通过正式界面上传图片，并用真实连接失败验证继续生成。
  await worker.evaluate(async () => { await chrome.storage.local.set({ dshPanelUiLocale: 'en' }) })
  const chat = await browser.newPage()
  await chat.goto(`chrome-extension://${extensionId}/panel/index.html`)
  await page.bringToFront()
  const composer = chat.locator('textarea')
  await composer.waitFor()
  await waitFor(() => composer.isEnabled(), 'chat session readiness')
  await chat.locator('input[type=file]').setInputFiles(join(root, 'extensions/dsh-browser/assets/icons/icon32.png'))
  await composer.fill('Describe this image.')
  await chat.getByRole('button', { name: 'Send message', exact: true }).click()
  const continueButton = chat.getByRole('button', { name: 'Continue generating', exact: true })
  await continueButton.waitFor({ timeout: 30_000 })
  const preview = chat.locator('.message-image img')
  await preview.waitFor()
  assert.equal(await preview.evaluate(image => image.complete && image.naturalWidth > 0), true)
  assert.equal(await chat.locator('.row.user').count(), 1)
  await composer.fill('Keep this draft.')

  const bridgeRpc = async (method, payload) => {
    const id = await panel.evaluate(({ method, payload }) => {
      const id = crypto.randomUUID()
      panelPort.postMessage({ type: 'rpc', id, method, payload })
      return id
    }, { method, payload })
    const response = await waitFor(() => panel.evaluate(id => messages.find(message => (
      message.type === 'rpc.result' && message.id === id
    )), id), `panel ${method}`)
    assert.equal(response.ok, true, JSON.stringify(response))
    assert.equal(response.result.result.ok, true, JSON.stringify(response.result))
    return response.result.result.value
  }
  const listed = await bridgeRpc('session.list', {})
  const conversation = listed.items.find(item => !item.blank)
  assert.ok(conversation, JSON.stringify(listed))
  await continueButton.click()
  await waitFor(async () => {
    const history = await bridgeRpc('session.history', { sessionId: conversation.sessionId })
    return history.events.filter(({ event }) => event.type === 'turn/end').length === 2
  }, 'continued browser conversation')
  await continueButton.waitFor()
  assert.equal(await composer.inputValue(), 'Keep this draft.')
  assert.equal(await chat.locator('.row.user').count(), 1)
  const history = await bridgeRpc('session.history', { sessionId: conversation.sessionId })
  assert.ok(history.events.some(({ event }) => event.type === 'user/message'
    && event.data.source.kind === 'retry' && event.data.content.length === 0))
  results.push('image previews load through full attachment references and continuation preserves the composer draft')
  await bridgeRpc('session.selectModel', {
    sessionId: conversation.sessionId, provider: 'connection-check', model: 'connection-check-next',
  })
  await waitFor(async () => (await chat.locator('.composer-model > button').textContent()).includes('connection-check-next'),
    'model selection projection in the panel')
  await bridgeRpc('session.setPermission', { sessionId: conversation.sessionId, preset: 'read-only' })
  await waitFor(async () => (await chat.getByRole('button', { name: 'Permission preset', exact: true }).textContent()).includes('Read only'),
    'permission projection in the panel')
  results.push('model and permission changes made outside the panel update its controls')

  const secondChat = await browser.newPage()
  await secondChat.goto(`chrome-extension://${extensionId}/panel/index.html`)
  await page.bringToFront()
  const secondComposer = secondChat.locator('textarea')
  await waitFor(() => secondComposer.isEnabled(), 'second panel readiness')
  await secondComposer.fill('A separate conversation in another panel.')
  await secondChat.getByRole('button', { name: 'Send message', exact: true }).click()
  await secondChat.getByRole('button', { name: 'Continue generating', exact: true }).waitFor({ timeout: 30_000 })
  const secondConversation = (await bridgeRpc('session.list', {})).items.find(item => (
    !item.blank && item.sessionId !== conversation.sessionId
  ))
  assert.ok(secondConversation)
  await hostRpc('session', 'selectModel', {
    sessionId: conversation.sessionId, provider: 'pending-check', model: 'pending-check',
  })
  await waitFor(async () => (await chat.locator('.composer-model > button').textContent()).includes('pending-check'),
    'first panel model update while second panel is open')
  await composer.fill('Wait for a response so this turn can be canceled.')
  await chat.getByRole('button', { name: 'Send message', exact: true }).click()
  const stopButton = chat.getByRole('button', { name: 'Stop generating', exact: true })
  await stopButton.waitFor()
  await waitFor(() => pendingRequests > 0, 'pending provider request')
  await stopButton.click()
  await waitFor(async () => await stopButton.count() === 0, 'cancelled turn state in first panel')
  assert.equal(await secondChat.getByRole('button', { name: 'Continue generating', exact: true }).count(), 1)
  results.push('two panels retain independent subscriptions and stopping one preserves the other panel')

  const beforeReconnect = pendingRequests
  await composer.fill('Finish this turn while the bridge is disconnected.')
  await chat.getByRole('button', { name: 'Send message', exact: true }).click()
  await stopButton.waitFor()
  await waitFor(() => pendingRequests > beforeReconnect, 'second pending provider request')
  await composer.fill('Keep this draft across reconnect.')
  await panel.evaluate(() => { messages.length = 0 })
  bridgeOnline = false
  for (const socket of bridgeSockets) socket.destroy()
  await waitFor(() => panel.evaluate(() => messages.some(message => (
    message.type === 'status' && message.state === 'reconnecting'
  ))), 'bridge disconnection')
  await hostRpc('session', 'cancel', { sessionId: conversation.sessionId })
  await waitFor(async () => !(await hostRpc('session', 'state', { sessionId: conversation.sessionId })).running,
    'host turn completion during disconnection')
  await hostRpc('session', 'selectModel', {
    sessionId: conversation.sessionId, provider: 'connection-check', model: 'connection-check-next',
  })
  bridgeOnline = true
  await waitFor(() => panel.evaluate(() => messages.some(message => (
    message.type === 'status' && message.state === 'connected'
  ))), 'bridge reconnection')
  await waitFor(async () => await stopButton.count() === 0, 'restored idle state after reconnect')
  await waitFor(async () => (await chat.locator('.composer-model > button').textContent()).includes('connection-check-next'),
    'restored model after reconnect')
  assert.equal(await composer.inputValue(), 'Keep this draft across reconnect.')
  await hostRpc('session', 'selectModel', {
    sessionId: conversation.sessionId, provider: 'connection-check', model: 'connection-check',
  })
  await waitFor(async () => (await chat.locator('.composer-model > button').textContent()).trim() === 'connection-check',
    'live projection after reconnect')
  await secondChat.getByRole('button', { name: 'Continue generating', exact: true }).waitFor()
  results.push('reconnection restores both panels, completed turn state, history and live projections without losing drafts')
  await writeFile(join(directory, 'results.json'), JSON.stringify(results, null, 2))
  console.log(`Browser smoke passed: ${results.join('; ')}`)
  console.log(`Evidence: ${directory}`)
} finally {
  if (browser) await browser.close()
  for (const socket of bridgeSockets) socket.destroy()
  if (bridgeProxy) await new Promise(resolve => bridgeProxy.close(resolve))
  for (const socket of pendingSockets) socket.destroy()
  await new Promise(resolve => pendingServer.close(resolve))
  if (host && host.exitCode === null && host.signalCode === null) {
    host.kill('SIGTERM')
    await once(host, 'exit')
  }
  await new Promise(resolve => server.close(resolve))
  await new Promise(resolve => childServer.close(resolve))
  await writeFile(join(directory, 'host.log'), hostLog)
}
