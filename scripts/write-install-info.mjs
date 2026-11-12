import { realpathSync, writeFileSync } from 'node:fs'

const [filename, mode, sourceRoot, dshHome] = process.argv.slice(2)
if (!filename || !['managed', 'checkout'].includes(mode) || !sourceRoot || !dshHome) {
  throw new Error('Usage: write-install-info.mjs <filename> <managed|checkout> <sourceRoot> <dshHome>')
}
const info = {
  schemaVersion: 1,
  application: 'dsh-browser',
  mode,
  dshHome: realpathSync(dshHome),
  ...(mode === 'checkout' ? { sourceRoot: realpathSync(sourceRoot) } : {}),
}
writeFileSync(filename, `${JSON.stringify(info, null, 2)}\n`)
