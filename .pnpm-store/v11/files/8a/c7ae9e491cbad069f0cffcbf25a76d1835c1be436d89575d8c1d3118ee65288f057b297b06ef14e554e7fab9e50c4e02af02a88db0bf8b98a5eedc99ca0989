"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MAX_IDLE_MS = exports.MANAGED_AGENTS_BETA = exports.SessionToolRunner = exports.EnvironmentWorker = exports.WorkPoller = void 0;
/**
 * Self-hosted environment runner helpers.
 *
 * - {@link WorkPoller} (`client.beta.environments.work.poller`) — control-plane
 *   only: claims work items and yields each one.
 * - {@link SessionToolRunner} (`client.beta.sessions.events.toolRunner`) — the
 *   sessions-side counterpart to `client.beta.messages.toolRunner`: dispatches
 *   local tools against a session's `agent.tool_use` events.
 * - {@link EnvironmentWorker} (`client.beta.environments.work.worker`) — the full
 *   composition: poll → set up the workdir + skills → run a
 *   {@link SessionToolRunner} while heartbeating the work-item lease →
 *   force-stop on exit (unless the lease was lost to another holder) → loop.
 *   Use `handleItem()` for the per-item flow when you already hold a claimed
 *   work item — with no arguments it reads the `ANTHROPIC_*` env vars that
 *   `ant worker poll --on-work` sets. The class is also exported here if you
 *   prefer `new EnvironmentWorker({ client, ... })`.
 *
 * The tool implementations themselves (`betaAgentToolset20260401` and the
 * per-tool factories) live in their own Node-only module — import them directly
 * from `@anthropic-ai/sdk/tools/agent-toolset/node`.
 */
var index_1 = require("../../lib/environments/index.js");
Object.defineProperty(exports, "WorkPoller", { enumerable: true, get: function () { return index_1.WorkPoller; } });
Object.defineProperty(exports, "EnvironmentWorker", { enumerable: true, get: function () { return index_1.EnvironmentWorker; } });
Object.defineProperty(exports, "SessionToolRunner", { enumerable: true, get: function () { return index_1.SessionToolRunner; } });
Object.defineProperty(exports, "MANAGED_AGENTS_BETA", { enumerable: true, get: function () { return index_1.MANAGED_AGENTS_BETA; } });
Object.defineProperty(exports, "DEFAULT_MAX_IDLE_MS", { enumerable: true, get: function () { return index_1.DEFAULT_MAX_IDLE_MS; } });
//# sourceMappingURL=environments.js.map