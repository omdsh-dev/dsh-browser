import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { uninstallCommand } from '../../extensions/dsh-browser/src/panel/uninstall.ts'
import { powerShellQuote } from '../../extensions/dsh-browser/src/panel/updates.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const artifacts = join(root, '.artifacts', 'uninstall-bootstrap')
mkdirSync(artifacts, { recursive: true })
const run = mkdtempSync(join(artifacts, 'run-'))
const proxy = 'http://127.0.0.1:1'

function workspace(name) {
  const base = join(run, name)
  const cwd = join(base, 'working')
  const temporary = join(base, 'temporary')
  mkdirSync(cwd, { recursive: true })
  mkdirSync(temporary)
  if (process.platform !== 'win32') chmodSync(cwd, 0o555)
  return {
    base, cwd, temporary,
    env: { ...process.env, TMPDIR: temporary, TMP: temporary, TEMP: temporary,
      HTTPS_PROXY: proxy, https_proxy: proxy, HTTP_PROXY: proxy, http_proxy: proxy, NO_PROXY: '', no_proxy: '' },
  }
}

function cleaned(fixture) {
  assert.deepEqual(readdirSync(fixture.cwd), [])
  assert.deepEqual(readdirSync(fixture.temporary).filter(name => name.startsWith('dsh-browser-uninstall.')), [])
}

test('streamed Bash preserves download failures and removes its temporary directory', {
  skip: process.platform === 'win32',
}, () => {
  const fixture = workspace('bash')
  try {
    const result = spawnSync('bash', ['-s', '--', '--dry-run'], {
      cwd: fixture.cwd, env: fixture.env, encoding: 'utf8', timeout: 30_000,
      input: readFileSync(join(root, 'scripts', 'uninstall.sh'), 'utf8'),
    })
    if (result.error) throw result.error
    assert.equal(result.status, 7, result.stdout + result.stderr)
    assert.doesNotMatch(result.stderr, /unbound variable/)
    cleaned(fixture)
  } finally {
    chmodSync(fixture.cwd, 0o755)
  }
})

const powershells = [
  ...(process.platform === 'win32' ? ['powershell.exe'] : []),
  ...(process.env.TEST_PWSH === '1' ? ['pwsh'] : []),
]

for (const shell of powershells) {
  for (const entry of ['script', 'command']) {
    test(`${shell} ${entry} cleans up a failed download outside the working directory`, () => {
      const fixture = workspace(`${shell}-${entry}`)
      const script = join(fixture.base, 'uninstall.ps1')
      cpSync(join(root, 'scripts', 'uninstall.ps1'), script)
      const command = entry === 'script' ? `& ${powerShellQuote(script)} --dry-run`
        : uninstallCommand({ mode: 'unknown' }, 'Windows')
      // 设置真实代理连接失败，覆盖下载中断后的清理。
      const source = `$ErrorActionPreference = 'Stop'; [System.Net.WebRequest]::DefaultWebProxy = New-Object System.Net.WebProxy('${proxy}'); ${command}`
      try {
        const result = spawnSync(shell, ['-NoProfile', '-EncodedCommand', Buffer.from(source, 'utf16le').toString('base64')], {
          cwd: fixture.cwd, env: fixture.env, encoding: 'utf8', timeout: 30_000,
        })
        if (result.error) throw result.error
        assert.equal(result.status, 1, result.stdout + result.stderr)
        assert.match(result.stderr, /Invoke-WebRequest/)
        cleaned(fixture)
      } finally {
        if (process.platform !== 'win32') chmodSync(fixture.cwd, 0o755)
      }
    })
  }
}

console.log(`Bootstrap evidence: ${run}`)
