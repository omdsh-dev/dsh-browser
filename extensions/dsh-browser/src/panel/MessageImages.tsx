import { memo, useEffect, useMemo, useState } from 'react'
import type { PanelApi } from './api.ts'
import { attachmentResponseDataUrl, type ImageAttachmentRef } from './attachments.ts'
import type { PanelCopy } from './strings.ts'

function imageFit(attachment: ImageAttachmentRef): { width: number; height: number; objectPosition: string } {
  const naturalRatio = attachment.width / attachment.height
  const ratio = Math.min(4, Math.max(0.25, naturalRatio))
  const box = ratio >= 1 ? { width: 240, height: 240 / ratio } : { width: 240 * ratio, height: 240 }
  const scale = Math.min(1, attachment.width / box.width, attachment.height / box.height)
  return {
    width: Math.max(1, Math.round(box.width * scale)),
    height: Math.max(1, Math.round(box.height * scale)),
    objectPosition: naturalRatio < 0.25 ? 'center top' : naturalRatio > 4 ? 'left center' : 'center',
  }
}

const MessageImage = memo(function MessageImage({
  attachment,
  sessionId,
  api,
  single,
  copy,
}: {
  attachment: ImageAttachmentRef
  sessionId: string
  api: PanelApi
  single: boolean
  copy: PanelCopy
}): React.JSX.Element {
  const [attempt, setAttempt] = useState(0)
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const fit = useMemo(() => imageFit(attachment), [attachment])
  const label = attachment.name ?? copy.app.image

  useEffect(() => {
    let current = true
    setSrc(null)
    setFailed(false)
    void api.rpc('session.attachment', {
      sessionId,
      attachment,
    }).then((value) => {
      if (!current) return
      const url = attachmentResponseDataUrl(value, attachment)
      if (url === null) setFailed(true)
      else setSrc(url)
    }).catch(() => { if (current) setFailed(true) })
    return () => { current = false }
  }, [api, attachment, attempt, sessionId])

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent): void => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [open])

  if (failed) {
    return (
      <button type="button" className="message-image-error" onClick={() => setAttempt((value) => value + 1)}>
        {copy.app.imageLoadFailed}
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        className={`message-image ${single ? 'single' : 'tile'}`}
        style={single ? { width: fit.width, height: fit.height } : undefined}
        disabled={src === null}
        title={copy.app.openImage}
        aria-label={copy.app.openNamedImage(label)}
        onClick={() => setOpen(true)}
      >
        {src === null
          ? <span>{copy.app.imageLoading}</span>
          : <img src={src} alt={label} style={single ? { objectPosition: fit.objectPosition } : undefined} />}
      </button>
      {open && src !== null && (
        <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={copy.app.imagePreview}
          onClick={() => setOpen(false)}>
          <button type="button" aria-label={copy.app.closeImage} onClick={() => setOpen(false)}>×</button>
          <img src={src} alt={label} onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </>
  )
})

export const MessageImages = memo(function MessageImages({
  images,
  sessionId,
  api,
  align,
  copy,
}: {
  images: readonly ImageAttachmentRef[]
  sessionId: string
  api: PanelApi
  align: 'start' | 'end'
  copy: PanelCopy
}): React.JSX.Element | null {
  if (images.length === 0) return null
  return (
    <div className={`message-images ${align}`}>
      {images.map((attachment, index) => (
        <MessageImage
          key={`${attachment.attachmentId}:${index}`}
          attachment={attachment}
          sessionId={sessionId}
          api={api}
          single={images.length === 1}
          copy={copy}
        />
      ))}
    </div>
  )
})
