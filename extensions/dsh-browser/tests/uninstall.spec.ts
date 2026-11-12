// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { parseExtensionInstallInfo } from '../src/panel/updates.ts'
import { uninstallCommand } from '../src/panel/uninstall.ts'

describe('uninstall handoff', () => {
  it('carries the installer-recorded home into the command', () => {
    const info = parseExtensionInstallInfo({
      schemaVersion: 1, mode: 'managed', application: 'dsh-browser', dshHome: "/Users/dev's home/DSH 中文",
    })
    expect(uninstallCommand(info, 'Macintosh')).toContain("--home '/Users/dev'\"'\"'s home/DSH 中文'")
    expect(uninstallCommand(info, 'Linux')).toContain("/dsh-browser/scripts/uninstall.sh' --home")
  })

  it('uses the standard uninstall command for old and unknown installations', () => {
    for (const info of [
      parseExtensionInstallInfo({ schemaVersion: 1, mode: 'managed' }),
      parseExtensionInstallInfo({ schemaVersion: 1, mode: 'checkout', sourceRoot: '/source' }),
      parseExtensionInstallInfo(null),
    ]) {
      expect(uninstallCommand(info, 'Linux'))
        .toBe('curl -fsSL https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/uninstall.sh | bash')
      expect(uninstallCommand(info, 'Windows')).toContain('-File $s }')
    }
  })

  it('quotes Windows directories for the installed PowerShell script', () => {
    const command = uninstallCommand({ mode: 'managed', dshHome: "C:\\DSH 空间\\dev's home" }, 'Windows NT')
    expect(command).toContain("--home 'C:\\DSH 空间\\dev''s home'")
    expect(command).toContain("dsh-browser\\scripts\\uninstall.ps1' --home")
    const legacy = uninstallCommand({ mode: 'unknown' }, 'Windows')
    expect(legacy).toContain('Invoke-WebRequest -UseBasicParsing')
    expect(legacy).toContain("$ErrorActionPreference = 'Stop'")
  })

  it('uses the originating checkout for a local installation', () => {
    expect(uninstallCommand({ mode: 'checkout', sourceRoot: '/source checkout', dshHome: '/custom home' }, 'Linux'))
      .toBe("bash '/source checkout/scripts/uninstall.sh' --home '/custom home'")
    expect(uninstallCommand({ mode: 'checkout', sourceRoot: 'C:\\source checkout', dshHome: 'C:\\custom home' }, 'Windows'))
      .toBe("powershell -NoProfile -ExecutionPolicy Bypass -File 'C:\\source checkout\\scripts\\uninstall.ps1' --home 'C:\\custom home'")
  })

  it('rejects invalid installation directories', () => {
    for (const dshHome of ['', '../home', 'C:relative', '/path\ncommand', '/path\0']) {
      expect(parseExtensionInstallInfo({ schemaVersion: 1, mode: 'managed', dshHome })).toEqual({ mode: 'unknown' })
    }
  })
})
