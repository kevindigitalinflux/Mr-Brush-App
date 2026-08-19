import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../lib/useTranslation'

const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // 50 MB safety ceiling
const MAX_DURATION_MS = 15000
const DURATION_TOLERANCE_S = 0.5 // guards against timer/encoder drift

const CANDIDATE_MIME_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4',
]

function pickSupportedMimeType(): string {
  for (const type of CANDIDATE_MIME_TYPES) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

type Stage = 'requesting' | 'live' | 'recording' | 'preview' | 'error'

interface Props {
  onCapture: (file: File) => void
  onCancel: () => void
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Full-screen live camera recorder. Records directly via getUserMedia + MediaRecorder —
 * deliberately does not accept a file picker, so cleaners cannot substitute a pre-recorded
 * or gallery video for a live one.
 */
export function VideoRecorder({ onCapture, onCancel }: Props) {
  const t = useTranslation()
  const liveVideoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mimeTypeRef = useRef('')

  const [stage, setStage] = useState<Stage>('requesting')
  const [secondsLeft, setSecondsLeft] = useState(MAX_DURATION_MS / 1000)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [error, setError] = useState('')

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  function clearTimers() {
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current)
    if (tickTimerRef.current) clearInterval(tickTimerRef.current)
    autoStopTimerRef.current = null
    tickTimerRef.current = null
  }

  async function startCamera() {
    setStage('requesting')
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } },
        audio: false,
      })
      streamRef.current = stream
      setStage('live')
    } catch (err) {
      const name = err instanceof DOMException ? err.name : 'UnknownError'
      console.error('getUserMedia failed:', name, err)
      setError(`${t('camera_permission_denied')} (${name})`)
      setStage('error')
    }
  }

  useEffect(() => {
    void startCamera()
    return () => {
      clearTimers()
      stopStream()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The live-preview <video> element only mounts once stage becomes 'live',
  // so the stream can only be attached to it after that render — attaching
  // it synchronously inside startCamera() (before setStage('live')) hits a
  // null ref and silently no-ops, leaving the preview permanently black.
  useEffect(() => {
    if (stage === 'live' && liveVideoRef.current && streamRef.current) {
      liveVideoRef.current.srcObject = streamRef.current
    }
  }, [stage])

  function beginRecording() {
    const stream = streamRef.current
    if (!stream) return
    const mimeType = pickSupportedMimeType()
    mimeTypeRef.current = mimeType
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    chunksRef.current = []

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = handleRecordingStopped

    recorderRef.current = recorder
    recorder.start()
    setStage('recording')
    setSecondsLeft(MAX_DURATION_MS / 1000)

    tickTimerRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    autoStopTimerRef.current = setTimeout(() => stopRecording(), MAX_DURATION_MS)
  }

  function stopRecording() {
    clearTimers()
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }

  function handleRecordingStopped() {
    stopStream()
    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || 'video/webm' })
    const url = URL.createObjectURL(blob)
    console.error('[VideoRecorder] recording stopped:', {
      chunkCount: chunksRef.current.length,
      blobSize: blob.size,
      blobType: blob.type,
      mimeTypeUsed: mimeTypeRef.current,
    })
    setPreviewBlob(blob)
    setPreviewUrl(url)
    if (blob.size === 0) {
      setError(`Debug: recording produced 0 bytes (${chunksRef.current.length} chunks, mimeType: ${mimeTypeRef.current || 'default'})`)
    }
    setStage('preview')
  }

  function handlePreviewLoaded() {
    const duration = previewVideoRef.current?.duration ?? 0
    if (Number.isFinite(duration) && duration > MAX_DURATION_MS / 1000 + DURATION_TOLERANCE_S) {
      setError(t('video_too_long'))
      return
    }
    if (previewBlob && previewBlob.size > MAX_VIDEO_BYTES) {
      setError(t('video_too_large'))
      return
    }
    setError('')
  }

  function handlePreviewError() {
    const mediaError = previewVideoRef.current?.error
    console.error('[VideoRecorder] preview playback error:', mediaError?.code, mediaError?.message)
    setError(`Debug: playback error code ${mediaError?.code ?? '?'} — blob ${previewBlob?.size ?? '?'} bytes, type ${previewBlob?.type ?? '?'}`)
  }

  function retake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewBlob(null)
    setError('')
    void startCamera()
  }

  function useThisVideo() {
    if (!previewBlob || error) return
    const ext = mimeTypeRef.current.includes('mp4') ? 'mp4' : 'webm'
    const file = new File([previewBlob], `zone-evidence-${Date.now()}.${ext}`, { type: previewBlob.type })
    onCapture(file)
  }

  function handleCancel() {
    clearTimers()
    stopStream()
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-[9000] bg-black flex flex-col items-center justify-center" role="dialog" aria-modal="true" aria-label="Video recorder">
      <button onClick={handleCancel} aria-label="Close recorder"
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10">
        <CloseIcon />
      </button>

      {stage === 'requesting' && (
        <p className="font-['Lato',sans-serif] text-white text-base">{t('loading')}</p>
      )}

      {stage === 'error' && (
        <div className="max-w-xs text-center px-6">
          <p className="font-['Lato',sans-serif] text-white text-base">{error}</p>
        </div>
      )}

      {(stage === 'live' || stage === 'recording') && (
        <div className="relative w-full h-full flex items-center justify-center">
          <video ref={liveVideoRef} autoPlay muted playsInline
            className="max-w-full max-h-full object-contain" />

          {stage === 'recording' && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A] animate-pulse" />
              <span className="font-['Lato',sans-serif] font-bold text-[13px] text-white tracking-[0.5px]">
                {t('recording_label')} · 0:{String(secondsLeft).padStart(2, '0')}
              </span>
            </div>
          )}

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            {stage === 'live' ? (
              <button onClick={beginRecording} aria-label={t('record_video')}
                className="w-16 h-16 rounded-full border-4 border-white bg-[#BA1A1A] cursor-pointer hover:opacity-90 transition-opacity" />
            ) : (
              <button onClick={stopRecording} aria-label="Stop recording"
                className="w-16 h-16 rounded-full border-4 border-white bg-white/20 flex items-center justify-center cursor-pointer">
                <span className="w-6 h-6 rounded-[4px] bg-[#BA1A1A]" />
              </button>
            )}
          </div>
        </div>
      )}

      {stage === 'preview' && previewUrl && (
        <div className="relative w-full h-full flex flex-col items-center justify-center gap-6 px-6">
          <video ref={previewVideoRef} src={previewUrl} controls playsInline
            onLoadedMetadata={handlePreviewLoaded}
            onError={handlePreviewError}
            className="max-w-full max-h-[70vh] object-contain rounded-[12px]" />

          {error && (
            <p className="font-['Lato',sans-serif] text-[13px] text-[#FF8A80] text-center max-w-xs">{error}</p>
          )}

          <div className="flex items-center gap-4">
            <button onClick={retake}
              className="h-12 px-6 rounded-[12px] border border-white/40 font-['Poppins',sans-serif] font-semibold text-sm text-white hover:bg-white/10 transition-colors cursor-pointer">
              {t('retake_video')}
            </button>
            <button onClick={useThisVideo} disabled={!!error}
              className={[
                'h-12 px-6 rounded-[12px] font-["Poppins",sans-serif] font-semibold text-sm text-[#1A1C19] transition-colors',
                error ? 'bg-white/30 cursor-not-allowed' : 'bg-white hover:bg-white/90 cursor-pointer',
              ].join(' ')}>
              {t('use_video')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
