import { framePointMapper, type Point } from '../shared/frame-geometry.ts'
import { resolveDebuggerFrame } from './debugger-frame.ts'
import { DevToolsError, type CdpClient } from './debugger-session.ts'
import type { TabFrame } from './frames.ts'

interface FrameInputTarget {
  client: CdpClient
  mapPoint: (point: Point) => Point
}

// Input 坐标属于接收命令的 CDP target；独立进程 iframe 直接使用自身视口。
export async function resolveFrameInputTarget(client: CdpClient, tabId: number, frame: TabFrame): Promise<FrameInputTarget> {
  if (frame.frameId === 0) return { client, mapPoint: point => point }
  const target = await resolveDebuggerFrame(client, tabId, frame)
  const tree = await target.client.send('Page.getFrameTree') as { frameTree: { frame: { id: string } } }
  let mapPoint: FrameInputTarget['mapPoint'] = point => point
  if (tree.frameTree.frame.id !== target.frameId) {
    // 同进程子框架的 content quad 已包含祖先变换、滚动、边框和 padding。
    const owner = await target.client.send('DOM.getFrameOwner', { frameId: target.frameId }) as { backendNodeId: number }
    const box = await target.client.send('DOM.getBoxModel', { backendNodeId: owner.backendNodeId }) as { model: { content: number[] } }
    const viewport = await target.client.send('Runtime.evaluate', {
      expression: '({ width: innerWidth, height: innerHeight })',
      uniqueContextId: target.uniqueId, returnByValue: true,
    }) as { result?: { value?: { width: number; height: number } }; exceptionDetails?: unknown }
    if (viewport.exceptionDetails !== undefined || viewport.result?.value === undefined) {
      throw new DevToolsError('devtools-command-failed', 'The target frame viewport is no longer available.')
    }
    mapPoint = framePointMapper(box.model.content, viewport.result.value.width, viewport.result.value.height)
  }
  const current = await chrome.webNavigation.getFrame({ tabId, frameId: frame.frameId })
  if (current?.documentId !== frame.documentId) {
    throw new DevToolsError('devtools-unavailable', 'The target frame navigated before input delivery.')
  }
  return { client: target.client, mapPoint }
}
