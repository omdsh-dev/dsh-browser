import { createRequire } from 'node:module'
import {
  lstatSync, readFileSync, readdirSync, realpathSync, rmSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve, sep, toNamespacedPath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const BRIDGES = ['@yuxianglin/dsh-bridge-browser', '@deepseek-ai/dsh-bridge-browser']
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies']
const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function fail(zh, en) {
  throw new Error(`${zh}\n${en}`)
}

function pair(zh, en) {
  console.log(`${zh}\n   ${en}`)
}

function stat(path) {
  return lstatSync(path, { throwIfNoEntry: false })
}

function regular(path, kind) {
  const item = stat(path)
  if (item && (item.isSymbolicLink() || !(kind === 'directory' ? item.isDirectory() : item.isFile()))) {
    fail(`路径类型不符合预期：${path}`, `Unexpected path type: ${path}`)
  }
  return item
}

function json(path) {
  if (!stat(path)) return undefined
  const value = JSON.parse(readFileSync(path, 'utf8'))
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`JSON 文件必须包含对象：${path}`, `JSON file must contain an object: ${path}`)
  }
  return value
}

function absolute(path) {
  if (typeof path !== 'string' || !isAbsolute(path) || /[\u0000-\u001f]/u.test(path)) {
    fail(`请指定完整的绝对路径：${path}`, `Specify an absolute path: ${path}`)
  }
  return resolve(path)
}

function contains(parent, child) {
  const part = relative(toNamespacedPath(parent), toNamespacedPath(child))
  return part === '' || (!part.startsWith(`..${sep}`) && part !== '..' && !isAbsolute(part))
}

function samePath(left, right) {
  return relative(toNamespacedPath(left), toNamespacedPath(right)) === ''
}

function dependencies(manifest) {
  return Object.assign({}, ...DEPENDENCY_FIELDS.map(field => manifest?.[field]))
}

function references(manifest) {
  const deps = dependencies(manifest)
  return BRIDGES.filter(name => Object.hasOwn(deps, name) || manifest?.dsh?.profile?.bundles?.includes(name))
}

function profiles(home) {
  const root = join(home, 'profiles')
  if (!stat(root)) return []
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) return []
    const name = entry.name
    const dir = join(root, name)
    const manifest = json(join(dir, 'package.json'))
    return manifest ? [{ name, dir, manifest, references: references(manifest) }] : []
  })
}

function inspect(home) {
  const extension = join(home, 'browser-extension')
  const managed = join(home, 'dsh-browser')
  const sourceLink = join(home, 'profiles', 'web', '.dsh-browser-source')
  const token = join(home, 'ext-bridge-token')
  const installedProfiles = profiles(home)
  const web = installedProfiles.find(profile => profile.name === 'web')
  const otherProfiles = installedProfiles.filter(profile => profile.name !== 'web' && profile.references.length > 0)
  const extensionStat = regular(extension, 'directory')
  const info = extensionStat ? json(join(extension, 'install-info.json')) : undefined
  if (info && (info.schemaVersion !== 1 || !['managed', 'checkout'].includes(info.mode))) {
    fail(`安装信息无法识别：${extension}`, `Unrecognized install metadata: ${extension}`)
  }
  if (info?.mode === 'checkout') absolute(info.sourceRoot)
  if (info?.dshHome !== undefined && !samePath(absolute(info.dshHome), home)) {
    fail(`安装记录指向其他目录：${info.dshHome}`, `Install metadata names a different home: ${info.dshHome}`)
  }
  if (extensionStat && !(info?.application === 'dsh-browser' && info.dshHome !== undefined)) {
    const manifest = json(join(extension, 'manifest.json'))
    const messages = json(join(extension, '_locales', 'en', 'messages.json'))
    if (!(manifest?.name === '__MSG_extensionName__' && messages?.extensionName?.message === 'dsh Browser Assistant')) {
      fail(`无法确认扩展目录的归属：${extension}`, `Cannot establish ownership of extension directory: ${extension}`)
    }
  }
  const managedStat = stat(managed)
  const ownedManaged = managedStat?.isDirectory()
    && stat(join(managed, '.managed-by-install-sh'))?.isFile()
    && !stat(join(managed, '.git'))
    && !(info?.mode === 'checkout' && contains(managed, info.sourceRoot))
  const linkStat = stat(sourceLink)
  if (linkStat && !linkStat.isSymbolicLink()) {
    fail(`安装联接路径已被其他内容占用：${sourceLink}`, `The installation junction path contains other data: ${sourceLink}`)
  }
  regular(token, 'file')
  // 其他 profile 仍引用桥插件时，保留共享联接、源码与 token。
  const targets = [extension]
  if (otherProfiles.length === 0) {
    targets.push(sourceLink, token)
    if (ownedManaged) targets.push(managed)
  }
  return {
    home, managed, info, web, targets,
  }
}

async function loadRuntime(plan, runtimeRoot) {
  if (!plan.web?.references.length) return undefined
  const linkedRoots = runtimeRoot ? [] : plan.web.references.flatMap(name => {
    const manifest = join(plan.web.dir, 'node_modules', name, 'package.json')
    if (!stat(manifest)) return []
    const root = resolve(dirname(realpathSync(manifest)), '../../..')
    return json(join(root, 'package.json'))?.name === 'dsh-browser' ? [root] : []
  })
  const roots = runtimeRoot ? [absolute(runtimeRoot)]
    : [plan.info?.sourceRoot, plan.managed, ...linkedRoots, scriptRoot].filter(Boolean)
  const root = roots.find(candidate => stat(join(candidate, 'node_modules', '@deepseek-ai', 'dsh', 'package.json')))
  if (!root) {
    fail('未找到 DSH 运行时。请使用 --runtime-root 指定已安装依赖的源码目录。',
      'DSH runtime not found. Pass --runtime-root with a checkout whose dependencies are installed.')
  }
  const anchor = realpathSync(join(root, 'node_modules', '@deepseek-ai', 'dsh', 'package.json'))
  const require = createRequire(anchor)
  const operations = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-plugin-manager/operations')).href)
  const atomic = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-atomic-write')).href)
  return { ...operations, ...atomic, anchor }
}

function describe(plan) {
  pair(`卸载目标：${plan.home}`, `Uninstall target: ${plan.home}`)
  pair(`移除 web profile 桥插件：${plan.web?.references.join(', ') || '已移除'}`,
    `Remove web profile bridges: ${plan.web?.references.join(', ') || 'already removed'}`)
  for (const path of plan.targets) {
    if (stat(path)) pair(`删除：${path}`, `Delete: ${path}`)
  }
}

async function removeBridge(plan, runtime) {
  const dir = plan.web.dir
  const manifest = json(join(dir, 'package.json'))
  const names = BRIDGES.filter(name => Object.hasOwn(dependencies(manifest), name))
  if (names.length) {
    const result = await runtime.runProfilePnpm({
      profile: 'web', dir, home: plan.home, installAnchor: runtime.anchor, cwd: dir,
    }, ['remove', ...names, '-w'], {
      execution: 'cli', outputBytes: 16384, env: { DSH_HOME: plan.home },
      onOutput: (text, stream) => process[stream].write(text),
    })
    if (result.exitCode !== 0) fail(`移除插件失败，停止清理文件。诊断文件：${result.logPath}`,
      `Plugin removal failed; file cleanup stopped. Diagnostics: ${result.logPath}`)
  }
  const after = json(join(dir, 'package.json'))
  if (BRIDGES.some(name => Object.hasOwn(dependencies(after), name))) {
    fail('桥插件依赖仍然存在，停止清理文件。', 'Bridge dependencies remain; file cleanup stopped.')
  }
  // 原生 remove 只整理本次删除的依赖；处理中断安装留下的独立 bundle 记录。
  const bundles = after.dsh?.profile?.bundles
  if (bundles?.some(name => BRIDGES.includes(name))) {
    after.dsh.profile.bundles = bundles.filter(name => !BRIDGES.includes(name))
    await runtime.saveManifest(dir, after)
  }
}

function cleanup(plan) {
  for (const path of plan.targets) {
    const now = stat(path)
    if (!now) continue
    // Node 的 rm 不遍历符号链接或 Windows junction 的目标。
    if (path === plan.managed) process.chdir(plan.home)
    rmSync(path, { recursive: now.isDirectory(), force: false })
  }
}

async function main() {
  if (Number(process.versions.node.split('.')[0]) < 24) {
    fail('卸载需要 Node.js 24 或更新版本。', 'Uninstall requires Node.js 24 or newer.')
  }
  const { values } = parseArgs({ options: {
    home: { type: 'string' }, 'runtime-root': { type: 'string' },
    'dry-run': { type: 'boolean' }, help: { type: 'boolean' },
  } })
  if (values.help) {
    console.log(`Usage: uninstall [--home <path>] [--dry-run] [--runtime-root <checkout>]

  --home <path>             DSH directory (defaults to DSH_HOME or ~/.dsh)
  --dry-run                 List the files and plugins to remove
  --runtime-root <checkout> Use DSH dependencies from this checkout`)
    return
  }
  let home = values.home ?? process.env.DSH_HOME ?? join(homedir(), '.dsh')
  home = absolute(home)
  if (stat(home)) home = realpathSync(home)
  regular(home, 'directory')
  const plan = inspect(home)
  if (values['dry-run']) {
    describe(plan)
    return
  }
  const runtime = await loadRuntime(plan, values['runtime-root'])
  pair('正在卸载 dsh-browser…', 'Uninstalling dsh-browser…')
  const execute = async () => {
    if (runtime) await removeBridge(plan, runtime)
    cleanup(plan)
  }
  if (runtime) await runtime.withFileLock(join(plan.web.dir, 'package.json'), execute)
  else await execute()
  pair('请在浏览器扩展管理页面移除“dsh 浏览器助手”，完成卸载。',
    'Remove dsh Browser Assistant from your browser to finish uninstalling.')
  console.log('Chrome: chrome://extensions · Edge: edge://extensions · Firefox: about:addons')
  pair('如果 DSH 正在运行，请重启 DSH。', 'If DSH is running, restart it.')
}

await main()
