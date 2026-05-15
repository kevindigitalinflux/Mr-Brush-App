import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import type { Language } from '../../lib/i18n'

const LANGUAGES: { code: Language; flag: string; label: string }[] = [
  { code: 'en', flag: '🇬🇧', label: 'English'   },
  { code: 'es', flag: '🇪🇸', label: 'Español'   },
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
]

interface Props {
  onClose: () => void
}

/** Bottom sheet for switching the supervisor's UI language. */
export function LanguageSheet({ onClose }: Props) {
  const { language, setLanguage } = useApp()
  const t = useTranslation()

  function pick(lang: Language) {
    setLanguage(lang)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[500] flex flex-col justify-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-[20px] px-6 pt-5 pb-10 flex flex-col gap-2 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#D0CFCA] rounded-full mx-auto mb-3" />
        <p className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.2px] text-[#737874] uppercase mb-1">
          {t('sv_language_label')}
        </p>
        {LANGUAGES.map(({ code, flag, label }) => (
          <button
            key={code}
            onClick={() => pick(code)}
            className={[
              'flex items-center gap-4 h-14 px-4 rounded-[12px] text-left transition-colors',
              language === code
                ? 'bg-[#F4F4EE] border-2 border-[#B8A77A]'
                : 'border border-[#E3E3DD] hover:bg-[#F9F9F6]',
            ].join(' ')}
          >
            <span className="text-2xl leading-none">{flag}</span>
            <span className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1A1C19] flex-1">
              {label}
            </span>
            {language === code && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" stroke="#B8A77A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
