import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import type { Language } from '../../lib/i18n'

// Flag image URLs from Figma — swap for permanent assets before production
const FLAG_URLS: Record<Language, string> = {
  en: 'https://www.figma.com/api/mcp/asset/abac7baa-306e-4933-9bfa-fda48c5c11df',
  es: 'https://www.figma.com/api/mcp/asset/bc271660-c61d-4673-a90c-2d0ae2f5a30d',
  pt: 'https://www.figma.com/api/mcp/asset/4628787e-1760-42cf-8505-bee76e6f7191',
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
]

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12l5 5L20 7" stroke="#F8F8F2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LanguageSelect() {
  const { setLanguage } = useApp()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Language>('en')

  function handleContinue() {
    setLanguage(selected)
    navigate('/login')
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F4EF] flex justify-center">
      <div className="flex flex-col justify-between w-full max-w-[448px] px-6 py-16 min-h-screen">

        <div className="flex flex-col">
          {/* Header */}
          <div className="flex flex-col items-center pb-16">
            <div className="w-28 h-28 rounded-full bg-white shadow-sm mb-8 border border-[#D0CFCA]">
              {/* Logo asset goes here */}
            </div>
            <h1 className="font-['Poppins',sans-serif] text-[30px] leading-9 text-[#1B1C19] text-center mb-4">
              Choose your<br />language
            </h1>
            <p className="font-['Lato',sans-serif] text-lg text-[#4B463B] opacity-70 text-center">
              Elige tu idioma / Escolha o seu idioma
            </p>
          </div>

          {/* Language options */}
          <div className="flex flex-col gap-4">
            {LANGUAGES.map((lang) => {
              const isSelected = selected === lang.code
              return (
                <button
                  key={lang.code}
                  onClick={() => setSelected(lang.code)}
                  aria-pressed={isSelected}
                  className={[
                    'flex items-center justify-between w-full min-h-[84px] px-3 py-6 rounded-[12px] border-2 transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-[#B8A77A] border-[#B8A77A] shadow-md'
                      : 'bg-white border-[#CDC6B7]',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-8 pl-2">
                    <img
                      src={FLAG_URLS[lang.code]}
                      alt={`${lang.label} flag`}
                      className="w-8 h-8 rounded-sm shadow-sm object-cover"
                    />
                    <span className={[
                      "font-['Poppins',sans-serif] text-xl",
                      isSelected ? 'text-[#F8F8F2]' : 'text-[#1B1C19]',
                    ].join(' ')}>
                      {lang.label}
                    </span>
                  </div>
                  {isSelected && <CheckIcon />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Continue */}
        <div className="pt-16">
          <button
            onClick={handleContinue}
            className="w-full h-16 bg-[#B8A77A] rounded-[12px] font-['Poppins',sans-serif] text-lg text-[#F8F8F2] tracking-[0.9px] uppercase cursor-pointer hover:bg-[#a8976a] transition-colors"
          >
            Continue
          </button>
        </div>

      </div>
    </div>
  )
}
