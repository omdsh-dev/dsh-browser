# Agent 笔记：高级页面能力

状态：已实现

[English](2026-08-18-advanced-page-capabilities.md) | 中文

## 问题

浏览器工具集把所有寻址都压在同一个编号体系上。`browser_snapshot` 只收集一层语义控件白名单（`a[href]`、`button`、input 和少数 role），清单上限 60 条，排序是"对话框优先、视口优先"。白名单之外的控件——没有 `href` 的 `<a>` 分页、`<li onclick>` 行、`cursor: pointer` 单元格——永远拿不到编号；页底分页还会被"视口优先"挤出 60 条之外。结果是页面能读却部分不可操作：模型在正文里看得到"下一页"，却点不了。

另外两处缺口是同一形状。`browser_scroll` 只移动 window，所以 app 壳布局（`body { overflow: hidden }` + 内部滚动 div）根本滚不动。`browser_press` 丢掉了修饰键状态，页面级的 Control+Enter 之类快捷键无法表达。

还有一类能力是**刻意没做**而非做不到：页面存储、以页面身份发请求、页面 JavaScript。扩展本来就持有 `scripting` 和全站 host 权限，限制来自工具契约，不是平台能力。

## 决策

**P0：在不扩大安全边界的前提下补齐寻址与输入。**

- `browser_click` 接受且仅接受 `index`、`selector`、`text` 三者之一（外加 `role`/`nth` 过滤）。文本解析先扫直接文本节点和无障碍名称，再向上找最近的可操作祖先——点击落点与用户点击一致，原生表单激活仍然有效。命中多个时返回候选清单报错，而不是猜一个。
- `browser_snapshot` 发现页面内部滚动容器，为每个容器输出唯一 CSS 选择器、滚动百分比和剩余像素。`browser_scroll` 可移动指定容器（或编号元素最近的滚动祖先）。window 滚动无效时会明确说明并指向区域清单。
- `browser_press` 接受 `modifiers`（`ctrl`/`meta`/`shift`/`alt`），并为常见按键推导 `KeyboardEvent.code`。
- 编号寻址保留"必须属于当前文档"的守卫；选择器/文本寻址刻意不要求快照基线，因为它在实时 DOM 上重新解析。

**P1：把跨页面工具做成默认关闭、复用既有审批机制的可选项。**

`browser_get_storage`、`browser_fetch`、`browser_eval` 仅在桥插件配置 `advancedTools: true` 时注册（默认 false）。三者在扩展侧都受审批：存储属于页面读取，fetch 与 eval 属于动作，且它们的审批从不提供"永久信任该 origin"。所有返回值走既有的 nonce 包裹不可信边界。存储批量列举会掩码疑似凭据的值，显式指定 key 是文档化的例外通道。fetch 以页面 origin 发起并带 `credentials: 'include'`，同源管理 API 直接带页面 Cookie 可用，跨源仍受 CORS 限制。eval 通过 `chrome.scripting.executeScript({ world: 'MAIN' })` 在页面主世界执行；异步结果寄存在按调用命名的页面全局变量里，最多轮询三秒。

## 考虑过的替代方案

**改用 CDP/debugger 路径换取原生级控制。** `chrome.debugger` 能提供真正的 `Input.dispatchKeyEvent`、可靠的点击、网络拦截，以及绕过页面 CSP 的 `Runtime.evaluate`。但它需要 `debugger` 权限、顶部会常驻"正在调试此浏览器"横幅、与打开的 DevTools 互斥，且无法移植到 Firefox 构建。对"在你已经开着的浏览器里操作"这个定位而言，它是完整 RPA 的正解，不是本项目的正解。

**扩大清单白名单而不是加选择器/文本寻址。** 把 `[onclick]`、`a:not([href])`、`cursor: pointer` 启发式塞进快照会污染每次快照、抬高 token 成本，而且仍然会输给 60 条上限。按需寻址才能让快照保持便宜。

**默认启用高级工具、只靠审批兜底。** 审批是逐次交互的控制，不是能力边界；只要工具被注册，任何跳过审批的配置（无限制访问、受信任会话）都会静默暴露页面存储与代码执行。默认关闭才能保持原有姿态。

**把 `browser_eval` 放到 content script 的隔离世界执行。** 那样可以避开 `world: 'MAIN'`，但隔离世界看不到页面变量和页面函数——而这正是调用方需要的东西；同时 MV3 扩展 CSP 会让那里的 eval 不可靠。

## 验证

`pnpm run typecheck` 与 `pnpm run build` 通过。扩展测试 433 项全过；桥测试 150/151，唯一失败的是 `token.spec` 里 Windows 下 `chmod 0600` 的既有断言（已在干净 checkout 上复确认）。新增覆盖：`tests/actions-advanced.spec.ts`（选择器/文本/role 寻址、歧义、修饰键、内部容器滚动、存储掩码、fetch 请求构造与 CORS 失败）、`tests/snapshot-regions.spec.ts`（区域发现、选择器、水平轴、delta 上报）、`tests/background-advanced-tools.spec.ts`（主世界注入、异步轮询、不可信包裹、审批拒绝、受保护页面、关闭共享闸门），并扩展了 `tools.spec.ts` / `authorization.spec.ts` / `index.spec.ts` 覆盖新契约与配置开关。

## 后果

- 文本/选择器点击消除了分页死路，但合成事件仍无法触发浏览器保留快捷键和原生编辑默认行为；这属于 CDP 级别的固有限制。
- `browser_eval` 继承页面 CSP：严格页面会以明确错误拒绝 eval；页面脚本死循环会卡住该标签页，沙箱无法抢占。
- `browser_fetch` 受 CORS 与页面自身凭据约束，不是通用 HTTP 代理。
- 高级工具扩大了被攻陷模型或提示注入能触达的范围，这正是它们既默认关闭、又逐次审批的原因。
