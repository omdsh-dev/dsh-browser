# dsh 浏览器操作扩展（Chrome 与 Firefox MV3）

[English](README.md) | 中文

dsh 的**浏览器操作端**：让模型直接读取并操作你在浏览器里打开的页面——抓取内容、点击元素、填写表单、滚动与导航，全部在真实页面执行、登录态保留。侧边栏面板是与模型对话的入口。

浏览器页面以结构化文本和带编号的交互元素清单呈现。`browser_screenshot` 也可经批准后截取受控页面的可视区域。DSH 宿主声明图片能力时，侧栏接收 PNG、JPEG、WebP 和 GIF，并渲染会话中的持久图片附件。


## 模型能做什么

| 能力 | 动作 | 说明 |
|---|---|---|
| 读取页面 | `browser_snapshot` | 标题/URL/正文/编号交互清单/表单字段（敏感值掩码）；`delta: true` 只返回变化，`frame` 单读 iframe，`query` 定位任意元素并给出选择器 |
| 截取可视区域 | `browser_screenshot` | 捕获可见像素，不遮盖字段；除非启用了完全控制，否则需要截图审批 |
| 点击 | `browser_click` | 按编号或选择器点击、双击；支持鼠标按键和修饰键 |
| 文本 | `browser_type` | 输入文本，`replace` 清空重填；`mode` 选择光标插入或逐字符按键 |
| 按键 | `browser_press` | 单键与组合键，可跨调用按住修饰键 |
| 滚动 | `browser_scroll` | 向上、向下滚动页面或指定 iframe，或滚动到顶部、底部 |
| 剪贴板 / 文件 | `browser_clipboard` / `browser_upload` | 写入或粘贴文本与富文本；把本机文件附加到 file input |
| 导航 | `browser_navigate` / `browser_open_tab` / `browser_back` / `browser_forward` / `browser_reload` | 受控标签页内跳转，或新开标签页并跟随 |
| 列出标签页 | `browser_list_tabs` | 列出可访问标签页的稳定 ID、标题、URL 和活动/受控状态 |
| 跟随标签页 | `browser_follow_tab` | 将后续浏览器工具绑定到已列出的标签页；默认后台，`activate: true` 才切前台 |
| 关闭标签页 | `browser_close_tab` | 关闭已列出的标签页 |
| 读区域 | `browser_get_text` | 懒加载内容 / 局部文本 |
| 等待 | `browser_wait` | 页面加载与渲染稳定检测 |
| 查看元素与 CSS | `browser_devtools_elements` / `browser_devtools_set_element_style` / `browser_devtools_set_element_attribute` | 高权限：计算样式、盒模型、命中规则，并可现场修改 CSS 与属性来调试 |
| 执行页面 JS | `browser_console_eval` / `browser_console_logs` | 高权限：在页面自身上下文执行代码，并读取记录的控制台输出 |
| 网络抓包 | `browser_devtools_network` / `browser_devtools_list_requests` / `browser_devtools_get_request` / `browser_devtools_request_body` | 高权限：已捕获请求列表、单条详情与正文（凭据类请求头默认脱敏） |
| 图片对话 | `session.prompt` / `session.attachment` | 按宿主能力启用图片选择、纯图片发送和持久历史预览 |
| 引用你划选的内容 | 侧栏输入框 | 你在页面里选中的文字会变成输入框里的引用，随下一条消息一起发送 |

## 架构

```
side panel (React) ◄─port─► background SW/事件页 ◄─WS─► dsh bridge plugin
                                 │
                  tabs.sendMessage (DSH_ACTION, DSH_SELECTION_WATCH)
                                 ▲ DSH_SELECTION
                                 ▼
                        content script (snapshot/actions/privacy/selection)
```

- **background**（`src/background/`）：桥连接（token 认证 + 指数退避重连 + 保活）、网关 RPC 客户端，以及**失败关闭地分发工具到用户受控标签页**。
- **content script**（`src/content/`）：纯文本快照（可读性主文 + 编号交互清单 + 表单字段）、**稳定编号**（`data-dsh-el`）、delta 变化、点击/输入/按键/滚动/导航动作、敏感字段掩码，以及带防抖的划选监听——只有侧栏打开且页面共享不是「关闭」时才会启用。
- **panel**（`src/panel/`）：React 对话界面（可续接会话/历史/实时事件/设置）；图片选择和预检由宿主声明的限制控制，持久图片通过会话授权读取；消息以已消毒的 Markdown 渲染，`ask_user_question` 请求会显示成可直接作答的卡片，手动切页时显示控制权交接条，运行中的回合提供标准停止按钮，页面划选的段落显示为可移除的引用卡片，并在下一条消息中包在不可信内容边界里发送。
- **协议**：`@yuxianglin/dsh-bridge-browser` workspace 包中的 `protocol.ts` 是两端共享的真源，具体通过该包的源码 export 共享。

## 构建

```sh
pnpm install
pnpm --filter dsh-browser-extension run build
pnpm --filter dsh-browser-extension run build:firefox
pnpm --filter dsh-browser-extension run test
```

请在仓库根目录执行这些命令。Chrome 产物输出到 `extensions/dsh-browser/dist/`；Firefox 产物输出到 `extensions/dsh-browser/dist-firefox/`。

## 安装与使用

推荐的零配置命令无需安装 Git，也无需提前 clone：

1. **构建并安装扩展**：

   ```sh
   curl -fsSL https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/install.sh | bash
   ```

   Windows 请改在 PowerShell 中运行：

   ```powershell
   $s="$env:TEMP\dsh-install.ps1"; irm https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/install.ps1 -OutFile $s; powershell -NoProfile -ExecutionPolicy Bypass -File $s
   ```

   脚本会把托管 workspace 下载到 `~/.dsh/dsh-browser`，构建桥插件，把它的官方 bundle 注册到本机 dsh 的 `web` profile，再构建扩展并把产物复制到稳定目录 `~/.dsh/browser-extension`，然后打开 `chrome://extensions`。开启开发者模式，选择「加载已解压的扩展程序」，加载扩展目录。再次运行该命令会更新托管安装。

   clone 得到的 checkout 也使用同一个安装器，而且不会下载或覆盖源码：

   ```sh
   git clone https://github.com/Lum1104/dsh-browser.git
   cd dsh-browser
   ./scripts/install.sh
   ```

   Windows checkout 请运行 `.\scripts\install.ps1`。路径可以包含空格：安装器通过 profile 内的目录联接注册插件，不会把 checkout 的绝对路径写入 pnpm link 规格。

2. **启动 dsh 并挂载桥插件**。可以使用 workspace 固定的运行时：

   ```sh
   cd ~/.dsh/dsh-browser && pnpm start
   ```

   如果使用 clone，请改为在仓库根目录运行 `pnpm start`。

   或使用受支持的精确公开版本：

   ```sh
   npx @deepseek-ai/dsh@0.2.1-rc.5 web
   ```

   两种命令都会从本机 `web` profile 加载同一个 bundle。默认端口为 3080；如被占用，可追加 `--port <port>`。

   **DSH Desktop 用户**：桌面版启动 Host 时用 `--port 0`，本地 Web 端口每次启动都由系统重新分配，固定端口列表无法预知。因此桥接插件会同时在固定的回环信标端口（`43189`–`43198`，取第一个空闲端口）上通告真实桥地址。面板打开时探测一次：已填地址优先尝试，只有回环地址连不上时才自动探测一次。都没找到时状态显示「未找到服务」，不再重试；此时打开**设置 → 自动检测**列出本机所有实例并点选，或直接手填 `http://127.0.0.1:<端口>`。若想固定端口，可在 `~/.dsh/profiles/desktop/cordis.patch.yml` 覆盖 `webserver` 行——patch 的 `config` 是整体替换，务必把 `host` 一起写出。

   加载或重新加载扩展本身是被动的：只有打开侧栏后，扩展才会探测本机端口并创建 WebSocket。用户已建立的健康连接可在侧栏关闭后继续用于后台审批；但连接一旦掉线或被另一浏览器替换，没有打开侧栏时就不会重连。

3. **开始使用**：打开普通的 `http://` 或 `https://` 页面，点击 DeepSeek 鲸鱼图标打开侧边栏。两个构建都会自动探测本机 dsh。Chrome 回环连接无需地址或 Token；Firefox 的 `moz-extension://` UUID 不能证明扩展身份，必须在设置中填入 `~/.dsh/ext-bridge-token`。可以直接对话，或先点「读取页面」。

页面即使在扩展安装或重载之前已经打开，也会在第一次操作时自动补加载内容脚本，无需手动刷新。`chrome://`、Chrome Web Store 等浏览器内置或受保护页面只提供标签页元数据，以及浏览器级 HTTP(S) 导航、后退、前进和刷新；不能读取或操作其 DOM。

如果只开发扩展，Chrome 从 `chrome://extensions` 加载 `extensions/dsh-browser/dist/`；Firefox 运行 `build:firefox` 后，从 `about:debugging#/runtime/this-firefox` 加载 `extensions/dsh-browser/dist-firefox/manifest.json`。代码更新后需重新构建并重新加载。

## 输入区控制：权限模式、模型、命令与 Skill

输入区提供与 Web GUI 对齐的控件，全部由桥插件自有的 Host 方法支撑：

- **权限模式**（左侧 chip）：部署的预设表（`read-only`、`workspace-write`、`danger-full-access`，实验 Auto integration 挂载时还有 `auto`）加上当前会话的取值。选择预设会执行宿主自己的 `/permission <preset>` 命令，因此 `permission/preset` 选择与两个旋钮事件都会像 Web GUI 选择一样写入会话日志。「完全权限」与「Auto review」会先要求显式确认；推导态 `custom` 只作展示、不可选；菜单底部提示新会话的默认值。首次发送消息创建会话之前，选择会被记住，并在 materialize 时、第一条提示词准入之前应用。
- **模型与推理强度**（右侧 chip）：按 provider 分组的模型目录，以及当前模型声明的推理强度（含「默认」）。选择只影响**下一轮**装配，因此回合运行中 chip 依然可用。目录读取失败时该行会说明原因并提供重试，而不是静默变灰；漏掉的 `turn/end` 会在面板下次变为可见时按宿主的 `running` 标记纠正。
- **`/` 选单**：在空行输入 `/` 会打开宿主命令目录（`/compact`、`/permission`、`/plan`、`/goal`、`/feedback`、`/export` 等）与该会话的用户可调用 skill，其中包含标记为 `modelInvocable: false` 的 skill（带「仅用户可调用」角标）——它们正是为显式调用而存在。`↑`/`↓` 移动、`Enter`/`Tab` 接受、`Esc` 关闭；选中某行会插入其确切文本，方便继续补参数。提交时面板按与宿主适配器一致的规则裁决：命令名走 `commands.execute`（其输出永远不会变成模型消息），skill 名按字面文本发送（由宿主注入 skill 正文），无法识别的 `/…` 行会被**拒绝**且草稿保留——若想按普通文本发送，请在行首加一个空格。命令不支持附件；临时会话（尚未创建）的命令/skill 目录在第一条消息创建会话前返回空。

## 页面读取与控制

- **文本快照**：标题、URL、正文、编号元素和表单的默认预算为 32k 字符（插件可配，经 `hello.ok` 协商给扩展）。经过审批后，截图还可提供页面图像。
- **页面文字是不可信输入**：快照和局部文本读取会放进带随机 nonce 的信任边界，并明确要求模型不得把网页中的命令当成指令。这只是纵深防御；扩展侧的操作审批才是强制安全边界。
- **稳定编号**：元素编号跨快照保持（WeakMap + `data-dsh-el`），模型可以说"点 7 号"；页面大改时显式提示"编号已重排"。
- **delta 模式**：`browser_snapshot({delta:true})` 只返回变化元素的编号，省 token。
- **隐私**：文本快照中的密码和卡号值以 `••••` 呈现，可访问名称不使用敏感字段的当前值。截图直接捕获可见像素，不会遮盖字段。开发者工具需要独立授权。
- **标签页绑定**：提交提示时会在模型开始工作前绑定活动标签页；如果直接调用浏览器工具，也会在需要时完成首次绑定。手动切换标签页或窗口后，后续工具会暂停，并询问助手留在原页面还是跟随当前页面；此时还可以点「跳转回到助手页面」，把你自己正在看的标签页切回助手所在的页面。选择留在原页面后允许后台操作，但不会改变用户正在看的页面；选择跟随后会重置页面引用状态。受控页关闭后失败关闭，直到用户选择当前页面；切页还会撤销尚未完成的操作审批。
- **分级审批**：默认「自动共享」允许模型按需读取受控标签页而不额外弹窗；「每次询问」可恢复逐次读取确认，「关闭」会阻断读取。在「每次询问」模式下，读取弹窗可以仅允许一次，也可以持久切回自动读取，之后仍可在设置中关闭。状态变更工具仍然失败关闭，并显示实际 origin 和脱敏动作摘要；用户可拒绝、仅允许一次，或只在当前侧栏会话中信任单个 origin。最后一个侧栏关闭或 Service Worker 重启会清空临时信任；永久信任需在设置中显式管理。侧栏关闭时，审批最多保留 60 秒；启用通知后，系统通知可把用户带回侧栏。会话级审批只会在其所属会话恢复完成后显示。调用方取消或桥接超时时，会先撤销尚未完成的审批，过期动作不会继续执行。
- **完全控制需显式开启**：**允许模型完全控制浏览器**只有设置保存成功后才会生效，启用后页面读取、页面操作以及标签页列出/跟随/关闭均无需确认。调用在收到时固定其访问模式，因此开启完全控制不会追溯提升已经开始的受限调用。关闭会立即生效：取消尚未下发操作的调用，等待已经下发到浏览器的操作完成，再保存限制设置。快速重新开启也会在旧权限撤销完成前保持受限，并发保存会按请求顺序落盘。受保护页面的 DOM 内容始终不可访问。
- **会话续接**：重新打开侧栏时默认恢复最近活跃的浏览器会话；若该会话不可用，则恢复最新的非空持久会话，最后才创建新会话。可在设置中关闭。

## 开发者工具（需显式开启，高权限）

开发者工具组通过 Chrome 调试协议（`chrome.debugger`）驱动受控标签页，因此可以查看并修改页面元素与 CSS、在页面自身上下文执行 JavaScript、以及抓取网络请求（含页面层拦截拿不可靠的响应正文）。

- **默认关闭**：用户通过设置或当前侧栏会话授权之前，开发者工具调用会请求审批。弹窗提供仅允许一次、本次会话信任、拒绝。最后一个侧栏关闭或 worker 重启后，会话信任失效。**允许模型完全控制浏览器**开关与持久化 origin 白名单都不覆盖这一组。
- **持久授权**：设置里的**允许开发者工具**跨侧栏会话授权这一组工具。关闭设置会断开调试器并取消进行中的开发者工具调用，包括通过会话信任允许的调用。页面导航会取消旧文档尚未完成的审批。
- **每个标签页只允许一个调试器**：Chrome 会拒绝第二个调试器，因此附加期间浏览器自带的开发者工具无法在同一标签页打开。工具返回会说明原因并提示先关闭该标签页的 DevTools。
- **数据处理**：抓包只存在内存中，上限为 200 条请求与 500 条控制台记录，附加时与每次顶层导航时都会重置。`Authorization`、`Cookie`、`Set-Cookie` 等请求头默认显示为 `[redacted]`，除非某次调用显式选择；疑似认证 URL 的正文默认脱敏。
- **平台**：仅 Chrome。Firefox 构建不申请 `debugger` 权限，因此宿主也不会在该平台注册这一组工具。

## 权限说明

Chrome 使用 `sidePanel`，Firefox 使用 `sidebar_action`。两者都申请 `storage`（设置与最近会话）、`notifications`（可选的审批提醒）、`tabs` + `activeTab` + `scripting`（观察切页并向受控标签页注入脚本）、`webNavigation`（将操作绑定到 frame 文档）、`alarms`（后台保活）和 `<all_urls>` 主机权限。内容脚本在 HTTP(S) 页面运行。Chrome 还申请用于真实输入和开发者工具的 `debugger`，以及用于剪贴板操作的 `clipboardWrite` 和 `offscreen`。Firefox 不申请这些 Chrome 专用能力。Firefox AMO manifest 声明了发送给用户配置的 dsh/模型服务的浏览活动、网页内容与操作、对话内容。显式返回助手页面或调用 `browser_follow_tab { activate: true }` 可以激活标签页；手动切换标签页需要确认控制权交接。

## 已知限制

- 同时只有一个扩展连接桥。未打开侧栏的浏览器 Profile 不会抢占连接；另一个已打开的侧栏顶替连接后，被替换的一端会主动让权，不再反复重连互踢。
- 开发者工具需要 Chrome 125 以上、设置或会话授权或逐次审批，以及可用的调试连接。连接保持期间会显示 Chrome 的调试提示，包括网络抓包期间。
- 标签页绑定属于整个扩展连接，而不是单个对话会话。
- 可访问的跨源 iframe 会进入快照，并通过稳定的 `(frame, index)` 地址执行操作；受保护或已销毁的 frame 会标记为不可访问，不影响整页快照。
- 验证码/纯图片按钮无法处理——工具结果会标注"存在无文本可访问名的元素"，提示用户手动完成该步。
- 令牌无自动轮换。
- `browser_press` 的合成按键不触发浏览器原生默认行为，例如 Tab 焦点移动、方向键滚动或 Enter 激活。Chrome 的真实输入通道支持这些操作；Firefox 使用合成输入。
- `browser_wait` 以加载完成 + 固定静默窗口为准，不观察持续 DOM 更新（连续刷新的 SPA 可能被报为稳定）。
