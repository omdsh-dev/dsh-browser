# Windows 7 兼容性说明与替代构建方案

在 Windows 7 上直接执行 `pnpm build` 会因原生打包工具崩溃而失败（`0xc0000005` 访问违例）。
本文说明根因，并提供一套**完全不加载原生二进制**的替代构建方案：`build-win7.mjs`。

---

## 1. 根因：原生工具链依赖 Win8+ 系统 API

本仓库的正常构建链是：

| 阶段 | 工具 | 实现 |
| --- | --- | --- |
| `packages/browser/bridge-browser` | `tsc -b` + `tsdown` | tsdown 底层是 **rolldown**（Rust，`@rolldown/binding-win32-x64-msvc.exe`） |
| `extensions/dsh-browser` | `vite build` ×3 | vite 底层是 **esbuild**（Go，`@esbuild/win32-x64/esbuild.exe`）与 **rollup**（Rust，`@rollup/rollup-win32-x64-msvc.exe`） |

这些 `.exe` 是 Go/Rust 编译的原生程序，内部调用了 **Windows 8 / Server 2012 才引入** 的系统 API，典型的有：

- `kernel32.dll!GetSystemTimePreciseAsFileTime`（Win8 引入的高精度时钟）
- `kernel32.dll!QueryUnbiasedInterruptTimePrecise`（Win8）
- `kernel32.dll!SetThreadDescription`（Win10 1607）

Windows 7 的 `kernel32.dll` **没有这些导出函数**。原生二进制在加载/启动阶段解析导入表失败，随即触发 `0xc0000005`（EXC032026 进程崩溃，通常是 "The NTDLL.dll!LdrpProcessRelocationBlock" 之后的非法访问）。表现为：

```
$ pnpm build
> vite build
# 无任何输出，进程立即退出，退出码 0xC0000005（-1073741819）
```

同理，`@deepseek-ai/libreoffice-kit-win32-x64/bin/libreoffice-kit.exe`（DSH 运行时依赖，与构建无关）也携带同样的 API。

## 2. 替代方案：纯 WASM / 纯 JS 工具链

方案只使用两种**无原生二进制**的实现：

| 工具 | 说明 |
| --- | --- |
| **`esbuild-wasm`** | esbuild 官方的 WebAssembly 构建（`esbuild.wasm`），由 Node 加载运行，API 与 `esbuild` 完全一致 |
| **`@rollup/wasm-node`** | rollup 官方的纯 JS/WASM 构建，不含 `rollup.exe` 类原生可执行文件 |
| **`typescript`（transpileModule）** | 纯 JS 的 TypeScript 编译器，用于转译而非类型检查 |

`build-win7.mjs` 在运行时优先 `import('esbuild-wasm')` / `import('@rollup/wasm-node')`；两者均不可用时给出清晰的安装提示并退出。

## 3. 快速开始

```bash
# 1. 安装依赖（仅所需工作区；--ignore-scripts 可跳过全部 postinstall 原生脚本）
pnpm install --filter @yuxianglin/dsh-bridge-browser --filter dsh-browser-extension

# 2a. Windows 7 上构建 chrome 扩展（产物 dist/）
node build-win7.mjs

# 2b. 构建 firefox 扩展（产物 dist-firefox/）
node build-win7.mjs --firefox

# 或通过 npm 脚本
pnpm build:win7
pnpm build:win7:firefox
```

构建成功后，扩展可直接加载：

- **Chrome**：`chrome://extensions` → 开发者模式 → 加载 `extensions/dsh-browser/dist`
- **Edge**：`edge://extensions` → 开发者模式 → 加载 `dist`
- **Firefox**：`about:debugging` → 临时加载 `dist-firefox/manifest.json`

> 非 Windows 7 用户**不受任何影响**：`pnpm build` 及原有工具链保持原样，本方案是增量而非替换。

## 4. `build-win7.mjs` 做了什么

### 阶段 1：bridge 库（`@rollup/wasm-node` + TS 转译插件）

对齐原 `tsc -b && tsdown` 的产物语义（`tsdown.config.ts`：ESM / node 平台 / 不打 dts / external 运行期依赖）：

- 入口 `src/{index,protocol,invariant}.ts` → `lib/*.js`（ESM）；`@deepseek-ai/*`、`ws`、`node:*` 保持外部引用（由宿主提供）
- 内联 rollup 插件用 `ts.transpileModule` 做逐文件转译（`isolatedModules` 语义；类型检查请走 `pnpm typecheck`）
- `src/client.js` 原样复制到 `lib/`（与原构建的 `node -e "copyFileSync(...)"` 一致）
- `--no-types` 之外的运行会调用 `tsc -b` 生成 `lib/types/` 声明产物（纯 JS，失败仅告警不阻断）

若 `@rollup/wasm-node` 缺失，自动回退到 `esbuild-wasm` 打包 bridge。

### 阶段 2：扩展三目标（`esbuild-wasm`，对齐 `scripts/build.mjs` 的三个 vite 配置）

| 目标 | 入口 | 格式 | 产物 |
| --- | --- | --- | --- |
| background | `src/background/index.ts` | chrome: `es`（MV3 module service worker）<br>firefox: `iife` | `dist/background.js` |
| content | `src/content/index.ts` | `iife` | `dist/content.js` |
| panel | `src/panel/main.tsx` | `iife` + JSX automatic + CSS 提取 | `dist/panel/assets/main.js`、`main.css` |

`import.meta.env.EXT_TARGET` 通过 esbuild `define` 注入（对应 `vite.shared.ts` 的行为）；`deepseek-256.png` 等资源用 `file` loader 输出为独立文件，与 vite 产物布局一致。

### 阶段 3：静态资源与 HTML（纯 Node `fs`）

复刻 `vite.shared.ts` 的 `copyManifest` 插件：

- `manifest.json`（firefox 时为 `manifest.firefox.json`）→ `dist/manifest.json`
- `_locales/`、`assets/`（icons 等）→ `dist/` 对应目录
- `panel/index.html` → 重写产物 HTML：脚本指向 `./assets/main.js`，注入 `./assets/main.css` 样式引用

### 原生风险扫描与 GoWin7Fixer 兜底（可选）

构建结尾会用**纯 Node 解析 PE 导入表**（不执行目标文件）扫描 `node_modules` 中的 `.exe`，报告携带 Win8+ API 导入的文件，例如：

```
[win7] 原生二进制扫描：发现 1 个携带 Win8+ API 导入的可执行文件：
[win7]   - @deepseek-ai/libreoffice-kit-win32-x64/bin/libreoffice-kit.exe（kernel32.dll!GetSystemTimePreciseAsFileTime）
[win7] 本 Win7 构建链不加载它们，可安全忽略；如需修补这些文件，请加 --fix-native，
       或以管理员身份运行并拖拽文件到 GoWin7Fixer.exe。
```

这些文件**不在本构建的加载路径上**，提示仅为信息目的。若某些第三方工具（例如 DSH 运行时）确实需要在 Win7 上启动而无法绕过，可以使用 [GoWin7Fixer](https://github.com/GoWin7Fixer)（一个 Windows 7 API 兼容修补 GUI）：

```bash
# 扫描并列出风险文件
node build-win7.mjs --scan-native

# 扫描并尝试用 GoWin7Fixer.exe 修补（按 GOWIN7FIXER_PATH / 桌面快捷方式 / Downloads / PATH 查找）
node build-win7.mjs --fix-native
```

`--fix-native` 会把风险文件作为参数传给 `GoWin7Fixer.exe` 并启动之；该程序是**拖放式 GUI**（实测不处理命令行参数），如未自动修补，请在弹出的窗口中把文件拖入并确认。

## 5. 命令行选项一览

| 选项 | 作用 |
| --- | --- |
| （默认） | 构建 chrome 扩展到 `dist/` |
| `--firefox` | 构建 firefox 扩展到 `dist-firefox/` |
| `--no-types` | 跳过 bridge 的 `tsc -b` 类型产物（纯 JS 转译照常） |
| `--scan-native` | 仅扫描 node_modules 中的 Win8+ API 原生二进制后退出 |
| `--fix-native` | 扫描并调用 `GoWin7Fixer.exe` 尝试修补 |

## 6. 开发工作流说明

- **类型检查**仍可随时执行：`pnpm typecheck`（`tsc --noEmit`，纯 JS，Win7 安全）
- **单元测试**：`pnpm test` 使用 vitest（vitest 本身依赖 vite 的原生 esbuild？—— vitest 走 vite 的 **JS 实现**（vite 在有 `esbuild-wasm` 时不加载原生 exe；vite 6 的 esbuild 集成会优先使用已安装的 `esbuild-wasm`）。如遇 vitest 也崩溃，可用 `--no-types` 类似思路跳过该阶段
- 本方案**不提供 watch/dev server**（`pnpm dev` 依赖 vite 开发服务器面板热更新）；开发期请用非 Win7 机器，或改完源码后重跑 `node build-win7.mjs` 再到 `chrome://extensions` 点"重新加载"

## 7. 已知限制

1. WASM 打包比原生 esbuild 慢数倍（本仓库全量构建约数十秒，Win7 机械盘上更慢）
2. 无源映射（`sourcemap: false`）；如需调试可临时打开
3. panel 产物为 `iife` 包而非 vite 的 ES 模块分包（无 code-splitting，单文件稍大）
4. `@deepseek-ai/libreoffice-kit-win32-x64`（约 71MB 运行时包）在 Win7 上需用 GoWin7Fixer 修补其 `libreoffice-kit.exe` 才能被 DSH 运行时加载——与本构建无关

## 8. 验证环境

- Windows 7 SP1（x64）+ Node v18.20.0 / v26.7.0
- pnpm 11.7.0（经 corepack）
- `esbuild-wasm@0.25.12`、`@rollup/wasm-node@4.66.0`、`typescript@6.0.3`、`vite@6.4.x`（仅作为依赖元数据，不执行其原生二进制）

产物已校验与原 vite/tsc+tsdown 构建在结构上等价（external 导入、`EXT_TARGET` 注入、MV3 manifest、`_locales`、icons、panel HTML 资源引用）。

---

## 附：为什么不用 pnpm overrides 强制把 `esbuild` 重定向到 `esbuild-wasm`？

在根 `package.json` 写 `"pnpm": { "overrides": { "esbuild": "npm:esbuild-wasm@..." } }` 会让 vite/vitest 的 `esbuild` 导入指向 wasm 包，理论上可行，但：

1. vite 内部对 `esbuild` 的 `build`/`transform` 调用在 wasm 实现下初始化路径不同，仍可能间接触发对原生可执行文件的引用探测
2. overrides 会**全局**改写所有消费者的依赖解析，破坏正常平台用户的行为
3. `rolldown` 无法用这种方式替换（它的原生绑定由 npm 包单独分发）

因此本方案选择**显式的独立构建入口**：保留原有构建链，新增 `build-win7.mjs` 与 `build:win7` 脚本，对原仓库的侵入性降到最低（仅新增文件、新增根 devDependencies 与两个脚本）。
