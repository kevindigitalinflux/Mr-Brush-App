import { pick } from '../../lib/facilityGuide'
import type { GuideLang, GuideStepData } from '../../lib/facilityGuide'

interface Props {
  step: GuideStepData
  lang: GuideLang
  number: number
  checkable: boolean
  checked: boolean
  photoUrls: string[]
  onToggle: () => void
  onOpenPhoto: (src: string) => void
}

function CodePill({ code, label }: { code: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-3 bg-[#1A1C19] text-white rounded-[12px] px-4 py-3 self-start">
      <span className="font-['Lato',sans-serif] text-xs uppercase tracking-wider text-[#B8A77A]">{label}</span>
      <span className="font-['Poppins',sans-serif] font-bold text-2xl tracking-[0.15em]">{code}</span>
    </div>
  )
}

function Marker({ checkable, checked, number, onToggle }: Pick<Props, 'checkable' | 'checked' | 'number' | 'onToggle'>) {
  if (!checkable) {
    return (
      <span className="shrink-0 w-7 h-7 rounded-full bg-[#F4F4EE] border border-[#D0CFCA] flex items-center justify-center font-['Poppins',sans-serif] font-semibold text-sm text-[#434B4D]">
        {number}
      </span>
    )
  }
  return (
    <button
      onClick={onToggle}
      role="checkbox"
      aria-checked={checked}
      aria-label={String(number)}
      className={`shrink-0 w-7 h-7 rounded-[8px] border-2 flex items-center justify-center cursor-pointer transition-colors ${checked ? 'bg-[#2F4A3D] border-[#2F4A3D]' : 'bg-white border-[#B8A77A]'}`}
    >
      {checked && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

/** One instruction in a guide section: text, optional code, warning, contact and photos. */
export function GuideStep({ step, lang, number, checkable, checked, photoUrls, onToggle, onOpenPhoto }: Props) {
  return (
    <li className="flex gap-3 py-3 border-t border-[#E3E3DD] first:border-t-0">
      <Marker checkable={checkable} checked={checked} number={number} onToggle={onToggle} />
      <div className="flex flex-col gap-3 min-w-0 flex-1">
        <p className={`font-['Lato',sans-serif] text-base leading-[1.6] ${checked ? 'text-[#737874] line-through' : 'text-[#1A1C19]'}`}>
          {pick(step.t, lang)}
        </p>
        {step.code && <CodePill code={step.code} label={pick(step.code_label, lang)} />}
        {step.warn && (
          <p className="font-['Lato',sans-serif] text-sm font-bold text-[#6F613A] bg-[#F1DEAD] rounded-[8px] px-3 py-2">
            {pick(step.warn, lang)}
          </p>
        )}
        {step.contact && (
          <div className="bg-[#F4F4EE] border border-[#D0CFCA] rounded-[12px] p-3 flex flex-col gap-1 font-['Lato',sans-serif] text-sm text-[#1A1C19]">
            <span className="font-bold">{step.contact.name}</span>
            <a className="text-[#2F4A3D] underline" href={`tel:${step.contact.phone.replace(/\s/g, '')}`}>{step.contact.phone}</a>
            <a className="text-[#2F4A3D] underline break-all" href={`mailto:${step.contact.email}`}>{step.contact.email}</a>
          </div>
        )}
        {photoUrls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photoUrls.map((src) => (
              <button key={src} onClick={() => onOpenPhoto(src)} className="shrink-0 cursor-pointer">
                <img src={src} alt="" loading="lazy" className="h-24 w-24 object-cover rounded-[8px] border border-[#D0CFCA]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}
