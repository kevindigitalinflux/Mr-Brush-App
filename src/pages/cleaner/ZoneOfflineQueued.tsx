import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'

function WifiOffIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 6C3.5 3.5 7 2 12 2s8.5 1.5 11 4" stroke="#C3C8C2" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 10c1.9-1.9 4.5-3 7-3s5.1 1.1 7 3" stroke="#C3C8C2" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.5 13.5c1-1 2.2-1.5 3.5-1.5s2.5.5 3.5 1.5" stroke="#C3C8C2" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.5" fill="#C3C8C2" />
      <path d="M2 2l20 20" stroke="#BA1A1A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function WifiIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 6C3.5 3.5 7 2 12 2s8.5 1.5 11 4" stroke="#2F4A3D" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 10c1.9-1.9 4.5-3 7-3s5.1 1.1 7 3" stroke="#2F4A3D" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.5 13.5c1-1 2.2-1.5 3.5-1.5s2.5.5 3.5 1.5" stroke="#2F4A3D" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.5" fill="#2F4A3D" />
    </svg>
  )
}

type Phase = 'offline' | 'uploading' | 'done'

/** Shown when a zone is submitted without internet — queued locally, auto-uploads on reconnect. */
export function ZoneOfflineQueued() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const jobId = params.get('jobId') ?? ''
  const zoneId = params.get('zoneId') ?? ''
  const { isOnline, completedZones } = useApp()
  const tr = useTranslation()

  const [phase, setPhase] = useState<Phase>(() => (isOnline ? 'uploading' : 'offline'))

  // Transition offline → uploading when internet returns
  useEffect(() => {
    if (!isOnline) return
    setPhase((p) => (p === 'offline' ? 'uploading' : p))
  }, [isOnline])

  // Transition uploading → done + navigate when AppContext flush marks zone complete
  useEffect(() => {
    if (!zoneId || !completedZones.has(zoneId)) return
    setPhase('done')
    const timer = setTimeout(() => navigate(`/cleaner/job/${jobId}`), 1400)
    return () => clearTimeout(timer)
  }, [completedZones, zoneId, jobId, navigate])

  const content = {
    offline: {
      icon: <WifiOffIcon />,
      iconBg: 'bg-[#F4F4EE] border border-[#D0CFCA]',
      title: tr('offline_saved'),
      body: tr('offline_saved_body'),
      pill: null,
    },
    uploading: {
      icon: <WifiIcon />,
      iconBg: 'bg-[#D0E8D7]',
      title: tr('uploading'),
      body: tr('online_uploading_body'),
      pill: (
        <div className="flex items-center gap-2 bg-[#F1DEAD] border border-[#D7C596]/30 rounded-full px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-[#B8A77A] animate-pulse" />
          <span className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.6px] text-[#6F613A]">{tr('syncing')}</span>
        </div>
      ),
    },
    done: {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#2F4A3D" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M22 4L12 14.01l-3-3" stroke="#2F4A3D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      iconBg: 'bg-[#D0E8D7]',
      title: tr('uploaded'),
      body: tr('uploaded_body'),
      pill: null,
    },
  }[phase]

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] flex flex-col items-center justify-center px-8 text-center">
      <div className="w-full max-w-[400px] flex flex-col items-center gap-6">

        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${content.iconBg}`}>
          {content.icon}
        </div>

        <div className="flex flex-col items-center gap-2">
          <h1 className="font-['Poppins',sans-serif] font-bold text-[28px] text-[#1A1C19] leading-tight tracking-[-0.3px]">
            {content.title}
          </h1>
          <p className="font-['Lato',sans-serif] text-base text-[#737874] leading-[1.6] max-w-[320px]">
            {content.body}
          </p>
        </div>

        {content.pill}

        {phase === 'offline' && (
          <button
            onClick={() => navigate(`/cleaner/job/${jobId}`)}
            className="mt-2 font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844] underline decoration-[#C3C8C2] cursor-pointer"
          >
            {tr('back_to_zones')}
          </button>
        )}

      </div>
    </div>
  )
}
