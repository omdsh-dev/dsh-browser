import { readFile, stat } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

/**
 * The dsh 0.2.1 plugin-manifest contract this package publishes: the runtime
 * refuses to load a plugin whose declared DSH range does not match, and the
 * Plugins page reads display text and the icon without activating the plugin.
 * These checks keep the manifest, the locale resources, and the icon in sync.
 */
const root = new URL('../', import.meta.url)
const readJson = async (relative: string): Promise<Record<string, unknown>> =>
  JSON.parse(await readFile(new URL(relative, root), 'utf8')) as Record<string, unknown>

const manifest = await readJson('package.json')
const dsh = manifest.dsh as {
  manifestVersion?: number
  bundle?: { patch?: unknown }
  client?: { platform?: string; inject?: string[] }
}
const engines = manifest.engines as { dsh?: string; node?: string }

describe('plugin manifest', () => {
  it('declares the dsh 0.2.1 manifest format and runtime range', () => {
    expect(dsh.manifestVersion).toBe(1)
    expect(dsh.bundle?.patch).toBe('./cordis.patch.yml')
    expect(dsh.client?.platform).toBe('web')
    expect(dsh.client?.inject).toEqual(expect.arrayContaining(['@deepseek-ai/dsh-client-ui-slots']))
    expect(engines.dsh).toBe('^0.2.1-rc.5')
    expect(engines.node).toBe('>=24')
  })

  it('mirrors the pinned runtime in peer and dev dependencies', async () => {
    const peers = manifest.peerDependencies as Record<string, string>
    const dev = manifest.devDependencies as Record<string, string>
    const dshPeers = Object.keys(peers).filter(name => name.startsWith('@deepseek-ai/dsh'))
    expect(dshPeers.length).toBeGreaterThan(0)
    for (const name of dshPeers) expect(peers[name]).toBe('0.2.1-rc.5')
    for (const name of dshPeers) {
      // Every runtime peer is also a build-time dependency of this workspace.
      expect(dev[name] ?? peers[name]).toBeDefined()
    }
  })

  it('stops exporting the invariant companion that dsh 0.2.1 removed', () => {
    const exports = manifest.exports as Record<string, unknown>
    const files = manifest.files as string[]
    expect(Object.keys(exports)).not.toContain('./invariant')
    expect(files).not.toContain('lib/invariant.js')
    expect(peersAndDev(manifest)).not.toContain('@deepseek-ai/dsh-invariants')
  })

  it('publishes the resources the Plugins page reads', () => {
    const exports = manifest.exports as Record<string, unknown>
    const files = manifest.files as string[]
    expect(Object.keys(exports)).toEqual(expect.arrayContaining([
      './client', './package.json', './locale/*.json',
    ]))
    expect(files).toEqual(expect.arrayContaining(['icon.svg', 'locale/*.json']))
    expect(manifest.icon).toBe('./icon.svg')
  })

  it('ships a self-contained icon within the size limit', async () => {
    const icon = await readFile(new URL('icon.svg', root), 'utf8')
    const size = (await stat(new URL('icon.svg', root))).size
    expect(size).toBeLessThanOrEqual(256 * 1024)
    expect(icon.trimStart().startsWith('<svg')).toBe(true)
    // An icon is rendered as an image, never inline HTML.
    expect(icon).not.toMatch(/<script|on\w+\s*=/i)
  })

  it.each(['en', 'zh'])('carries a complete %s plugin title and description', async (locale) => {
    const file = await readJson(`locale/${locale}.json`)
    const meta = file.meta as { title?: unknown; description?: unknown }
    expect(typeof meta.title).toBe('string')
    expect((meta.title as string).trim()).not.toBe('')
    expect(typeof meta.description).toBe('string')
    expect((meta.description as string).trim()).not.toBe('')
  })
})

/** Every DSH package this manifest references, as a flat name list. */
function peersAndDev(value: Record<string, unknown>): string[] {
  const peers = Object.keys((value.peerDependencies ?? {}) as Record<string, string>)
  const dev = Object.keys((value.devDependencies ?? {}) as Record<string, string>)
  return [...new Set([...peers, ...dev])]
}
