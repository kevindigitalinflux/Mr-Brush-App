import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { ClientNav } from '../../components/client/ClientNav'
import { ClientSidebar } from '../../components/client/ClientSidebar'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientNotif {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso)
  const isToday = d.toDateString() === new Date().toDateString()
  if (isToday) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Notification card ────────────────────────────────────────────────────────

function NotifCard({ notif }: { notif: ClientNotif }) {
  return (
    <div className={`cl-notif-card bg-white border rounded-[12px] p-5 transition-colors ${notif.is_read ? 'border-[#D0CFCA]' : 'border-[#B8A77A]'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {!notif.is_read && <span className="w-2 h-2 rounded-full bg-[#B8A77A] shrink-0" />}
          <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#3D3B3A] leading-snug">
            {notif.title}
          </p>
        </div>
        <span className="font-['Lato',sans-serif] text-[11px] text-[#9A9A94] shrink-0 mt-0.5 tabular-nums">
          {formatTime(notif.created_at)}
        </span>
      </div>
      <p className="font-['Lato',sans-serif] text-[13px] text-[#434B4D] leading-relaxed">
        {notif.message}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/** Client notification feed — supervisor responses and complaint status updates. */
export function ClientNotifications() {
  const { user } = useApp()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [notifs, setNotifs] = useState<ClientNotif[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('notifications')
        .select('id, title, message, is_read, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      const rows = (data as unknown as ClientNotif[]) ?? []
      setNotifs(rows)
      setLoading(false)

      // Mark all unread as read
      const unreadIds = rows.filter((n) => !n.is_read).map((n) => n.id)
      if (unreadIds.length > 0) {
        void supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
      }
    }

    void load()
  }, [user])

  useGSAP(() => {
    if (loading) return
    gsap.from('.cl-notif-card', { opacity: 0, y: 12, duration: 0.35, stagger: 0.07, ease: 'power2.out' })
  }, { scope: containerRef, dependencies: [loading] })

  const content = (
    <div ref={containerRef} className="max-w-[640px] mx-auto px-6 pt-10 pb-[100px] md:pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="#3D3B3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <p className="font-['Lato',sans-serif] text-[12px] text-[#B8A77A] font-bold tracking-[1.5px] uppercase mb-0.5">
            Updates
          </p>
          <h1 className="font-['Poppins',sans-serif] font-bold text-[26px] text-[#3D3B3A] leading-tight">
            Notifications
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[90px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-10 flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F5F4EF] border border-[#D0CFCA] flex items-center justify-center mb-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#3D3B3A]">No notifications yet</p>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#434B4D] mt-0.5">
            Supervisor responses to your complaints will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifs.map((n) => <NotifCard key={n.id} notif={n} />)}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="hidden md:block">
        <ClientSidebar active="notifications" complaintsCount={0} />
      </div>
      <div className="md:pl-60 min-h-screen bg-[#F5F4EF]">
        {content}
      </div>
      <div className="md:hidden">
        <ClientNav active="notifications" complaintsCount={0} />
      </div>
    </>
  )
}
