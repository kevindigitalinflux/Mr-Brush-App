import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { gsap, useGSAP } from '../../lib/gsap'
import { BottomNav } from '../../components/BottomNav'
import { DesktopSidebar } from '../../components/DesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { supabase } from '../../lib/supabase'

interface Notif {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function BriefcaseSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" stroke="#F5F0E3" strokeWidth="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#F5F0E3" strokeWidth="2" />
    </svg>
  )
}

function AlertSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5Z"
        stroke="#BA1A1A" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function NotifAvatar({ title, isUnread }: { title: string; isUnread: boolean }) {
  const isAlert = /flag|attention|urgent/i.test(title)
  if (isAlert) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#FDECEA] border border-[#F5C6C6] flex items-center justify-center flex-shrink-0">
        <AlertSvg />
      </div>
    )
  }
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isUnread ? 'bg-[#1A1C19]' : 'bg-[#434B4D]'}`}>
      <BriefcaseSvg />
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function NotifCard({ notif, onPress, selected = false }: { notif: Notif; onPress: () => void; selected?: boolean }) {
  const cardClass = notif.is_read
    ? 'bg-white border border-[#D0CFCA]'
    : 'bg-[#F1DEAD] border border-[#D7C596]/60'

  return (
    <button
      onClick={onPress}
      className={[
        'notif-card w-full rounded-[12px] p-4 flex flex-col gap-2 text-left cursor-pointer transition-shadow',
        selected ? 'shadow-[0_0_0_2px_#B8A77A]' : 'hover:shadow-sm',
        cardClass,
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <NotifAvatar title={notif.title} isUnread={!notif.is_read} />
          {!notif.is_read && (
            <span className="absolute -top-0.5 -right-0.5 w-[10px] h-[10px] bg-[#BA1A1A] rounded-full border-2 border-[#F1DEAD]" />
          )}
        </div>
        <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
          <span className={`font-['Poppins',sans-serif] font-semibold text-[15px] truncate ${!notif.is_read ? 'text-[#6F613A]' : 'text-[#1A1C19]'}`}>
            {notif.title}
          </span>
          <span className="font-['Lato',sans-serif] text-[13px] text-[#8A8A8A] flex-shrink-0">{timeAgo(notif.created_at)}</span>
        </div>
      </div>
      <p className="font-['Lato',sans-serif] text-sm text-[#434844] leading-[1.6] overflow-hidden"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {notif.message}
      </p>
    </button>
  )
}

function EmptyState() {
  return (
    <div className="notif-card bg-white border border-[#C3C8C2] rounded-[12px] p-8 flex flex-col items-center gap-2">
      <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">No notifications yet</p>
      <p className="font-['Lato',sans-serif] text-sm text-[#737874] text-center">Messages from your supervisor will appear here.</p>
    </div>
  )
}

// ─── Desktop 2-pane layout ────────────────────────────────────────────────────

function DesktopNotifications() {
  const t = useTranslation()
  const { user } = useApp()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const selected = notifs.find(n => n.id === selectedId) ?? null

  useEffect(() => {
    if (!user) return
    void supabase
      .from('notifications')
      .select('id, title, message, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setNotifs((data ?? []) as Notif[]); setLoading(false) })
  }, [user])

  useGSAP(() => {
    if (loading) return
    gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'all' } })
      .from('.dnotif-heading', { opacity: 0, y: 16, duration: 0.4 })
      .from('.notif-card', { opacity: 0, y: 16, duration: 0.4, stagger: 0.07 }, '-=0.2')
  }, { scope: listRef, dependencies: [loading] })

  function handleSelect(notif: Notif) {
    setSelectedId(notif.id)
    if (!notif.is_read) {
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
      void supabase.from('notifications').update({ is_read: true }).eq('id', notif.id)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
      <DesktopSidebar active="notifications" />
      <div ref={listRef} className="fixed left-60 top-0 h-screen w-[360px] border-r border-[#D5D5CF] flex flex-col z-20">
        <div className="sticky top-0 z-10 bg-[#F4F4EE] px-5 pt-7 pb-4 border-b border-[#E3E3DD]">
          <h1 className="dnotif-heading font-['Poppins',sans-serif] font-bold text-[28px] text-[#1A1C19] tracking-[-0.4px]">
            {t('notifications_title')}
          </h1>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <p className="p-5 font-['Lato',sans-serif] text-sm text-[#737874]">Loading…</p>
          ) : notifs.length === 0 ? (
            <div className="p-4"><EmptyState /></div>
          ) : (
            <div className="flex flex-col gap-2 p-4">
              {notifs.map(n => <NotifCard key={n.id} notif={n} onPress={() => handleSelect(n)} selected={selectedId === n.id} />)}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 ml-[600px] overflow-y-auto bg-[#F4F4EE]">
        {selected ? (
          <div className="max-w-2xl">
            <div className="sticky top-0 z-10 bg-[#F4F4EE]/95 backdrop-blur-sm border-b border-[#E3E3DD] px-6 h-14 flex items-center">
              <span className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{selected.title}</span>
            </div>
            <div className="p-6">
              <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mb-4">{timeAgo(selected.created_at)}</p>
              <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-5">
                <p className="font-['Lato',sans-serif] text-[15px] text-[#1A1C19] leading-[1.7]">{selected.message}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="font-['Lato',sans-serif] text-[#737874]">Select a notification to read</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Mobile layout ────────────────────────────────────────────────────────────

function MobileNotifications() {
  const navigate = useNavigate()
  const t = useTranslation()
  const { user } = useApp()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    void supabase
      .from('notifications')
      .select('id, title, message, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setNotifs((data ?? []) as Notif[]); setLoading(false) })
  }, [user])

  useGSAP(() => {
    if (loading) return
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.notif-heading',  { opacity: 0, y: 20, duration: 0.45 })
      .from('.notif-subtitle', { opacity: 0, y: 10, duration: 0.35 }, '-=0.2')
      .from('.notif-card', { opacity: 0, y: 20, duration: 0.4, stagger: 0.07 }, '-=0.15')
  }, { scope: containerRef, dependencies: [loading] })

  function handlePress(notif: Notif) {
    if (!notif.is_read) {
      void supabase.from('notifications').update({ is_read: true }).eq('id', notif.id)
    }
    navigate(`/cleaner/notifications/${notif.id}`)
  }

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto pb-[100px]">
        <div className="px-6 pt-10 pb-5">
          <h1 className="notif-heading font-['Poppins',sans-serif] font-bold text-[42px] text-[#1A1C19] leading-[1.1] tracking-[-0.5px]">
            {t('notifications_title')}
          </h1>
          <p className="notif-subtitle font-['Lato',sans-serif] text-[15px] text-[#434844] mt-2 leading-[1.65]">
            {t('notifications_subtitle')}
          </p>
        </div>
        <div className="px-6 flex flex-col gap-3">
          {loading ? (
            <div className="notif-card bg-white border border-[#C3C8C2] rounded-[12px] p-8 flex justify-center">
              <p className="font-['Lato',sans-serif] text-sm text-[#737874]">Loading…</p>
            </div>
          ) : notifs.length === 0 ? (
            <EmptyState />
          ) : (
            notifs.map(n => <NotifCard key={n.id} notif={n} onPress={() => handlePress(n)} />)
          )}
        </div>
      </div>
      <BottomNav active="notifications" />
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/** Notification feed — messages and alerts from supervisors. */
export function Notifications() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopNotifications /> : <MobileNotifications />
}
