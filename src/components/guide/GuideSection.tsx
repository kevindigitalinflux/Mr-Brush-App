import { useState } from 'react'
import { GuideStep } from './GuideStep'
import { pick, TASK_SORT_START } from '../../lib/facilityGuide'
import type { GuideLang, GuideSectionData } from '../../lib/facilityGuide'

interface Props {
  section: GuideSectionData
  lang: GuideLang
  done: Set<string>
  photoUrls: Record<string, string>
  onToggle: (id: string) => void
  onOpenPhoto: (src: string) => void
  doneLabel: string
}

/** One collapsible guide section. Task-list sections get tick boxes and a progress count. */
export function GuideSection({ section, lang, done, photoUrls, onToggle, onOpenPhoto, doneLabel }: Props) {
  const [open, setOpen] = useState(false)
  const isTask = section.sort >= TASK_SORT_START
  const ids = section.steps.map((_, i) => `${section.slug}:${i}`)
  const doneCount = ids.filter((id) => done.has(id)).length
  const complete = isTask && doneCount === ids.length && ids.length > 0

  return (
    <section className={`bg-white border rounded-[12px] overflow-hidden ${complete ? 'border-[#2F4A3D]' : 'border-[#D0CFCA]'}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
      >
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {section.time_label && (
            <span className="font-['Lato',sans-serif] text-xs font-bold tracking-wider text-[#6B5D36]">{section.time_label}</span>
          )}
          <span className="font-['Poppins',sans-serif] font-semibold text-lg text-[#1A1C19] leading-snug">{pick(section.title, lang)}</span>
          {!open && section.summary && (
            <span className="font-['Lato',sans-serif] text-sm text-[#434B4D]">{pick(section.summary, lang)}</span>
          )}
        </div>
        {isTask && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${complete ? 'bg-[#2F4A3D] text-white' : 'bg-[#E3E3DD] text-[#434B4D]'}`} aria-label={doneLabel}>
            {doneCount}/{ids.length}
          </span>
        )}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" stroke="#434B4D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ol className="px-4 pb-2 list-none">
          {section.steps.map((step, i) => (
            <GuideStep
              key={ids[i]}
              step={step}
              lang={lang}
              number={i + 1}
              checkable={isTask}
              checked={done.has(ids[i])}
              photoUrls={(step.photos ?? []).map((p) => photoUrls[`${section.facility_id}/${p}`]).filter((u): u is string => Boolean(u))}
              onToggle={() => onToggle(ids[i])}
              onOpenPhoto={onOpenPhoto}
            />
          ))}
        </ol>
      )}
    </section>
  )
}
