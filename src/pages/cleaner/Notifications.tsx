import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { gsap, useGSAP } from '../../lib/gsap'
import { BottomNav } from '../../components/BottomNav'
import { DesktopSidebar } from '../../components/DesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { DETAIL_MAP } from '../../lib/mockNotifications'
import { NotifDetailContent } from './NotificationDetail'
import type { Language } from '../../lib/i18n'

// ─── Types & mock data ────────────────────────────────────────────────────────

type NotifVariant = 'unread' | 'read' | 'urgent'

interface MockNotif {
  id: string
  variant: NotifVariant
  avatarType: 'initials' | 'building' | 'alert'
  initials: string
  senderName: string
  time: Record<Language, string>
  preview: Record<Language, string>
}

const MOCK_NOTIFS: MockNotif[] = [
  {
    id: 'n1', variant: 'unread', avatarType: 'initials', initials: 'SJ', senderName: 'Sarah Jenkins',
    time: { en: '10m ago', es: 'hace 10 min', pt: 'há 10 min' },
    preview: {
      en: 'Great job on the 4th-floor lobby yesterday. Just a reminder to restock the cleaning cart before your next shift.',
      es: 'Excelente trabajo en el vestíbulo del 4.º piso ayer. Recuerda reponer el carrito de limpieza antes de tu próximo turno.',
      pt: 'Ótimo trabalho no lobby do 4.º andar ontem. Lembre-se de reabastecer o carrinho de limpeza antes do próximo turno.',
    },
  },
  {
    id: 'n2', variant: 'read', avatarType: 'building', initials: 'BM', senderName: 'Building Manager',
    time: { en: '2h ago', es: 'hace 2 h', pt: 'há 2 h' },
    preview: {
      en: 'Weekly maintenance schedule for the East Wing has been updated. Please review the new checklist in your dashboard.',
      es: 'El horario de mantenimiento semanal para el Ala Este ha sido actualizado. Por favor revise la nueva lista en su panel.',
      pt: 'O cronograma de manutenção semanal para a Ala Leste foi atualizado. Por favor revise a nova lista no seu painel.',
    },
  },
  {
    id: 'n3', variant: 'read', avatarType: 'initials', initials: 'MT', senderName: 'Mark Thompson',
    time: { en: 'Yesterday', es: 'Ayer', pt: 'Ontem' },
    preview: {
      en: 'The delivery of the specialised stone polish has been delayed. Use the heritage wood wax on the library floor instead.',
      es: 'La entrega del lustrador de piedra especializado ha sido retrasada. Use la cera de madera heritage en el suelo de la biblioteca.',
      pt: 'A entrega do polidor de pedra especializado foi atrasada. Use a cera de madeira heritage no piso da biblioteca.',
    },
  },
  {
    id: 'n4', variant: 'urgent', avatarType: 'alert', initials: '!', senderName: 'System Alert',
    time: { en: 'Just now', es: 'Ahora mismo', pt: 'Agora mesmo' },
    preview: {
      en: 'Water leak reported in Utility Room 3B. Please proceed to the location immediately to assist with containment.',
      es: 'Fuga de agua en la Sala de Servicios 3B. Diríjase inmediatamente al lugar para ayudar con la contención.',
      pt: 'Vazamento de água na Sala de Utilidades 3B. Dirija-se imediatamente ao local para ajudar na contenção.',
    },
  },
]

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
      <span className="font-['Poppins',sans-serif] font-semibold text-sm text-white">{notif.initials}</span>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

const CARD_CLASS: Record<NotifVariant, string> = {
  unread: 'bg-[#F1DEAD] border border-[#D7C596]/60',
  read:   'bg-white border border-[#D0CFCA]',
  urgent: 'bg-white border-2 border-[#1A1C19]',
}

function NotifCard({ notif, onPress, selected = false }: { notif: MockNotif; onPress: () => void; selected?: boolean }) {
  const { language } = useApp()
  const t = useTranslation()

  return (
    <button
      onClick={onPress}
      className={[
        'notif-card w-full rounded-[12px] p-4 flex flex-col gap-2 text-left cursor-pointer transition-shadow',
        selected ? 'ring-2 ring-[#B8A77A] shadow-sm' : 'hover:shadow-sm',
        CARD_CLASS[notif.variant],
      ].join(' ')}
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
                {t('urgent')}
              </span>
            )}
            <span className="font-['Lato',sans-serif] text-[13px] text-[#8A8A8A]">{notif.time[language]}</span>
          </div>
        </div>
      </div>
      <p className="font-['Lato',sans-serif] text-sm text-[#434844] leading-[1.6] overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {notif.preview[language]}
      </p>
    </button>
  )
}

// ─── End-of-feed ─────────────────────────────────────────────────────────────

function EndOfFeed() {
  const t = useTranslation()
  return (
    <div className="flex flex-col items-center gap-2 py-10">
      <svg width="36" height="24" viewBox="0 0 36 24" fill="none" aria-hidden="true">
        <path d="M18 0 L19.4 5.6 L25 7 L19.4 8.4 L18 14 L16.6 8.4 L11 7 L16.6 5.6 Z" fill="#C3C8C2"/>
        <path d="M7 9 L7.7 11.3 L10 12 L7.7 12.7 L7 15 L6.3 12.7 L4 12 L6.3 11.3 Z" fill="#C3C8C2"/>
        <path d="M29 9 L29.7 11.3 L32 12 L29.7 12.7 L29 15 L28.3 12.7 L26 12 L28.3 11.3 Z" fill="#C3C8C2"/>
      </svg>
      <span className="font-['Lato',sans-serif] text-[11px] tracking-[2px] text-[#B8B8B3] uppercase">
        {t('end_of_updates')}
      </span>
    </div>
  )
}

// ─── Desktop 2-pane layout ────────────────────────────────────────────────────

function DesktopNotifications() {
  const t = useTranslation()
  const { language } = useApp()
  const [selectedId, setSelectedId] = useState<string>('n1')
  const selectedDetail = DETAIL_MAP[selectedId]
  const listRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.dnotif-heading', { opacity: 0, y: 16, duration: 0.4 })
      .from('.notif-card', { opacity: 0, y: 16, duration: 0.4, stagger: 0.07 }, '-=0.2')
  }, { scope: listRef })

  return (
    <div className="relative h-screen overflow-hidden bg-[#F4F4EE]">
      <DesktopSidebar active="notifications" />

      {/* Left pane: list — fixed so it never shifts when switching messages */}
      <div ref={listRef} className="fixed left-60 top-0 h-screen w-[360px] border-r border-[#D5D5CF] flex flex-col z-20">
        <div className="sticky top-0 z-10 bg-[#F4F4EE] px-5 pt-7 pb-4 border-b border-[#E3E3DD]">
          <h1 className="dnotif-heading font-['Poppins',sans-serif] font-bold text-[28px] text-[#1A1C19] tracking-[-0.4px]">
            {t('notifications_title')}
          </h1>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">
            {t('notifications_subtitle')}
          </p>
        </div>
        <div className="overflow-y-auto flex-1 flex flex-col">
          <div className="flex flex-col gap-2 p-4">
            {MOCK_NOTIFS.map((n) => (
              <NotifCard
                key={n.id}
                notif={n}
                onPress={() => setSelectedId(n.id)}
                selected={selectedId === n.id}
              />
            ))}
          </div>
          <EndOfFeed />
        </div>
      </div>

      {/* Right pane: detail — absolutely positioned in remaining space */}
      <div className="absolute left-[600px] top-0 right-0 bottom-0 overflow-y-auto bg-[#F4F4EE]">
        {selectedDetail ? (
          <div className="max-w-2xl">
            <div className="sticky top-0 z-10 bg-[#F4F4EE]/95 backdrop-blur-sm border-b border-[#E3E3DD] flex items-center justify-between px-6 h-14">
              <span className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">
                {selectedDetail.subject[language]}
              </span>
            </div>
            <NotifDetailContent key={selectedId} detail={selectedDetail} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full">
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
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.notif-heading',  { opacity: 0, y: 20, duration: 0.45 })
      .from('.notif-subtitle', { opacity: 0, y: 10, duration: 0.35 }, '-=0.2')
      .from('.notif-card', { opacity: 0, y: 20, duration: 0.4, stagger: 0.07 }, '-=0.15')
      .from('.notif-eof', { opacity: 0, duration: 0.4 }, '-=0.1')
  }, { scope: containerRef })

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
          {MOCK_NOTIFS.map((n) => (
            <NotifCard key={n.id} notif={n} onPress={() => navigate(`/cleaner/notifications/${n.id}`)} />
          ))}
        </div>
        <div className="notif-eof"><EndOfFeed /></div>
      </div>
      <BottomNav active="notifications" />
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/** Notification feed — messages and alerts from supervisors and building management. */
export function Notifications() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopNotifications /> : <MobileNotifications />
}
