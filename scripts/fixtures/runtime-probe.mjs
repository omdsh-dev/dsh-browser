// Loaded only by smoke-runtime.mjs into its isolated real DSH profile.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

export const name = 'runtime-smoke-probe'
export const inject = ['sessions', 'sessionPersistence', 'sessionQuery', 'sessionProjectionCache', 'attachments', 'worktrees']

export async function apply(ctx, config) {
  ctx.on('worktree/cleanup', info => {
    if (info.cleanup.status !== 'scheduled') {
      writeFileSync(`${config.marker}.cleanup-${info.sessionId}`, JSON.stringify(info))
    }
  })
  // DSH 0.1.7 resolves profile packages through process-local module hooks.
  // Inspect providers inside the host where those hooks are installed.
  const resolve = createRequire(config.profileManifest)
  for (const [name, service] of [
    ['dsh-session-query', 'sessionQuery'],
    ['dsh-session-projection-cache', 'sessionProjectionCache'],
  ]) {
    const packageName = `@deepseek-ai/${name}`
    const path = resolve.resolve(`${packageName}/package.json`)
    const { version } = JSON.parse(await readFile(path, 'utf8'))
    assert.equal(version, config.expectedVersion, `Profile resolved an incompatible ${name} at ${path}`)
    const { default: Provider } = await import(pathToFileURL(resolve.resolve(packageName)).href)
    assert.ok(ctx.get(service) instanceof Provider, `${service} must use the profile's resolved provider`)
  }
  if (config.reopen) {
    assert.equal(ctx.sessions.get(config.sessionId), undefined, 'session must be cold after restart')
    // A prepared observation calls the real cache.hydratePrepared, the exact
    // failing boundary in #71. No mocked query, cache, or persistence services.
    const observation = await ctx.sessionQuery.observeSession(config.sessionId)
    try {
      assert.equal(observation.source, 'prepared')
      assert.ok(observation.projections)
      await writeFile(config.marker, JSON.stringify({ source: observation.source }))
    } finally {
      observation[Symbol.dispose]()
    }
    return
  }
  ctx.on('agent/created', async ({ agent }) => {
    const session = agent.session
    const worktreeSession = config.worktreeSessions.find(entry => entry.sessionId === session.id)
    if (worktreeSession !== undefined) {
      const worktree = await ctx.worktrees.create(agent)
      if (worktreeSession.dirty) await writeFile(`${worktree.path}/user-note.txt`, 'Keep this file.\n')
      await ctx.sessionPersistence.flush()
      await writeFile(`${config.marker}.${session.id}`, JSON.stringify(worktree))
      return
    }
    if (session.id !== config.sessionId) return
    // A durable Session choice must survive catalog refreshes and cold reads,
    // independently of the deployment default. No model request is needed.
    session.append('model/selection', { provider: 'smoke-provider', model: 'smoke-model' })
    // Persist a blank session without an LLM call so restart exercises reads
    // from disk even though normal empty sessions may be deferred.
    // AgentLoop owns writes through its SessionHandle; the service flush
    // barrier drains those handles and materializes even an empty session.
    await ctx.sessionPersistence.flush()
    const attachment = await ctx.attachments.saveImage({
      data: await readFile(config.imagePath), mediaType: 'image/png', name: 'browser-icon.png',
    })
    await writeFile(config.marker, JSON.stringify({ sessionId: session.id, attachment }))
  })
}
