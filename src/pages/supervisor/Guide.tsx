import { useNavigate } from 'react-router-dom'
import { GuideView } from '../../components/guide/GuideView'
import { useTranslation } from '../../lib/useTranslation'

/** Facility guide for supervisors of a site that has one (e.g. Journey). Reached from the Dashboard card. */
export function SupervisorGuide() {
  const navigate = useNavigate()
  const t = useTranslation()

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="w-full max-w-[480px] md:max-w-2xl mx-auto px-6 pb-10">
        <div className="flex items-center gap-3 pt-10 pb-5">
          <button onClick={() => navigate('/supervisor/dashboard')} aria-label={t('guide_back')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[24px] text-[#1A1C19] leading-[1.1]">{t('guide_title')}</h1>
            <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">{t('guide_subtitle')}</p>
          </div>
        </div>
        <GuideView />
      </div>
    </div>
  )
}
