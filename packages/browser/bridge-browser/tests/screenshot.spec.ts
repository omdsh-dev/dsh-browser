import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { AttachmentId, type ImageAttachmentRef, type SaveImageAttachment } from '@deepseek-ai/dsh-attachment'
import type { BridgeServer } from '../src/server.ts'
import { BROWSER_TOOL_NAMES, registerBrowserTools } from '../src/tools.ts'

/**
 * A screenshot result is the one place a browser tool returns an image, so the
 * contract that decides whether the model ever sees the page lives here: the
 * tool must not exist without a host that can carry an image, and its rendered
 * result must include an image block, not only the status line.
 */

const REF: ImageAttachmentRef = {
  attachmentId: AttachmentId(`sha256:${'a'.repeat(64)}`),
  mediaType: 'image/png',
  bytes: 4_096,
  width: 1_280,
  height: 800,
}

const PNG_BASE64 = Buffer.from('fake-png-bytes').toString('base64')
const CAPS = { textOnly: true as const, snapshotMaxChars: 12_000, maxInteractiveItems: 60 }

interface HarnessOptions {
  /** Whether the connected extension advertises capture; omit for a connected text-only build. */
  screenshots?: boolean
  /** Raw payload the extension replies with. */
  reply?: unknown
}

function harness(options: HarnessOptions = {}) {
  const registered: { name: string; definition: Record<string, unknown> }[] = []
  const ctx = {
    tools: {
      register: vi.fn((definition: { name: string }) => {
        registered.push({ name: definition.name, definition: definition as Record<string, unknown> })
        return () => {}
      }),
    },
  } as unknown as Context
  const reply = options.reply ?? {
    text: 'Captured the visible viewport of https://example.com/.',
    image: { mediaType: 'image/png', data: PNG_BASE64 },
  }
  const requestTool = vi.fn(async () => reply)
  const bridge = {
    requestTool,
    clientCapabilities: () => ({ ...CAPS, screenshots: options.screenshots === true }),
  } as unknown as BridgeServer
  const saveScreenshot = vi.fn(async (_image: SaveImageAttachment) => REF)
  return { ctx, bridge, requestTool, saveScreenshot, registered }
}

function register(harnessed: ReturnType<typeof harness>, withImageHost: boolean) {
  return registerBrowserTools(harnessed.ctx, harnessed.bridge, {
    toolTimeoutMs: 1_000,
    snapshotMaxChars: 12_000,
    maxInteractiveItems: 60,
    ...withImageHost ? { saveScreenshot: harnessed.saveScreenshot } : {},
  })
}

function toolOf(harnessed: ReturnType<typeof harness>, name: string) {
  const tool = harnessed.registered.find((entry) => entry.name === name)
  expect(tool).toBeDefined()
  return tool!.definition as {
    execute: (args: unknown, exec: { signal: AbortSignal; agent?: { id: string } }) => Promise<unknown>
    output: { render: (args: unknown, value: unknown) => unknown[] }
  }
}

describe('browser_screenshot registration', () => {
  it('is absent when the host cannot carry an image', () => {
    const harnessed = harness()
    register(harnessed, false)

    expect(harnessed.registered.map((entry) => entry.name)).not.toContain('browser_screenshot')
    // Everything else still registers, so text-only deployments lose nothing.
    expect(harnessed.registered).toHaveLength(BROWSER_TOOL_NAMES.length - 1)
  })

  it('is registered when the host can carry an image', () => {
    const harnessed = harness()
    const disposers = register(harnessed, true)

    expect(harnessed.registered.map((entry) => entry.name).sort()).toEqual([...BROWSER_TOOL_NAMES].sort())
    expect(disposers.size).toBe(BROWSER_TOOL_NAMES.length)
  })
})

describe('browser_screenshot result', () => {
  it('persists the capture and cites the durable reference', async () => {
    const harnessed = harness({ screenshots: true })
    register(harnessed, true)
    const tool = toolOf(harnessed, 'browser_screenshot')

    const value = await tool.execute({}, { signal: new AbortController().signal })

    expect(harnessed.saveScreenshot).toHaveBeenCalledTimes(1)
    const saved = harnessed.saveScreenshot.mock.calls[0]![0]
    expect(saved.mediaType).toBe('image/png')
    expect(Buffer.from(saved.data).toString()).toBe('fake-png-bytes')
    expect(value).toEqual({
      text: 'Captured the visible viewport of https://example.com/.',
      attachment: REF,
    })
  })

  it('renders the status text and the image together', async () => {
    const harnessed = harness({ screenshots: true })
    register(harnessed, true)
    const tool = toolOf(harnessed, 'browser_screenshot')
    const value = await tool.execute({}, { signal: new AbortController().signal })

    const blocks = tool.output.render({}, value)

    expect(blocks).toEqual([
      { type: 'text', text: 'Captured the visible viewport of https://example.com/.' },
      { type: 'image', attachment: REF },
    ])
  })

  it('forwards the owning session so approval stays bound to it', async () => {
    const harnessed = harness({ screenshots: true })
    register(harnessed, true)
    const tool = toolOf(harnessed, 'browser_screenshot')
    const signal = new AbortController().signal

    await tool.execute({}, { signal, agent: { id: 'session-vision' } })

    expect(harnessed.requestTool).toHaveBeenCalledWith('browser_screenshot', {}, signal, 1_000, 'session-vision')
  })
})

describe('browser_screenshot refusals', () => {
  it('refuses when the connected extension cannot capture', async () => {
    const harnessed = harness({ screenshots: false })
    register(harnessed, true)
    const tool = toolOf(harnessed, 'browser_screenshot')

    await expect(tool.execute({}, { signal: new AbortController().signal }))
      .rejects.toThrow(/cannot capture screenshots/)
    // The refusal happens before any work, so nothing is persisted.
    expect(harnessed.requestTool).not.toHaveBeenCalled()
    expect(harnessed.saveScreenshot).not.toHaveBeenCalled()
  })

  it('refuses a payload with no image', async () => {
    const harnessed = harness({ screenshots: true, reply: { text: 'no image here' } })
    register(harnessed, true)
    const tool = toolOf(harnessed, 'browser_screenshot')

    await expect(tool.execute({}, { signal: new AbortController().signal }))
      .rejects.toThrow(/no usable screenshot/)
    expect(harnessed.saveScreenshot).not.toHaveBeenCalled()
  })

  it('refuses an image in a media type the tool does not accept', async () => {
    const harnessed = harness({
      screenshots: true,
      reply: { text: 'captured', image: { mediaType: 'image/tiff', data: PNG_BASE64 } },
    })
    register(harnessed, true)
    const tool = toolOf(harnessed, 'browser_screenshot')

    await expect(tool.execute({}, { signal: new AbortController().signal }))
      .rejects.toThrow(/no usable screenshot/)
    expect(harnessed.saveScreenshot).not.toHaveBeenCalled()
  })
})
