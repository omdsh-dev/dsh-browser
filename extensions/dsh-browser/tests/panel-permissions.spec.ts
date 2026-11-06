// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { PANEL_COPY } from '../src/panel/strings.ts'
import {
  builtInLabel,
  isExperimentalPreset,
  isSelectablePreset,
  parseSessionPermissions,
  permissionLabel,
  permissionSwitchLine,
  requiresRiskConfirmation,
} from '../src/panel/permissions.ts'

const copy = PANEL_COPY.en
const zh = PANEL_COPY.zh

describe('permission directory parsing', () => {
  it('keeps a well-formed bridge answer', () => {
    expect(parseSessionPermissions({
      current: 'workspace-write',
      defaultPreset: 'workspace-write',
      routable: true,
      provisional: false,
      options: [
        { value: 'read-only', name: 'Read Only' },
        { value: 'workspace-write', name: 'Workspace Write', description: 'Write inside the workspace' },
        { value: 'danger-full-access', name: 'Full access' },
      ],
      defaultOptions: [],
    })).toEqual({
      current: 'workspace-write',
      defaultPreset: 'workspace-write',
      routable: true,
      provisional: false,
      options: [
        { value: 'read-only', name: 'Read Only' },
        { value: 'workspace-write', name: 'Workspace Write', description: 'Write inside the workspace' },
        { value: 'danger-full-access', name: 'Full access' },
      ],
    })
  })

  it('refuses payloads the composer cannot render', () => {
    expect(parseSessionPermissions(undefined)).toBeNull()
    expect(parseSessionPermissions('read-only')).toBeNull()
    expect(parseSessionPermissions({})).toBeNull()
    expect(parseSessionPermissions({ current: '   ' })).toBeNull()
  })

  it('drops malformed options and treats an empty directory as not routable', () => {
    expect(parseSessionPermissions({
      current: 'custom',
      defaultPreset: 'workspace-write',
      routable: true,
      options: [{ value: 'read-only' }, 'nope', { value: '', name: 'x' }, { value: 'auto', name: 'Auto' }],
    })).toEqual({
      current: 'custom',
      defaultPreset: 'workspace-write',
      routable: true,
      provisional: false,
      options: [{ value: 'auto', name: 'Auto' }],
    })
    expect(parseSessionPermissions({
      current: 'custom',
      defaultPreset: 'workspace-write',
      routable: true,
      options: [],
    })).toMatchObject({ routable: false })
  })

  it('marks a provisional directory', () => {
    expect(parseSessionPermissions({
      current: 'workspace-write',
      defaultPreset: 'workspace-write',
      routable: true,
      provisional: true,
      options: [{ value: 'workspace-write', name: 'Workspace Write' }],
    })).toMatchObject({ provisional: true })
  })
})

describe('permission presentation rules', () => {
  it('localizes built-in presets in both languages', () => {
    expect(builtInLabel('read-only', copy)).toBe('Read only')
    expect(builtInLabel('workspace-write', copy)).toBe('Workspace edits')
    expect(builtInLabel('danger-full-access', copy)).toBe('Full access')
    expect(builtInLabel('auto', copy)).toBe('Auto review')
    expect(builtInLabel('read-only', zh)).toBe('仅可查看')
    expect(builtInLabel('workspace-write', zh)).toBe('工作区内修改')
    expect(builtInLabel('danger-full-access', zh)).toBe('完全权限')
    expect(builtInLabel('custom', zh)).toBe('自定义')
    expect(builtInLabel('team-preset', copy)).toBeUndefined()
  })

  it('prefers the localized built-in label over the Host name', () => {
    expect(permissionLabel('workspace-write', { value: 'workspace-write', name: 'Workspace Write' }, zh))
      .toBe('工作区内修改')
    expect(permissionLabel('team-preset', { value: 'team-preset', name: 'Team preset' }, zh))
      .toBe('Team preset')
    expect(permissionLabel('unknown', undefined, zh)).toBe('unknown')
  })

  it('never treats the derived custom state as selectable', () => {
    expect(isSelectablePreset('read-only')).toBe(true)
    expect(isSelectablePreset('auto')).toBe(true)
    expect(isSelectablePreset('custom')).toBe(false)
    expect(isSelectablePreset('')).toBe(false)
  })

  it('requires confirmation for the risky presets only', () => {
    expect(requiresRiskConfirmation('danger-full-access')).toBe(true)
    expect(requiresRiskConfirmation('auto')).toBe(true)
    expect(requiresRiskConfirmation('workspace-write')).toBe(false)
    expect(isExperimentalPreset('auto')).toBe(true)
    expect(isExperimentalPreset('danger-full-access')).toBe(false)
  })

  it('builds the exact Host command line', () => {
    expect(permissionSwitchLine('read-only')).toBe('/permission read-only')
  })
})
