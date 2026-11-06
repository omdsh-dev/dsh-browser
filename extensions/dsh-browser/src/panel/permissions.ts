/**
 * Permission preset directory for the composer, framework-free.
 *
 * The bridge answers `session.permissions` with the Host's process catalog plus
 * the Session's current value; this module parses that payload defensively and
 * owns the presentation rules the Web GUI applies: built-in preset labels are
 * localized by the client, `custom` is a display state that can never be
 * selected, and the two risky presets need an explicit confirmation.
 *
 * @module
 */

import type { PanelCopy } from './strings.ts'

/** One selectable permission preset as the Host advertises it. */
export interface PermissionPresetOption {
  value: string
  name: string
  description?: string
}

/** The composer's permission directory for one Session. */
export interface SessionPermissionDirectory {
  /** The preset the Session currently runs under (may be the derived `custom`). */
  current: string
  /** Preset a newly created Session would start from. */
  defaultPreset: string
  /** Whether the current value can be switched through the Host command. */
  routable: boolean
  /** True while the Session exists only as a deferred id. */
  provisional: boolean
  options: PermissionPresetOption[]
}

/** Built-in preset values whose labels the panel owns, exactly like the Web GUI. */
const BUILT_IN_PRESETS = new Set(['read-only', 'workspace-write', 'danger-full-access', 'auto'])

/** Presets that change the risk posture and therefore need a confirmation. */
const RISKY_PRESETS = new Set(['danger-full-access', 'auto'])

/** Parse a `session.permissions` payload; null when the shape is unusable. */
export function parseSessionPermissions(value: unknown): SessionPermissionDirectory | null {
  if (!isRecord(value)) return null
  const current = typeof value.current === 'string' ? value.current.trim() : ''
  const defaultPreset = typeof value.defaultPreset === 'string' ? value.defaultPreset.trim() : ''
  if (current === '') return null
  const options = parseOptions(value.options)
  return {
    current,
    defaultPreset,
    routable: value.routable === true && options.length > 0,
    provisional: value.provisional === true,
    options,
  }
}

function parseOptions(value: unknown): PermissionPresetOption[] {
  if (!Array.isArray(value)) return []
  const options: PermissionPresetOption[] = []
  for (const entry of value) {
    const option = parseOption(entry)
    if (option !== null) options.push(option)
  }
  return options
}

function parseOption(value: unknown): PermissionPresetOption | null {
  if (!isRecord(value)) return null
  const preset = typeof value.value === 'string' ? value.value.trim() : ''
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  if (preset === '' || name === '') return null
  return {
    value: preset,
    name,
    ...(typeof value.description === 'string' && value.description.trim() !== ''
      ? { description: value.description.trim() }
      : {}),
  }
}

/** Presentation label for one preset: localized built-ins, then the Host name. */
export function permissionLabel(
  value: string,
  option: PermissionPresetOption | undefined,
  copy: PanelCopy,
): string {
  const builtIn = builtInLabel(value, copy)
  if (builtIn !== undefined) return builtIn
  return option?.name ?? value
}

/** Localized label for a built-in preset value, else undefined. */
export function builtInLabel(value: string, copy: PanelCopy): string | undefined {
  switch (value) {
    case 'read-only': return copy.app.permissionReadOnly
    case 'workspace-write': return copy.app.permissionWorkspaceWrite
    case 'danger-full-access': return copy.app.permissionFullAccess
    case 'auto': return copy.app.permissionAuto
    case 'custom': return copy.app.permissionCustom
    default: return undefined
  }
}

/** `custom` is derived state: it can label the control but never be chosen. */
export function isSelectablePreset(value: string): boolean {
  return value !== '' && value !== 'custom'
}

/** Selecting either of these changes approval/sandbox posture and must be confirmed. */
export function requiresRiskConfirmation(value: string): boolean {
  return RISKY_PRESETS.has(value)
}

/** Whether this preset is an experimental opt-in that deserves an EXP badge. */
export function isExperimentalPreset(value: string): boolean {
  return value === 'auto'
}

/** Whether the value is one the panel localizes itself. */
export function isBuiltInPreset(value: string): boolean {
  return BUILT_IN_PRESETS.has(value)
}

/** The exact Host command line that switches a Session preset. */
export function permissionSwitchLine(value: string): string {
  return `/permission ${value}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
