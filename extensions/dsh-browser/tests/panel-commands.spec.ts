// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { PANEL_COPY } from '../src/panel/strings.ts'
import {
  commandNameOf,
  commandSyntaxValid,
  localSlashEntries,
  parseCommandDirectory,
  parseSkillDirectory,
  rankSlashEntries,
  resolveComposerLine,
  slashEntries,
  slashQuery,
  type HostCommand,
  type HostSkill,
} from '../src/panel/commands.ts'

const commands: HostCommand[] = [
  { name: 'compact', description: 'Compact the conversation' },
  { name: 'permission', description: 'Switch preset', hint: '<preset>' },
  { name: 'plan', description: 'Enter plan mode' },
]

const skills: HostSkill[] = [
  { name: 'office-docx', description: 'Word documents', modelInvocable: false },
  { name: 'ctf-sandbox', description: 'CTF routing', modelInvocable: true },
]

const local = localSlashEntries(PANEL_COPY.en)

describe('directory parsing', () => {
  it('parses commands with hints and definition ids', () => {
    expect(parseCommandDirectory({
      provisional: false,
      commands: [
        { name: 'compact', description: 'Compact', definitionId: 'pkg#compact' },
        { name: 'permission', description: 'Switch', input: { hint: '<preset>' } },
      ],
    })).toEqual({
      provisional: false,
      commands: [
        { name: 'compact', description: 'Compact', definitionId: 'pkg#compact' },
        { name: 'permission', description: 'Switch' },
      ],
    })
  })

  it('skips unusable rows instead of failing the whole directory', () => {
    expect(parseCommandDirectory({ commands: ['x', { name: '' }, { name: 'ok' }] })).toEqual({
      provisional: false,
      commands: [{ name: 'ok', description: '' }],
    })
    expect(parseCommandDirectory({})).toBeNull()
    expect(parseSkillDirectory(undefined)).toBeNull()
  })

  it('parses the skill directory, keeping the user-only marker', () => {
    expect(parseSkillDirectory({
      provisional: true,
      skills: [
        { name: 'office-docx', description: 'Word documents', modelInvocable: false, path: '/skills/x/SKILL.md' },
        { name: 'ctf-sandbox', description: 'CTF', whenToUse: 'When CTF', modelInvocable: true },
      ],
    })).toEqual({
      provisional: true,
      skills: [
        { name: 'office-docx', description: 'Word documents', modelInvocable: false, path: '/skills/x/SKILL.md' },
        { name: 'ctf-sandbox', description: 'CTF', whenToUse: 'When CTF', modelInvocable: true },
      ],
    })
  })
})

describe('slash menu rows', () => {
  it('lists commands first, then skills, then unclaimed local rows', () => {
    const entries = slashEntries(commands, skills, local)
    expect(entries.map((entry) => `${entry.kind}:${entry.name}`)).toEqual([
      'command:compact',
      'command:permission',
      'command:plan',
      'skill:office-docx',
      'skill:ctf-sandbox',
      'local:model',
    ])
  })

  it('keeps the caret after a command that declares input', () => {
    const entries = slashEntries(commands, skills, local)
    expect(entries.find((entry) => entry.name === 'permission')?.insert).toBe('/permission ')
    expect(entries.find((entry) => entry.name === 'compact')?.insert).toBe('/compact')
    expect(entries.find((entry) => entry.name === 'office-docx')).toMatchObject({
      kind: 'skill', insert: '/office-docx', userOnly: true,
    })
  })

  it('lets a Host command win a name collision, like the Host registry does', () => {
    const entries = slashEntries(
      [{ name: 'model', description: 'Host model command' }],
      [],
      local,
    )
    expect(entries.filter((entry) => entry.name === 'model')).toEqual([
      { kind: 'command', name: 'model', description: 'Host model command', insert: '/model' },
    ])
  })

  it('only opens the menu inside the leading token', () => {
    expect(slashQuery('/', 1)).toBe('')
    expect(slashQuery('/per', 4)).toBe('per')
    expect(slashQuery('/permission read-only', 11)).toBe('permission')
    expect(slashQuery('/permission read-only', 20)).toBeNull()
    expect(slashQuery('hello /per', 9)).toBeNull()
    expect(slashQuery(' /per', 5)).toBeNull()
  })

  it('ranks prefix hits before subsequence hits and keeps insertion order', () => {
    const entries = slashEntries(commands, skills, local)
    expect(rankSlashEntries(entries, 'p').map((entry) => entry.name)).toEqual(['plan', 'permission', 'compact'])
    expect(rankSlashEntries(entries, 'per').map((entry) => entry.name)).toEqual(['permission'])
    expect(rankSlashEntries(entries, '').map((entry) => entry.name))
      .toEqual(['compact', 'permission', 'plan', 'office-docx', 'ctf-sandbox', 'model'])
  })
})

describe('submitted line arbitration', () => {
  it('accepts only the Host command grammar', () => {
    expect(commandSyntaxValid('/compact')).toBe(true)
    expect(commandSyntaxValid('/permission read-only')).toBe(true)
    expect(commandSyntaxValid('/compact ')).toBe(true)
    // A raw trailing newline is not the Host grammar; the composer trims first.
    expect(commandSyntaxValid('/plan\n')).toBe(false)
    expect(commandSyntaxValid('/Compact')).toBe(false)
    expect(commandSyntaxValid('//x')).toBe(false)
    expect(commandSyntaxValid('/usr/local/bin')).toBe(false)
    expect(commandNameOf('/permission danger-full-access')).toBe('permission')
    expect(commandNameOf('/permission')).toBe('permission')
    expect(commandNameOf('/usr/local/bin')).toBeUndefined()
  })

  it('routes commands, skills, local rows, prompts, and unknown names', () => {
    const catalogs = { commands, skills, local }
    expect(resolveComposerLine('explain this page', catalogs)).toEqual({ kind: 'prompt' })
    expect(resolveComposerLine('   ', catalogs)).toEqual({ kind: 'empty' })
    expect(resolveComposerLine('/compact', catalogs)).toEqual({ kind: 'command', name: 'compact', line: '/compact' })
    expect(resolveComposerLine('/compact\n', catalogs)).toEqual({ kind: 'command', name: 'compact', line: '/compact' })
    expect(resolveComposerLine('/permission danger-full-access ', catalogs))
      .toEqual({ kind: 'command', name: 'permission', line: '/permission danger-full-access' })
    expect(resolveComposerLine('/office-docx', catalogs)).toEqual({ kind: 'skill', name: 'office-docx' })
    expect(resolveComposerLine('/model', catalogs)).toEqual({ kind: 'local', name: 'model' })
    expect(resolveComposerLine('/nope', catalogs)).toEqual({ kind: 'unknown-command', name: 'nope' })
    expect(resolveComposerLine('/nope with args', catalogs)).toEqual({ kind: 'unknown-command', name: 'nope' })
  })

  it('never downgrades an unrecognized slash line to a prompt', () => {
    const catalogs = { commands, skills, local }
    // A path-like line matches the command grammar, so it is reported, not sent.
    expect(resolveComposerLine('/usr/local/bin', catalogs).kind).toBe('unknown-command')
    expect(resolveComposerLine('/Compact', catalogs).kind).toBe('unknown-command')
    // Leading whitespace is the explicit escape hatch.
    expect(resolveComposerLine(' /usr/local/bin', catalogs)).toEqual({ kind: 'prompt' })
  })

  it('treats a local row as bare-only so arguments still reach the Host', () => {
    const catalogs = {
      commands: [{ name: 'model', description: 'Host model command' }],
      skills: [],
      local,
    }
    expect(resolveComposerLine('/model', catalogs)).toEqual({ kind: 'local', name: 'model' })
    expect(resolveComposerLine('/model deepseek-v4', catalogs))
      .toEqual({ kind: 'command', name: 'model', line: '/model deepseek-v4' })
  })
})
