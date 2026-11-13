# dsh 浏览器操作 [![dshfind](https://dshfind.com/api/badge/Lum1104/dsh-browser?lang=zh)](https://dshfind.com/zh/plugins/Lum1104/dsh-browser?ref=badge)

[English](README.md) | **中文**

<img width="1701" height="897" alt="dsh 浏览器操作" src="https://github.com/user-attachments/assets/3b1f3a25-f962-4e02-a9ef-d23e0d01fc8e" />

把 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 连接到你正在使用的 Chrome 或 Firefox 标签页。模型可以读取页面内容、操作控件、导航和管理标签页，同时保留登录态、会话和 Cookie。侧边栏提供对话界面。

`dsh` 是由 DeepSeek AI 开发的开源、插件化 agent harness（智能体框架）。本仓库将配套的浏览器桥插件与 Chrome/Firefox MV3 扩展组成一个独立的 pnpm workspace。

页面会转换为结构化文本和带编号的交互元素清单。工具通过编号或选择器定位元素；`browser_screenshot` 经批准后截取受控标签页的可视区域。宿主声明图片能力时，侧栏也可发送 PNG、JPEG、WebP 和 GIF 附件。

> [!IMPORTANT]
> 工作区固定使用 DSH 0.2.2-rc.2。

## 快速安装

安装器会安装桥插件和 Chrome 扩展。

macOS 与 Linux：

```sh
curl -fsSL https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/install.sh | bash
```

Windows（PowerShell）：

```powershell
$s="$env:TEMP\dsh-install.ps1"; irm https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/install.ps1 -OutFile $s; powershell -NoProfile -ExecutionPolicy Bypass -File $s
```

安装器打开 `chrome://extensions` 后，请按提示加载或重新加载 **dsh 浏览器助手**。如果 dsh 已经在运行，安装完成后请重启。前置要求、启动命令、更新方式和开发者安装详见[详细安装与使用](#详细安装与使用)。

> [!IMPORTANT]
> npm 上未加 scope 的 [`dsh-browser`](https://www.npmjs.com/package/dsh-browser) 包属于另一个项目，与本仓库无关。本项目目前没有发布 npm 包，请使用上方安装器。

## 性能基准

在 2026 年 8 月 18 日完成的 60 次配对端到端评测中，两个后端分配到的 30 次运行均全部成功；dsh 浏览器操作使用了更少的模型/工具轮次，并以更短时间完成任务：

| 后端 | 成功率 | 平均端到端耗时 | 平均浏览器工具调用 |
|---|---:|---:|---:|
| **dsh 浏览器操作** | **30/30** | **5.32 秒** | **3.4** |
| 对齐工具契约的 Playwright 基线 | 30/30 | 6.67 秒 | 4.7 |

Playwright / 扩展的配对耗时比为 **1.24**（95% CI **1.16–1.34**）：Playwright 耗时约多 24%；等价地说，dsh 浏览器操作将延迟降低约 20%，每个任务平均节省 1.35 秒。评测使用 6 个浏览器任务、5 个确定性 seed、相同的 DSH profile 与模型（`deepseek-v4-flash`），并通过独立页面状态验证结果。详见[评测方法与复现说明](benchmark/README.md)。

## 核心能力

| 能力 | 工具 | 说明 |
|---|---|---|
| 读取页面 | `browser_snapshot` | 结构化文本快照：标题/URL/正文/编号交互清单/表单字段（敏感值掩码）；`delta: true` 只返回变化，`frame` 单读一个 iframe，`query` 按文本/选择器/角色定位任意元素并给出选择器 |
| 点击 | `browser_click` | 按编号或选择器点击、双击；支持鼠标按键和修饰键 |
| 文本 | `browser_type` | 输入文本（React/Vue 受控组件兼容），`replace` 清空重填；`mode` 可选插入或逐键输入（自动补全类字段） |
| 按键 | `browser_press` | 单键或组合键（`modifiers`），`action: down/up` 跨调用按住，`repeat` 重复 |
| 滚动 | `browser_scroll` | 向上、向下滚动页面或指定 iframe，或滚动到顶部、底部 |
| 剪贴板 | `browser_clipboard` | `write` 写入系统剪贴板（文本/HTML）；`paste` 以粘贴事件或真实快捷键粘贴到页面 |
| 文件 | `browser_upload` | 把本机文件附加到 `input[type=file]`（Chrome） |
| 页面导航 | `browser_navigate` / `browser_open_tab` / `browser_back` / `browser_forward` / `browser_reload` | 受控标签页内导航，或新开标签页并跟随（`active:false` 时保持当前页在前台） |
| 列出标签页 | `browser_list_tabs` | 列出可访问标签页的稳定 ID、标题、URL、窗口/顺序以及活动/受控状态 |
| 跟随标签页 | `browser_follow_tab` | 将后续浏览器工具绑定到 `browser_list_tabs` 返回的标签页；默认不激活，`activate: true` 才切到前台 |
| 关闭标签页 | `browser_close_tab` | 关闭 `browser_list_tabs` 返回的标签页 |
| 读取区域 | `browser_get_text` | 懒加载内容 / 局部文本 |
| 等待稳定 | `browser_wait` | 页面加载与渲染稳定检测 |
| 发送图片 | `session.prompt` / `session.attachment` | 按宿主能力启用图片草稿、纯图片消息和持久历史预览 |
| 引用选中内容 | 侧栏输入框 | 在页面里划选的文字会出现在输入框，随下一条消息一起发送，并带上来源与不可信内容边界 |
| 继续生成 | 侧栏 | 请求失败后，点击出现的“继续生成”按钮继续对话 |

点击、文本输入和滚动操作在指定文档中执行，支持跨域 iframe。Chrome 通过调试器执行原生键盘事件、光标位置插入、系统粘贴和文件上传。截图要求受控标签页处于活动状态且窗口聚焦，可以使用 `browser_follow_tab { activate: true }` 将页面切到前台。

## 详细安装与使用

前置要求：Node.js `>=24.9.0`、Corepack/pnpm，以及 Chrome 125+ 或 Firefox 140+。Windows 还需要系统自带的 Windows PowerShell 5.1，或 PowerShell 7+。

### 安装或更新

运行[快速安装命令](#快速安装)即可安装或更新。安装器打开 `chrome://extensions` 后，首次安装时加载 `~/.dsh/browser-extension` 目录；更新后点击**重新加载**。如果 dsh 已在运行，请重启。

如需从源码 checkout 安装当前分支：

```sh
git clone https://github.com/Lum1104/dsh-browser.git
cd dsh-browser
./scripts/install.sh
```

Windows 请在 checkout 中运行 `.\scripts\install.ps1`。拉取或切换版本后，请重新运行安装器并重新加载扩展。

### 卸载

在扩展的**设置 → 卸载 dsh-browser**中复制命令，然后在终端运行。

也可以直接运行。macOS 或 Linux：

```sh
curl -fsSL https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/uninstall.sh | bash
```

Windows 请运行：

```powershell
& { $ErrorActionPreference = 'Stop'; $d=New-Item -ItemType Directory -Path (Join-Path ([IO.Path]::GetTempPath()) ('dsh-browser-uninstall.'+[Guid]::NewGuid().ToString('N'))); try { $s=Join-Path $d.FullName 'uninstall.ps1'; Invoke-WebRequest -UseBasicParsing https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/uninstall.ps1 -OutFile $s; powershell -NoProfile -ExecutionPolicy Bypass -File $s } finally { Remove-Item -LiteralPath $d.FullName -Recurse -Force } }
```

在源码目录中运行 `bash scripts/uninstall.sh` 或 `.\scripts\uninstall.ps1`。

### Firefox 源码构建

Firefox 使用独立的 MV3 manifest、事件页后台和 Sidebar。在 checkout 中构建后，打开 `about:debugging#/runtime/this-firefox`，选择「临时载入附加组件」，再选取 `extensions/dsh-browser/dist-firefox/manifest.json`：

```sh
pnpm install
pnpm --filter dsh-browser-extension run build:firefox
```

桥地址仍会自动探测。Firefox 的 `moz-extension://` UUID 不能证明扩展身份，因此需要把 `~/.dsh/ext-bridge-token` 中的 bearer token 填入扩展设置（dsh 启动日志会报告该文件路径）。签名发布时可直接使用同一份 `dist-firefox/` 产物。

### 启动与使用

启动托管安装：

```sh
cd ~/.dsh/dsh-browser && pnpm start
```

使用源码 checkout 时，请在仓库根目录运行 `pnpm start`。受支持的精确公开版本为：

```sh
npx @deepseek-ai/dsh@0.2.2-rc.2 web
```

Chrome 本机使用无需配置；Firefox 需要填写上述本地桥 token。打开页面，点击 DeepSeek 鲸鱼图标，等待侧边栏显示**已连接**。已有 HTTP(S) 标签页会在第一次操作时自动加载。在浏览器受保护页面和扩展商店中，模型可以读取标签页元数据，并通过浏览器级能力导航到 HTTP(S)、后退、前进和刷新，但不能读取或操作受保护页面的 DOM。

## 故障排查

**侧边栏一直显示「未连接」**

- 确认 DSH 正在运行。安装或更新后，重启 DSH 并重新打开侧栏。
- 打开**设置 → 自动检测**，选择需要连接的 DSH 实例。
- 使用 Firefox 时，在设置中填写 `~/.dsh/ext-bridge-token` 中的 token。
- 连接远程 DSH 时，在设置中填写服务器地址和对应的桥接 token。

## 开发

桥接插件和 Chrome/Firefox 扩展都属于本仓库 workspace；所有命令均在本仓库根目录执行。首次开发安装运行 `pnpm install`。

开发文档：[浏览器桥插件](packages/browser/bridge-browser/README.zh.md)与[浏览器扩展](extensions/dsh-browser/README.zh.md)。

```sh
pnpm run build
pnpm run typecheck
pnpm run test
pnpm run check:runtime
pnpm run test:smoke

pnpm --filter @yuxianglin/dsh-bridge-browser run build
pnpm --filter @yuxianglin/dsh-bridge-browser run typecheck
pnpm --filter @yuxianglin/dsh-bridge-browser run test

pnpm --filter dsh-browser-extension run build
pnpm --filter dsh-browser-extension run build:firefox
pnpm --filter dsh-browser-extension run test
```

注意：

- 启动前桥接插件必须已有 `lib/` 供 Loader 加载；`scripts/install.sh` 和根目录 `pnpm run build` 都会先构建插件再构建扩展。
- `@deepseek-ai/dsh` 与桥接插件的依赖固定在同一条经过验证的公开发布线上；升级时必须同时更新 manifest、锁文件并重跑根目录检查。

`check:runtime` 检查实际解析的 DSH 依赖和锁文件；`test:smoke` 使用临时 DSH home 启动真实 web 宿主，验证桥接和重启后的会话读取，无需模型密钥。CI 在干净安装后运行这些检查。

构建后运行 `pnpm test:browser`，需要已安装 Playwright Chromium，或通过 `CHROMIUM_PATH` 指定支持加载未打包扩展的 Chromium 可执行文件。测试会启动真实 DSH 和 Chromium，验证页面共享、开发者工具授权、输入、iframe 上传与定位，以及 CSS 修改。测试开启并确认跨站 iframe 的进程隔离，覆盖同源、跨源和嵌套 iframe 中的元素点击、输入与滚动。测试无需模型密钥，结果保存在 `.artifacts/browser-smoke/`。

构建扩展后运行 `pnpm test:uninstall`。设置界面测试使用 `pnpm test:uninstall:ui`，需要 Playwright Chromium。

## 安全

- 助手读取的页面文字和你发送的附件会交给当前选择的模型。
- 页面内容共享可以选择**自动共享**（默认）、**每次询问**或**关闭**。
- 文本快照会遮盖密码和卡号值；截图保留可见像素，不会遮盖字段。
- 页面操作默认需要审批。你可以信任指定网站，或开启**允许模型完全控制浏览器**。开发者工具需要单独授权。
- 切换标签页后，助手会询问接下来操作哪个页面。
