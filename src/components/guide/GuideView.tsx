import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { ImageViewer } from '../ImageViewer'
import { GuideSection } from './GuideSection'
import { readGuideLang, saveGuideLang, TASK_SORT_START, useFacilityGuide, useGuideChecks } from '../../lib/facilityGuide'
import type { GuideLang } from '../../lib/facilityGuide'

const LANG_BUTTONS: { code: GuideLang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-8 flex flex-col items-center gap-2 text-center">
      <p className="font-['Poppins',sans-serif] font-semibold text-lg text-[#1A1C19]">{title}</p>
      <p className="font-['Lato',sans-serif] text-sm text-[#434B4D]">{body}</p>
    </div>
  )
}

/** The facility guide: language switch, "getting in" reference sections, and a tickable task list for the day. */
export function GuideView() {
  const { user, language } = useApp()
  const t = useTranslation()
  const { sections, photoUrls, loading, error } = useFacilityGuide(user?.id)
  const { done, toggle } = useGuideChecks(user?.id)
  const [lang, setLang] = useState<GuideLang>(() => readGuideLang(language))
  const [photo, setPhoto] = useState<string | null>(null)

  function chooseLang(code: GuideLang) { setLang(code); saveGuideLang(code) }

  const access = sections.filter((s) => s.sort < TASK_SORT_START)
  const tasks = sections.filter((s) => s.sort >= TASK_SORT_START)
  const totalSteps = tasks.reduce((n, s) => n + s.steps.length, 0)
  const doneSteps = tasks.reduce((n, s) => n + s.steps.filter((_, i) => done.has(`${s.slug}:${i}`)).length, 0)
  const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0

  const render = (list: typeof sections) => list.map((s) => (
    <GuideSection key={s.id} section={s} lang={lang} done={done} photoUrls={photoUrls} onToggle={toggle} onOpenPhoto={setPhoto} doneLabel={t('guide_done_label')} />
  ))

  if (loading) return <div className="flex flex-col gap-3">{[1, 2, 3].map((i) => <div key={i} className="h-[72px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />)}</div>
  if (error) return <Notice title={t('guide_error_title')} body={t('guide_error_body')} />
  if (sections.length === 0) return <Notice title={t('guide_empty_title')} body={t('guide_empty_body')} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2" role="group" aria-label={t('guide_language')}>
        {LANG_BUTTONS.map((b) => (
          <button key={b.code} onClick={() => chooseLang(b.code)} aria-pressed={lang === b.code}
            className={`h-10 px-4 rounded-[12px] font-['Poppins',sans-serif] font-semibold text-sm cursor-pointer border ${lang === b.code ? 'bg-[#1A1C19] text-white border-[#1A1C19]' : 'bg-white text-[#434B4D] border-[#D0CFCA]'}`}>
            {b.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-['Poppins',sans-serif] font-semibold text-xl text-[#1A1C19]">{t('guide_group_access')}</h2>
        {render(access)}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-['Poppins',sans-serif] font-semibold text-xl text-[#1A1C19]">{t('guide_group_tasks')}</h2>
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-4 flex flex-col gap-2">
          <div className="flex justify-between font-['Lato',sans-serif] text-sm text-[#434B4D]">
            <span>{t('guide_progress')}</span><span className="font-bold">{doneSteps}/{totalSteps}</span>
          </div>
          <div className="h-2 rounded-full bg-[#E3E3DD] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-[#2F4A3D] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {render(tasks)}
      </div>

      {photo && <ImageViewer src={photo} onClose={() => setPhoto(null)} />}
    </div>
  )
}
