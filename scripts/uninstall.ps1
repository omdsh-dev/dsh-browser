# Windows PowerShell 5.1 使用 UTF-8 BOM 读取中文。
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false

Get-Command node -ErrorAction Stop | Out-Null
$Engine = if ($PSScriptRoot) { Join-Path $PSScriptRoot 'uninstall.mjs' } else { '' }
$DownloadDir = $null
if (-not $Engine -or -not (Test-Path -LiteralPath $Engine -PathType Leaf)) {
  $DownloadDir = Join-Path (Get-Location).ProviderPath ('.artifacts\dsh-browser-uninstall.' + [Guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $DownloadDir | Out-Null
  $Engine = Join-Path $DownloadDir 'uninstall.mjs'
  Invoke-WebRequest -UseBasicParsing `
    -Uri 'https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/uninstall.mjs' `
    -OutFile $Engine
}

# 同时释放 runspace 与进程的当前目录。
$OriginalLocation = (Get-Location).ProviderPath
$OriginalDirectory = [System.IO.Directory]::GetCurrentDirectory()
$ExecutionRoot = [System.IO.Path]::GetPathRoot($Engine)
Set-Location -LiteralPath $ExecutionRoot
[System.IO.Directory]::SetCurrentDirectory($ExecutionRoot)
try {
  & node $Engine @args
  $Result = $LASTEXITCODE
} finally {
  if (Test-Path -LiteralPath $OriginalLocation -PathType Container) {
    Set-Location -LiteralPath $OriginalLocation
  }
  if (Test-Path -LiteralPath $OriginalDirectory -PathType Container) {
    [System.IO.Directory]::SetCurrentDirectory($OriginalDirectory)
  }
  if ($DownloadDir -and (Test-Path -LiteralPath $DownloadDir)) {
    Remove-Item -LiteralPath $DownloadDir -Recurse -Force
  }
}
exit $Result
