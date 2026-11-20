import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { useTranslation } from '../../lib/useTranslation'

const LOOM_EMBED_URL = 'https://www.loom.com/embed/69bcfaf6516340d7b8b866d866e099f0'

type SeenState = 'loading' | 'seen' | 'unseen'

/** Reads whether this cleaner has already dealt with the tutorial prompt. Any error counts as "seen" so a missing column never blocks the app. */
function useTutorialSeen(userId: string | undefined) {
  const [state, setState] = useState<SeenState>('loading')

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function load() {
      const { data, error } = await supabase.from('profiles').select('tutorial_seen_at').eq('id', userId).maybeSingle()
      if (cancelled) return
      if (error) { console.error('tutorial_seen_at read failed', error); setState('seen'); return }
      const row = data as { tutorial_seen_at: string | null } | null
      setState(row && row.tutorial_seen_at === null ? 'unseen' : 'seen')
    }
    void load()
    return () => { cancelled = true }
  }, [userId])

  async function markSeen() {
    setState('seen')
    const { error } = await supabase.rpc('mark_tutorial_seen')
    if (error) console.error('mark_tutorial_seen failed', error)
  }

  return { state, markSeen }
}

function VideoFrame({ onClose }: { onClose: () => void }) {
  const t = useTranslation()
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label={t('tutorial_title')}>
      <div className="w-full max-w-[480px] bg-[#F5F4EF] rounded-[12px] p-4 flex flex-col gap-3">
        <div className="aspect-video w-full overflow-hidden rounded-[12px] bg-black">
          <iframe src={LOOM_EMBED_URL} title={t('tutorial_title')} allowFullScreen className="w-full h-full border-0" />
        </div>
        <button onClick={onClose} className="h-[56px] rounded-[12px] bg-[#3D3B3A] text-white font-['Poppins',sans-serif] font-semibold cursor-pointer">
          {t('tutorial_close')}
        </button>
      </div>
    </div>
  )
}

function WelcomePrompt({ onWatch, onSkip }: { onWatch: () => void; onSkip: () => void }) {
  const t = useTranslation()
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center px-6" role="dialog" aria-modal="true" aria-label={t('tutorial_welcome')}>
      <div className="w-full max-w-[420px] bg-[#F5F4EF] rounded-[12px] p-6 flex flex-col gap-4">
        <h2 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19]">{t('tutorial_welcome')}</h2>
        <p className="font-['Lato',sans-serif] text-base text-[#434B4D] leading-[1.6]">{t('tutorial_welcome_body')}</p>
        <p className="font-['Lato',sans-serif] text-sm text-[#6B5D36]">{t('tutorial_lang_note')}</p>
        <button onClick={onWatch} className="h-[56px] rounded-[12px] bg-[#B8A77A] text-[#1A1C19] font-['Poppins',sans-serif] font-semibold cursor-pointer">
          {t('tutorial_watch')}
        </button>
        <button onClick={onSkip} className="h-[56px] rounded-[12px] border border-[#D0CFCA] bg-white text-[#3D3B3A] font-['Poppins',sans-serif] font-semibold cursor-pointer">
          {t('tutorial_skip')}
        </button>
      </div>
    </div>
  )
}

/**
 * Tutorial video for cleaners. Shows a Watch/Skip prompt on a cleaner's first visit
 * (tracked per account in profiles.tutorial_seen_at) and a permanent card afterwards.
 */
export function TutorialVideo() {
  const { user } = useApp()
  const t = useTranslation()
  const { state, markSeen } = useTutorialSeen(user?.id)
  const [playing, setPlaying] = useState(false)

  if (state === 'loading') return null

  function watch() { setPlaying(true); void markSeen() }

  return (
    <>
      <button onClick={() => setPlaying(true)} className="w-full bg-white border border-[#D0CFCA] rounded-[12px] p-4 flex items-center gap-4 text-left cursor-pointer hover:bg-[#F4F4EE] transition-colors">
        <span className="shrink-0 w-12 h-12 rounded-full bg-[#B8A77A] flex items-center justify-center" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1A1C19"><path d="M8 5v14l11-7z" /></svg>
        </span>
        <span className="flex flex-col gap-0.5 min-w-0">
          <span className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{t('tutorial_title')}</span>
          <span className="font-['Lato',sans-serif] text-sm text-[#434B4D]">{t('tutorial_subtitle')}</span>
        </span>
      </button>
      {state === 'unseen' && !playing && <WelcomePrompt onWatch={watch} onSkip={() => void markSeen()} />}
      {playing && <VideoFrame onClose={() => setPlaying(false)} />}
    </>
  )
}
