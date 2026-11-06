# @yuxianglin/dsh-bridge-browser

[English](README.md) | 中文

dsh 的**浏览器操作桥**挂载经过 token 认证的 WebSocket 通道（`/ext/bridge`）供浏览器扩展连接，把扩展调用投影到 DSH Typert Remotes，跟随 Session 与 Remote Event 流，并注册用于读取和操作受控标签页、截图、开发者工具的工具集。浏览器保留登录状态，侧栏提供对话界面。

页面快照包含结构化文本、编号控件和遮盖敏感值的表单字段。操作通过元素编号或选择器定位。截图和对话图片使用 DSH 持久附件服务；宿主挂载该服务时，延迟创建的会话会声明图片限制。


## 配置

| 键 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `token` | `string` | 自动生成 | 固定 bearer token。缺省时首次启动生成，写入 `~/.dsh/ext-bridge-token`（0600）并打印在启动日志。 |
| `toolTimeoutMs` | `number` | 90000 | 单次工具调用预算，为扩展的 60 秒审批窗口预留时间。 |
| `snapshotMaxChars` | `number` | 32000 | 单次快照渲染字符上限，最小为 500（经 `hello.ok` caps 协商给扩展）。 |
| `maxInteractiveItems` | `number` | 60 | 单次快照交互清单条数上限。 |
| `devToolsMaxChars` | `number` | 24000 | 单次开发者工具结果渲染字符上限，最小为 500。 |
| `sessionWorkspacePath` | `string` | `~/.dsh/browser-sessions` | 扩展创建的会话所用的专用 Host Workspace。插件会在首次调用未显式指定工作区的 `session.create` 时创建并幂等注册该目录；会话的 cwd 随之变为此路径，因此 GUI 会显示 `browser-sessions` 工作区分组。设为 `""` 可让会话继续显示在“未分组”中。 |
| `deferSessionCreate` | `boolean` | `true` | 会话只在第一条消息时才真正创建：`session.create` 先返回一个内存暂定 ID（不落库），历史读取为空，第一次 `session.prompt` 才创建真实会话（同一 ID、回放原始创建参数）。只打开面板不说话，会在会话库/GUI 里不留任何痕迹。 |
| `beacon` | `boolean` | `true` | 同时在固定的回环信标端口上回答发现端点，让随机分配的 Web 端口（DSH Desktop 用 `--port 0` 启动 Host）保持可发现。绑定失败只记诊断，不影响桥本身。 |
| `beaconPorts` | `number[]` | `43189…43198` | 候选信标端口，按序尝试直到绑定成功；取第一个空闲端口，多个本地实例因此都能被发现。`beacon` 为 false 时忽略。 |

工作区分组采用尽力而为方式。如果组合没有 workspace 域、目录创建失败，或 `workspace.create` 拒绝该路径，插件会记录一条警告，并在不注入工作区的情况下发送所有会话创建请求，因此浏览器聊天仍可使用。

## 使用

远程安装器会下载一个由脚本托管的 workspace，构建插件，并将它的官方 bundle 注册到本机 dsh 的 `web` profile。该方式无需 Git，也无需提前 clone：

```sh
curl -fsSL https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/install.sh | bash
cd ~/.dsh/dsh-browser && pnpm start
```

Windows 请改用 PowerShell 安装器：

```powershell
$s="$env:TEMP\dsh-install.ps1"; irm https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/install.ps1 -OutFile $s; powershell -NoProfile -ExecutionPolicy Bypass -File $s
cd $HOME\.dsh\dsh-browser; pnpm start
```

开发者也可以 clone 仓库，在 checkout 中依次运行 `./scripts/install.sh` 和 `pnpm start`。本地模式直接使用当前分支，不会下载或覆盖源码。两种安装模式都会注册同一个 profile bundle；构建工具只从选定的 workspace 解析，绝不读取父 checkout 或父目录的 `node_modules`。

工作区针对最新公开发布的 dsh，目前固定使用 0.2.1-rc.5；不支持旧版 DSH：

```sh
npx @deepseek-ai/dsh@0.2.1-rc.5 web
```

插件清单自带这层声明：`engines.dsh`（`^0.2.1-rc.5`）与 `dsh.manifestVersion: 1` 让 dsh 在加载插件前拒绝不兼容的宿主；插件页直接读取 `locale/en.json` / `locale/zh.json` 里的标题与简介、以及 `icon.svg` 图标来展示，无需激活插件。

安装器会把已解压扩展复制到 `~/.dsh/browser-extension` 并打开 `chrome://extensions`。在 Chrome 中加载这个稳定目录，然后使用侧边栏。扩展会自动发现回环连接，无需输入 token；非回环部署仍需要配置的 bearer token。

## 面板驱动的 Host 方法

除了纯网关透传（`rpc`），适配器还组合了侧栏需要的若干 Host 方法。它们是面板操作输入区权限/模型/命令/Skill 的唯一词汇，且从不会作为工具暴露给模型。

| 面板方法 | payload | 宿主侧工作 | 结果 |
|---|---|---|---|
| `permission.catalog` | `{}` | `permissionPresets/catalog` | `{ options, defaultOptions, defaultPreset }` |
| `session.permissions` | `{ sessionId }` | 目录 + 该会话的 `permissions` 投影 | `{ current, defaultPreset, options, defaultOptions, routable, provisional }` |
| `session.setPermission` | `{ sessionId, preset }` | 校验预设后执行 `commands/execute` 的 `/permission <preset>` | `{ preset, commandId, result }` |
| `commands.list` | `{ sessionId }` | 以会话 agent 为作用域的 `commands/list` | `{ commands: [{ name, description, hint?, definitionId? }], provisional }` |
| `commands.execute` | `{ sessionId, line }` | 附件列表为空的 `commands/execute` | `{ commandId, result }`；未知命令行返回 `bad-request` |
| `skills.list` | `{ sessionId }` | 该会话组合的 `skills/list` | `{ skills: [{ name, description, whenToUse?, modelInvocable, path? }], provisional }` |

失败语义：未挂载权限服务的宿主会让 `session.permissions` 返回 `routable: false` 而不是报错，面板据此隐藏控件；部署的桥未实现某方法时返回 `not-found`（`… is unavailable`），使较新的面板可以降级而不是崩掉。`commands.execute` 会拒绝不符合宿主命令语法的行，宿主返回的未知命令名会被报告为 `bad-request`，而不是空成功。

## 延后创建（deferred Sessions）

`deferSessionCreate`（默认 `true`）让 `session.create` 返回临时 id，并在第一条 `session.prompt` 时才真正创建会话。输入区方法遵循这一点：临时 id 的 `session.permissions` 用进程目录加已记住的选择作答，`session.setPermission` 记录该选择，materialize 时在模型选择之前、第一条提示词准入之前重放 `/permission <preset>`（失败会让该提示词留在队列中重试，而不是在错误的策略下运行）。`commands.list` 与 `skills.list` 需要真实 agent，因此临时 id 返回空并带 `provisional: true`；`commands.execute` 只接受权限切换，其余返回 `provisional-session`。

## 安全模型

- 桥路径在 `/api` 信任栅栏**之外**（栅栏只罩 client-connection 注册的路由），因此自带 bearer token 认证：首帧必须是 `hello`（5 秒内），常量时间比对，失败即断开。
- `/api` 载体钉在回环上的方法（`settings.*`、`credentials.*`、`host.pickDirectory`、`host.openPath`）对非回环来源**即使 token 正确也拒绝**——对 `--host 0.0.0.0` 部署的纵深防御。
- 同一时刻仅一个活动连接，新认证连接顶替旧连接。
- 发现信标（固定回环端口上的 `/ext/bridge-config`）只给出桥地址、宿主 pid 与启动时间：只绑 `127.0.0.1`，不发任何 CORS 头（网页能看到连接但读不到内容），对不是 `127.0.0.1`/`localhost:<该端口>` 的 `Host` 头返回 403（防 DNS rebinding），且从不携带 bearer token。宿主绑定非回环地址时整个信标被跳过。
- 桥是 confused-deputy 边界而非通用认证层：不要把 `dsh web --host 0.0.0.0` 暴露在不信任的网络上。
- 抽取的页面文字会标记为模型的不可信输入。页面读取遵循扩展的询问/自动/关闭策略；状态变更工具必须经过按 origin 的侧边栏决策，没有侧边栏时失败关闭。同源后续操作可只在当前侧栏会话中临时信任，永久信任仍需显式设置。

## 线协议

帧为按 `t` 判别的 JSON 对象，定义在 [`protocol.ts`](src/protocol.ts)，是通过 workspace 包的 `./src/*` export 与扩展共享的真源。构建后的包还会发布 `@yuxianglin/dsh-bridge-browser/protocol`，供外部消费方使用。

- 客户端 → 服务端：`hello`（认证+caps）、`rpc`（网关方法透传）、`respond`（按 RPC id 结算宿主交互）、`tool.result`、`pong`。
- 服务端 → 客户端：`hello.ok`（回显协商后的 caps）、`rpc.result`、`respond.result`（相关联的受理结果或错误）、`event`（由 dsh Remote 流与 waterfall 投影而来的 bridge 内部事件）、`tool.call`、`ping`、`error`。

每个 `respond` 同时携带全局唯一的传输 id 与宿主交互的 `rpcId`。扩展只把回执路由给发起操作的面板，并在超时、面板关闭或桥断线时拒绝尚未完成的响应。

## 工具

| 工具 | 用途 |
|---|---|
| `browser_snapshot` | 结构化文本快照（标题/URL/正文/清单/表单）；`delta: true` 只返回变化，`frame` 单读一个 iframe，`query` 按文本/选择器/角色定位元素并给出选择器。 |
| `browser_click` | 按编号或选择器点击、双击；支持鼠标按键和修饰键。 |
| `browser_type` | 按编号/选择器或向当前焦点输入文本；`replace` 先选中内容，`mode` 选择光标插入或逐字符按键。 |
| `browser_press` | 单键或组合键（`modifiers`），`action: down/up` 跨调用按住，`repeat` 重复。 |
| `browser_clipboard` / `browser_upload` | 写入/粘贴文本与富文本；把本机文件附加到 file input（系统粘贴与上传在 Chrome 可用）。 |
| `browser_scroll` / `browser_navigate` / `browser_open_tab` / `browser_back` / `browser_forward` / `browser_reload` | 页面滚动与导航；滚动时可用 `frame` 指定 iframe。 |
| `browser_get_text` / `browser_wait` | 读区域文本 / 稳定检测。 |

点击、文本输入和滚动操作在指定文档中执行，支持跨域 iframe。Chrome 通过调试器执行原生键盘事件、光标位置插入、系统粘贴和文件上传。截图要求受控标签页处于活动状态且窗口聚焦，可以使用 `browser_follow_tab { activate: true }` 将页面切到前台。

### 开发者工具（高权限）

该组只在已连接的扩展声明 `devTools` 能力时注册，Chrome 构建会声明，Firefox 构建不会。每次调用需要设置中的**允许开发者工具**、当前侧栏会话授权或逐次审批（仅允许一次 / 本次会话信任 / 拒绝）。最后一个侧栏关闭或 worker 重启后，会话信任失效。「完全控制浏览器」开关与持久化 origin 白名单不覆盖这一组。

| 工具 | 用途 |
|---|---|
| `browser_devtools_elements` | 按 CSS 选择器或 `browser_snapshot` 编号查看元素（计算样式、盒模型、命中规则、属性）。 |
| `browser_devtools_set_element_style` / `browser_devtools_set_element_attribute` | 现场调试 CSS（内联样式或命中的样式表规则）与读取/设置/删除单个属性。可执行脚本的属性会被拒绝。 |
| `browser_console_eval` / `browser_console_logs` | 在页面自身上下文执行 JavaScript（可选等待 Promise），并读取附加后记录的控制台输出。 |
| `browser_devtools_network` | 对受控标签页开始 / 停止 / 查询网络抓包。 |
| `browser_devtools_list_requests` / `browser_devtools_get_request` / `browser_devtools_request_body` | 列出已捕获请求、查看单条完整内容、获取请求或响应正文。凭据类请求头（`Authorization`、`Cookie` 等）默认脱敏，除非单次调用显式选择；疑似认证 URL 的正文默认脱敏。 |

抓包说明：Chrome 同一标签页只允许一个调试器，因此附加期间浏览器自带的开发者工具无法在该标签页打开，错误信息会点明这一原因。抓包数据保存在内存中且有上限（200 条请求、500 条控制台记录），附加时与每次顶层导航时都会重置。所有返回的页面数据都视为不可信输入。

## 模型体验

- **Token 影响**：一次 `browser_snapshot`（默认 32k 字符）对常见英文文本约为 8–10k token，具体取决于语言和分词器；delta 快照只需零头。系统提示段落引导模型按需快照而非囤积页面文本。
- **KV 缓存影响**：无（快照不做服务端缓存）。
- **延迟**：每次动作等待扩展在真实页面执行 + 稳定检测（通常 0.2–2s；导航最长 5s）。
- **失败模式**：`bridge-closed`（扩展未连接）、`timeout`、`no-active-tab`、`content-unavailable`（页面需刷新）、`action-failed`（编号过期——模型应重新快照）。

## 扩展点

- 工具集是消费面；seam 是桥接线（`protocol.ts`）。在 `ctx.tools` 注册新工具并经由桥分发即可，扩展的 content script 按动作名分发。
- 协商 caps（`hello.ok`）让插件无需共享配置文件即可向扩展下达快照预算。

## 已知限制与后续工作

- 仅一个活动扩展连接（第二个窗口顶替第一个）。
- 可访问的跨源 iframe 会进入快照，并通过稳定的 `(frame, index)` 地址执行操作；受保护或已销毁的 frame 会标记为不可访问，不影响整页快照。
- token 手动轮换（改 `~/.dsh/ext-bridge-token` 或配置 `token`），无过期。
- Playwright 驱动的扩展 e2e 会在缺少可用的 Chromium 可执行文件或构建完成的扩展包时自行跳过。
- 审批由扩展 service worker 强制执行，而不是依赖模型自觉。未来接入 dsh 工具管线时可以把同一策略暴露给其它客户端。
