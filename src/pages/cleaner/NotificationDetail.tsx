import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { gsap, useGSAP } from '../../lib/gsap'
import { DesktopSidebar } from '../../components/DesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { DETAIL_MAP } from '../../lib/mockNotifications'
import type { NotifDetail } from '../../lib/mockNotifications'

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckCircleSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" stroke="#B8A77A" strokeWidth="1.5" />
      <path d="M8 12l3 3 5-6" stroke="#B8A77A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PdfIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="14" height="18" rx="2" stroke="#B8A77A" strokeWidth="1.5" />
      <path d="M7 7h6M7 11h4" stroke="#B8A77A" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 6l4 4" stroke="#B8A77A" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 6h4v4" stroke="#B8A77A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="#B8A77A" strokeWidth="1.5" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="#B8A77A" />
      <path d="M3 16l5-5 4 4 2-2 4 4" stroke="#B8A77A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v13M7 13l5 5 5-5" stroke="#434844" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 20h18" stroke="#434844" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#434844" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="#434844" strokeWidth="2" />
    </svg>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

export function SenderAvatar({ detail, size = 'sm' }: { detail: NotifDetail; size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm'
  return (
    <div className={`${dim} rounded-full flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: detail.avatarBg }}>
      <span className="font-['Poppins',sans-serif] font-semibold text-white">{detail.initials}</span>
    </div>
  )
}

function InstructionBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border border-[#D0CFCA] rounded-[8px] p-4 bg-[#FAFAF6]">
      <p className="font-['Lato',sans-serif] font-bold text-[11px] tracking-[1.2px] text-[#6B5D36] uppercase mb-3">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircleSmall />
            <span className="font-['Lato',sans-serif] text-sm text-[#434844] leading-[1.6]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AttachmentCard({ file }: { file: NonNullable<NotifDetail['attachments']>[number] }) {
  const t = useTranslation()
  return (
    <div className="bg-white border border-[#D0CFCA] rounded-[10px] px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-[8px] bg-[#F5F0E3] border border-[#D7C596]/40 flex items-center justify-center flex-shrink-0">
        {file.type === 'pdf' ? <PdfIcon /> : <ImageIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-['Poppins',sans-serif] font-semibold text-sm text-[#1A1C19] truncate">{file.name}</p>
        <p className="font-['Lato',sans-serif] text-xs text-[#6B5D36] mt-0.5">{file.meta}</p>
      </div>
      <button aria-label={file.type === 'pdf' ? t('download') : t('view')}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0EFE8] transition-colors">
        {file.type === 'pdf' ? <DownloadIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}

// ─── Shared detail content (used by both mobile full-page and desktop 2-pane) ─

export function NotifDetailContent({ detail }: { detail: NotifDetail }) {
  const { language } = useApp()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.nd-sender',  { opacity: 0, y: 14, duration: 0.4 })
      .from('.nd-subject', { opacity: 0, y: 10, duration: 0.35 }, '-=0.2')
      .from('.nd-body',    { opacity: 0, y: 12, duration: 0.4  }, '-=0.2')
      .from('.nd-attach',  { opacity: 0, y: 10, duration: 0.35 }, '-=0.15')
  }, { scope: containerRef })

  const subject = detail.subject[language]
  const body = detail.body[language]
  const senderRole = detail.senderRole[language]

  return (
    <div ref={containerRef}>
      {/* Sender info */}
      <div className="nd-sender px-6 pt-5 pb-4 flex items-center gap-3">
        <SenderAvatar detail={detail} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{detail.senderName}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.8px] uppercase text-[#6B5D36]">{senderRole}</span>
            <span className="text-[#C3C8C2]">·</span>
            <span className="font-['Lato',sans-serif] text-[13px] text-[#8A8A8A]">{detail.date}</span>
          </div>
        </div>
      </div>

      <div className="mx-6 h-px bg-[#E3E3DD]" />

      {/* Subject */}
      <div className="nd-subject px-6 pt-5 pb-4">
        <h1 className="font-['Poppins',sans-serif] font-bold text-[26px] text-[#1A1C19] leading-[1.25] tracking-[-0.3px]">
          {subject}
        </h1>
      </div>

      {/* Body */}
      <div className="nd-body px-6">
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-5 flex flex-col gap-4">
          {body.map((para, i) => (
            <p key={i} className="font-['Lato',sans-serif] text-[15px] text-[#1A1C19] leading-[1.7]">{para}</p>
          ))}
          {detail.instructions && (
            <InstructionBlock
              title={detail.instructions.title[language]}
              items={detail.instructions.items[language]}
            />
          )}
          <div className="pt-1 border-t border-[#F0EFE8]">
            {detail.signature.split('\n').map((line, i) => (
              <p key={i} className={`font-['Lato',sans-serif] text-[14px] text-[#434844] leading-[1.6] ${i === 0 ? 'font-bold' : ''}`}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Attachments */}
      {detail.attachments && detail.attachments.length > 0 && (
        <div className="nd-attach px-6 pt-6 pb-8">
          <p className="font-['Lato',sans-serif] font-bold text-[11px] tracking-[1.5px] uppercase text-[#6B5D36] mb-3">
            {t('attached_docs')}
          </p>
          <div className="flex flex-col gap-2">
            {detail.attachments.map((file) => (
              <AttachmentCard key={file.name} file={file} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Desktop layout ───────────────────────────────────────────────────────────

function DesktopNotificationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const t = useTranslation()
  const detail = id ? DETAIL_MAP[id] : undefined

  if (!detail) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
        <DesktopSidebar active="notifications" />
        <main className="flex-1 flex items-center justify-center">
          <p className="font-['Lato',sans-serif] text-[#434844]">Notification not found.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
      <DesktopSidebar active="notifications" />
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#F4F4EE]/95 backdrop-blur-sm border-b border-[#E3E3DD] flex items-center justify-between px-8 h-16">
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
          <SenderAvatar detail={detail} size="sm" />
        </div>
        <div className="max-w-2xl mx-auto pb-12">
          <NotifDetailContent key={id} detail={detail} />
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
  const detail = id ? DETAIL_MAP[id] : undefined

  if (!detail) {
    return (
      <div className="fixed inset-0 bg-[#F4F4EE] flex items-center justify-center">
        <p className="font-['Lato',sans-serif] text-[#434844]">Notification not found.</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="w-full max-w-[480px] mx-auto pb-12">
        <div className="sticky top-0 z-10 bg-[#F4F4EE]/95 backdrop-blur-sm border-b border-[#E3E3DD] flex items-center justify-between px-6 h-16">
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
          <SenderAvatar detail={detail} size="sm" />
        </div>
        <NotifDetailContent key={id} detail={detail} />
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
