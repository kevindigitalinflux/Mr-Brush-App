import { useNavigate } from 'react-router-dom'
import { BottomNav } from '../../components/BottomNav'

// ─── Types & mock data ────────────────────────────────────────────────────────

type NotifVariant = 'unread' | 'read' | 'urgent'

interface MockNotif {
  id: string
  variant: NotifVariant
  avatarType: 'initials' | 'building' | 'alert'
  initials: string
  senderName: string
  time: string
  preview: string
}

const MOCK_NOTIFS: MockNotif[] = [
  {
    id: 'n1', variant: 'unread', avatarType: 'initials', initials: 'SJ',
    senderName: 'Sarah Jenkins', time: '10m ago',
    preview: 'Great job on the 4th-floor lobby yesterday. Just a reminder to restock the cleaning cart before your next shift.',
  },
  {
    id: 'n2', variant: 'read', avatarType: 'building', initials: 'BM',
    senderName: 'Building Manager', time: '2h ago',
    preview: 'Weekly maintenance schedule for the East Wing has been updated. Please review the new checklist in your dashboard.',
  },
  {
    id: 'n3', variant: 'read', avatarType: 'initials', initials: 'MT',
    senderName: 'Mark Thompson', time: 'Yesterday',
    preview: 'The delivery of the specialised stone polish has been delayed. Use the heritage wood wax on the library floor instead.',
  },
  {
    id: 'n4', variant: 'urgent', avatarType: 'alert', initials: '!',
    senderName: 'System Alert', time: 'Just now',
    preview: 'Water leak reported in Utility Room 3B. Please proceed to the location immediately to assist with containment.',
  },
]

// ─── Avatar variants ──────────────────────────────────────────────────────────

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

function NotifAvatar({ notif }: { notif: MockNotif }) {
  if (notif.avatarType === 'building') {
    return (
      <div className="w-10 h-10 rounded-full bg-[#1A1C19] flex items-center justify-center flex-shrink-0">
        <BriefcaseSvg />
      </div>
    )
  }
  if (notif.avatarType === 'alert') {
    return (
      <div className="w-10 h-10 rounded-full bg-[#FDECEA] border border-[#F5C6C6] flex items-center justify-center flex-shrink-0">
        <AlertSvg />
      </div>
    )
  }
  const isUnread = notif.variant === 'unread'
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isUnread ? 'bg-[#B8A77A]' : 'bg-[#434B4D]'}`}>
      <span className="font-['Poppins',sans-serif] font-semibold text-sm text-white">
        {notif.initials}
      </span>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

const CARD_CLASS: Record<NotifVariant, string> = {
  unread:  'bg-[#F1DEAD] border border-[#D7C596]/60',
  read:    'bg-white border border-[#D0CFCA]',
  urgent:  'bg-white border-2 border-[#1A1C19]',
}

function NotifCard({ notif, onPress }: { notif: MockNotif; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className={`${CARD_CLASS[notif.variant]} w-full rounded-[12px] p-4 flex flex-col gap-2 text-left cursor-pointer hover:shadow-sm transition-shadow`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <NotifAvatar notif={notif} />
          {notif.variant === 'unread' && (
            <span className="absolute -top-0.5 -right-0.5 w-[10px] h-[10px] bg-[#BA1A1A] rounded-full border-2 border-[#F1DEAD]" />
          )}
        </div>
        <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
          <span className={`font-['Poppins',sans-serif] font-semibold text-[15px] truncate ${notif.variant === 'unread' ? 'text-[#6F613A]' : 'text-[#1A1C19]'}`}>
            {notif.senderName}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {notif.variant === 'urgent' && (
              <span className="bg-[#BA1A1A] text-white font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.7px] px-2 py-0.5 rounded-full">
                URGENT
              </span>
            )}
            <span className="font-['Lato',sans-serif] text-[13px] text-[#8A8A8A]">{notif.time}</span>
          </div>
        </div>
      </div>
      <p className="font-['Lato',sans-serif] text-sm text-[#434844] leading-[1.6] overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {notif.preview}
      </p>
    </button>
  )
}

// ─── End-of-feed indicator ────────────────────────────────────────────────────

function EndOfFeed() {
  return (
    <div className="flex flex-col items-center gap-2 py-10">
      <svg width="36" height="24" viewBox="0 0 36 24" fill="none" aria-hidden="true">
        <path d="M18 0 L19.4 5.6 L25 7 L19.4 8.4 L18 14 L16.6 8.4 L11 7 L16.6 5.6 Z" fill="#C3C8C2"/>
        <path d="M7 9 L7.7 11.3 L10 12 L7.7 12.7 L7 15 L6.3 12.7 L4 12 L6.3 11.3 Z" fill="#C3C8C2"/>
        <path d="M29 9 L29.7 11.3 L32 12 L29.7 12.7 L29 15 L28.3 12.7 L26 12 L28.3 11.3 Z" fill="#C3C8C2"/>
      </svg>
      <span className="font-['Lato',sans-serif] text-[11px] tracking-[2px] text-[#B8B8B3] uppercase">
        End of Updates
      </span>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

/** Notification feed — messages and alerts from supervisors and building management. */
export function Notifications() {
  const navigate = useNavigate()
  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="w-full max-w-[480px] mx-auto pb-[100px]">

        <div className="px-6 pt-10 pb-5">
          <h1 className="font-['Poppins',sans-serif] font-bold text-[42px] text-[#1A1C19] leading-[1.1] tracking-[-0.5px]">
            Notifications
          </h1>
          <p className="font-['Lato',sans-serif] text-[15px] text-[#434844] mt-2 leading-[1.65]">
            Stay updated with the latest instructions from your supervisors and building management.
          </p>
        </div>

        <div className="px-6 flex flex-col gap-3">
          {MOCK_NOTIFS.map((n) => (
            <NotifCard key={n.id} notif={n} onPress={() => navigate(`/cleaner/notifications/${n.id}`)} />
          ))}
        </div>

        <EndOfFeed />
      </div>

      <BottomNav active="notifications" />
    </div>
  )
}
