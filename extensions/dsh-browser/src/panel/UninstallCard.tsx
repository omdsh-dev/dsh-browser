import { useEffect, useState } from 'react'
import type { PanelCopy } from './strings.ts'
import { readExtensionInstallInfo, type ExtensionInstallInfo } from './updates.ts'
import { uninstallCommand } from './uninstall.ts'

export function UninstallCard({ copy }: { copy: PanelCopy['uninstall'] }): React.JSX.Element {
  const [info, setInfo] = useState<ExtensionInstallInfo | null>(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    let active = true
    void readExtensionInstallInfo(chrome.runtime.getURL('install-info.json')).then(value => {
      if (active) setInfo(value)
    })
    return () => { active = false }
  }, [])
  const command = info === null ? null : uninstallCommand(info)

  return (
    <details className="uninstall-card settings-panel">
      <summary>{copy.title}</summary>
      <div className="uninstall-content">
        <p>{copy.runCommand}</p>
        {command !== null && <pre className="uninstall-command" tabIndex={0}>{command}</pre>}
        <div className="update-actions">
          <button type="button" className="update-check" disabled={command === null}
            onClick={() => {
              if (command !== null) void navigator.clipboard.writeText(command).then(() => setCopied(true))
            }}>
            {copied ? copy.copied : copy.copyCommand}
          </button>
        </div>
        <span role="status" aria-live="polite">{copied ? copy.copied : ''}</span>
      </div>
    </details>
  )
}
