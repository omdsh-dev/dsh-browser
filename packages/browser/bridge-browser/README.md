# @yuxianglin/dsh-bridge-browser

English | [中文](README.zh.md)

The **browser-operation bridge** for dsh mounts a token-authenticated WebSocket carrier (`/ext/bridge`) for the browser extension, projects its calls onto DSH Typert Remotes, follows Session and Remote Event streams, and registers tools for reading and operating the controlled tab, capturing screenshots, and using developer tools. The browser retains its login state, and the side panel provides the conversation UI.

Page snapshots contain structured text with numbered controls and masked form fields. Actions target element numbers or selectors. Screenshots and chat images use DSH's durable attachment service; deferred sessions expose image limits when the host mounts that service.

## Config

| Key | Type | Default | Description |
|---|---|---|---|
| `token` | `string` | generated | Fixed bearer token. When absent, a token is generated on first boot and saved to `~/.dsh/ext-bridge-token` (chmod 0600). The boot log shows the file path. |
| `toolTimeoutMs` | `number` | 90000 | Per-tool-call budget, leaving time for the extension's 60-second approval window. |
| `snapshotMaxChars` | `number` | 32000 | Upper bound on one rendered snapshot's characters, minimum 500 (also negotiated to the extension via `hello.ok` caps). |
| `maxInteractiveItems` | `number` | 60 | Upper bound on interactive inventory items per snapshot. |
| `devToolsMaxChars` | `number` | 24000 | Upper bound on one developer-tools result's characters, minimum 500. |
| `sessionWorkspacePath` | `string` | `~/.dsh/browser-sessions` | Dedicated Host Workspace for extension-created sessions. The plugin creates and idempotently registers the directory on the first implicit `session.create`; the session cwd becomes this path, so the GUI shows a `browser-sessions` workspace group. Set `""` to keep sessions Ungrouped. |
| `deferSessionCreate` | `boolean` | `true` | Sessions materialize only on the first message: `session.create` answers with a provisional id (nothing persisted), history reads empty, and the first `session.prompt` creates the real session (same id, original payload). Opening the panel without chatting leaves zero trace in the session store/GUI. |
| `beacon` | `boolean` | `true` | Also answer the discovery endpoint on a fixed loopback port, so a randomly assigned Web port (DSH Desktop starts its host with `--port 0`) stays discoverable. Binding failures are diagnostics only; the bridge itself is unaffected. |
| `beaconPorts` | `number[]` | `43189…43198` | Candidate beacon ports, tried in order until one binds; the first free port wins, which keeps several local instances discoverable. Ignored when `beacon` is false. |

Workspace grouping is best-effort. If the composition has no workspace domain, directory creation fails, or `workspace.create` rejects the path, the plugin logs one warning and sends every session creation without an injected workspace so browser chat remains usable.

## Usage

See the root README for [installation, updates, startup, and uninstall](../../../README.md#detailed-installation-and-usage).

## Development

The package declares `dsh.bundle.patch` as `./cordis.patch.yml`. The installer registers the local package in the `web` profile, which loads that patch.

The bridge and extension share one pnpm workspace. Bridge source imports `@deepseek-ai/cordis` and `@deepseek-ai/schemastery` directly, and its DSH dependencies match the workspace's pinned release. The root build builds the bridge before the extension.

The package manifest declares that support itself: `engines.dsh` (`^0.2.2-rc.2`) and `dsh.manifestVersion: 1` let dsh refuse an incompatible host before loading the plugin, and the Plugins page reads the localized title and description from `locale/en.json` / `locale/zh.json` plus the icon from `icon.svg` without activating the plugin.

## Host methods the panel drives

Beyond plain gateway passthrough (`rpc`), the adapter composes a few Host
methods the side panel needs. They are the panel's only vocabulary for the
composer's permission, model, command, and skill controls, and they are never
offered to the model as tools.

| Panel method | Payload | Host work | Result |
|---|---|---|---|
| `permission.catalog` | `{}` | `permissionPresets/catalog` | `{ options, defaultOptions, defaultPreset }` |
| `session.permissions` | `{ sessionId }` | the catalog plus the Session's `permissions` projection | `{ current, defaultPreset, options, defaultOptions, routable, provisional }` |
| `session.setPermission` | `{ sessionId, preset }` | validates the preset, then `commands/execute` with `/permission <preset>` | `{ preset, commandId, result }` |
| `commands.list` | `{ sessionId }` | `commands/list` scoped to the Session's agent | `{ commands: [{ name, description, hint?, definitionId? }], provisional }` |
| `commands.execute` | `{ sessionId, line }` | `commands/execute` with the empty attachment list | `{ commandId, result }`; an unknown line is a `bad-request` |
| `skills.list` | `{ sessionId }` | `skills/list` for the Session composition | `{ skills: [{ name, description, whenToUse?, modelInvocable, path? }], provisional }` |

Opening `session.history` activates the Session through `session/follow`; requests with `beforeSeq` use `session/events` for older pages. `session/observeState` supplies the bridge's `session/state` events, and `session/observeProjections` supplies `session/projection` events with `{ sessionId, seq, changes }`.

`session.attachment` takes `{ sessionId, attachment }` with the complete image reference. When the `conversationContinuation` projection permits it and the Session is idle, the panel continues with `session.prompt` and `content: []`. Session deletion waits for the Host's archive-triggered worktree cleanup before removing its log.

Failure semantics: a Host that does not mount the permission service answers
`session.permissions` with `routable: false` instead of failing, so the panel
can hide the control; a method the deployed bridge does not implement answers
`not-found` (`… is unavailable`), which lets a newer panel degrade instead of
breaking. `commands.execute` refuses a line without the Host command grammar,
and an unknown command name from the Host is reported as `bad-request` rather
than an empty success.

## Deferred Sessions

`deferSessionCreate` (default `true`) answers `session.create` with a
provisional id and materializes the real Session on the first `session.prompt`.
Composer methods respect that: a provisional id answers `session.permissions`
from the process catalog plus the remembered choice, `session.setPermission`
records the choice, and materialization replays `/permission <preset>` before
the model selection and before the first prompt is admitted (a failure keeps
the prompt queued for retry instead of running it under the wrong policy).
`commands.list` and `skills.list` need a real agent, so a provisional id
answers empty with `provisional: true`; `commands.execute` accepts only the
permission switch and answers `provisional-session` for everything else.

## Security model

- The bridge route lives **outside** the `/api` trust fence (which only guards client-connection's routes), so it carries its own bearer-token authentication: the first frame must be `hello` with the token within 5s, verified in constant time. Failed auth closes the socket.
- Gateway methods the `/api` carrier pins to loopback (`settings.*`, `credentials.*`, `host.pickDirectory`, `host.openPath`) are refused for non-loopback remotes **even with a valid token** — defense in depth for `--host 0.0.0.0` deployments.
- One active connection at a time; a new authenticated socket replaces the previous one.
- The discovery beacon (`/ext/bridge-config` on a fixed loopback port) only names the bridge URL, the host pid, and its start time. It binds `127.0.0.1`, sends no CORS headers (a web page can see the connection but cannot read the body), rejects a `Host` header that is not `127.0.0.1`/`localhost` on that port (DNS rebinding), and never carries the bearer token. It is skipped entirely when the host binds a non-loopback interface.
- The bridge is a confused-deputy boundary, not a general auth layer: never expose `dsh web --host 0.0.0.0` on untrusted networks.
- Extracted page text is marked as untrusted model input. Page reads honor the extension's ask/auto/off policy, while state-changing tools require an origin-scoped side-panel decision and fail closed without a panel. Same-origin repetition can be trusted for the current panel session; permanent trust remains an explicit setting.

## Wire protocol

Frames are JSON objects discriminated by `t`, defined in [`protocol.ts`](src/protocol.ts) and shared with the extension through the workspace package's `./src/*` export. The built package exposes `@yuxianglin/dsh-bridge-browser/protocol` for external consumers.

- Client → server: `hello` (auth + caps), `rpc` (gateway method passthrough), `respond` (resolve a host interaction by its RPC id), `tool.result`, `pong`.
- Server → client: `hello.ok` (echoes negotiated caps), `rpc.result`, `respond.result` (correlated acceptance or error), `event` (bridge-owned projection of dsh Remote streams and waterfalls), `tool.call`, `tool.cancel`, `ping`, `error`.

Each `respond` carries a globally unique transport id as well as the host interaction's `rpcId`. The extension routes its receipt only to the panel that initiated it and rejects pending responses on timeout, panel closure, or bridge disconnection.

## Tools

| Tool | Purpose |
|---|---|
| `browser_snapshot` | Structured text snapshot (title/URL/main/inventory/forms); `delta: true` returns only changes, `frame` reads one iframe, and `query` locates elements by text/selector/role and returns their selectors. |
| `browser_click` | Click or double-click by index or selector; supports mouse buttons and modifiers. |
| `browser_type` | Enter text by index/selector or into the focused element; `replace` selects existing content first, and `mode` chooses caret insertion or per-character keys. |
| `browser_press` | Single keys or chords (`modifiers`), `action: down/up` to hold a key across calls, `repeat` to repeat. |
| `browser_clipboard` / `browser_upload` | Write/paste text and rich HTML; attach local files to a file input (Chrome for system paste and upload). |
| `browser_scroll` / `browser_navigate` / `browser_open_tab` / `browser_back` / `browser_forward` / `browser_reload` | Page scrolling and navigation; `frame` selects an iframe for scrolling. |
| `browser_get_text` / `browser_wait` | Read regions / settle detection. |

Clicks, text entry, and scrolling run in the selected document, including cross-origin iframes. Chrome uses its debugger for native keyboard events, caret insertion, system paste, and file uploads. Screenshots require an active tab in a focused window; `browser_follow_tab { activate: true }` brings the controlled page to the front.

### Developer tools (high privilege)

This group is registered only while the connected extension advertises the `devTools` capability, which Chrome builds do and Firefox builds do not. Each call requires consent through **Allow developer tools** in Settings, a current side-panel session grant, or a per-call approval (allow once / trust this session / deny). Session trust expires when the last panel closes or the worker restarts. The blanket browser-control switch and the persistent origin allowlist do not cover this group.

| Tool | Purpose |
|---|---|
| `browser_devtools_elements` | Inspect an element (computed CSS, box model, matched rules, attributes) by CSS selector or `browser_snapshot` index. |
| `browser_devtools_set_element_style` / `browser_devtools_set_element_attribute` | Live-debug CSS on an element (inline style or the matched stylesheet rule) and read/set/remove one attribute. Script-capable attributes are refused. |
| `browser_console_eval` / `browser_console_logs` | Run JavaScript in the page's own context (optionally awaiting a promise) and read the console output recorded since attach. |
| `browser_devtools_network` | Start/stop/status network capture for the controlled tab. |
| `browser_devtools_list_requests` / `browser_devtools_get_request` / `browser_devtools_request_body` | List captured requests, read one in full, and fetch a request or response body. Credential headers (`Authorization`, `Cookie`, …) are redacted unless the caller opts in per call, and bodies of authentication-shaped URLs are redacted by default. |

Capture notes: Chrome allows only one debugger per tab, so the browser's own DevTools cannot stay open on a tab while capture is attached; the error names that cause. Capture is in-memory, bounded (200 requests, 500 console entries) and resets on attach and on every top-level navigation. All returned page data is untrusted input.

## Extension points

- The tool set is the consumer surface; the seam is the bridge wire (`protocol.ts`). Add tools by registering on `ctx.tools` and dispatching over the bridge; the extension's content script dispatches by action name.
- Negotiated caps (`hello.ok`) let the plugin dictate snapshot budgets to the extension without a shared config file.

## Known limitations

- One active extension connection at a time.
- Accessible cross-origin iframes are snapshotted and operated with stable `(frame, index)` addresses. Restricted or short-lived frames are reported as unavailable without failing the whole page snapshot.
- Token rotation is manual (edit `~/.dsh/ext-bridge-token` or set `token` in config); no expiry.
