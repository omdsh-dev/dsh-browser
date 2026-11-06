/**
 * Slash-command and skill directory for the composer, framework-free.
 *
 * The panel owns the same arbitration the Web GUI adapter applies: a line that
 * starts with `/` is resolved against the Session's command and skill
 * directories and is NEVER silently downgraded to an ordinary prompt. Commands
 * run through the Host registry, skills stay literal text (the Host injects
 * their instructions before the next step), and unknown names are reported to
 * the user with the draft preserved.
 *
 * @module
 */

import type { PanelCopy } from './strings.ts'

/** One Host command as `commands.list` reports it. */
export interface HostCommand {
  name: string
  description: string
  /** Placeholder shown after the command name for commands that take input. */
  hint?: string
  definitionId?: string
}

/** One user-invocable skill as `skills.list` reports it. */
export interface HostSkill {
  name: string
  description: string
  whenToUse?: string
  /** False for skills restricted to explicit user invocation. */
  modelInvocable: boolean
  path?: string
}

/** Parsed `commands.list` answer. */
export interface ComposerCommandDirectory {
  commands: HostCommand[]
  provisional: boolean
}

/** Parsed `skills.list` answer. */
export interface ComposerSkillDirectory {
  skills: HostSkill[]
  provisional: boolean
}

/** One row of the composer's `/` menu. */
export interface SlashEntry {
  kind: 'command' | 'skill' | 'local'
  name: string
  description: string
  /** Panel-owned action for a local entry that never reaches the Host. */
  action?: 'model'
  /** True for a skill that only explicit user invocation can load. */
  userOnly?: boolean
  /** Exact text inserted into the draft when the row is accepted. */
  insert: string
}

/** The directories the composer resolves a submitted line against. */
export interface ComposerCatalogs {
  commands: readonly HostCommand[]
  skills: readonly HostSkill[]
  local: readonly SlashEntry[]
}

/** Resolved meaning of one composer submission. */
export type ComposerLine =
  | { kind: 'empty' }
  | { kind: 'prompt' }
  | { kind: 'command'; name: string; line: string }
  | { kind: 'skill'; name: string }
  | { kind: 'local'; name: string }
  | { kind: 'unknown-command'; name: string }

/** Parse a `commands.list` payload; null when the shape is unusable. */
export function parseCommandDirectory(value: unknown): ComposerCommandDirectory | null {
  if (!isRecord(value) || !Array.isArray(value.commands)) return null
  const commands: HostCommand[] = []
  for (const entry of value.commands) {
    if (!isRecord(entry)) continue
    const name = typeof entry.name === 'string' ? entry.name.trim() : ''
    if (name === '') continue
    commands.push({
      name,
      description: typeof entry.description === 'string' ? entry.description : '',
      ...(typeof entry.hint === 'string' && entry.hint !== '' ? { hint: entry.hint } : {}),
      ...(typeof entry.definitionId === 'string' && entry.definitionId !== ''
        ? { definitionId: entry.definitionId }
        : {}),
    })
  }
  return { commands, provisional: value.provisional === true }
}

/** Parse a `skills.list` payload; null when the shape is unusable. */
export function parseSkillDirectory(value: unknown): ComposerSkillDirectory | null {
  if (!isRecord(value) || !Array.isArray(value.skills)) return null
  const skills: HostSkill[] = []
  for (const entry of value.skills) {
    if (!isRecord(entry)) continue
    const name = typeof entry.name === 'string' ? entry.name.trim() : ''
    if (name === '') continue
    skills.push({
      name,
      description: typeof entry.description === 'string' ? entry.description : '',
      ...(typeof entry.whenToUse === 'string' && entry.whenToUse !== '' ? { whenToUse: entry.whenToUse } : {}),
      modelInvocable: entry.modelInvocable === true,
      ...(typeof entry.path === 'string' && entry.path !== '' ? { path: entry.path } : {}),
    })
  }
  return { skills, provisional: value.provisional === true }
}

/**
 * Build the `/` menu rows: Host commands first, then skills, then the panel's
 * own entries. A name claimed by a Host command keeps the command row, because
 * that is how the Host registry arbitrates a collision.
 */
export function slashEntries(
  commands: readonly HostCommand[],
  skills: readonly HostSkill[],
  local: readonly SlashEntry[],
): SlashEntry[] {
  const entries: SlashEntry[] = []
  for (const command of commands) {
    entries.push({
      kind: 'command',
      name: command.name,
      description: command.description,
      // A command that declares input keeps the caret after the space.
      insert: `/${command.name}${command.hint === undefined ? '' : ' '}`,
    })
  }
  const claimed = new Set(entries.map((entry) => entry.name))
  for (const skill of skills) {
    if (claimed.has(skill.name)) continue
    entries.push({
      kind: 'skill',
      name: skill.name,
      description: skill.whenToUse ?? skill.description,
      ...(skill.modelInvocable ? {} : { userOnly: true }),
      insert: `/${skill.name}`,
    })
  }
  for (const entry of local) {
    if (claimed.has(entry.name)) continue
    entries.push(entry)
  }
  return entries
}

/**
 * The panel-owned rows: bare `/model` opens the model picker instead of
 * spending a Host round trip on a command the registry does not own.
 */
export function localSlashEntries(copy: PanelCopy): SlashEntry[] {
  return [
    {
      kind: 'local',
      name: 'model',
      description: copy.app.slashLocalModel,
      action: 'model',
      insert: '/model',
    },
  ]
}

/**
 * The `/` query under the caret, or null when the caret is not inside the
 * leading token. Only the first token opens the menu; after whitespace the
 * user is typing the command's own input.
 */
export function slashQuery(text: string, caret: number): string | null {
  if (!text.startsWith('/')) return null
  const head = text.slice(0, Math.max(0, Math.min(caret, text.length)))
  const match = /^\/([a-z0-9_-]*)$/u.exec(head)
  return match === null ? null : (match[1] ?? '')
}

/**
 * Filter and rank menu rows for one query: case-insensitive ordered
 * subsequence, prefix hits first, then shorter names, then insertion order.
 */
export function rankSlashEntries(entries: readonly SlashEntry[], query: string): SlashEntry[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return [...entries]
  const scored: Array<{ entry: SlashEntry; score: number; index: number }> = []
  entries.forEach((entry, index) => {
    const score = matchScore(entry.name.toLowerCase(), needle)
    if (score !== undefined) scored.push({ entry, score, index })
  })
  scored.sort((left, right) => (
    left.score - right.score
    || left.entry.name.length - right.entry.name.length
    || left.index - right.index
  ))
  return scored.map((item) => item.entry)
}

/** 0 for a prefix hit, 1 for an in-order subsequence, undefined when no match. */
function matchScore(name: string, needle: string): number | undefined {
  if (name.startsWith(needle)) return 0
  let cursor = 0
  for (const char of needle) {
    const found = name.indexOf(char, cursor)
    if (found === -1) return undefined
    cursor = found + 1
  }
  return 1
}

/** Host command syntax: `/`, a lowercase name, then end of input or whitespace. */
export function commandSyntaxValid(line: string): boolean {
  return /^\/[a-z0-9_-]+(?:[ \t]|$)/u.test(line)
}

/** The command name of a syntactically valid slash line. */
export function commandNameOf(line: string): string | undefined {
  return /^\/([a-z0-9_-]+)(?:[ \t]|$)/u.exec(line)?.[1]
}

/**
 * Resolve one submitted composer line.
 *
 * A leading `/` always claims the command grammar: the panel must never send an
 * unrecognized slash line as a prompt, matching the Host adapter's rejection.
 * A line that begins with whitespace stays an ordinary prompt, which is the
 * escape hatch for text such as a `/usr/local` path.
 */
export function resolveComposerLine(text: string, catalogs: ComposerCatalogs): ComposerLine {
  const line = text.trimEnd()
  if (line.trim() === '') return { kind: 'empty' }
  if (!line.startsWith('/')) return { kind: 'prompt' }
  const name = commandNameOf(line)
  if (name === undefined) return { kind: 'unknown-command', name: line.trim() }
  // A local row owns only its bare form; `/name args` still belongs to the Host.
  const bare = `/${name}`
  if (line.trim() === bare && catalogs.local.some((entry) => entry.name === name)) {
    return { kind: 'local', name }
  }
  if (catalogs.commands.some((command) => command.name === name)) {
    return { kind: 'command', name, line: line.trim() }
  }
  if (catalogs.skills.some((skill) => skill.name === name)) return { kind: 'skill', name }
  return { kind: 'unknown-command', name }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
