import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupervisorNotif {
  id: string
  created_at: string
  client_name: string
  client_company: string
  message: string
  is_urgent: boolean
  read: boolean
}

// ─── Notification card ────────────────────────────────────────────────────────

function NotifCard({ notif }: { notif: SupervisorNotif }) {
  const timeStr = new Date(notif.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const dateStr = new Date(notif.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const isToday = new Date(notif.created_at).toDateString() === new Date().toDateString()

  return (
    <div className={[
      'notif-card bg-white border rounded-[12px] p-5 flex flex-col gap-3 transition-colors',
      notif.read ? 'border-[#D0CFCA]' : 'border-[#B8A77A]',
    ].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {notif.is_urgent && (
              <span className="font-['Lato',sans-serif] font-bold text-[10px] tracking-[1px] text-white bg-[#BA1A1A] px-2 py-0.5 rounded-full uppercase">
                URGENT
              </span>
            )}
            {!notif.read && (
              <span className="w-2 h-2 rounded-full bg-[#B8A77A] shrink-0" />
            )}
          </div>
          <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19]">
            {notif.client_name}
          </p>
          <p className="font-['Lato',sans-serif] text-[12px] text-[#737874]">
            {notif.client_company}
          </p>
        </div>
        <span className="font-['Lato',sans-serif] text-[12px] text-[#9E9E9E] shrink-0">
          {isToday ? timeStr : dateStr}
        </span>
      </div>
      <p className="font-['Lato',sans-serif] text-[14px] text-[#434844] leading-relaxed">
        {notif.message}
      </p>
    </div>
  )
}

// ─── Supervisor notifications page ────────────────────────────────────────────

/** CRM notification feed — direct messages from clients to the supervisor. */
export function SupervisorNotifications() {
  const { user } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [notifs, setNotifs] = useState<SupervisorNotif[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('supervisor_notifications')
        .select('*')
        .eq('supervisor_id', user!.id)
        .order('created_at', { ascending: false })

      setNotifs((data as unknown as SupervisorNotif[]) ?? [])
      setLoading(false)
    }

    load()
  }, [user])

  useGSAP(() => {
    if (loading) return
    gsap.from('.notif-card', { opacity: 0, y: 14, duration: 0.35, stagger: 0.07, ease: 'power2.out' })
  }, { scope: containerRef, dependencies: [loading] })

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto px-6 pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 pt-10 pb-5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[24px] text-[#1A1C19] leading-[1.1] tracking-[-0.3px]">
              {t('notifications_title')}
            </h1>
            <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
              {t('sv_notifications_subtitle_sup')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[120px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-10 flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F4F4EE] border border-[#D0CFCA] flex items-center justify-center mb-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{t('sv_no_notifications')}</p>
            <p className="font-['Lato',sans-serif] text-sm text-[#737874]">{t('sv_no_notifications_body')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifs.map((n) => <NotifCard key={n.id} notif={n} />)}
          </div>
        )}
      </div>
    </div>
  )
}
