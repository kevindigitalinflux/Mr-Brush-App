import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { gsap, useGSAP } from '../../lib/gsap'
import { supabase } from '../../lib/supabase'
import { useApp } from '../../context/AppContext'
import { DesktopSidebar } from '../../components/DesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { useTranslation } from '../../lib/useTranslation'

// ─── Types ────────────────────────────────────────────────────────────────────

type ZoneStatus = 'not_started' | 'in_progress' | 'completed' | 'flagged_no_photo'

interface ZoneData {
  id: string
  zone_name: string
  status: ZoneStatus
  note: string | null
  cleanedAt: string | null
}

interface ShiftData {
  siteName: string
  scheduledDate: string
  jobStatus: string
  zones: ZoneData[]
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useShiftDetailData(shiftId: string | undefined) {
  const { user } = useApp()
  const [data, setData] = useState<ShiftData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!shiftId || !user) return
    let cancelled = false

    async function load() {
      setLoading(true)

      const { data: job } = await supabase
        .from('jobs')
        .select('facility_id, scheduled_date, status')
        .eq('id', shiftId)
        .single()

      if (!job) {
        if (!cancelled) { setNotFound(true); setLoading(false) }
        return
      }

      const jr = job as { facility_id: string; scheduled_date: string; status: string }

      const [facilityRes, zonesRes, logsRes] = await Promise.all([
        supabase.from('facilities').select('name').eq('id', jr.facility_id).single(),
        supabase.from('job_zones').select('id, zone_name, status').eq('job_id', shiftId).eq('cleaner_id', user!.id).neq('status', 'deleted').order('created_at'),
        supabase.from('cleaning_logs').select('job_zone_id, note, created_at').eq('job_id', shiftId).eq('cleaner_id', user!.id),
      ])

      type LogRow = { job_zone_id: string; note: string | null; created_at: string }
      const logMap: Record<string, { note: string | null; at: string }> = {}
      for (const l of ((logsRes.data ?? []) as unknown as LogRow[])) {
        logMap[l.job_zone_id] = { note: l.note, at: l.created_at }
      }

      type ZoneRow = { id: string; zone_name: string; status: string }
      const zones: ZoneData[] = ((zonesRes.data ?? []) as unknown as ZoneRow[]).map((z) => ({
        id: z.id,
        zone_name: z.zone_name,
        status: z.status as ZoneStatus,
        note: logMap[z.id]?.note ?? null,
        cleanedAt: logMap[z.id]?.at ?? null,
      }))

      if (!cancelled) {
        setData({
          siteName: ((facilityRes.data as { name: string } | null)?.name) ?? 'Site',
          scheduledDate: jr.scheduled_date,
          jobStatus: jr.status,
          zones,
        })
        setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [shiftId, user])

  return { data, loading, notFound }
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="#434844" strokeWidth="1.5" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="#434844" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ZoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="#434844" strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="#434844" strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="#434844" strokeWidth="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="#434844" strokeWidth="1.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#2F4A3D" />
      <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#B8521A" />
      <path d="M8 6h8l-2 4 2 4H8V6z" fill="white" />
      <path d="M8 18v-2" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ClockDotIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#B8A77A" />
      <path d="M12 7v5l3 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function DashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#D0CFCA" />
      <path d="M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CompletedBadgeIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#2F4A3D" />
      <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#BA1A1A" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IdentityCard({ data }: { data: ShiftData }) {
  const t = useTranslation()
  const isComplete = data.jobStatus === 'completed'
  const d = new Date(data.scheduledDate + 'T00:00:00')
  const dateLabel = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="sd-identity relative bg-white border border-[#E3E3DD] rounded-[12px] shadow-[0px_8px_30px_0px_rgba(17,30,23,0.04)] overflow-hidden p-[25px] flex flex-col gap-2">
      <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#D7C596] to-[#6B5D36] opacity-80" />
      <div className="flex items-center justify-between">
        <span className="font-['Lato',sans-serif] font-bold text-[13px] tracking-[1.4px] uppercase text-[#434844]">
          {t('commercial_cleaning')}
        </span>
        <div className={[
          'flex items-center gap-1.5 px-3 py-1 rounded-full border text-[13px] font-bold tracking-[0.7px]',
          isComplete
            ? "bg-[rgba(208,232,215,0.3)] border-[#B5CCBC] text-[#374B3F] font-['Lato',sans-serif]"
            : "bg-[#FFDAD6] border-[rgba(186,26,26,0.2)] text-[#93000A] font-['Lato',sans-serif]",
        ].join(' ')}>
          <CompletedBadgeIcon ok={isComplete} />
          {isComplete ? t('completed') : t('incomplete')}
        </div>
      </div>
      <h2 className="font-['Poppins',sans-serif] font-bold text-[40px] leading-[1.1] tracking-[-0.8px] text-[#1A1C19]">
        {data.siteName}
      </h2>
      <div className="flex items-center gap-2">
        <CalendarIcon />
        <span className="font-['Lato',sans-serif] text-[16px] text-[#434844]">{dateLabel}</span>
      </div>
    </div>
  )
}

function ZoneItem({ zone }: { zone: ZoneData }) {
  const t = useTranslation()
  const icon = zone.status === 'completed' ? <CheckIcon />
    : zone.status === 'flagged_no_photo' ? <FlagIcon />
    : zone.status === 'in_progress' ? <ClockDotIcon />
    : <DashIcon />

  const statusLabel = zone.status === 'completed' ? t('completed')
    : zone.status === 'flagged_no_photo' ? t('zone_flagged')
    : zone.status === 'in_progress' ? t('in_progress')
    : t('not_started')

  const timeLabel = zone.cleanedAt
    ? new Date(zone.cleanedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="sd-zone bg-white border border-[#E3E3DD] rounded-[12px] p-[17px] flex gap-4 items-start">
      <div className="w-11 h-11 rounded-[10px] bg-[#F4F4EE] border border-[#E3E3DD] flex items-center justify-center shrink-0 mt-0.5">
        <ZoneIcon />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-['Poppins',sans-serif] font-semibold text-xl text-[#1A1C19] leading-tight">{zone.zone_name}</h4>
          {timeLabel && (
            <span className="font-['Lato',sans-serif] font-bold text-[13px] text-[#737874] shrink-0 mt-0.5">{timeLabel}</span>
          )}
        </div>
        {zone.note && (
          <p className="font-['Lato',sans-serif] italic text-[13px] text-[#6B5D36] leading-[1.5]">
            &ldquo;{zone.note}&rdquo;
          </p>
        )}
        <div className="flex items-center gap-2 pt-1">
          {icon}
          <span className="font-['Lato',sans-serif] font-bold text-[13px] tracking-[0.6px] text-[#1A1C19]">{statusLabel}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[180px] bg-white border border-[#E3E3DD] rounded-[12px] animate-pulse" />
      <div className="h-[80px] bg-white border border-[#E3E3DD] rounded-[12px] animate-pulse" />
      <div className="h-[80px] bg-white border border-[#E3E3DD] rounded-[12px] animate-pulse" />
    </div>
  )
}

// ─── Not found state ──────────────────────────────────────────────────────────

function ShiftNotFound({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const t = useTranslation()
  return (
    <div className="min-h-screen w-full bg-[#F4F4EE] flex items-center justify-center p-8">
      <div className="bg-white border border-[#C3C8C2] rounded-[12px] p-8 text-center max-w-sm w-full">
        <p className="font-['Poppins',sans-serif] font-semibold text-xl text-[#1A1C19] mb-2">{t('shift_not_found')}</p>
        <button onClick={() => navigate('/cleaner/history')}
          className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#B8A77A] underline cursor-pointer">
          {t('back_to_history')}
        </button>
      </div>
    </div>
  )
}

// ─── Desktop layout ───────────────────────────────────────────────────────────

function DesktopShiftDetail() {
  const { shiftId } = useParams<{ shiftId: string }>()
  const navigate = useNavigate()
  const t = useTranslation()
  const { data, loading, notFound } = useShiftDetailData(shiftId)
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (loading || !data) return
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.sd-identity', { opacity: 0, y: 16, scale: 0.97, duration: 0.45 })
      .from('.sd-section',  { opacity: 0, y: 10, duration: 0.3 }, '-=0.15')
      .from('.sd-zone',     { opacity: 0, y: 14, duration: 0.35, stagger: 0.07 }, '-=0.1')
  }, { scope: containerRef, dependencies: [loading] })

  if (notFound) return <ShiftNotFound navigate={navigate} />

  const doneZones = data?.zones.filter((z) => z.status === 'completed').length ?? 0

  return (
    <div className="min-h-screen bg-[#F4F4EE]">
      <DesktopSidebar active="history" />
      <main className="pl-60">
        <div className="sticky top-0 z-10 bg-[rgba(244,244,238,0.95)] backdrop-blur-[6px] border-b border-[#E8E8E3] flex items-center h-16 px-8 gap-4">
          <button onClick={() => navigate('/cleaner/history')} aria-label="Go back"
            className="p-2 rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer shrink-0">
            <BackIcon />
          </button>
          <h1 className="font-['Poppins',sans-serif] font-semibold text-2xl tracking-[-0.6px] text-[#1A1C19]">{t('shift_details')}</h1>
        </div>

        <div ref={containerRef} className="max-w-5xl mx-auto px-8 py-8 pb-12">
          {loading ? <Skeleton /> : data && (
            <div className="flex flex-col gap-6">
              <IdentityCard data={data} />
              <div className="flex flex-col gap-5">
                <div className="sd-section flex items-center justify-between border-b border-[#E8E8E3] pb-3">
                  <h3 className="font-['Poppins',sans-serif] font-semibold text-[28px] tracking-[-0.3px] text-[#1A1C19]">
                    {t('cleaned_zones')}
                  </h3>
                  <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#D7C596]">
                    {doneZones} / {data.zones.length} {t('zones')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {data.zones.map((zone) => <ZoneItem key={zone.id} zone={zone} />)}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── Mobile layout ────────────────────────────────────────────────────────────

function MobileShiftDetail() {
  const { shiftId } = useParams<{ shiftId: string }>()
  const navigate = useNavigate()
  const t = useTranslation()
  const { data, loading, notFound } = useShiftDetailData(shiftId)
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (loading || !data) return
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.sd-identity', { opacity: 0, y: 16, scale: 0.97, duration: 0.45 })
      .from('.sd-section',  { opacity: 0, y: 10, duration: 0.3 }, '-=0.15')
      .from('.sd-zone',     { opacity: 0, y: 14, duration: 0.35, stagger: 0.07 }, '-=0.1')
  }, { scope: containerRef, dependencies: [loading] })

  if (notFound) return <ShiftNotFound navigate={navigate} />

  const doneZones = data?.zones.filter((z) => z.status === 'completed').length ?? 0

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="sticky top-0 z-10 bg-[rgba(250,250,244,0.9)] backdrop-blur-[6px] border-b border-[#E8E8E3] flex items-center h-16 px-6 gap-4">
        <button onClick={() => navigate('/cleaner/history')} aria-label="Go back"
          className="p-2 rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer shrink-0">
          <BackIcon />
        </button>
        <h1 className="font-['Poppins',sans-serif] font-semibold text-2xl tracking-[-0.6px] text-[#1A1C19]">{t('shift_details')}</h1>
      </div>

      <div ref={containerRef} className="w-full max-w-[480px] mx-auto pb-12">
        <div className="flex flex-col gap-6 p-6">
          {loading ? <Skeleton /> : data && (
            <>
              <IdentityCard data={data} />
              <div className="flex flex-col gap-5">
                <div className="sd-section flex items-center justify-between border-b border-[#E8E8E3] pb-3">
                  <h3 className="font-['Poppins',sans-serif] font-semibold text-[28px] tracking-[-0.32px] text-[#1A1C19]">{t('cleaned_zones')}</h3>
                  <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#D7C596]">{doneZones} / {data.zones.length} {t('zones')}</span>
                </div>
                <div className="flex flex-col gap-4">
                  {data.zones.map((zone) => <ZoneItem key={zone.id} zone={zone} />)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/** Detail view for a single past shift, loading real zone data from Supabase. */
export function ShiftDetail() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopShiftDetail /> : <MobileShiftDetail />
}
