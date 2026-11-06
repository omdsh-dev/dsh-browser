// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import type { BridgeConfigPayload } from '@yuxianglin/dsh-bridge-browser/src/protocol.ts'
import {
  discoverInstances,
  discoveryUrl,
  planDiscovery,
  portOfUrl,
  readBridgeConfig,
} from '../src/background/discovery.ts'

function payload(port: number, extra: Partial<BridgeConfigPayload> = {}): BridgeConfigPayload {
  return { wsUrl: `ws://127.0.0.1:${port}/ext/bridge`, ...extra }
}

/** A probe that answers for the given ports and reports every port it saw. */
function probes(answer: Record<number, BridgeConfigPayload | undefined>) {
  const seen: number[] = []
  return {
    seen,
    probe: async (port: number): Promise<BridgeConfigPayload | undefined> => {
      seen.push(port)
      return answer[port]
    },
  }
}

describe('discoveryUrl / portOfUrl', () => {
  it('builds the loopback config URL and parses the port back out', () => {
    expect(discoveryUrl(43189)).toBe('http://127.0.0.1:43189/ext/bridge-config')
    expect(portOfUrl('ws://127.0.0.1:51801/ext/bridge')).toBe(51801)
    expect(portOfUrl('http://127.0.0.1:3080/ext/bridge')).toBe(3080)
  })

  it('treats unusable addresses as absent', () => {
    expect(portOfUrl(undefined)).toBeUndefined()
    expect(portOfUrl('')).toBeUndefined()
    expect(portOfUrl('nonsense')).toBeUndefined()
    expect(portOfUrl('ws://127.0.0.1/ext/bridge')).toBeUndefined()
  })
})

describe('planDiscovery', () => {
  it('probes the remembered URL first and drops duplicate candidates', () => {
    const plan = planDiscovery({ rememberedUrl: 'ws://127.0.0.1:3080/ext/bridge' })

    expect(plan.groups[0]).toEqual({ source: 'fixed', ports: [3080] })
    expect(plan.groups[1]?.ports).toEqual([3081, 3090, 14389])
    expect(plan.groups[2]?.source).toBe('beacon')
    expect(plan.groups[2]?.ports).toEqual([43189, 43190, 43191, 43192, 43193, 43194, 43195, 43196, 43197, 43198])
    expect(plan.groups.flatMap((group) => group.ports)).toHaveLength(14)
  })

  it('never re-probes the address that just failed', () => {
    const plan = planDiscovery({ excludeUrl: 'ws://127.0.0.1:3080/ext/bridge' })

    expect(plan.groups.flatMap((group) => group.ports)).not.toContain(3080)
  })
})

describe('discoverInstances', () => {
  it('stops at the first answering group', async () => {
    const { probe, seen } = probes({ 3081: payload(3081) })
    const plan = planDiscovery({})

    const found = await discoverInstances(plan, { probe, shouldContinue: () => true }, { stopAtFirstHit: true })

    expect(found.map((instance) => instance.wsUrl)).toEqual(['ws://127.0.0.1:3081/ext/bridge'])
    expect(seen).not.toContain(43189)
  })

  it('enumerates every group and merges the sources that agreed on one URL', async () => {
    // The fixed port and the beacon advertise the same bridge: one instance, two sources.
    const beacon: BridgeConfigPayload = { ...payload(51801), beacon: true, pid: 4242, startedAt: '2026-10-18T00:00:00.000Z' }
    const { probe } = probes({ 3080: payload(51801), 43189: beacon, 43190: payload(9000) })
    const plan = planDiscovery({})

    const found = await discoverInstances(plan, { probe, shouldContinue: () => true }, { stopAtFirstHit: false })

    expect(found).toHaveLength(2)
    expect(found[0]).toMatchObject({ wsUrl: beacon.wsUrl, port: 51801, sources: ['fixed', 'beacon'] })
    expect(found[1]).toMatchObject({ wsUrl: 'ws://127.0.0.1:9000/ext/bridge', sources: ['beacon'] })
  })

  it('reports progress for every group with the instances found so far', async () => {
    const { probe } = probes({ 43189: payload(51801) })
    const plan = planDiscovery({})
    const progress: Array<{ done: number; total: number; ports: number[] }> = []

    await discoverInstances(plan, {
      probe,
      shouldContinue: () => true,
      onProgress: (report) => {
        progress.push({
          done: report.done,
          total: report.total,
          ports: report.instances.map((instance) => instance.port),
        })
      },
    }, { stopAtFirstHit: false })

    expect(progress[0]).toMatchObject({ done: 0, total: 14, ports: [] })
    expect(progress.at(-1)).toMatchObject({ done: 14, total: 14, ports: [51801] })
  })

  it('ends the pass as soon as the caller withdraws', async () => {
    const { probe, seen } = probes({})
    const plan = planDiscovery({})
    let probesSeen = 0

    const found = await discoverInstances(plan, {
      probe: async (port) => {
        probesSeen += 1
        return await probe(port)
      },
      shouldContinue: () => probesSeen < 4,
    }, { stopAtFirstHit: false })

    expect(found).toEqual([])
    expect(seen).not.toContain(43189)
  })

  it('returns nothing when every group stays silent', async () => {
    const { probe } = probes({ 3080: undefined })
    const plan = planDiscovery({})

    const found = await discoverInstances(plan, { probe, shouldContinue: () => true }, { stopAtFirstHit: true })

    expect(found).toEqual([])
  })
})

describe('readBridgeConfig', () => {
  it('accepts a loopback answer and keeps its instance metadata', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      wsUrl: 'ws://127.0.0.1:43189/ext/bridge',
      beacon: true,
      pid: 77,
      startedAt: '2026-10-18T00:00:00.000Z',
    }), { status: 200 }))

    await expect(readBridgeConfig(43189, 100, fetchImpl as unknown as typeof fetch)).resolves.toEqual({
      wsUrl: 'ws://127.0.0.1:43189/ext/bridge',
      beacon: true,
      pid: 77,
      startedAt: '2026-10-18T00:00:00.000Z',
    })
    expect(fetchImpl).toHaveBeenCalledWith('http://127.0.0.1:43189/ext/bridge-config', expect.anything())
  })

  it('ignores non-2xx answers, foreign URLs, and transport failures', async () => {
    const status = vi.fn(async () => new Response('nope', { status: 404 }))
    await expect(readBridgeConfig(3080, 50, status as unknown as typeof fetch)).resolves.toBeUndefined()

    const foreign = vi.fn(async () => new Response(JSON.stringify({
      wsUrl: 'ws://evil.example:3080/ext/bridge',
    }), { status: 200 }))
    await expect(readBridgeConfig(3080, 50, foreign as unknown as typeof fetch)).resolves.toBeUndefined()

    const broken = vi.fn(async () => { throw new Error('refused') })
    await expect(readBridgeConfig(3080, 50, broken as unknown as typeof fetch)).resolves.toBeUndefined()
  })
})
