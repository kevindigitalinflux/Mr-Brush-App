import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { useTranslation } from '../../lib/useTranslation'

/** Shows only to staff who can read a facility guide (row-level security decides); links to the guide page. */
export function GuideEntryCard({ to }: { to: string }) {
  const { user } = useApp()
  const t = useTranslation()
  const navigate = useNavigate()
  const [hasGuide, setHasGuide] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    async function check() {
      const { data, error } = await supabase.from('facility_guide_sections').select('id').limit(1)
      if (cancelled) return
      if (error) { console.error('guide check failed', error); return }
      setHasGuide((data ?? []).length > 0)
    }
    void check()
    return () => { cancelled = true }
  }, [user?.id])

  if (!hasGuide) return null

  return (
    <button onClick={() => navigate(to)} className="w-full bg-white border border-[#D0CFCA] rounded-[12px] p-4 flex items-center gap-4 text-left cursor-pointer hover:bg-[#F4F4EE] transition-colors">
      <span className="shrink-0 w-12 h-12 rounded-full bg-[#2F4A3D] flex items-center justify-center" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 8h6M8 12h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{t('guide_card_title')}</span>
        <span className="font-['Lato',sans-serif] text-sm text-[#434B4D]">{t('guide_card_subtitle')}</span>
      </span>
    </button>
  )
}
