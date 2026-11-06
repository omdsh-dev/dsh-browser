# dsh Browser Control Extension (Chrome and Firefox MV3)

English | [中文](README.zh.md)

The **browser-operation end** of dsh: the model reads and operates the browser page you have open — extract content, click elements, fill forms, scroll, and navigate, all in the real page with your login state preserved. The side panel is the conversation entry.

Browser pages are rendered as structured text with a numbered interactive-element inventory. `browser_screenshot` can also capture the controlled viewport after approval. When the DSH host advertises image support, the side panel accepts PNG, JPEG, WebP, and GIF attachments and renders their durable history references.


## What the model can do

| Capability | Action | Notes |
|---|---|---|
| Read page | `browser_snapshot` | Title/URL/main text/numbered inventory/form fields (sensitive values masked); `delta: true` returns only changes, `frame` reads one iframe, `query` locates any element and returns its selector |
| Capture viewport | `browser_screenshot` | Captures visible pixels without masking; requires screenshot approval unless unrestricted control is enabled |
| Click | `browser_click` | Click or double-click by index or selector; supports mouse buttons and modifiers |
| Text | `browser_type` | Type text; `replace` clears first; `mode` chooses insertion or per-character keys |
| Keys | `browser_press` | Keys and chords, including held modifiers across calls |
| Scroll | `browser_scroll` | Scroll the page or selected iframe up, down, to the top, or to the bottom |
| Clipboard / files | `browser_clipboard` / `browser_upload` | Write or paste text and rich HTML; attach local files to a file input |
| Navigate | `browser_navigate` / `browser_open_tab` / `browser_back` / `browser_forward` / `browser_reload` | Navigation inside the controlled tab, or open a URL in a new tab and follow it |
| List tabs | `browser_list_tabs` | List accessible tabs with stable IDs, titles, URLs, and active/controlled state |
| Follow tab | `browser_follow_tab` | Bind later browser tools to a listed tab; stays in the background unless `activate: true` |
| Close tab | `browser_close_tab` | Close a listed tab |
| Read region | `browser_get_text` | Lazy-loaded content / partial text |
| Wait | `browser_wait` | Page load and render-settle detection |
| Inspect elements / CSS | `browser_devtools_elements` / `browser_devtools_set_element_style` / `browser_devtools_set_element_attribute` | High privilege: computed styles, box model, matched rules, live CSS and attribute edits for debugging |
| Run page JavaScript | `browser_console_eval` / `browser_console_logs` | High privilege: evaluate in the page's own context and read recorded console output |
| Capture network | `browser_devtools_network` / `browser_devtools_list_requests` / `browser_devtools_get_request` / `browser_devtools_request_body` | High privilege: captured request list, per-request detail, and bodies (credential headers redacted by default) |
| Chat with images | `session.prompt` / `session.attachment` | Host-gated image selection, image-only sends, and durable history previews |
| Quote what you highlight | side panel composer | The text you select in the page becomes a quote in the composer and rides along with your next message |

## Architecture

```
side panel (React) ◄─port─► background SW/event page ◄─WS─► dsh bridge plugin
                                 │
                  tabs.sendMessage (DSH_ACTION, DSH_SELECTION_WATCH)
                                 ▲ DSH_SELECTION
                                 ▼
                        content script (snapshot/actions/privacy/selection)
```

- **background** (`src/background/`): bridge connection (token auth + exponential-backoff reconnect + keepalive), gateway RPC client, and **fail-closed tool dispatch to a user-controlled tab**.
- **content script** (`src/content/`): text-only snapshot (readability main text + numbered interactive inventory + form fields), **stable element numbers** (`data-dsh-el`), delta changes, click/type/press/scroll/navigate actions, sensitive-field masking, and a debounced selection watcher that stays disarmed until a side panel is open and page sharing is not `off`.
- **panel** (`src/panel/`): React conversation UI (resumable session/history/live events/settings); host-advertised image limits gate image selection and preflight checks, durable attachments render through session-authorized reads, messages render as sanitized Markdown, `ask_user_question` requests render as answerable cards, manual tab switches render a control-handoff strip, an active turn exposes a standard stop control, and a highlighted page passage renders as a removable quote that the next prompt carries inside the untrusted-content boundary.
- **Protocol**: `protocol.ts` in the `@yuxianglin/dsh-bridge-browser` workspace package is the single source of truth, shared by both ends through the package's source export.

## Build

```sh
pnpm install
pnpm --filter dsh-browser-extension run build
pnpm --filter dsh-browser-extension run build:firefox
pnpm --filter dsh-browser-extension run test
```

Run these commands from the repository root. Chrome outputs to `extensions/dsh-browser/dist/`; Firefox outputs to `extensions/dsh-browser/dist-firefox/`.

## Install and use

The recommended zero-configuration command does not require Git or a local clone:

1. **Build and install the extension**:

   ```sh
   curl -fsSL https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/install.sh | bash
   ```

   On Windows, run this in PowerShell instead:

   ```powershell
   $s="$env:TEMP\dsh-install.ps1"; irm https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/install.ps1 -OutFile $s; powershell -NoProfile -ExecutionPolicy Bypass -File $s
   ```

   The script downloads a managed workspace to `~/.dsh/dsh-browser`, builds the bridge plugin, registers its official bundle in the local dsh `web` profile, builds the extension, copies the output to the stable directory `~/.dsh/browser-extension`, and opens `chrome://extensions`. Enable Developer mode, choose Load unpacked, and select the extension directory. Running the command again updates the managed installation.

   A cloned checkout uses the same installer without downloading or overwriting source files:

   ```sh
   git clone https://github.com/Lum1104/dsh-browser.git
   cd dsh-browser
   ./scripts/install.sh
   ```

   Windows checkouts run `.\scripts\install.ps1` instead. Paths containing spaces are supported: the installer uses a profile-local directory junction instead of putting the absolute checkout path in pnpm's link spec.

2. **Start dsh with the bridge plugin mounted**. Use either the workspace-pinned runtime:

   ```sh
   cd ~/.dsh/dsh-browser && pnpm start
   ```

   From a clone, run `pnpm start` in the repository root instead.

   Or use the exact supported public runtime:

   ```sh
   npx @deepseek-ai/dsh@0.2.1-rc.5 web
   ```

   Both commands load the same bundle from the local `web` profile. Port 3080 is used by default; append `--port <port>` when it is occupied.

   **DSH Desktop users**: the Desktop app launches its host with `--port 0`, so the OS assigns a different local Web port on every start and no fixed port list can predict it. The bridge plugin therefore also listens on a fixed loopback discovery beacon (`43189`–`43198`, first free port) that advertises the real bridge URL. Discovery runs once when the panel opens: a filled-in address is tried first, and only a loopback address that does not answer falls back to one automatic pass. When nothing is found the status reads "No service found" and nothing retries; open **Settings → Detect** to list every local instance and pick one, or type `http://127.0.0.1:<port>` by hand. To pin the port instead, override the `webserver` row in `~/.dsh/profiles/desktop/cordis.patch.yml` — patch `config` is replaced wholesale, so repeat `host` as well.

   Loading or reloading the extension is passive: it does not probe local ports or open a WebSocket until the side panel is opened. A healthy connection established by the user may remain available for background approvals after the panel closes, but it will not reconnect without an open panel if it drops or another browser replaces it.

3. **Use it**: open a normal `http://` or `https://` page and click the DeepSeek whale icon. Both builds auto-discover local dsh. Chrome loopback connections need no address or token; Firefox must be given the token from `~/.dsh/ext-bridge-token` because a `moz-extension://` UUID is not an add-on identity. Chat directly or click "Read page" first.

Pages that were already open before extension installation or reload are instrumented automatically on the first action, so they do not require a manual refresh. Browser-internal and protected pages such as `chrome://` and the Chrome Web Store expose only tab metadata and browser-level HTTP(S) navigation, back, forward, and reload; their DOM cannot be read or operated.

For extension-only development, load `extensions/dsh-browser/dist/` from `chrome://extensions`, or run `build:firefox` and load `extensions/dsh-browser/dist-firefox/manifest.json` from `about:debugging#/runtime/this-firefox`. Rebuild and reload after code changes.

## Composer controls: permission, model, commands, and skills

The composer carries the same controls the Web GUI exposes, backed by Host
methods the bridge owns:

- **Permission preset** (left chip): the deployment's preset table
  (`read-only`, `workspace-write`, `danger-full-access`, plus `auto` when the
  experimental Auto integration is mounted) with the Session's current value.
  Selecting a preset runs the Host's own `/permission <preset>` command, so the
  `permission/preset` selection and both knob events land in the Session log
  exactly as a Web GUI selection would. `Full access` and `Auto review` ask for
  an explicit confirmation first; a derived `custom` state is shown but never
  selectable, and the menu footnotes the default for future chats. Before the
  first message creates the chat, the choice is remembered and applied at
  materialization, before that first prompt is admitted.
- **Model and reasoning effort** (right chip): the Session's model directory
  grouped by provider, plus the reasoning efforts the selected model declares
  (`Default` included). A selection only shapes the **next** assembled turn, so
  the chip stays usable while a turn is running. When the directory cannot be
  read, the row says why and offers a retry instead of going silently grey; a
  missed `turn/end` is repaired from the Host's `running` flag the next time the
  panel becomes visible.
- **`/` menu**: typing `/` in an empty line opens the Host command directory
  (`/compact`, `/permission`, `/plan`, `/goal`, `/feedback`, `/export`, …) and
  the Session's user-invocable skills, including skills marked
  `modelInvocable: false` (badged `User only`) that exist precisely for explicit
  invocation. `↑`/`↓` move, `Enter`/`Tab` accept, `Esc` closes; picking a row
  inserts its exact text so its input stays editable. On submit the panel
  arbitrates exactly like the Host adapter: a command name runs through
  `commands.execute` (its output never becomes a model message), a skill name is
  sent as a literal prompt so the Host injects its instructions, and an
  unrecognized `/…` line is **refused** with the draft preserved — start the
  line with a space to send it as ordinary text. Commands take no attachments
  here, and neither is a provisional chat's directory browsable: it answers
  empty until the first message creates the real Session.

## Page reading and control

- **Text snapshots**: title, URL, main text, numbered elements, and forms are budgeted at 32k chars by default (plugin-configurable, negotiated to the extension via `hello.ok`). Screenshots provide an additional image view after approval.
- **Page text is untrusted input**: snapshots and targeted text reads are enclosed in a fresh nonce-bound trust marker and explicitly tell the model never to treat page-authored commands as instructions. This is defense in depth; extension-side action approval is the enforcement boundary.
- **Stable numbering**: element numbers persist across snapshots (WeakMap + `data-dsh-el`), so the model can say "click 7"; a large page change explicitly reports "numbers reindexed".
- **Delta mode**: `browser_snapshot({delta:true})` returns only changed element numbers, saving tokens.
- **Privacy**: text snapshots render password/credit-card values as `••••`; accessible names never use a sensitive field's current value. Screenshots capture visible pixels without masking. Developer-tools access requires separate consent.
- **Tab affinity**: prompt submission binds the active tab before the model starts working; a direct browser-tool call also performs the initial bind when needed. A manual tab/window switch pauses later tools and asks whether the assistant should stay on the original page or follow the current one; that prompt also offers "jump back to the assistant page", which moves the user's own tab to the page the assistant is bound to. Staying permits explicit background operation without changing the user's visible tab; following resets page-reference state. A closed controlled tab fails closed until the user selects the current page, and a switch withdraws any open action approval.
- **Proportional approval**: the default `auto` mode lets the model read the controlled tab without an extra prompt; `ask` restores per-read confirmation and `off` blocks reads. In `ask` mode, the read dialog can allow one read or persistently switch back to `auto`, which remains reversible in Settings. State-changing tools still fail closed and show their exact origin plus a redacted action summary. The user may deny, allow once, or trust one origin for the current side-panel session; temporary trust clears when the last panel closes or the service worker restarts. Permanent trust is managed explicitly in Settings. If the panel is closed, an approval remains pending for up to 60 seconds and, when enabled, a system notification opens the panel for review. The panel restores the requesting session before showing a session-scoped approval. Caller cancellation or bridge timeout withdraws any open approval before an action can run.
- **Unrestricted control is explicit**: **Allow unrestricted browser control** becomes active only after the setting is saved successfully, then lets page reads, page actions, and tab list/follow/close operations run without confirmation. Calls capture their access mode when received, so enabling unrestricted control never retroactively elevates an existing restricted call. Disabling it takes effect immediately, cancels calls that have not dispatched an action, waits for already-dispatched browser operations to settle, and only then saves the restrictive setting. A rapid re-enable remains restricted until that revocation finishes, and concurrent saves persist in request order. Protected-page DOM content remains inaccessible.
- **Conversation continuity**: reopening the panel resumes the most recently active browser conversation by default, falling back to the latest non-empty durable session before creating a new one. This can be disabled in Settings.

## Developer tools (opt-in, high privilege)

The developer-tools group drives the controlled tab through the Chrome debugger protocol (`chrome.debugger`), so it can inspect and edit page elements and CSS, run JavaScript in the page's own context, and capture network traffic — including response bodies, which page-level interception cannot read reliably.

- **Off by default**: developer-tools calls ask for approval until the user grants consent through Settings or the current side-panel session. The dialog offers allow once, trust this session, or deny. Session trust expires when the last panel closes or the worker restarts. The blanket **Allow unrestricted browser control** switch and the persistent origin allowlist never cover this group.
- **Persistent consent**: **Allow developer tools** in Settings authorizes the group across panel sessions. Turning it off detaches the debugger and cancels in-flight devtools calls, including calls allowed by session trust. Navigation cancels pending approvals for the replaced document.
- **One debugger per tab**: Chrome refuses a second debugger, so the browser's own DevTools cannot stay open on the same tab while capture is attached. The tool result explains this and tells you to close DevTools on that tab.
- **Data handling**: capture is in memory only, bounded to 200 requests and 500 console entries, and resets on attach and on every top-level navigation. `Authorization`, `Cookie`, `Set-Cookie`, and similar header values are shown as `[redacted]` unless a call explicitly opts in, and bodies of authentication-shaped URLs are redacted by default.
- **Platform**: Chrome only. The Firefox build does not request the `debugger` permission, so the host never registers the group there.

## Permissions

Chrome uses `sidePanel`; Firefox uses `sidebar_action`. Both request `storage` (settings and recent sessions), `notifications` (optional approval reminders), `tabs` + `activeTab` + `scripting` (observe tab changes and instrument the controlled tab), `webNavigation` (bind operations to frame documents), `alarms` (background keepalive), and `<all_urls>` host access. Content scripts run on HTTP(S) pages. Chrome additionally requests `debugger` for trusted input and developer tools, plus `clipboardWrite` and `offscreen` for clipboard operations. Firefox omits these Chrome-specific capabilities. Firefox's AMO manifest declares the browsing activity, website content/activity, and personal communications sent to the configured dsh/model service. The extension can activate a tab through an explicit return-to-page action or `browser_follow_tab { activate: true }`; manual tab switches require a control-handoff decision.

## Known limitations

- Only one extension connection at a time. An unopened browser profile never claims it; if another open panel replaces a live connection, the replaced client yields instead of starting a reconnect fight.
- Developer tools require Chrome 125+, a setting/session grant or per-call approval, and an available debugger connection. Chrome shows its debugging banner while the connection remains attached, including during network capture.
- Tab affinity is global to that extension connection rather than per chat session.
- Accessible cross-origin iframes are snapshotted and operated with stable `(frame, index)` addresses. Restricted or short-lived frames are reported as unavailable without failing the whole page snapshot.
- Captcha/image-only controls cannot be handled — the tool result reports "elements with no accessible name" and asks the user to complete that step manually.
- No automatic token rotation.
- Synthetic `browser_press` events do not trigger browser-native default actions such as Tab focus movement, arrow-key scrolling, or Enter activation. Chrome's trusted input channel supports these actions; Firefox uses synthetic input.
- `browser_wait` considers page load plus a fixed quiet window, but does not observe continuously changing DOM state; a live-updating SPA may be reported as stable.
