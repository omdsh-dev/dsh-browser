import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { powerShellQuote } from '../../extensions/dsh-browser/src/panel/updates.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const temporary = join(root, '.artifacts', 'uninstall-command')
mkdirSync(temporary, { recursive: true })
const shells = [
  ...(process.platform === 'win32' ? ['powershell.exe'] : []),
  ...(process.env.TEST_PWSH === '1' ? ['pwsh'] : []),
]

for (const shell of shells) {
  test(`${shell} preserves paths containing every single-quote delimiter`, () => {
    const paths = ["'", '\u2018', '\u2019', '\u201a', '\u201b']
      .map(quote => `C:\\DSH 中文\\O${quote}Brien & $user`)
    const source = `[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false; $values = @(${paths.map(powerShellQuote).join(', ')}); ConvertTo-Json -Compress -InputObject $values`
    const result = spawnSync(shell, ['-NoProfile', '-EncodedCommand', Buffer.from(source, 'utf16le').toString('base64')], {
      cwd: root, encoding: 'utf8', timeout: 15_000,
      env: { ...process.env, TMPDIR: temporary, TMP: temporary, TEMP: temporary },
    })
    if (result.error) throw result.error
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.deepEqual(JSON.parse(result.stdout), paths)
  })
}
