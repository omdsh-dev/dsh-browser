#!/bin/bash
set -euo pipefail

download_dir=""

main() {
  local engine="" script_dir
  if ! command -v node >/dev/null; then
    printf '%s\n' '需要 Node.js 24 或更新版本。 / Node.js 24 or newer is required.' >&2
    return 1
  fi
  if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$script_dir/uninstall.mjs" ]; then
      engine="$script_dir/uninstall.mjs"
    fi
  fi
  if [ -z "$engine" ]; then
    if ! command -v curl >/dev/null; then
      printf '%s\n' '下载卸载模块需要 curl。 / curl is required to download the uninstaller.' >&2
      return 1
    fi
    download_dir="$(mktemp -d "${TMPDIR:-/tmp}/dsh-browser-uninstall.XXXXXX")"
    trap 'if [ -d "$download_dir" ]; then rm -rf -- "$download_dir"; fi' EXIT
    engine="$download_dir/uninstall.mjs"
    curl --fail --location --silent --show-error \
      https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/uninstall.mjs \
      --output "$engine"
  fi
  node "$engine" "$@"
}

main "$@"
