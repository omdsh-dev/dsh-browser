#!/usr/bin/env node
/**
 * build-win7.mjs — Windows 7 兼容构建入口（dsh-browser）
 *
 * 为什么需要它：
 *   原生构建链（tsdown → rolldown、vite → esbuild/rollup 原生二进制）携带
 *   Go/Rust 编译的 .exe/.node，它们在内部调用 Windows 8+ 才存在的
 *   GetSystemTimePreciseAsFileTime 等 API，Win7 上运行会直接 0xc0000005 崩溃。
 *
 * 本脚本完全不加载任何原生二进制：
 *   - bridge 库（packages/browser/bridge-browser）：@rollup/wasm-node（纯 wasm）
 *     + 内联 TypeScript 转译插件（typescript 自带的 transpileModule，纯 JS）。
 *   - 扩展（extensions/dsh-browser）：esbuild-wasm（纯 wasm），一次三目标：
 *     background（chrome: es / firefox: iife）、content（iife）、panel（React iife）。
 *   - 静态资源（manifest、_locales、assets、panel/index.html）：Node fs 复制，
 *     HTML 中的脚本/样式引用改写为产物路径。
 *   - 原生兜底：扫描 node_modules 中携带 Win8+ API 导入的 .exe；若显式要求
 *     （--fix-native）则调用 GoWin7Fixer.exe 尝试修补。
 *
 * 用法：
 *   node build-win7.mjs              构建 chrome 扩展（dist/）
 *   node build-win7.mjs --firefox    构建 firefox 扩展（dist-firefox/）
 *   node build-win7.mjs --no-types   跳过 bridge 的 tsc 类型产物
 *   node build-win7.mjs --scan-native 仅扫描可疑原生二进制
 *   node build-win7.mjs --fix-native 扫描并调用 GoWin7Fixer.exe 修补
 *
 * 退出码：0 成功；非 0 表示构建失败。
 */

import { spawn, spawnSync } from 'node:child_process'
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const BRIDGE = join(ROOT, 'packages', 'browser', 'bridge-browser')
const EXT = join(ROOT, 'extensions', 'dsh-browser')

const argv = process.argv.slice(2)
const firefox = argv.includes('--firefox')
const withTypes = !argv.includes('--no-types')
const scanNativeOnly = argv.includes('--scan-native')
const fixNative = argv.includes('--fix-native')

const browserTarget = firefox ? 'firefox' : 'chrome'
const extOutDir = join(EXT, firefox ? 'dist-firefox' : 'dist')
const targetManifest = firefox ? 'manifest.firefox.json' : 'manifest.json'

/** 统一前缀日志 */
const log = (msg) => console.log(`[win7] ${msg}`)
const warn = (msg) => console.warn(`[win7:warn] ${msg}`)
const fail = (msg) => { console.error(`[win7:error] ${msg}`); process.exit(1) }
const bytes = (n) => `${(n / 1024).toFixed(1)} KB`

async function main() {
  log(`dsh-browser Win7 构建（target=${browserTarget}）`)

  const esbuild = await tryImportEsbuild()
  const rollup = await tryImportRollup()
  if (!esbuild && !rollup) {
    fail('esbuild-wasm 与 @rollup/wasm-node 均不可用。请在项目根目录执行：\n  pnpm install --filter @yuxianglin/dsh-bridge-browser --filter dsh-browser-extension\n依赖安装完成后再运行本脚本。')
  }
  log(`引擎：esbuild-wasm=${esbuild ? 'ok' : '缺失'} @rollup/wasm-node=${rollup ? 'ok' : '缺失'}`)

  if (scanNativeOnly || fixNative) {
    await runNativeStep(fixNative)
    if (scanNativeOnly) process.exit(0)
  }

  // ---- bridge 库 ----
  log('=== 阶段 1/3：bridge-browser（@rollup/wasm-node）===')
  await buildBridge({ rollup, esbuild })

  // ---- 扩展 ----
  log('=== 阶段 2/3：dsh-browser-extension（esbuild-wasm）===')
  await buildExtension(esbuild)

  // ---- 原生风险提示（非阻塞）----
  await runNativeStep(false)

  log('=== 完成 ===')
  reportOutputs()
}

/* ------------------------------------------------------------------ *
 * 引擎加载
 * ------------------------------------------------------------------ */

async function tryImportEsbuild() {
  try {
    const mod = await import('esbuild-wasm')
    return typeof mod.build === 'function' ? mod : null
  } catch { return null }
}

async function tryImportRollup() {
  try {
    const mod = await import('@rollup/wasm-node')
    const rollup = mod.rollup ?? mod.default?.rollup
    return typeof rollup === 'function' ? rollup : null
  } catch { return null }
}

/** 从 bridge 包目录加载纯 JS 的 typescript（根目录未必安装） */
let tsModule = null
async function loadTypeScript() {
  if (tsModule) return tsModule
  for (const candidate of [
    join(BRIDGE, 'node_modules', 'typescript', 'lib', 'typescript.js'),
    join(EXT, 'node_modules', 'typescript', 'lib', 'typescript.js'),
  ]) {
    if (existsSync(candidate)) {
      tsModule = await import(pathToFileURL(candidate).href)
      return tsModule
    }
  }
  return null
}

/* ------------------------------------------------------------------ *
 * 阶段 1：bridge 库
 * ------------------------------------------------------------------ */

const BRIDGE_ENTRIES = ['index', 'protocol', 'invariant']
/** 运行期由宿主提供，保持外部引用（与 tsdown 平台行为一致） */
const bridgeExternal = (id) =>
  id.startsWith('@deepseek-ai/') || id === 'ws' || id.startsWith('node:')

async function buildBridge({ rollup, esbuild }) {
  rmSync(join(BRIDGE, 'lib'), { recursive: true, force: true })
  mkdirSync(join(BRIDGE, 'lib'), { recursive: true })
  if (withTypes) await emitBridgeTypes()

  if (rollup) {
    await buildBridgeWithRollup(rollup)
  } else {
    log('@rollup/wasm-node 不可用，回退到 esbuild-wasm 打包 bridge')
    if (!esbuild) fail('无可用打包引擎（见上方引擎检查）')
    await buildBridgeWithEsbuild(esbuild)
  }

  // 与原构建一致：client.js 是纯 JS 透传文件
  const clientSrc = join(BRIDGE, 'src', 'client.js')
  if (existsSync(clientSrc)) {
    cpSync(clientSrc, join(BRIDGE, 'lib', 'client.js'))
    log(`复制 src/client.js → lib/client.js`)
  } else {
    warn('src/client.js 不存在，跳过 client.js 产物')
  }
}

/** tsc -b：纯 JS 实现，产物 lib/types/*.js + *.d.ts（与原流程一致，失败不致命） */
async function emitBridgeTypes() {
  const tsc = join(BRIDGE, 'node_modules', 'typescript', 'bin', 'tsc')
  if (!existsSync(tsc)) {
    warn('bridge 下未安装 typescript，跳过 lib/types 类型产物（使用 --no-types 可关闭该提示）')
    return
  }
  log('tsc -b（生成 lib/types 声明产物）…')
  const res = spawnSync(process.execPath, [tsc, '-b', '--pretty', 'false'], { cwd: BRIDGE })
  if (res.status !== 0) {
    warn('tsc -b 失败（类型/依赖问题），已跳过类型产物；JS 产物不受影响。')
    warn(String(res.stderr || res.stdout).trim().split('\n').slice(0, 5).join('\n'))
  }
}

async function buildBridgeWithRollup(rollup) {
  const ts = await loadTypeScript()
  if (!ts) { warn('typescript 不可用，bridge 回退到 esbuild-wasm'); return buildBridgeWithEsbuild(await tryImportEsbuild()) }

  const plugin = makeTsTranspilePlugin(ts)
  for (const name of BRIDGE_ENTRIES) {
    const input = join(BRIDGE, 'src', `${name}.ts`)
    const bundle = await rollup({
      input,
      plugins: [plugin],
      external: bridgeExternal,
      onwarn: (warning, handler) => {
        if (warning.code === 'UNRESOLVED_IMPORT' || warning.code === 'EVAL') warn(String(warning.message))
        else handler(warning)
      },
    })
    await bundle.write({
      file: join(BRIDGE, 'lib', `${name}.js`),
      format: 'esm',
      sourcemap: false,
    })
    await bundle.close()
    log(`rollup: src/${name}.ts → lib/${name}.js`)
  }
}

/**
 * 内联 TypeScript→JS 插件：每文件 transpileModule（isolatedModules 语义，
 * 不做类型检查；类型检查请用 pnpm --filter @yuxianglin/dsh-bridge-browser typecheck）。
 */
function makeTsTranspilePlugin(ts) {
  const exts = ['.ts', '.tsx', '.js', '.json']
  const resolveRelative = (importer, spec) => {
    if (!spec.startsWith('.') && !spec.startsWith('/')) return null
    const base = isAbsolute(spec) ? spec : resolve(dirname(importer), spec)
    if (existsSync(base) && statSync(base).isFile()) return base
    for (const ext of exts) {
      if (existsSync(base + ext)) return base + ext
    }
    for (const ext of exts) {
      const idx = join(base, `index${ext}`)
      if (existsSync(idx)) return idx
    }
    return null
  }
  return {
    name: 'win7-typescript-transpile',
    resolveId(specifier, importer) {
      if (!importer) return null
      const resolved = resolveRelative(importer, specifier)
      return resolved
    },
    transform(code, id) {
      if (!/\.(ts|tsx)$/.test(id)) return null
      const result = ts.transpileModule(code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
          verbatimModuleSyntax: false,
        },
      })
      return { code: result.outputText, map: result.sourceMapText ? JSON.parse(result.sourceMapText) : null }
    },
  }
}

async function buildBridgeWithEsbuild(esbuild) {
  await esbuild.build({
    entryPoints: BRIDGE_ENTRIES.map((n) => join(BRIDGE, 'src', `${n}.ts`)),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'es2022',
    outdir: join(BRIDGE, 'lib'),
    entryNames: '[name]',
    external: ['@deepseek-ai/*', 'ws'],
    logLevel: 'warning',
    legalComments: 'none',
  })
  log(`esbuild-wasm: src/{${BRIDGE_ENTRIES.join(',')}}.ts → lib/`)
}

/* ------------------------------------------------------------------ *
 * 阶段 2：扩展三目标
 * ------------------------------------------------------------------ */

async function buildExtension(esbuild) {
  if (!esbuild) {
    fail('扩展构建依赖 esbuild-wasm（JSX/CSS/资源处理）。请在根目录执行：pnpm add -D esbuild-wasm')
  }
  rmSync(extOutDir, { recursive: true, force: true })
  mkdirSync(extOutDir, { recursive: true })

  const define = { 'import.meta.env.EXT_TARGET': JSON.stringify(browserTarget) }
  const common = {
    bundle: true,
    minify: true,
    target: 'es2022',
    platform: 'browser',
    define,
    sourcemap: false,
    logLevel: 'info',
    legalComments: 'none',
    loader: { '.png': 'file', '.svg': 'file', '.woff': 'file', '.woff2': 'file' },
  }

  try {
    // background：chrome 用 ES module service worker，firefox 用 iife
    const bgFormat = firefox ? 'iife' : 'esm'
    await esbuild.build({
      ...common,
      entryPoints: [join(EXT, 'src', 'background', 'index.ts')],
      outdir: extOutDir,
      entryNames: 'background',
      format: bgFormat,
      globalName: firefox ? '__dsh_background__' : undefined,
    })
    log(`background → ${join(basename(extOutDir), 'background.js')}（${bgFormat}）`)

    // content：iife
    await esbuild.build({
      ...common,
      entryPoints: [join(EXT, 'src', 'content', 'index.ts')],
      outdir: extOutDir,
      entryNames: 'content',
      format: 'iife',
      globalName: '__dsh_content__',
    })
    log(`content → ${join(basename(extOutDir), 'content.js')}（iife）`)

    // panel：React iife，CSS 提取到 panel/assets/main.css
    await esbuild.build({
      ...common,
      entryPoints: [join(EXT, 'src', 'panel', 'main.tsx')],
      outdir: join(extOutDir, 'panel'),
      entryNames: 'assets/[name]',
      assetNames: 'assets/[name]',
      format: 'iife',
      globalName: '__dsh_panel__',
      jsx: 'automatic',
    })
    log(`panel → ${join(basename(extOutDir), 'panel', 'assets', 'main.js')}（iife + css 提取）`)
  } catch (e) {
    fail(`扩展构建失败：${e && e.message ? e.message : e}`)
  }

  writePanelHtml()
  copyStaticAssets()
}

/** panel/index.html → 产物 HTML：脚本/样式指向 assets/ */
function writePanelHtml() {
  const src = join(EXT, 'panel', 'index.html')
  if (!existsSync(src)) { warn('panel/index.html 不存在，跳过 HTML 改写'); return }
  let html = readFileSync(src, 'utf8')
  const scriptRe = /<script([^>]*?)src=(["'])(\/?)src\/panel\/main\.tsx\2([^>]*)><\/script>/i
  if (!scriptRe.test(html)) warn('未在 panel/index.html 中找到 /src/panel/main.tsx 脚本标签；HTML 保持原样')
  html = html.replace(scriptRe, (_, pre, _q, _slash, post) => {
    const raw = `${pre}${post}`.replace(/\s{2,}/g, ' ').trim()
    const attrs = /type\s*=/i.test(raw) ? raw : `${raw} type="module"`.trim()
    return `<link rel="stylesheet" href="./assets/main.css">\n  <script ${attrs} src="./assets/main.js"></script>`
  })
  const out = join(extOutDir, 'panel', 'index.html')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, html, 'utf8')
  log(`panel/index.html → ${join(basename(extOutDir), 'panel', 'index.html')}（注入 assets 引用）`)
}

/** manifest、_locales、assets → outDir（对齐 vite copyManifest 插件） */
function copyStaticAssets() {
  copyFileToOut(targetManifest, 'manifest.json')
  copyDirToOut('_locales')
  copyDirToOut('assets')
}

function copyFileToOut(srcName, outName) {
  const src = join(EXT, srcName)
  if (!existsSync(src)) { warn(`${srcName} 不存在，跳过`); return }
  mkdirSync(extOutDir, { recursive: true })
  cpSync(src, join(extOutDir, outName))
  log(`复制 ${srcName} → ${join(basename(extOutDir), outName)}`)
}

function copyDirToOut(dirName) {
  const src = join(EXT, dirName)
  if (!existsSync(src)) { warn(`${dirName}/ 不存在，跳过`); return }
  mkdirSync(extOutDir, { recursive: true })
  cpSync(src, join(extOutDir, dirName), { recursive: true })
  log(`复制 ${dirName}/ → ${join(basename(extOutDir), dirName)}/`)
}

/* ------------------------------------------------------------------ *
 * 原生二进制风险扫描与 GoWin7Fixer 兜底
 * ------------------------------------------------------------------ */

/** Win7 不存在、Win8+ 才有的 API（Go/Rust 工具链崩溃的典型根因） */
const WIN8_PLUS_API = ['GetSystemTimePreciseAsFileTime', 'SetThreadDescription', 'QueryUnbiasedInterruptTimePrecise']

async function runNativeStep(invokeFixer) {
  const risky = scanRiskyExecutables(join(ROOT, 'node_modules'))
  if (risky.length === 0) {
    log('原生二进制扫描：node_modules 中未发现 Win8+ API 依赖的 .exe（本构建无需原生二进制）')
    return
  }
  log(`原生二进制扫描：发现 ${risky.length} 个携带 Win8+ API 导入的可执行文件：`)
  for (const item of risky) log(`  - ${item.path}（${item.dll}!${item.api}）`)
  if (!invokeFixer) {
    log('本 Win7 构建链不加载它们，可安全忽略；如需修补这些文件，请加 --fix-native，或以管理员身份运行并拖拽文件到 GoWin7Fixer.exe。')
    return
  }
  const fixer = locateGoWin7Fixer()
  if (!fixer) {
    warn('未找到 GoWin7Fixer.exe（已查找桌面快捷方式、Downloads、PATH、GOWIN7FIXER_PATH）。')
    warn('请手动启动 GoWin7Fixer.exe 并拖入以下文件：')
    for (const item of risky) warn(`  - ${resolve(ROOT, item.path)}`)
    return
  }
  log(`调用 GoWin7Fixer.exe：${fixer}`)
  const targets = [...new Set(risky.map((i) => resolve(ROOT, i.path)))]
  const child = spawn(fixer, targets, { detached: true, stdio: 'ignore' })
  child.unref()
  log('已将下列文件作为参数传入 GoWin7Fixer.exe（GUI 程序；如未自动修补，请在其窗口中拖拽确认）：')
  for (const t of targets) log(`  - ${t}`)
}

/** 在 node_modules 中扫描 .exe 的 PE 导入表（纯 Node 解析，不执行目标文件） */
function scanRiskyExecutables(rootDir) {
  const found = []
  if (!existsSync(rootDir)) return found
  const stack = [{ dir: rootDir, depth: 0 }]
  const seen = new Set()
  const MAX_DEPTH = 8, MAX_FILES = 4000
  let scanned = 0
  while (stack.length && scanned < MAX_FILES) {
    const { dir, depth } = stack.pop()
    if (depth > MAX_DEPTH) continue
    let names
    try { names = readdirSync(dir, { withFileTypes: true }) } catch { continue }
    for (const ent of names) {
      if (ent.isDirectory()) {
        if (ent.name === '.git' || ent.name === 'node_modules' && depth > 2) continue
        stack.push({ dir: join(dir, ent.name), depth: depth + 1 })
      } else if (ent.isFile() && /\.exe$/i.test(ent.name)) {
        scanned++
        const path = join(dir, ent.name)
        let st
        try { st = statSync(path) } catch { continue }
        if (st.size > 256 * 1024 * 1024) continue
        const hit = findWin8PlusImport(readFileSync(path))
        if (hit) {
          const rel = path.replace(/\\/g, '/').replace(/^.*node_modules\//, '')
          found.push({ path: rel, dll: hit.dll, api: hit.api })
        }
      }
    }
    if (found.length >= 32) break
  }
  return found
}

/** 解析 PE 导入表，返回命中的 Win8+ API（{ dll, api }） */
function findWin8PlusImport(buf) {
  try {
    if (buf.length < 0x40 || buf.readUInt16LE(0) !== 0x5a4d) return null
    const e_lfanew = buf.readUInt32LE(0x3c)
    if (e_lfanew + 24 > buf.length || buf.readUInt32LE(e_lfanew) !== 0x00004550) return null
    const machine = buf.readUInt16LE(e_lfanew + 4)
    const is64 = machine === 0x8664 || machine === 0xaa64
    const numSections = buf.readUInt16LE(e_lfanew + 6)
    const sizeOpt = buf.readUInt16LE(e_lfanew + 20)
    const opt = e_lfanew + 24
    const magic = buf.readUInt16LE(opt)
    if (magic !== 0x10b && magic !== 0x20b) return null
    const dataDirBase = magic === 0x20b ? opt + 112 : opt + 96
    const importRva = buf.readUInt32LE(dataDirBase + 8) // directory[1].RVA
    if (!importRva) return null
    const sections = []
    for (let i = 0; i < numSections; i++) {
      const s = opt + sizeOpt + i * 40
      if (s + 40 > buf.length) return null
      const va = buf.readUInt32LE(s + 12)
      const vsize = buf.readUInt32LE(s + 8)
      const rawSize = buf.readUInt32LE(s + 16)
      const rawPtr = buf.readUInt32LE(s + 20)
      sections.push({ va, end: va + Math.max(vsize, rawSize), rawPtr })
    }
    const rvaToOffset = (rva) => {
      for (const s of sections) if (rva >= s.va && rva < s.end) return rva - s.va + s.rawPtr
      return null
    }
    const readCstring = (offset) => {
      if (offset === null || offset < 0 || offset >= buf.length) return ''
      let end = offset
      while (end < buf.length && buf[end] !== 0) end++
      return buf.toString('ascii', offset, end)
    }
    let descOff = rvaToOffset(importRva)
    for (let i = 0; i < 512 && descOff !== null && descOff + 20 <= buf.length; i++, descOff += 20) {
      const olt = buf.readUInt32LE(descOff)       // OriginalFirstThunk
      const nameRva = buf.readUInt32LE(descOff + 12)
      const iat = buf.readUInt32LE(descOff + 16)  // FirstThunk
      if (!olt && !nameRva && !iat) break
      const dll = readCstring(rvaToOffset(nameRva)).toLowerCase()
      if (dll === 'kernel32.dll' || dll === 'kernelbase.dll' || dll === 'api-ms-win-core-sysinfo-l1-1-0.dll' || dll === 'api-ms-win-core-sysinfo-l1-2-0.dll' || dll === 'api-ms-win-core-threadpool-l1-2-0.dll') {
        let thunkRva = olt || iat
        let thunkOff = rvaToOffset(thunkRva)
        const step = is64 ? 8 : 4
        for (let j = 0; thunkOff !== null && thunkOff + step <= buf.length; j++) {
          const entry = is64 ? Number(buf.readBigUInt64LE(thunkOff)) : buf.readUInt32LE(thunkOff)
          if (entry === 0) break
          const ordinalFlag = is64 ? 0x8000000000000000n : 0x80000000
          if ((is64 ? BigInt(entry) : entry) & BigInt(ordinalFlag)) { thunkOff += step; continue }
          const fn = readCstring(rvaToOffset(entry) === null ? null : rvaToOffset(entry) + 2)
          if (WIN8_PLUS_API.includes(fn)) return { dll, api: fn }
          thunkOff += step
        }
      }
    }
  } catch { /* Not a parseable PE — ignore */ }
  return null
}

/** 定位 GoWin7Fixer.exe：环境变量 → 桌面快捷方式 → Downloads → PATH */
function locateGoWin7Fixer() {
  const envPath = process.env.GOWIN7FIXER_PATH
  if (envPath && existsSync(envPath)) return envPath
  const home = process.env.USERPROFILE || process.env.HOME
  if (home) {
    const desktop = join(home, 'Desktop')
    for (const name of ['GoWin7Fixer.exe', 'GoWin7Fixer.exe.lnk']) {
      const p = join(desktop, name)
      if (existsSync(p)) {
        if (/\.exe$/i.test(p)) return p
        const target = parseLnkTarget(p)
        if (target && existsSync(target)) return target
      }
    }
  }
  for (const fixed of ['D:\\Downloads\\GoWin7Fixer.exe', 'C:\\Users\\Administrator\\Downloads\\GoWin7Fixer.exe']) {
    if (existsSync(fixed)) return fixed
  }
  const onPath = which('GoWin7Fixer.exe')
  if (onPath) return onPath
  return null
}

function parseLnkTarget(lnkPath) {
  try {
    const text = readFileSync(lnkPath, 'utf16le')
    const m = text.match(/([A-Za-z]:\\[^\u0000-\u001f<>|?*]+\.exe)/i)
    return m ? m[1] : null
  } catch { return null }
}

function which(name) {
  const res = spawnSync('where', [name], { windowsVerbatimArguments: false })
  if (res.status === 0) return String(res.stdout).trim().split(/\r?\n/)[0] || null
  return null
}

/* ------------------------------------------------------------------ *
 * 产物报告
 * ------------------------------------------------------------------ */

function reportOutputs() {
  const items = []
  const walk = (dir, prefix = '') => {
    let names
    try { names = readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const ent of names) {
      const p = join(dir, ent.name)
      if (ent.isDirectory()) walk(p, `${prefix}${ent.name}/`)
      else items.push({ path: `${prefix}${ent.name}`, size: statSync(p).size })
    }
  }
  walk(join(BRIDGE, 'lib'))
  walk(extOutDir)
  const total = items.reduce((sum, i) => sum + i.size, 0)
  for (const i of items) console.log(`       ${bytes(i.size).padStart(10)}  ${i.path}`)
  log(`产物共 ${items.length} 个文件，合计 ${bytes(total)}（bridge lib/ + ${basename(extOutDir)}/）`)
}

main().catch((err) => {
  console.error(`[win7:error] 未捕获错误：${err && err.stack ? err.stack : err}`)
  process.exit(1)
})
