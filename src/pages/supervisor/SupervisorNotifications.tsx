import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notif {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)   return 'Just now'
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  === 1) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function isComplaint(title: string) {
  return title.toLowerCase().includes('complaint')
}

// ─── Notification card ────────────────────────────────────────────────────────

function NotifCard({ notif, onRead }: { notif: Notif; onRead: (id: string) => void }) {
  const navigate = useNavigate()
  const complaint = isComplaint(notif.title)

  function handleClick() {
    if (!notif.is_read) onRead(notif.id)
  }

  return (
    <div
      onClick={handleClick}
      className={[
        'notif-card bg-white border rounded-[12px] p-5 flex flex-col gap-3 cursor-default transition-colors',
        notif.is_read ? 'border-[#D0CFCA]' : 'border-[#B8A77A]',
      ].join(' ')}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {!notif.is_read && (
            <span className="mt-[6px] w-2 h-2 rounded-full bg-[#B8A77A] shrink-0" />
          )}
          <div className="min-w-0">
            <p className={[
              "font-['Poppins',sans-serif] font-semibold text-[14px] leading-snug",
              complaint && !notif.is_read ? 'text-[#BA1A1A]' : 'text-[#1A1C19]',
            ].join(' ')}>
              {notif.title}
            </p>
          </div>
        </div>
        <span className="font-['Lato',sans-serif] text-[11px] text-[#9E9E9E] shrink-0 pt-0.5">
          {relativeTime(notif.created_at)}
        </span>
      </div>

      {/* Message */}
      <p className="font-['Lato',sans-serif] text-[13px] text-[#434844] leading-relaxed">
        {notif.message}
      </p>

      {/* Complaint CTA */}
      {complaint && (
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/supervisor/issues') }}
          className="self-start flex items-center gap-1.5 font-['Lato',sans-serif] font-semibold text-[12px] text-[#B8A77A] hover:text-[#8B7A5A] transition-colors"
        >
          View complaint
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/** Supervisor notification feed — system and client alerts. */
export function SupervisorNotifications() {
  const { user } = useApp()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (silent = false) => {
    if (!user) return
    if (!silent) setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotifs((data ?? []) as Notif[])
    setLoading(false)
  }, [user])

  useEffect(() => { if (user) load() }, [load, user])

  // Realtime — refresh on any notification insert/update
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('sv-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => load(true))
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [user, load])

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    const unreadIds = notifs.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const unreadCount = notifs.filter((n) => !n.is_read).length

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
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-['Poppins',sans-serif] font-bold text-[24px] text-[#1A1C19] leading-[1.1] tracking-[-0.3px]">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="bg-[#BA1A1A] text-white font-['Lato',sans-serif] font-bold text-[11px] px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
              Job alerts and client updates
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="shrink-0 font-['Lato',sans-serif] text-[12px] font-semibold text-[#B8A77A] hover:text-[#8B7A5A] transition-colors whitespace-nowrap"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Complaints shortcut */}
        <button
          onClick={() => navigate('/supervisor/issues')}
          className="w-full mb-5 flex items-center justify-between gap-3 bg-white border border-[#D0CFCA] rounded-[12px] px-5 py-4 hover:border-[#B8A77A] hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FDECEA] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#BA1A1A" strokeWidth="2" strokeLinejoin="round" />
                <path d="M12 9v4M12 17h.01" stroke="#BA1A1A" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19]">Client Complaints</p>
              <p className="font-['Lato',sans-serif] text-[12px] text-[#737874]">Acknowledge, respond, and resolve</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Feed */}
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
            <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">All caught up</p>
            <p className="font-['Lato',sans-serif] text-sm text-[#737874]">No notifications yet. Client alerts will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifs.map((n) => <NotifCard key={n.id} notif={n} onRead={markRead} />)}
          </div>
        )}
      </div>
    </div>
  )
}
