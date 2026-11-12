import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const artifacts = join(root, '.artifacts', 'uninstall-tests')
mkdirSync(artifacts, { recursive: true })
const run = mkdtempSync(join(artifacts, 'run-'))
const anchor = realpathSync(join(root, 'node_modules', '@deepseek-ai', 'dsh', 'package.json'))
const require = createRequire(anchor)
const { initProfile } = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-app-boot')).href)
const { runPluginCommand } = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-plugin-manager/operations')).href)
const current = '@yuxianglin/dsh-bridge-browser'
const legacy = '@deepseek-ai/dsh-bridge-browser'
const other = '@deepseek-ai/dsh-experimental-terminal-bundle'

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

async function addBridge(fixture, profileName, name, source = fixture.bridge) {
  const dir = join(fixture.home, 'profiles', profileName)
  initProfile(dir, ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'])
  const result = await runPluginCommand({ profile: profileName, dir, installAnchor: anchor, cwd: dir },
    ['add', '-w', `${name}@link:${source}`], {
      execution: 'service', outputBytes: 16384, env: { DSH_HOME: fixture.home },
    })
  assert.equal(result.exitCode, 0, result.output)
}

async function installation(name, { mode = 'checkout', bridges = [current], oldMetadata = false, sourceInHome = false } = {}) {
  const base = join(run, name)
  const home = join(base, 'DSH 空间 & user')
  const source = mode === 'managed' || sourceInHome ? join(home, 'dsh-browser') : join(base, "source checkout 中文 ' &")
  const extension = join(home, 'browser-extension')
  const profile = join(home, 'profiles', 'web')
  mkdirSync(source, { recursive: true })
  cpSync(join(root, 'package.json'), join(source, 'package.json'))
  if (mode === 'managed') writeFileSync(join(source, '.managed-by-install-sh'), '')
  cpSync(join(root, 'scripts'), join(source, 'scripts'), { recursive: true })
  const bridge = join(source, 'packages', 'browser', 'bridge-browser')
  cpSync(join(root, 'packages', 'browser', 'bridge-browser'), bridge, {
    recursive: true, filter: path => !path.split(/[\\/]/u).includes('node_modules'),
  })
  symlinkSync(join(root, 'node_modules'), join(source, 'node_modules'), 'junction')
  cpSync(join(root, 'extensions', 'dsh-browser', 'dist'), extension, { recursive: true })
  const info = { schemaVersion: 1, mode, ...(mode === 'checkout' ? { sourceRoot: source } : {}) }
  if (oldMetadata) writeJson(join(extension, 'install-info.json'), info)
  else {
    const result = spawnSync(process.execPath, [join(root, 'scripts', 'write-install-info.mjs'),
      join(extension, 'install-info.json'), mode, source, home], { encoding: 'utf8' })
    if (result.error) throw result.error
    assert.equal(result.status, 0, result.stderr)
    assert.equal(readJson(join(extension, 'install-info.json')).dshHome, realpathSync(home))
  }
  mkdirSync(join(home, 'sessions'), { recursive: true })
  writeFileSync(join(home, 'sessions', 'preserved.txt'), 'session data to preserve\n')
  writeJson(join(home, 'settings.json'), { account: 'preserved account settings' })
  writeFileSync(join(home, 'ext-bridge-token'), 'test-bridge-token\n')
  initProfile(profile, ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', other])
  const fixture = { base, home, source, extension, profile, bridge }
  for (const name of bridges) await addBridge(fixture, 'web', name)
  return fixture
}

function uninstall(fixture, args = [], { entry = 'node', env = {}, fromSource = false } = {}) {
  const options = {
    cwd: fromSource ? fixture.source : root,
    encoding: 'utf8', env: { ...process.env, DSH_HOME: fixture.home, ...env }, timeout: 120_000,
  }
  const script = join(fromSource ? fixture.source : root, 'scripts', `uninstall.${entry === 'node' ? 'mjs' : entry === 'bash' ? 'sh' : 'ps1'}`)
  const result = entry === 'node'
    ? spawnSync(process.execPath, [script, ...args], options)
    : entry === 'bash'
      ? spawnSync('bash', [script, ...args], options)
      : spawnSync(entry, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, ...args], options)
  if (result.error) throw result.error
  writeFileSync(join(fixture.base, `uninstall-${entry}.log`), result.stdout + result.stderr)
  return result
}

function preserved(fixture) {
  assert.equal(readFileSync(join(fixture.home, 'sessions', 'preserved.txt'), 'utf8'), 'session data to preserve\n')
  assert.deepEqual(readJson(join(fixture.home, 'settings.json')), { account: 'preserved account settings' })
  const manifest = readJson(join(fixture.profile, 'package.json'))
  assert.deepEqual(manifest.dsh.profile.bundles, ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', other])
  assert.equal(existsSync(join(fixture.profile, 'cordis.patch.yml')), true)
}

test('managed installation: native removal, owned files, preserved data and repeat execution', async () => {
  const fixture = await installation('managed', { mode: 'managed' })
  await addBridge(fixture, 'web', other, dirname(require.resolve(`${other}/package.json`)))
  const otherDependency = readJson(join(fixture.profile, 'package.json')).dependencies[other]
  const result = uninstall(fixture)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const manifest = readJson(join(fixture.profile, 'package.json'))
  assert.equal(manifest.dependencies?.[current], undefined)
  assert.equal(existsSync(join(fixture.profile, 'node_modules', current)), false)
  assert.equal(manifest.dependencies[other], otherDependency)
  assert.equal(existsSync(join(fixture.profile, 'node_modules', other, 'package.json')), true)
  assert.equal(existsSync(fixture.source), false)
  assert.equal(existsSync(fixture.extension), false)
  assert.equal(existsSync(join(fixture.home, 'ext-bridge-token')), false)
  preserved(fixture)
  const repeat = uninstall(fixture)
  assert.equal(repeat.status, 0, repeat.stderr)
  preserved(fixture)
})

test('checkout and junction: current and legacy names removed, target source retained', async () => {
  const fixture = await installation('checkout', { bridges: [current, legacy], oldMetadata: true })
  symlinkSync(fixture.bridge, join(fixture.profile, '.dsh-browser-source'), 'junction')
  const result = uninstall(fixture, ['--home', fixture.home], { env: { DSH_HOME: join(fixture.base, 'unused home') } })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const manifest = readJson(join(fixture.profile, 'package.json'))
  assert.equal(manifest.dependencies?.[current], undefined)
  assert.equal(manifest.dependencies?.[legacy], undefined)
  assert.equal(existsSync(join(fixture.source, 'scripts', 'install.sh')), true)
  assert.equal(existsSync(join(fixture.bridge, 'package.json')), true)
  assert.equal(existsSync(join(fixture.profile, '.dsh-browser-source')), false)
  preserved(fixture)
})

test('other profiles retain their bridge, shared workspace and token', async () => {
  const fixture = await installation('shared', { mode: 'managed' })
  await addBridge(fixture, 'another-profile', current)
  const otherManifest = readFileSync(join(fixture.home, 'profiles', 'another-profile', 'package.json'), 'utf8')
  const result = uninstall(fixture)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(existsSync(fixture.source), true)
  assert.equal(readFileSync(join(fixture.home, 'ext-bridge-token'), 'utf8'), 'test-bridge-token\n')
  assert.equal(readFileSync(join(fixture.home, 'profiles', 'another-profile', 'package.json'), 'utf8'), otherManifest)
  preserved(fixture)
})

test('linked profiles retain the shared workspace and token', async () => {
  const fixture = await installation('linked-profile', { mode: 'managed' })
  await addBridge(fixture, 'another-profile', current)
  const profile = join(fixture.home, 'profiles', 'another-profile')
  const external = join(fixture.base, 'external-profile')
  renameSync(profile, external)
  symlinkSync(external, profile, 'junction')
  const before = readFileSync(join(external, 'package.json'), 'utf8')
  const result = uninstall(fixture)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(existsSync(fixture.source), true)
  assert.equal(readFileSync(join(fixture.home, 'ext-bridge-token'), 'utf8'), 'test-bridge-token\n')
  assert.equal(readFileSync(join(external, 'package.json'), 'utf8'), before)
  assert.equal(existsSync(fixture.extension), false)
  preserved(fixture)
})

test('other profiles retain the shared source junction and their package resolution', async () => {
  const fixture = await installation('shared-junction', { mode: 'managed' })
  const link = join(fixture.profile, '.dsh-browser-source')
  symlinkSync(fixture.bridge, link, 'junction')
  await addBridge(fixture, 'another-profile', current, '../web/.dsh-browser-source')
  const profile = join(fixture.home, 'profiles', 'another-profile')
  const packageManifest = join(profile, 'node_modules', current, 'package.json')
  const before = readFileSync(packageManifest, 'utf8')
  const result = uninstall(fixture)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(existsSync(link), true)
  assert.equal(readFileSync(packageManifest, 'utf8'), before)
  assert.equal(readJson(join(profile, 'package.json')).dependencies[current], 'link:../web/.dsh-browser-source')
  preserved(fixture)
})

test('checkout stored at the managed path is preserved as a checkout', async () => {
  const fixture = await installation('checkout-in-home', { sourceInHome: true })
  const result = uninstall(fixture)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(existsSync(join(fixture.source, 'scripts', 'install.sh')), true)
  assert.equal(existsSync(fixture.extension), false)
  preserved(fixture)
})

test('metadata for a different home stops before any removal', async () => {
  const fixture = await installation('wrong-home')
  const path = join(fixture.extension, 'install-info.json')
  const info = readJson(path)
  info.dshHome = join(fixture.base, 'another home')
  writeJson(path, info)
  const result = uninstall(fixture)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Install metadata names a different home/)
  assert.ok(readJson(join(fixture.profile, 'package.json')).dependencies[current])
  assert.equal(existsSync(fixture.extension), true)
})

test('the uninstall command completes without terminal prompts', async () => {
  const fixture = await installation('direct-command')
  const result = spawnSync(process.execPath, [join(root, 'scripts', 'uninstall.mjs'), '--home', fixture.home], {
    encoding: 'utf8', env: process.env, timeout: 30_000,
  })
  if (result.error) throw result.error
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(existsSync(fixture.extension), false)
  preserved(fixture)
})

test('dry run leaves profile and installed files intact', async () => {
  const fixture = await installation('dry-run')
  const before = readFileSync(join(fixture.profile, 'package.json'), 'utf8')
  const result = uninstall(fixture, ['--dry-run'])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(readFileSync(join(fixture.profile, 'package.json'), 'utf8'), before)
  assert.equal(existsSync(fixture.extension), true)
})

test('native pnpm failure stops before deleting any installation files', async () => {
  const fixture = await installation('pnpm-failure', { mode: 'managed' })
  writeFileSync(join(fixture.profile, 'pnpm-workspace.yaml'), 'packages: [\n')
  const before = readFileSync(join(fixture.profile, 'package.json'), 'utf8')
  const result = uninstall(fixture)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Plugin removal failed; file cleanup stopped/)
  assert.equal(readFileSync(join(fixture.profile, 'package.json'), 'utf8'), before)
  assert.equal(existsSync(fixture.source), true)
  assert.equal(existsSync(fixture.extension), true)
  assert.equal(existsSync(join(fixture.home, 'ext-bridge-token')), true)
})

test('unowned directory is retained while the current installation is removed', async () => {
  const fixture = await installation('unowned', { mode: 'managed' })
  rmSync(join(fixture.source, '.managed-by-install-sh'))
  const result = uninstall(fixture)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(existsSync(fixture.source), true)
  assert.equal(existsSync(fixture.extension), false)
  preserved(fixture)
})

test('extension directory symlink is refused without deleting its target', async () => {
  const fixture = await installation('symlink')
  rmSync(fixture.extension, { recursive: true })
  symlinkSync(fixture.source, fixture.extension, 'junction')
  const result = uninstall(fixture)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Unexpected path type/)
  assert.equal(existsSync(join(fixture.source, 'scripts', 'install.sh')), true)
  assert.ok(readJson(join(fixture.profile, 'package.json')).dependencies[current])
})

test('profile lock contention stops before changes', async () => {
  const fixture = await installation('locked')
  writeFileSync(join(fixture.profile, 'package.json.lock'), `${process.pid}\n`)
  const result = uninstall(fixture)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /timed out waiting for the writer lock/)
  assert.equal(existsSync(fixture.extension), true)
  assert.ok(readJson(join(fixture.profile, 'package.json')).dependencies[current])
})

test('bundle-only interrupted removal is reconciled with the native manifest writer', async () => {
  const fixture = await installation('bundle-only', { bridges: [] })
  const path = join(fixture.profile, 'package.json')
  const manifest = readJson(path)
  manifest.dsh.profile.bundles.push(current, legacy)
  writeJson(path, manifest)
  const result = uninstall(fixture)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  preserved(fixture)
})

test('broken source junction is removed without following its missing target', async () => {
  const fixture = await installation('broken-junction', { mode: 'managed' })
  const link = join(fixture.profile, '.dsh-browser-source')
  symlinkSync(fixture.bridge, link, 'junction')
  rmSync(fixture.bridge, { recursive: true })
  const result = uninstall(fixture)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(existsSync(fixture.source), false)
  assert.equal(existsSync(fixture.extension), false)
  preserved(fixture)
})

test('missing extension metadata uses verified extension identity', async () => {
  const fixture = await installation('no-metadata', { mode: 'managed' })
  rmSync(join(fixture.extension, 'install-info.json'))
  const result = uninstall(fixture)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(existsSync(fixture.extension), false)
  preserved(fixture)
})

test('recorded installation is removable when extension resources are damaged', async () => {
  const fixture = await installation('damaged-extension', { mode: 'managed' })
  writeFileSync(join(fixture.extension, 'manifest.json'), '{')
  writeFileSync(join(fixture.extension, '_locales', 'en', 'messages.json'), '{')
  const result = uninstall(fixture)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(existsSync(fixture.extension), false)
  assert.equal(existsSync(fixture.source), false)
  preserved(fixture)
})

test('source junction removal leaves its target contents untouched', async () => {
  const fixture = await installation('junction-target')
  const target = join(fixture.base, 'external-source')
  mkdirSync(target)
  writeFileSync(join(target, 'package.json'), '{')
  const link = join(fixture.profile, '.dsh-browser-source')
  symlinkSync(target, link, 'junction')
  const result = uninstall(fixture)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(existsSync(link), false)
  assert.equal(readFileSync(join(target, 'package.json'), 'utf8'), '{')
  preserved(fixture)
})

test('standalone helper discovers an old checkout through the installed bridge', async () => {
  const fixture = await installation('standalone-old-checkout')
  rmSync(join(fixture.extension, 'install-info.json'))
  const helper = join(fixture.base, 'uninstall.mjs')
  cpSync(join(root, 'scripts', 'uninstall.mjs'), helper)
  const result = spawnSync(process.execPath, [helper, '--home', fixture.home], {
    encoding: 'utf8', env: process.env, timeout: 120_000,
  })
  if (result.error) throw result.error
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(existsSync(fixture.source), true)
  assert.equal(existsSync(fixture.extension), false)
  preserved(fixture)
})

test('an explicit runtime removes the bridge when the linked checkout manifest is damaged', async () => {
  const fixture = await installation('explicit-runtime')
  writeFileSync(join(fixture.source, 'package.json'), '{')
  const result = uninstall(fixture, ['--runtime-root', root])
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(readFileSync(join(fixture.source, 'package.json'), 'utf8'), '{')
  assert.equal(existsSync(fixture.extension), false)
  preserved(fixture)
})

test('incomplete bootstrap with no profile needs no DSH runtime', () => {
  const base = join(run, 'incomplete')
  const home = join(base, 'home')
  mkdirSync(join(home, 'dsh-browser'), { recursive: true })
  writeFileSync(join(home, 'dsh-browser', '.managed-by-install-sh'), '')
  const result = uninstall({ base, home })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(existsSync(join(home, 'dsh-browser')), false)
  assert.equal(existsSync(join(home, 'profiles')), false)
})

test('platform entry script forwards arguments and runs the actual uninstaller', async () => {
  const fixture = await installation('entry', { mode: 'managed' })
  const result = uninstall(fixture, ['--home', fixture.home], {
    entry: process.platform === 'win32' ? 'powershell.exe' : 'bash', fromSource: true,
  })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(existsSync(fixture.extension), false)
  preserved(fixture)
})

test('PowerShell 7 entry uses the same cleanup when requested', { skip: process.env.TEST_PWSH !== '1' }, async () => {
  const fixture = await installation('pwsh-entry', { mode: 'managed' })
  const result = uninstall(fixture, ['--home', fixture.home], { entry: 'pwsh', fromSource: true })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  preserved(fixture)
})

console.log(`Uninstall evidence: ${run}`)
