import assert from 'node:assert/strict'
import { readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = new URL('../', import.meta.url)
const require = createRequire(new URL('package.json', root))
const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
const version = manifest.dependencies['@deepseek-ai/dsh']
const anchor = require.resolve('@deepseek-ai/dsh/package.json')
const hostRequire = createRequire(anchor)
const { load } = hostRequire('js-yaml')
const lockfile = load(readFileSync(new URL('pnpm-lock.yaml', root), 'utf8'))
const lockedPackages = Object.keys(lockfile.packages)
  .map(key => [key.slice(0, key.lastIndexOf('@')), key.slice(key.lastIndexOf('@') + 1)])
  .filter(([name]) => /^@deepseek-ai\/dsh(?:-|$)/.test(name))
assert.ok(lockedPackages.length > 0, 'no DSH package keys found in lockfile')
for (const [name, resolved] of lockedPackages) {
  assert.equal(resolved, version, `${name}: lockfile has a different DSH release`)
}

const { createRuntimeResolution } = await import(pathToFileURL(hostRequire.resolve('@deepseek-ai/dsh-app-boot')).href)
const resolution = await createRuntimeResolution({ installAnchor: anchor, home: fileURLToPath(root) })
const providers = new Map(resolution.entries.map(({ name, packageDir }) => [name, join(packageDir, 'package.json')]))
for (const { name, version: resolved, packageDir } of resolution.entries) {
  if (!/^@deepseek-ai\/dsh(?:-|$)/.test(name)) continue
  assert.equal(resolved, version, `${name}: runtime provider at ${packageDir}`)
}
for (const name of ['dsh-session-query', 'dsh-session-projection-cache']) {
  const path = providers.get(`@deepseek-ai/${name}`)
  assert.ok(path, `${name}: missing runtime provider`)
  console.log(`${name}@${version}: ${path}`)
}
const cacheName = '@deepseek-ai/dsh-session-projection-cache'
const cacheManifest = realpathSync(providers.get(cacheName))
assert.equal(require.resolve(`${cacheName}/package.json`), cacheManifest, 'root and host must resolve the same cache')
const entry = createRequire(cacheManifest).resolve(cacheName)
const { default: Cache } = await import(pathToFileURL(entry).href)
assert.equal(typeof Cache.prototype.hydratePrepared, 'function', `${entry}: hydratePrepared missing`)
console.log('DSH runtime dependency checks passed')
