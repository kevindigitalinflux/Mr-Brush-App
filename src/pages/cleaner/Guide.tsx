import { useNavigate } from 'react-router-dom'
import { BottomNav } from '../../components/BottomNav'
import { DesktopSidebar } from '../../components/DesktopSidebar'
import { GuideView } from '../../components/guide/GuideView'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { useTranslation } from '../../lib/useTranslation'

function BackButton({ label }: { label: string }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate('/cleaner/home')} aria-label={label} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

/** Facility guide for cleaners who work at a site that has one (e.g. Journey). */
export function Guide() {
  const t = useTranslation()
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-[#F4F4EE]">
        <DesktopSidebar active="jobs" />
        <main className="pl-60">
          <div className="max-w-2xl mx-auto px-10 py-10 flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <BackButton label={t('guide_back')} />
              <div>
                <h1 className="font-['Poppins',sans-serif] font-bold text-[36px] text-[#1A1C19] leading-[1.1]">{t('guide_title')}</h1>
                <p className="font-['Lato',sans-serif] text-[#737874]">{t('guide_subtitle')}</p>
              </div>
            </div>
            <GuideView />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="w-full max-w-[480px] mx-auto px-6 pb-[100px]">
        <div className="flex items-center gap-3 pt-10 pb-5">
          <BackButton label={t('guide_back')} />
          <div>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[28px] text-[#1A1C19] leading-[1.1]">{t('guide_title')}</h1>
            <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">{t('guide_subtitle')}</p>
          </div>
        </div>
        <GuideView />
      </div>
      <BottomNav active="jobs" />
    </div>
  )
}
