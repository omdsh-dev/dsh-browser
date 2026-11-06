import { DevToolsError, type CdpClient, type FrameExecutionContext } from './debugger-session.ts'
import type { TabFrame } from './frames.ts'

// 用目标文档上的一次性标记关联 Chrome frameId 与 CDP execution context。
export async function resolveDebuggerFrame(client: CdpClient, tabId: number, frame: TabFrame): Promise<FrameExecutionContext> {
  if (client.executionContexts === undefined || frame.documentId === undefined) {
    throw new DevToolsError('devtools-unavailable', 'The browser cannot resolve the target document for debugging.')
  }
  const contexts = await client.executionContexts()
  const attribute = `data-dsh-frame-${crypto.randomUUID()}`
  const target = { tabId, documentIds: [frame.documentId] }
  await chrome.scripting.executeScript({
    target, args: [attribute],
    func: (name: string) => { document.documentElement.setAttribute(name, '') },
  })
  try {
    for (const context of contexts) {
      const answer = await context.client.send('Runtime.evaluate', {
        expression: `document.documentElement.hasAttribute(${JSON.stringify(attribute)})`,
        uniqueContextId: context.uniqueId, returnByValue: true,
      }) as { result?: { value?: unknown } }
      if (answer.result?.value !== true) continue
      const current = await chrome.webNavigation.getFrame({ tabId, frameId: frame.frameId })
      if (current?.documentId !== frame.documentId) {
        throw new DevToolsError('devtools-unavailable', 'The target frame navigated before execution.')
      }
      return context
    }
    throw new DevToolsError('devtools-unavailable', `Frame ${frame.frameId} has no matching debugger context.`)
  } finally {
    await chrome.scripting.executeScript({
      target, args: [attribute],
      func: (name: string) => { document.documentElement.removeAttribute(name) },
    })
  }
}

export async function resolveFrameNode(client: CdpClient, selector: string, uniqueContextId: string): Promise<number> {
  await client.send('DOM.enable')
  await client.send('DOM.getDocument', { depth: -1, pierce: true })
  const answer = await client.send('Runtime.evaluate', {
    expression: `document.querySelector(${JSON.stringify(selector)})`,
    uniqueContextId, returnByValue: false,
  }) as { result?: { objectId?: string }; exceptionDetails?: unknown }
  if (answer.exceptionDetails !== undefined || answer.result?.objectId === undefined) {
    throw new DevToolsError('devtools-command-failed', `No element matched ${selector} in the target frame.`)
  }
  const objectId = answer.result.objectId
  try {
    const result = await client.send('DOM.requestNode', { objectId }) as { nodeId?: number }
    if (result.nodeId === undefined || result.nodeId === 0) {
      throw new DevToolsError('devtools-command-failed', 'The target element is no longer available.')
    }
    return result.nodeId
  } finally {
    await client.send('Runtime.releaseObject', { objectId })
  }
}
