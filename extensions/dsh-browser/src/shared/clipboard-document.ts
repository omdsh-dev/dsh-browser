import { sanitizeClipboardHtml, type ClipboardWriteOutcome, type ClipboardWritePayload } from './clipboard.ts'

/** 在扩展文档中同时写入准确的纯文本和 HTML。 */
export function copyClipboardInDocument(payload: ClipboardWritePayload): ClipboardWriteOutcome {
  const host = document.createElement('div')
  host.contentEditable = 'true'
  Object.assign(host.style, { position: 'fixed', left: '-9999px', top: '0' })
  const html = payload.html === undefined ? undefined : sanitizeClipboardHtml(payload.html)
  if (html !== undefined) host.innerHTML = html
  else host.textContent = payload.text
  document.body.appendChild(host)
  const plainDerived = payload.html !== undefined && payload.text === ''
  const plainText = plainDerived ? host.innerText : payload.text
  let copied = false
  const copy = (event: ClipboardEvent) => {
    if (event.clipboardData === null) throw new Error('Clipboard data is unavailable.')
    event.clipboardData.setData('text/plain', plainText)
    if (html !== undefined) event.clipboardData.setData('text/html', html)
    event.preventDefault()
    copied = true
  }
  document.addEventListener('copy', copy)
  try {
    const selection = document.getSelection()
    if (selection === null) throw new Error('The clipboard document has no selection.')
    const range = document.createRange()
    range.selectNodeContents(host)
    selection.removeAllRanges()
    selection.addRange(range)
    if (!document.execCommand('copy') || !copied) throw new Error('The browser rejected the clipboard write.')
    return { rich: payload.html !== undefined, plainDerived, plainText }
  } finally {
    document.removeEventListener('copy', copy)
    host.remove()
  }
}
