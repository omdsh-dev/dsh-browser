# Agent Note: Advanced page capabilities

Status: implemented

English | [中文](2026-08-18-advanced-page-capabilities.zh.md)

## Problem

The browser surface addressed everything through one numbering scheme. `browser_snapshot` collects a whitelist of semantic controls (`a[href]`, `button`, inputs, a few roles) and caps the inventory at 60 items, ordered dialog-first then viewport-first. Controls outside that whitelist — pagination rendered as `<a>` without `href`, `<li onclick>` rows, `cursor: pointer` cells — never receive an index, and bottom-of-page pagination is routinely pushed past the cap by viewport-first ordering. The page was therefore readable but partially inoperable: the model could see "下一页" in the text and still be unable to click it.

Two more gaps shared the same shape. `browser_scroll` only moved the window, so app-shell layouts (`body { overflow: hidden }` plus an inner scrolling `div`) could not be scrolled at all. `browser_press` dropped modifier state, so page-level shortcuts such as Control+Enter could not be expressed.

A fourth cluster — page storage, page-origin requests, and page JavaScript — was absent by design rather than by accident: the extension already holds `scripting` and all-site host permissions, so the limits were tool-contract limits, not platform limits.

## Decision

**P0 — close the addressing and input gaps without widening the security boundary.**

- `browser_click` accepts exactly one of `index`, `selector`, or `text` (plus `role`/`nth` filters). Text resolution scans direct text nodes and accessible names, then walks to the nearest actionable ancestor, so the click lands where a user would click and native form activation still works. Ambiguity is an error listing candidates rather than a guess.
- `browser_snapshot` discovers inner scroll containers, prints each with a generated unique CSS selector, scroll percentage, and remaining pixels. `browser_scroll` moves the addressed container (or the nearest scrollable ancestor of an indexed element). A window scroll that did not move now says so and points at the region list.
- `browser_press` accepts `modifiers` (`ctrl`/`meta`/`shift`/`alt`) and derives `KeyboardEvent.code` for common keys.
- Index addressing keeps its document-binding guard; selector/text addressing deliberately does not require a snapshot baseline, because it re-resolves against the live DOM.

**P1 — opt-in page-crossing tools behind the existing approval machinery.**

`browser_get_storage`, `browser_fetch`, and `browser_eval` are registered only when the bridge plugin config sets `advancedTools: true` (default false). All three are approval-gated in the extension: storage is a page read, fetch and eval are actions whose prompts never offer persistent origin trust. Every payload crosses the existing nonce-wrapped untrusted boundary. Bulk storage listings mask credential-looking values; naming a key explicitly is the documented escape hatch. Fetch runs from the page origin with `credentials: 'include'`, so same-origin administration APIs work with the page's cookies while cross-origin stays subject to CORS. Eval runs in the page main world via `chrome.scripting.executeScript({ world: 'MAIN' })`; async results park in a per-call page global and are polled for up to three seconds.

## Alternatives considered

**Adopt a CDP/debugger path for native-level control.** `chrome.debugger` would give real `Input.dispatchKeyEvent`, unlimited click reliability, network interception, and `Runtime.evaluate` that bypasses page CSP. It also requires the `debugger` permission, shows a permanent "is debugging this browser" banner, conflicts with open DevTools, and is not portable to the Firefox build. It is the right architecture for full RPA, not for a bridge whose value is operating the browser the user already has open.

**Broaden the inventory whitelist instead of adding selector/text addressing.** Adding `[onclick]`, `a:not([href])`, and `cursor: pointer` heuristics to the snapshot would inflate every snapshot with noise, raise token cost, and still lose to the 60-item cap. Addressing on demand keeps the snapshot cheap.

**Enable the advanced tools by default and rely on approval alone.** Approval prompts are a per-interaction control, not a capability boundary; shipping the tools registered means any configuration that skips prompts (unrestricted access, a trusted session) silently exposes page storage and code execution. Opt-in keeps the default posture unchanged.

**Run `browser_eval` in the content script's isolated world.** It would avoid `world: 'MAIN'`, but isolated-world code cannot see page variables or page functions, which is exactly what callers need, and MV3 extension CSP makes eval there unreliable.

## Verification

`pnpm run typecheck` and `pnpm run build` pass. Extension tests (433) and bridge tests (150/151) pass; the single `token.spec` failure is the pre-existing Windows `chmod 0600` assertion, confirmed failing on a clean checkout. New coverage: `tests/actions-advanced.spec.ts` (selector/text/role addressing, ambiguity, modifiers, inner-container scrolling, storage masking, fetch request construction and CORS failure), `tests/snapshot-regions.spec.ts` (region discovery, selectors, horizontal axis, delta reporting), `tests/background-advanced-tools.spec.ts` (main-world injection, async polling, untrusted wrapping, approval denial, protected pages, sharing-off gate), and expanded `tools.spec.ts` / `authorization.spec.ts` / `index.spec.ts` for the new contracts and config switch.

## Consequences

- Text/selector clicking removes the pagination dead end, but synthetic events still cannot trigger browser-reserved shortcuts or native editing defaults; that remains a CDP-class limitation.
- `browser_eval` inherits page CSP: strict pages reject eval with an explicit error, and a page script that loops forever blocks its tab because no sandbox can preempt it.
- `browser_fetch` is bounded by CORS and by the page's own credentials; it is not a general HTTP proxy.
- The advanced tools widen what a compromised model or prompt injection can reach, which is why they are both opt-in and per-call approved.
