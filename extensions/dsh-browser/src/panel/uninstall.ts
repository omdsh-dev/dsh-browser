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
      + '$d=New-Item -ItemType Directory -Path (Join-Path ([IO.Path]::GetTempPath()) (\'dsh-browser-uninstall.\'+[Guid]::NewGuid().ToString(\'N\'))); '
      + 'try { $s=Join-Path $d.FullName \'uninstall.ps1\'; '
      + `Invoke-WebRequest -UseBasicParsing ${SCRIPT_ROOT}/uninstall.ps1 -OutFile $s; `
      + 'powershell -NoProfile -ExecutionPolicy Bypass -File $s } '
      + 'finally { Remove-Item -LiteralPath $d.FullName -Recurse -Force } }'
  }
  return `curl -fsSL ${SCRIPT_ROOT}/uninstall.sh | bash`
}
