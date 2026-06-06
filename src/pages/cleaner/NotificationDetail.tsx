import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from '../../lib/useTranslation'
import { gsap, useGSAP } from '../../lib/gsap'
import { DesktopSidebar } from '../../components/DesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { supabase } from '../../lib/supabase'
import { useApp } from '../../context/AppContext'
import { postRecleanAck } from '../../lib/webhooks'

interface NotifMetadata {
  type?: 'reclean' | 'approved' | 'feedback'
  feedback_comment_id?: string
  supervisor_id?: string
  zone_name?: string
  facility_name?: string
}

interface Notif {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  metadata: NotifMetadata | null
}

function timeAgo(iso: string, lang: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  type L = Record<string, string>
  if (mins < 1) return ({ en: 'Just now', es: 'Ahora mismo', pt: 'Agora mesmo' } as L)[lang] ?? 'Just now'
  if (mins < 60) return ({ en: `${mins}m ago`, es: `hace ${mins}m`, pt: `há ${mins}m` } as L)[lang] ?? `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return ({ en: `${hrs}h ago`, es: `hace ${hrs}h`, pt: `há ${hrs}h` } as L)[lang] ?? `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return ({ en: `${days}d ago`, es: `hace ${days}d`, pt: `há ${days}d` } as L)[lang] ?? `${days}d ago`
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Reclean acknowledge section ─────────────────────────────────────────────

function RecleanAckSection({ notif }: { notif: Notif }) {
  const { user } = useApp()
  const t = useTranslation()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const meta = notif.metadata

  if (!meta?.feedback_comment_id || !meta.supervisor_id) return null

  async function handleAck() {
    if (!user || loading) return
    setLoading(true)
    try {
      await postRecleanAck({
        feedback_comment_id: meta!.feedback_comment_id!,
        supervisor_id: meta!.supervisor_id!,
        cleaner_id: user.id,
        cleaner_note: note,
        zone_name: meta!.zone_name ?? '',
        facility_name: meta!.facility_name ?? '',
      })
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="nd-ack mx-6 mt-4 bg-[#F0FAF5] border border-[#A8D5B8] rounded-[12px] p-5 flex flex-col gap-1">
        <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#2F4A3D]">{t('reclean_ack_done')}</p>
        <p className="font-['Lato',sans-serif] text-[14px] text-[#2F4A3D]">{t('reclean_ack_done_body')}</p>
      </div>
    )
  }

  return (
    <div className="nd-ack mx-6 mt-4 bg-white border border-[#D0CFCA] rounded-[12px] p-5 flex flex-col gap-4">
      <div>
        <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19]">{t('reclean_ack_heading')}</p>
        <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">{t('reclean_ack_body')}</p>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('reclean_ack_note_placeholder')}
        rows={3}
        className="w-full border border-[#C3C8C2] rounded-[8px] px-4 py-3 font-['Lato',sans-serif] text-[14px] text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] resize-none transition-colors"
      />
      <button
        onClick={handleAck}
        disabled={loading}
        className="w-full h-[52px] bg-[#B8A77A] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-[15px] text-[#F8F8F2] cursor-pointer hover:bg-[#a8976a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? t('reclean_ack_submitting') : t('reclean_ack_btn')}
      </button>
    </div>
  )
}

// ─── Detail content ───────────────────────────────────────────────────────────

function NotifDetailContent({ notif }: { notif: Notif }) {
  const { language } = useApp()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.nd-title',   { opacity: 0, y: 14, duration: 0.4 })
      .from('.nd-message', { opacity: 0, y: 12, duration: 0.4 }, '-=0.2')
      .from('.nd-ack',     { opacity: 0, y: 10, duration: 0.35 }, '-=0.15')
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="pt-6 pb-8">
      <div className="nd-title px-6 mb-6">
        <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mb-2">{timeAgo(notif.created_at, language)}</p>
        <h1 className="font-['Poppins',sans-serif] font-bold text-[26px] text-[#1A1C19] leading-[1.25] tracking-[-0.3px]">
          {notif.title}
        </h1>
      </div>
      <div className="nd-message px-6">
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-5">
          <p className="font-['Lato',sans-serif] text-[15px] text-[#1A1C19] leading-[1.7]">{notif.message}</p>
        </div>
      </div>
      {notif.metadata?.type === 'reclean' && <RecleanAckSection notif={notif} />}
    </div>
  )
}

// ─── Shared hook ─────────────────────────────────────────────────────────────

function useFetchNotif(id: string | undefined) {
  const { user } = useApp()
  const [notif, setNotif] = useState<Notif | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || !user) return
    void supabase
      .from('notifications')
      .select('id, title, message, is_read, created_at, metadata')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        const n = data as Notif | null
        setNotif(n)
        setLoading(false)
        if (n && !n.is_read) {
          void supabase.from('notifications').update({ is_read: true }).eq('id', id)
        }
      })
  }, [id, user])

  return { notif, loading }
}

// ─── Desktop layout ───────────────────────────────────────────────────────────

function DesktopNotificationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const t = useTranslation()
  const { notif, loading } = useFetchNotif(id)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
      <DesktopSidebar active="notifications" />
      <main className="flex-1 overflow-y-auto ml-60">
        <div className="sticky top-0 z-10 bg-[#F4F4EE]/95 backdrop-blur-sm border-b border-[#E3E3DD] flex items-center px-8 h-16">
          <button
            onClick={() => navigate('/cleaner/notifications')}
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Back to notifications"
          >
            <BackIcon />
            <span className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">
              {t('notif_message')}
            </span>
          </button>
        </div>
        <div className="max-w-2xl mx-auto pb-12">
          {loading ? (
            <p className="p-6 font-['Lato',sans-serif] text-sm text-[#737874]">{t('loading')}</p>
          ) : notif ? (
            <NotifDetailContent notif={notif} />
          ) : (
            <p className="p-6 font-['Lato',sans-serif] text-[#434844]">{t('notif_not_found')}</p>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── Mobile layout ────────────────────────────────────────────────────────────

function MobileNotificationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const t = useTranslation()
  const { notif, loading } = useFetchNotif(id)

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="w-full max-w-[480px] mx-auto pb-12">
        <div className="sticky top-0 z-10 bg-[#F4F4EE]/95 backdrop-blur-sm border-b border-[#E3E3DD] flex items-center px-6 h-16">
          <button
            onClick={() => navigate('/cleaner/notifications')}
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Back to notifications"
          >
            <BackIcon />
            <span className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">
              {t('notif_message')}
            </span>
          </button>
        </div>
        {loading ? (
          <p className="p-6 font-['Lato',sans-serif] text-sm text-[#737874]">{t('loading')}</p>
        ) : notif ? (
          <NotifDetailContent notif={notif} />
        ) : (
          <p className="p-6 font-['Lato',sans-serif] text-[#434844]">{t('notif_not_found')}</p>
        )}
      </div>
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/** Full message view for a single notification. */
export function NotificationDetail() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopNotificationDetail /> : <MobileNotificationDetail />
}
