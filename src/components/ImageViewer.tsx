import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  src: string
  alt?: string
  onClose: () => void
}

async function downloadImage(src: string) {
  try {
    const res = await fetch(src)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = src.split('/').pop()?.split('?')[0] || 'evidence-photo.jpg'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    console.error('Image download failed, opening in a new tab instead:', err)
    window.open(src, '_blank')
  }
}

/** Full-screen image overlay. Click anywhere or press Escape to dismiss. */
export function ImageViewer({ src, alt = 'Image', onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Rendered via a portal straight to <body> so this can never get trapped
  // inside an ancestor's CSS transform (e.g. a hover:-translate-y-px card) —
  // a transformed ancestor becomes the containing block for `position: fixed`
  // descendants, which shrinks this "full-screen" overlay down to that
  // ancestor's box instead of the viewport. See root CLAUDE.md's Known
  // Patterns & Gotchas note on this exact issue.
  return createPortal(
    <div
      className="fixed inset-0 z-[9000] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Download button */}
      <button
        onClick={(e) => { e.stopPropagation(); void downloadImage(src) }}
        aria-label="Download image"
        className="absolute top-5 right-[72px] w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3v13m0 0l-4-4m4 4l4-4M5 21h14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close image"
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Image — stop propagation so clicking image itself doesn't close */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain select-none"
        style={{ maxWidth: 'min(100vw, 1200px)', maxHeight: '90vh' }}
        draggable={false}
      />
    </div>,
    document.body
  )
}
