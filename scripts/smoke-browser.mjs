import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
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

const inner = `<!doctype html><body style="margin:0;overflow:hidden"><button id="inner" style="position:absolute;left:20px;top:20px;width:100px;height:50px">Inner target</button>
  <input id="upload" type="file" style="position:absolute;left:10px;top:100px;width:130px">
  <div id="scroller" style="position:absolute;left:150px;top:20px;width:100px;height:120px;overflow:auto"><div style="height:1000px">Scroll target</div></div>
  <script>
    window.innerClicks=0;window.pageMarker='frame-world';window.pointerEvents=[];
    document.querySelector('#inner').addEventListener('click',()=>window.innerClicks++);
    for(const type of ['pointerdown','pointerup','pointermove','click','contextmenu','wheel']) document.addEventListener(type,event=>{
      window.pointerEvents.push({type,x:event.clientX,y:event.clientY,button:event.button,shift:event.shiftKey,trusted:event.isTrusted});
      if(type==='contextmenu') event.preventDefault();
    });
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

try {
  await command(['plugin', '--profile', 'web', 'add', '-w', `@yuxianglin/dsh-bridge-browser@link:${bridge}`])
  const patch = join(directory, 'host.patch.yml')
  await writeFile(patch, [
    '- id: bridge-browser', '  config:', `    token: ${JSON.stringify(token)}`,
    '    sessionWorkspacePath: ""',
    '- id: tools', '  config:', '    mode: native',
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
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' }
  const tool = async (name, args) => {
    const response = await fetch(probe, { method: 'POST', headers, body: JSON.stringify({ name, args }), signal: AbortSignal.timeout(35_000) })
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
    succeed(await tool('browser_click', { frame, point: { x: 40, y: 40 } }))
    assert.equal(await document.evaluate(() => window.innerClicks), 1, kind)
    const clicked = await document.evaluate(() => window.pointerEvents.find(event => event.type === 'click'))
    assert.ok(clicked.trusted && Math.abs(clicked.x - 40) <= 1 && Math.abs(clicked.y - 40) <= 1, JSON.stringify({ kind, clicked }))
    succeed(await tool('browser_click', { frame, selector: '#inner', trusted: true }))
    assert.equal(await document.evaluate(() => window.innerClicks), 2, kind)
    await document.evaluate(() => { window.pointerEvents = [] })
    succeed(await tool('browser_click', { frame, action: 'drag', point: { x: 40, y: 40 }, to: { x: 100, y: 60 }, steps: 4 }))
    const events = await document.evaluate(() => window.pointerEvents)
    for (const [type, x, y] of [['pointerdown', 40, 40], ['pointerup', 100, 60]]) {
      const event = events.find(event => event.type === type)
      assert.ok(event?.trusted && Math.abs(event.x - x) <= 1 && Math.abs(event.y - y) <= 1, JSON.stringify({ kind, type, events }))
    }
    assert.ok(events.some(event => event.type === 'pointermove' && event.trusted), kind)
    succeed(await tool('browser_scroll', { frame, point: { x: 180, y: 50 }, deltaY: 100 }))
    await waitFor(() => document.locator('#scroller').evaluate(element => element.scrollTop > 0), `${kind} wheel scroll`)
    assert.equal(await document.evaluate(() => window.pointerEvents.find(event => event.type === 'wheel')?.trusted), true, kind)
  }
  assert.equal(await page.evaluate(() => window.events.length), beforeEvents)
  results.push('trusted clicks, selector clicks, drags, and wheel scrolling hit all five frame types without clicking the outer page')

  for (const transform of ['scale(.9) rotate(7deg)', 'perspective(500px) rotateY(25deg)', 'scale(.25) rotate(7deg)']) {
    await page.locator('#same, #cross, #crossSite, #nested').evaluateAll((elements, transform) => {
      document.body.style.minHeight = '1400px';
      for (const element of elements) Object.assign(element.style, { border: '7px solid', padding: '3px', transform, transformOrigin: '0 0' });
      window.scrollTo(0, 100);
    }, transform)
    assert.equal(await page.evaluate(() => scrollY), 100)
    for (const [kind, frame] of Object.entries(frameIds)) {
      const document = page.frame({ url: frameUrls[kind] })
      await document.evaluate(() => { window.pointerEvents = [] })
      succeed(await tool('browser_click', { frame, point: { x: 40, y: 40 } }))
      const clicked = await document.evaluate(() => window.pointerEvents.find(event => event.type === 'click'))
      assert.ok(clicked?.trusted && Math.abs(clicked.x - 40) <= 1 && Math.abs(clicked.y - 40) <= 1, JSON.stringify({ kind, transform, clicked }))
      await document.locator('#scroller').evaluate(element => { element.scrollTop = 0 })
      succeed(await tool('browser_scroll', { frame, point: { x: 180, y: 50 }, deltaY: 100 }))
      await waitFor(() => document.locator('#scroller').evaluate(element => element.scrollTop > 0), `${kind} transformed wheel scroll`)
    }
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  results.push('frame coordinates survive borders, padding, page scrolling, nested transforms, rotation, scaling, and perspective')

  const pointerFrame = page.frame({ url: frameUrls.crossSite })
  await pointerFrame.evaluate(() => { window.pointerEvents = [] })
  for (const [action, point] of [['down', { x: 40, y: 40 }], ['move', { x: 80, y: 50 }], ['up', { x: 100, y: 60 }]]) {
    succeed(await tool('browser_click', { frame: frameIds.crossSite, action, point, modifiers: ['Shift'] }))
  }
  const heldEvents = await pointerFrame.evaluate(() => window.pointerEvents)
  for (const type of ['pointerdown', 'pointermove', 'pointerup']) {
    assert.ok(heldEvents.some(event => event.type === type && event.trusted && event.shift), JSON.stringify(heldEvents))
  }
  succeed(await tool('browser_click', { frame: frameIds.crossSite, point: { x: 40, y: 40 }, button: 'right', modifiers: ['Shift'] }))
  assert.ok(await pointerFrame.evaluate(() => window.pointerEvents.some(event => event.type === 'contextmenu' && event.trusted && event.button === 2 && event.shift)))
  results.push('out-of-process frames preserve pointer state across calls and receive trusted modifier/right-click gestures')

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
  await writeFile(join(directory, 'results.json'), JSON.stringify(results, null, 2))
  console.log(`Browser smoke passed: ${results.join('; ')}`)
  console.log(`Evidence: ${directory}`)
} finally {
  if (browser) await browser.close()
  if (host && host.exitCode === null && host.signalCode === null) {
    host.kill('SIGTERM')
    await once(host, 'exit')
  }
  await new Promise(resolve => server.close(resolve))
  await new Promise(resolve => childServer.close(resolve))
  await writeFile(join(directory, 'host.log'), hostLog)
}
