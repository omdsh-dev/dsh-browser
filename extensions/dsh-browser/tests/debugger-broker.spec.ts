// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { createDebuggerBroker } from '../src/background/debugger-broker.ts'
import type { DebuggerApi } from '../src/background/debugger-session.ts'

interface Harness {
  api: DebuggerApi
  broker: ReturnType<typeof createDebuggerBroker>
  commands: [string, Record<string, unknown> | undefined][]
  attach: ReturnType<typeof vi.fn>
  detach: ReturnType<typeof vi.fn>
  emitDetach: (tabId: number, reason: string) => void
}

function harness(idleDetachMs = 0): Harness {
  const commands: [string, Record<string, unknown> | undefined][] = []
  const eventListeners = new Set<(source: { tabId?: number }, method: string, params?: unknown) => void>()
  const detachListeners = new Set<(source: { tabId?: number }, reason: string) => void>()
  const attach = vi.fn(async () => undefined)
  const detach = vi.fn(async () => undefined)
  const sendCommand = vi.fn(async (_target: { tabId: number }, method: string, params?: Record<string, unknown>) => {
    commands.push([method, params])
    return {}
  })
  const api: DebuggerApi = {
    attach,
    detach,
    sendCommand: sendCommand as unknown as DebuggerApi['sendCommand'],
    onEvent: {
      addListener: (listener) => { eventListeners.add(listener) },
      removeListener: (listener) => { eventListeners.delete(listener) },
    },
    onDetach: {
      addListener: (listener) => { detachListeners.add(listener) },
      removeListener: (listener) => { detachListeners.delete(listener) },
    },
  }
  return {
    api,
    broker: createDebuggerBroker({ api, idleDetachMs, commandTimeoutMs: 200 }),
    commands,
    attach,
    detach,
    emitDetach: (tabId, reason) => { for (const listener of detachListeners) listener({ tabId }, reason) },
  }
}

describe('debugger broker', () => {
  it('shares one attachment between both features', async () => {
    const h = harness()
    const inputLease = await h.broker.acquire(7, 'input')
    const devtoolsLease = await h.broker.acquire(7, 'devtools', { domains: ['DOM', 'CSS', 'Runtime', 'Network'] })
    expect(h.attach).toHaveBeenCalledTimes(1)
    expect(h.attach).toHaveBeenCalledWith({ tabId: 7 }, '1.3')
    expect(h.commands.map(([method]) => method)).toEqual([
      'DOM.enable',
      'CSS.enable',
      'Runtime.enable',
      'Network.enable',
    ])
    expect(h.broker.state()).toMatchObject({ attached: true, tabId: 7 })
    expect(h.broker.state().owners.sort()).toEqual(['devtools', 'input'])
    expect(h.broker.attachedSession(7)).toBe(inputLease.session)
    await inputLease.release({ immediate: true })
    await devtoolsLease.release({ immediate: true })
  })

  it('attaches input without enabling developer-tools domains', async () => {
    const h = harness()
    const lease = await h.broker.acquire(9, 'input')
    expect(h.attach).toHaveBeenCalledTimes(1)
    expect(h.commands).toEqual([])
    await lease.release({ immediate: true })
  })

  it('detaches immediately when the idle window is zero', async () => {
    const h = harness(0)
    const lease = await h.broker.acquire(3, 'input')
    await lease.release()
    await vi.waitFor(() => { expect(h.detach).toHaveBeenCalledTimes(1) })
    expect(h.broker.state().attached).toBe(false)
  })

  it('keeps the attachment while another owner holds it', async () => {
    const h = harness()
    const inputLease = await h.broker.acquire(3, 'input')
    const devtoolsLease = await h.broker.acquire(3, 'devtools', { domains: ['DOM'] })
    await devtoolsLease.release({ immediate: true })
    expect(h.detach).not.toHaveBeenCalled()
    expect(h.broker.state().owners).toEqual(['input'])
    await inputLease.release({ immediate: true })
    await vi.waitFor(() => { expect(h.detach).toHaveBeenCalledTimes(1) })
  })

  it('reattaches an owned session after an external detach', async () => {
    const h = harness()
    await h.broker.acquire(5, 'input')
    h.emitDetach(5, 'canceled_by_user')
    expect(h.broker.attachedSession(5)).toBeUndefined()
    await h.broker.reattach(5, 'input')
    expect(h.attach).toHaveBeenCalledTimes(2)
    expect(h.broker.attachedSession(5)).toBeDefined()
  })

  it('refuses to reattach a tab the owner no longer holds', async () => {
    const h = harness()
    await expect(h.broker.reattach(11, 'devtools')).rejects.toThrow(/no longer holds/)
  })

  it('rolls ownership back when an attach fails', async () => {
    const h = harness()
    h.attach.mockRejectedValueOnce(new Error('Cannot access a chrome:// URL'))
    await expect(h.broker.acquire(4, 'input')).rejects.toThrow(/could not attach/i)
    expect(h.broker.state().owners).toEqual([])
    // A later successful acquire still attaches.
    await h.broker.acquire(4, 'input')
    expect(h.attach).toHaveBeenCalledTimes(2)
  })

  it('retries once after a stale attachment left by a worker restart', async () => {
    const h = harness()
    h.attach.mockRejectedValueOnce(new Error('Another debugger is already attached to the tab'))
    const lease = await h.broker.acquire(4, 'input')
    expect(h.detach).toHaveBeenCalledWith({ tabId: 4 })
    expect(h.attach).toHaveBeenCalledTimes(2)
    expect(h.broker.state().attached).toBe(true)
    await lease.release({ immediate: true })
  })

  it('drops one owner without detaching a shared attachment', async () => {
    const h = harness()
    await h.broker.acquire(6, 'input')
    await h.broker.acquire(6, 'devtools', { domains: ['DOM'] })
    await h.broker.detachOwner(6, 'input')
    expect(h.detach).not.toHaveBeenCalled()
    expect(h.broker.state().owners).toEqual(['devtools'])
    expect(h.broker.attachedSession(6)).toBeDefined()
    // Dropping the last owner releases the attachment.
    await h.broker.detachOwner(6, 'devtools')
    expect(h.detach).toHaveBeenCalledTimes(1)
    expect(h.broker.attachedSession(6)).toBeUndefined()
  })

  it('detaches a whole tab regardless of owners', async () => {
    const h = harness()
    await h.broker.acquire(6, 'input')
    await h.broker.acquire(6, 'devtools', { domains: ['DOM'] })
    await h.broker.detachTab(6)
    expect(h.detach).toHaveBeenCalledTimes(1)
    expect(h.broker.attachedSession(6)).toBeUndefined()
    expect(h.broker.state().owners).toEqual([])
  })

  it('notifies observers on attach and detach', async () => {
    const h = harness()
    const changes = vi.fn()
    h.broker.onChange(changes)
    const lease = await h.broker.acquire(8, 'input')
    expect(changes).toHaveBeenCalled()
    await lease.release({ immediate: true })
    expect(changes.mock.calls.length).toBeGreaterThanOrEqual(2)
  })
})
