/**
 * Release checks for the unpacked browser extension.
 *
 * The managed installer follows the repository's main branch, so that
 * branch's manifest is the update source of truth. The check is deliberately
 * read-only: Chrome does not let an unpacked extension replace itself.
 */

export const UPDATE_MANIFEST_URL =
  'https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/extensions/dsh-browser/manifest.json'

export const UPDATE_COMMAND =
  'curl -fsSL https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/install.sh | bash'

/**
 * install.ps1 carries a UTF-8 BOM so Windows PowerShell renders its Chinese half, and a
 * leading BOM is exactly what Invoke-Expression refuses, so the file is downloaded and run.
 */
export const WINDOWS_UPDATE_COMMAND =
  '$s="$env:TEMP\\dsh-install.ps1"; '
  + 'irm https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/install.ps1 -OutFile $s; '
  + 'powershell -NoProfile -ExecutionPolicy Bypass -File $s'

export interface ExtensionUpdateResult {
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
}

export type ExtensionInstallInfo =
  | { mode: 'managed'; dshHome?: string }
  | { mode: 'checkout'; sourceRoot: string; dshHome?: string }
  | { mode: 'unknown' }

/** A drive-letter root (C:\dsh-browser) or a UNC share (\\host\share\dsh-browser). */
function isWindowsPath(value: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(value) || value.startsWith('\\\\')
}

/** Installers only ever record an absolute root, so a relative one is corrupt metadata. */
function isAbsolutePath(value: string): boolean {
  return value.startsWith('/') || isWindowsPath(value)
}

/** Parse installer-written provenance without trusting malformed local data. */
export function parseExtensionInstallInfo(value: unknown): ExtensionInstallInfo {
  if (typeof value !== 'object' || value === null) return { mode: 'unknown' }
  const info = value as { schemaVersion?: unknown; mode?: unknown; sourceRoot?: unknown; dshHome?: unknown }
  if (info.schemaVersion !== 1) return { mode: 'unknown' }
  if (info.dshHome !== undefined && (typeof info.dshHome !== 'string'
    || !isAbsolutePath(info.dshHome) || /[\u0000-\u001f]/u.test(info.dshHome))) return { mode: 'unknown' }
  const location = typeof info.dshHome === 'string' ? { dshHome: info.dshHome } : {}
  if (info.mode === 'managed') return { mode: 'managed', ...location }
  if (info.mode === 'checkout'
    && typeof info.sourceRoot === 'string'
    && isAbsolutePath(info.sourceRoot)
    && !info.sourceRoot.includes('\0')) {
    return { mode: 'checkout', sourceRoot: info.sourceRoot, ...location }
  }
  return { mode: 'unknown' }
}

/** Read install provenance from the extension package; older installs safely resolve as unknown. */
export async function readExtensionInstallInfo(
  url: string,
  request: typeof fetch = fetch,
): Promise<ExtensionInstallInfo> {
  try {
    const response = await request(url, { cache: 'no-store' })
    if (!response.ok) return { mode: 'unknown' }
    return parseExtensionInstallInfo(await response.json())
  } catch {
    return { mode: 'unknown' }
  }
}

export function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\"'\"'")}'`
}

export function powerShellQuote(value: string): string {
  return `'${value.replace(/['\u2018-\u201b]/gu, quote => quote + quote)}'`
}

/**
 * Re-run the installer from the exact checkout that produced this extension. The recorded
 * root already says which platform wrote it, so the command matches that shell.
 */
export function checkoutInstallCommand(sourceRoot: string): string {
  if (isWindowsPath(sourceRoot)) {
    return `cd ${powerShellQuote(sourceRoot)}; .\\scripts\\install.ps1`
  }
  return `cd ${shellQuote(sourceRoot)} && ./scripts/install.sh`
}

/**
 * Select the managed installer for the browser's current platform.
 */
export function managedInstallCommand(userAgent: string = navigator.userAgent): string {
  return /windows/i.test(userAgent) ? WINDOWS_UPDATE_COMMAND : UPDATE_COMMAND
}

function versionParts(version: string): number[] {
  if (!/^\d+(?:\.\d+){0,3}$/.test(version)) throw new Error('invalid extension version')
  return version.split('.').map((part) => Number(part))
}

/** Compare Chrome's one-to-four-part numeric extension versions. */
export function compareExtensionVersions(left: string, right: string): number {
  const leftParts = versionParts(left)
  const rightParts = versionParts(right)
  const length = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0)
    if (difference !== 0) return difference < 0 ? -1 : 1
  }
  return 0
}

/** Fetch the main-branch manifest and compare it with the running extension. */
export async function checkForExtensionUpdate(
  currentVersion: string,
  request: typeof fetch = fetch,
): Promise<ExtensionUpdateResult> {
  versionParts(currentVersion)
  const response = await request(UPDATE_MANIFEST_URL, { cache: 'no-store' })
  if (!response.ok) throw new Error(`update manifest request failed (${response.status})`)

  const manifest = await response.json() as { version?: unknown }
  if (typeof manifest.version !== 'string') throw new Error('update manifest has no version')
  versionParts(manifest.version)

  return {
    currentVersion,
    latestVersion: manifest.version,
    updateAvailable: compareExtensionVersions(currentVersion, manifest.version) < 0,
  }
}
