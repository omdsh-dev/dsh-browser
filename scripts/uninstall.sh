#!/bin/bash
set -euo pipefail

main() {
  local engine="" script_dir download_dir=""
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
    mkdir -p "$PWD/.artifacts"
    download_dir="$(mktemp -d "$PWD/.artifacts/dsh-browser-uninstall.XXXXXX")"
    trap 'if [ -d "$download_dir" ]; then rm -rf -- "$download_dir"; fi' EXIT
    engine="$download_dir/uninstall.mjs"
    curl --fail --location --silent --show-error \
      https://raw.githubusercontent.com/Lum1104/dsh-browser/refs/heads/main/scripts/uninstall.mjs \
      --output "$engine"
  fi
  node "$engine" "$@"
  if [ -n "$download_dir" ]; then
    if [ -d "$download_dir" ]; then rm -rf -- "$download_dir"; fi
    trap - EXIT
  fi
}

main "$@"
