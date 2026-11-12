import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { cp, mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(join(root, 'packages', 'browser', 'bridge-browser', 'package.json'))
const { chromium } = require('playwright-core')
const artifacts = join(root, '.artifacts', 'uninstall-ui')
await mkdir(artifacts, { recursive: true })
const directory = await mkdtemp(join(artifacts, 'run-'))
const runtimeTmp = join(directory, 'runtime')
await mkdir(runtimeTmp)
const results = []

for (const mode of ['managed', 'checkout', 'unknown']) {
  const home = join(directory, mode, "DSH 中文 & user's home")
  const extension = join(home, 'browser-extension')
  await mkdir(home, { recursive: true })
  await cp(join(root, 'extensions', 'dsh-browser', 'dist'), extension, { recursive: true })
  if (mode !== 'unknown') {
    const source = mode === 'managed' ? join(home, 'dsh-browser') : join(directory, mode, 'source checkout 中文')
    await mkdir(join(source, 'scripts'), { recursive: true })
    for (const name of ['uninstall.sh', 'uninstall.ps1', 'uninstall.mjs']) {
      await cp(join(root, 'scripts', name), join(source, 'scripts', name))
    }
    if (mode === 'managed') await writeFile(join(source, '.managed-by-install-sh'), '')
    const result = spawnSync(process.execPath, [join(root, 'scripts', 'write-install-info.mjs'),
      join(extension, 'install-info.json'), mode, source, home], { encoding: 'utf8' })
    if (result.error) throw result.error
    assert.equal(result.status, 0, result.stderr)
  }
  const launch = () => chromium.launchPersistentContext(join(directory, mode, 'chromium'), {
    executablePath: process.env.CHROMIUM_PATH ?? chromium.executablePath(),
    channel: 'chromium', headless: true,
    env: { ...process.env, TMPDIR: runtimeTmp, TMP: runtimeTmp, TEMP: runtimeTmp },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  })
  let browser = await launch()
  try {
    let worker = browser.serviceWorkers()[0] ?? await browser.waitForEvent('serviceworker')
    const id = new URL(worker.url()).host
    // 验证服务离线时仍可操作卸载入口。
    await worker.evaluate(async () => {
      await chrome.storage.local.set({
        dshSettings: { bridgeUrl: 'ws://uninstall.invalid:43189/ext/bridge', autoResumeSession: false },
        dshPanelUiLocale: 'en',
      })
    })
    await browser.close()
    browser = await launch()
    worker = browser.serviceWorkers()[0] ?? await browser.waitForEvent('serviceworker')
    const page = await browser.newPage()
    for (const locale of ['en', 'zh']) {
      await worker.evaluate(async locale => { await chrome.storage.local.set({ dshPanelUiLocale: locale }) }, locale)
      await page.goto(`chrome-extension://${id}/panel/index.html`)
      await page.getByRole('button', { name: locale === 'en' ? 'Open settings' : '打开设置', exact: true }).click()
      const card = page.locator('.uninstall-card')
      await card.locator('summary').click()
      await card.locator('.uninstall-command').waitFor()
      const command = await card.locator('.uninstall-command').innerText()
      if (mode !== 'unknown') {
        assert.ok(command.includes('--home'))
        assert.ok(command.includes(process.platform === 'win32' ? "''" : "'\"'\"'"))
        const options = { encoding: 'utf8', env: process.env, timeout: 30_000 }
        const preview = process.platform === 'win32'
          ? spawnSync('powershell.exe', ['-NoProfile', '-Command', `${command} --dry-run`], options)
          : spawnSync('bash', ['-c', `${command} --dry-run`], options)
        if (preview.error) throw preview.error
        assert.equal(preview.status, 0, preview.stdout + preview.stderr)
        assert.ok(preview.stdout.includes(home))
      } else {
        assert.ok(command.endsWith('| bash') || command.endsWith('-File $s }'))
      }
      await page.bringToFront()
      await card.getByRole('button', { name: locale === 'en' ? 'Copy uninstall command' : '复制卸载命令', exact: true }).click()
      await card.getByRole('button', { name: locale === 'en' ? 'Command copied' : '命令已复制', exact: true }).waitFor()
      results.push({ mode, locale, command, copied: true })
    }
  } finally {
    await browser.close()
  }
}

await writeFile(join(directory, 'results.json'), JSON.stringify(results, null, 2) + '\n')
console.log(`Uninstall UI passed: ${results.length} cases. Evidence: ${directory}`)
