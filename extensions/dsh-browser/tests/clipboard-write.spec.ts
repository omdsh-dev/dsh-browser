// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { writeClipboard } from '../src/background/clipboard-write.ts'
import { CLIPBOARD_WRITE_MESSAGE, OFFSCREEN_CLIPBOARD_URL } from '../src/shared/clipboard.ts'

interface ChromeStub {
  offscreen?: {
    hasDocument?: () => Promise<boolean>
    createDocument?: (options: { url: string; reasons: string[]; justification: string }) => Promise<void>
  }
  runtime?: { sendMessage?: (message: unknown) => Promise<unknown> }
}

function stubChrome(stub: ChromeStub): void {
  ;(globalThis as { chrome?: ChromeStub }).chrome = stub
}

afterEach(() => {
  delete (globalThis as { chrome?: ChromeStub }).chrome
  vi.restoreAllMocks()
})

describe('writeClipboard', () => {
  it('creates the offscreen document once and sends the payload', async () => {
    const createDocument = vi.fn(async () => undefined)
    const sendMessage = vi.fn(async () => ({ ok: true, outcome: { rich: true, plainDerived: false, plainText: 'hello' } }))
    stubChrome({ offscreen: { hasDocument: async () => false, createDocument }, runtime: { sendMessage } })
    const outcome = await writeClipboard({ text: 'hello', html: '<b>hello</b>' })
    expect(createDocument).toHaveBeenCalledWith({
      url: OFFSCREEN_CLIPBOARD_URL,
      reasons: ['CLIPBOARD'],
      justification: expect.any(String),
    })
    expect(sendMessage).toHaveBeenCalledWith({
      type: CLIPBOARD_WRITE_MESSAGE,
      target: 'offscreen',
      payload: { text: 'hello', html: '<b>hello</b>' },
    })
    expect(outcome).toEqual({ rich: true, plainDerived: false, plainText: 'hello' })
  })

  it('returns what the offscreen document actually wrote', async () => {
    stubChrome({
      offscreen: { hasDocument: async () => true },
      runtime: {
        sendMessage: async () => ({
          ok: true,
          outcome: { rich: true, plainDerived: true, plainText: 'derived text' },
        }),
      },
    })
    await expect(writeClipboard({ text: 'fallback', html: '<b>derived text</b>' }))
      .resolves.toEqual({ rich: true, plainDerived: true, plainText: 'derived text' })
  })

  it('reuses an existing offscreen document', async () => {
    const createDocument = vi.fn(async () => undefined)
    stubChrome({
      offscreen: { hasDocument: async () => true, createDocument },
      runtime: { sendMessage: async () => ({ ok: true, outcome: { rich: false, plainDerived: false, plainText: 'hello' } }) },
    })
    await writeClipboard({ text: 'hello' })
    expect(createDocument).not.toHaveBeenCalled()
  })

  it('surfaces a rejected offscreen write', async () => {
    stubChrome({
      offscreen: { hasDocument: async () => true },
      runtime: { sendMessage: async () => ({ ok: false, error: 'clipboard denied' }) },
    })
    await expect(writeClipboard({ text: 'x' })).rejects.toThrow(/clipboard denied/)
  })

  it('rejects an empty payload', async () => {
    stubChrome({})
    await expect(writeClipboard({ text: '' })).rejects.toMatchObject({ code: 'bad-args' })
  })
})
