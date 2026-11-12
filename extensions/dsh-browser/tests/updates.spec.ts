// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import {
  checkForExtensionUpdate,
  checkoutInstallCommand,
  compareExtensionVersions,
  managedInstallCommand,
  parseExtensionInstallInfo,
  readExtensionInstallInfo,
  UPDATE_COMMAND,
  UPDATE_MANIFEST_URL,
  WINDOWS_UPDATE_COMMAND,
} from '../src/panel/updates.ts'

describe('extension update checks', () => {
  it('compares Chrome numeric versions component by component', () => {
    expect(compareExtensionVersions('0.2.0', '0.2')).toBe(0)
    expect(compareExtensionVersions('0.2.9', '0.10.0')).toBeLessThan(0)
    expect(compareExtensionVersions('1.0.0.1', '1.0.0')).toBeGreaterThan(0)
    expect(() => compareExtensionVersions('1.0.0-beta', '1.0.0')).toThrow('invalid extension version')
  })

  it('reports a newer main-branch manifest', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(
      JSON.stringify({ version: '0.3.0' }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ))

    await expect(checkForExtensionUpdate('0.2.0', request)).resolves.toEqual({
      currentVersion: '0.2.0',
      latestVersion: '0.3.0',
      updateAvailable: true,
    })
    expect(request).toHaveBeenCalledWith(UPDATE_MANIFEST_URL, { cache: 'no-store' })
  })

  it('treats equal or older remote versions as current', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(
      JSON.stringify({ version: '0.2.0' }),
      { status: 200 },
    ))
    await expect(checkForExtensionUpdate('0.2.0', request)).resolves.toMatchObject({
      updateAvailable: false,
    })
  })

  it('rejects unavailable and malformed manifests', async () => {
    const unavailable = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 503 }))
    await expect(checkForExtensionUpdate('0.2.0', unavailable)).rejects.toThrow('(503)')

    const malformed = vi.fn<typeof fetch>().mockResolvedValue(new Response(
      JSON.stringify({ version: 'next' }),
      { status: 200 },
    ))
    await expect(checkForExtensionUpdate('0.2.0', malformed)).rejects.toThrow('invalid extension version')
  })

  it('distinguishes managed, checkout, and unknown install provenance', () => {
    expect(parseExtensionInstallInfo({ schemaVersion: 1, mode: 'managed' })).toEqual({ mode: 'managed' })
    expect(parseExtensionInstallInfo({
      schemaVersion: 1,
      mode: 'checkout',
      sourceRoot: '/Users/example/dsh-browser',
    })).toEqual({ mode: 'checkout', sourceRoot: '/Users/example/dsh-browser' })
    expect(parseExtensionInstallInfo({ schemaVersion: 1, mode: 'checkout', sourceRoot: '../relative' }))
      .toEqual({ mode: 'unknown' })
    expect(parseExtensionInstallInfo({ mode: 'managed' })).toEqual({ mode: 'unknown' })
  })

  it('accepts the absolute roots install.ps1 records on Windows', () => {
    expect(parseExtensionInstallInfo({
      schemaVersion: 1,
      mode: 'checkout',
      sourceRoot: 'C:\\Users\\example\\dsh-browser',
    })).toEqual({ mode: 'checkout', sourceRoot: 'C:\\Users\\example\\dsh-browser' })
    expect(parseExtensionInstallInfo({
      schemaVersion: 1,
      mode: 'checkout',
      sourceRoot: '\\\\build\\share\\dsh-browser',
    })).toEqual({ mode: 'checkout', sourceRoot: '\\\\build\\share\\dsh-browser' })
    expect(parseExtensionInstallInfo({ schemaVersion: 1, mode: 'checkout', sourceRoot: 'C:relative' }))
      .toEqual({ mode: 'unknown' })
    expect(parseExtensionInstallInfo({ schemaVersion: 1, mode: 'checkout', sourceRoot: 'dsh-browser' }))
      .toEqual({ mode: 'unknown' })
  })

  it('treats missing or malformed install metadata as unknown', async () => {
    const missing = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 404 }))
    await expect(readExtensionInstallInfo('chrome-extension://id/install-info.json', missing))
      .resolves.toEqual({ mode: 'unknown' })

    const malformed = vi.fn<typeof fetch>().mockResolvedValue(new Response('{', { status: 200 }))
    await expect(readExtensionInstallInfo('chrome-extension://id/install-info.json', malformed))
      .resolves.toEqual({ mode: 'unknown' })
  })

  it('builds a shell-safe command for the originating checkout', () => {
    expect(checkoutInstallCommand('/Users/example/My Checkout'))
      .toBe("cd '/Users/example/My Checkout' && ./scripts/install.sh")
    expect(checkoutInstallCommand("/Users/example/dev's checkout"))
      .toBe("cd '/Users/example/dev'\"'\"'s checkout' && ./scripts/install.sh")
  })

  it('builds a PowerShell command for a Windows checkout', () => {
    expect(checkoutInstallCommand('C:\\Users\\example\\My Checkout'))
      .toBe("cd 'C:\\Users\\example\\My Checkout'; .\\scripts\\install.ps1")
    expect(checkoutInstallCommand("C:\\Users\\example\\dev's checkout"))
      .toBe("cd 'C:\\Users\\example\\dev''s checkout'; .\\scripts\\install.ps1")
    expect(checkoutInstallCommand('\\\\build\\share\\dsh-browser'))
      .toBe("cd '\\\\build\\share\\dsh-browser'; .\\scripts\\install.ps1")
  })

  it('picks the managed installer that matches the running platform', () => {
    expect(managedInstallCommand('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(UPDATE_COMMAND)
    expect(managedInstallCommand('Mozilla/5.0 (X11; Linux x86_64)')).toBe(UPDATE_COMMAND)
    expect(managedInstallCommand('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(WINDOWS_UPDATE_COMMAND)
  })

  it('keeps package, Chrome manifest, and update CSP metadata aligned', () => {
    const extensionRoot = process.cwd()
    const packageManifest = JSON.parse(readFileSync(`${extensionRoot}/package.json`, 'utf8')) as { version: string }
    const chromeManifest = JSON.parse(readFileSync(`${extensionRoot}/manifest.json`, 'utf8')) as {
      version: string
      content_security_policy: { extension_pages: string }
    }
    expect(packageManifest.version).toBe(chromeManifest.version)
    expect(chromeManifest.content_security_policy.extension_pages).toContain(new URL(UPDATE_MANIFEST_URL).origin)
  })

  it('keeps the Windows installer encoded for PowerShell 5.1', () => {
    const extensionRoot = process.cwd()
    const installerPath = `${extensionRoot}/../../scripts/install.ps1`
    // Windows PowerShell 5.1 需要 BOM 才能正确读取 UTF-8 中文。
    expect(readFileSync(installerPath).subarray(0, 3)).toEqual(Buffer.from([0xef, 0xbb, 0xbf]))
  })
})
