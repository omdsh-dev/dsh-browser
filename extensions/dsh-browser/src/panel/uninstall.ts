import { powerShellQuote, shellQuote, type ExtensionInstallInfo } from './updates.ts'

const SCRIPT_ROOT = 'https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts'

export function uninstallCommand(info: ExtensionInstallInfo, userAgent: string = navigator.userAgent): string {
  const home = info.mode === 'unknown' ? undefined : info.dshHome
  const windows = /windows/i.test(userAgent)
  if (home !== undefined) {
    const separator = windows ? '\\' : '/'
    const source = info.mode === 'checkout' ? info.sourceRoot : `${home}${separator}dsh-browser`
    const script = `${source}${separator}scripts${separator}uninstall.${windows ? 'ps1' : 'sh'}`
    return windows
      ? `powershell -NoProfile -ExecutionPolicy Bypass -File ${powerShellQuote(script)} --home ${powerShellQuote(home)}`
      : `bash ${shellQuote(script)} --home ${shellQuote(home)}`
  }
  if (windows) {
    return '& { $ErrorActionPreference = \'Stop\'; '
      + '$d=New-Item -ItemType Directory -Force -Path \'.artifacts/dsh-browser-uninstall\'; '
      + '$s=Join-Path $d.FullName \'uninstall.ps1\'; '
      + `Invoke-WebRequest -UseBasicParsing ${SCRIPT_ROOT}/uninstall.ps1 -OutFile $s; `
      + 'powershell -NoProfile -ExecutionPolicy Bypass -File $s }'
  }
  return `curl -fsSL ${SCRIPT_ROOT}/uninstall.sh | bash`
}
