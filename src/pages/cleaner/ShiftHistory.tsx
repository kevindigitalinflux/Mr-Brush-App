import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { BottomNav } from '../../components/BottomNav'
import { DesktopSidebar } from '../../components/DesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { useTranslation } from '../../lib/useTranslation'
import { gsap, useGSAP } from '../../lib/gsap'
import type { Language } from '../../lib/i18n'

const DATE_LOCALE: Record<Language, string> = { en: 'en-GB', es: 'es-ES', pt: 'pt-BR' }

// ─── Types ────────────────────────────────────────────────────────────────────

type ShiftStatus = 'completed' | 'in_progress' | 'not_started'

interface Shift {
  id: string
  scheduledDate: string
  siteName: string
  status: ShiftStatus
  zonesTotal: number
  zonesDone: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthStartOf(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1) }
function monthEndOf(d: Date): Date   { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }
function toIso(d: Date): string      { return d.toISOString().slice(0, 10) }

function formatShiftDate(iso: string, locale: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' })
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useShiftHistoryData(month: Date) {
  const { user, language } = useApp()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  const monthLabel = month.toLocaleDateString(DATE_LOCALE[language], { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const from = toIso(monthStartOf(month))
      const to   = toIso(monthEndOf(month))

      // Step 1 — all zones assigned to this cleaner (any time)
      const { data: zoneRows } = await supabase
        .from('job_zones')
        .select('job_id, status')
        .eq('cleaner_id', user!.id)
        .neq('status', 'deleted')

      if (!zoneRows?.length) {
        if (!cancelled) { setShifts([]); setLoading(false) }
        return
      }

      const allJobIds = [...new Set(zoneRows.map((z) => (z as { job_id: string }).job_id))]

      // Step 2 — jobs in the selected month
      const { data: jobRows } = await supabase
        .from('jobs')
        .select('id, facility_id, scheduled_date, status')
        .in('id', allJobIds)
        .gte('scheduled_date', from)
        .lte('scheduled_date', to)
        .order('scheduled_date', { ascending: false })

      if (!jobRows?.length) {
        if (!cancelled) { setShifts([]); setLoading(false) }
        return
      }

      const monthJobIds = new Set(jobRows.map((j) => j.id as string))

      // Step 3 — facility names
      const facilityIds = [...new Set(jobRows.map((j) => j.facility_id as string))]
      const { data: facilityRows } = await supabase
        .from('facilities')
        .select('id, name')
        .in('id', facilityIds)

      type FacRow = { id: string; name: string }
      const facilityMap: Record<string, string> = Object.fromEntries(
        ((facilityRows ?? []) as unknown as FacRow[]).map((f) => [f.id, f.name])
      )

      // Step 4 — zone counts per job for this cleaner
      const zoneCounts: Record<string, { total: number; done: number }> = {}
      for (const z of zoneRows) {
        const zr = z as { job_id: string; status: string }
        if (!monthJobIds.has(zr.job_id)) continue
        if (!zoneCounts[zr.job_id]) zoneCounts[zr.job_id] = { total: 0, done: 0 }
        zoneCounts[zr.job_id].total++
        if (zr.status === 'completed') zoneCounts[zr.job_id].done++
      }

      type JobRow = { id: string; facility_id: string; scheduled_date: string; status: string }
      const result: Shift[] = ((jobRows ?? []) as unknown as JobRow[]).map((j) => {
        const counts = zoneCounts[j.id] ?? { total: 0, done: 0 }
        return {
          id: j.id,
          scheduledDate: j.scheduled_date,
          siteName: facilityMap[j.facility_id] ?? 'Site',
          status: j.status === 'completed' ? 'completed' : j.status === 'in_progress' ? 'in_progress' : 'not_started',
          zonesTotal: counts.total,
          zonesDone: counts.done,
        }
      })

      if (!cancelled) { setShifts(result); setLoading(false) }
    }

    void load()
    return () => { cancelled = true }
  }, [user, month])

  return { shifts, loading, monthLabel }
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {dir === 'left'
        ? <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

// ─── Month picker ─────────────────────────────────────────────────────────────

function MonthPicker({ month, onChange }: { month: Date; onChange: (d: Date) => void }) {
  const now = new Date()
  const isCurrent = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth()
  const label = month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="flex items-center gap-2 bg-white border border-[#D0CFCA] rounded-[10px] px-3 py-2 self-start">
      <button
        onClick={() => onChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F4F4EE] text-[#434844]"
      >
        <ChevronIcon dir="left" />
      </button>
      <span className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#1A1C19] min-w-[128px] text-center">
        {label}
      </span>
      <button
        onClick={() => { if (!isCurrent) onChange(new Date(month.getFullYear(), month.getMonth() + 1, 1)) }}
        disabled={isCurrent}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F4F4EE] text-[#434844] disabled:opacity-30"
      >
        <ChevronIcon dir="right" />
      </button>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[84px] bg-white border border-[#C3C8C2] rounded-[12px] animate-pulse" />
      ))}
    </div>
  )
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function ShiftCard({ shift, locale, onPress }: { shift: Shift; locale: string; onPress: () => void }) {
  const t = useTranslation()
  const isComplete = shift.status === 'completed'
  const badgeStyle = isComplete
    ? 'bg-[#D7E6DB] text-[#2F4A3D]'
    : shift.status === 'in_progress'
      ? 'bg-[#F1DEAD] text-[#6B5D36]'
      : 'bg-[#E3E3DD] text-[#737874]'
  const badgeLabel = isComplete ? t('completed') : shift.status === 'in_progress' ? t('in_progress') : t('not_started')

  return (
    <button
      onClick={onPress}
      className="shift-card w-full bg-white rounded-[12px] p-5 flex items-center gap-4 text-left border border-[#C3C8C2] hover:shadow-md transition-shadow"
    >
      {/* Date block */}
      <div className="w-12 shrink-0 text-center">
        <p className="font-['Poppins',sans-serif] font-bold text-[22px] text-[#1A1C19] leading-none">
          {new Date(shift.scheduledDate + 'T00:00:00').getDate()}
        </p>
        <p className="font-['Lato',sans-serif] text-[11px] text-[#737874] uppercase tracking-[0.5px] mt-0.5">
          {new Date(shift.scheduledDate + 'T00:00:00').toLocaleDateString(locale, { month: 'short' })}
        </p>
      </div>

      <div className="w-px h-10 bg-[#E3E3DD] shrink-0" />

      <div className="flex-1 min-w-0">
        <h4 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1A1C19] leading-tight truncate">
          {shift.siteName}
        </h4>
        <p className="font-['Lato',sans-serif] text-[12px] text-[#737874] mt-0.5">
          {new Date(shift.scheduledDate + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long' })} · {shift.zonesDone}/{shift.zonesTotal} {t('zones')}
        </p>
      </div>

      <span className={`shrink-0 font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.6px] px-2.5 py-1 rounded-full ${badgeStyle}`}>
        {badgeLabel}
      </span>
    </button>
  )
}

// ─── Desktop row ──────────────────────────────────────────────────────────────

function ShiftRow({ shift, locale, onPress }: { shift: Shift; locale: string; onPress: () => void }) {
  const t = useTranslation()
  const isComplete = shift.status === 'completed'
  const badgeStyle = isComplete
    ? 'bg-[#D7E6DB] text-[#2F4A3D]'
    : shift.status === 'in_progress'
      ? 'bg-[#F1DEAD] text-[#6B5D36]'
      : 'bg-[#E3E3DD] text-[#737874]'
  const badgeLabel = isComplete ? t('completed') : shift.status === 'in_progress' ? t('in_progress') : t('not_started')
  const d = new Date(shift.scheduledDate + 'T00:00:00')

  return (
    <button
      onClick={onPress}
      className="desk-shift-row w-full bg-white border border-[#D0CFCA] rounded-[12px] flex items-stretch overflow-hidden text-left hover:shadow-sm transition-shadow"
    >
      <div className="w-20 flex flex-col items-center justify-center border-r border-[#E3E3DD] py-4 px-3 shrink-0">
        <span className="font-['Poppins',sans-serif] font-bold text-[36px] text-[#1A1C19] leading-none">{d.getDate()}</span>
        <span className="font-['Lato',sans-serif] text-[11px] tracking-[1.2px] text-[#737874] uppercase mt-1">
          {d.toLocaleDateString(locale, { weekday: 'short' })}
        </span>
      </div>
      <div className="flex-1 px-5 py-4 flex flex-col justify-center gap-0.5">
        <h4 className="font-['Poppins',sans-serif] font-semibold text-lg text-[#1A1C19] leading-tight">{shift.siteName}</h4>
        <p className="font-['Lato',sans-serif] text-sm text-[#737874]">
          {shift.zonesDone} {t('of_count')} {shift.zonesTotal} {t('zones').toLowerCase()}
        </p>
      </div>
      <div className="flex items-center gap-3 pr-5">
        <span className={`font-['Lato',sans-serif] font-bold text-[13px] tracking-[0.65px] px-3 h-7 flex items-center rounded-full ${badgeStyle}`}>
          {badgeLabel}
        </span>
        <ChevronIcon dir="right" />
      </div>
    </button>
  )
}

// ─── Desktop layout ───────────────────────────────────────────────────────────

function DesktopShiftHistory() {
  const { language } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const [month, setMonth] = useState(() => new Date())
  const { shifts, loading, monthLabel } = useShiftHistoryData(month)
  const containerRef = useRef<HTMLDivElement>(null)
  const locale = DATE_LOCALE[language]

  useGSAP(() => {
    if (loading) return
    gsap.set(['.dsh-heading', '.dsh-month', '.desk-shift-row'], { clearProps: 'all' })
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.dsh-heading',   { opacity: 0, y: 20, duration: 0.45 })
      .from('.dsh-month',     { opacity: 0, y: 10, duration: 0.35 }, '-=0.2')
      .from('.desk-shift-row', { opacity: 0, y: 16, duration: 0.4, stagger: 0.07 }, '-=0.15')
  }, { scope: containerRef, dependencies: [loading] })

  return (
    <div className="min-h-screen bg-[#F4F4EE]">
      <DesktopSidebar active="history" />
      <main className="pl-60">
        <div ref={containerRef} className="max-w-4xl mx-auto px-8 py-8 flex flex-col gap-8 pb-12">

          <div>
            <h1 className="dsh-heading font-['Poppins',sans-serif] font-bold text-[48px] text-[#1A1C19] leading-[1.1] tracking-[-0.8px]">
              {t('shift_history')}
            </h1>
            <p className="font-['Lato',sans-serif] text-[15px] text-[#434844] mt-1 leading-[1.65]">
              {t('shift_history_subtitle')}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="dsh-month flex items-center gap-4 border-b border-[#E3E3DD] pb-4">
              <MonthPicker month={month} onChange={setMonth} />
              {!loading && (
                <span className="ml-auto font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#B8A77A]">
                  {shifts.filter((s) => s.status === 'completed').length} {t('completed').toLowerCase()}
                </span>
              )}
            </div>

            {loading ? <Skeleton /> : shifts.length === 0 ? (
              <div className="bg-white border border-[#C3C8C2] rounded-[12px] p-12 flex flex-col items-center gap-2">
                <p className="font-['Poppins',sans-serif] font-semibold text-xl text-[#1A1C19]">{t('no_shifts_yet')}</p>
                <p className="font-['Lato',sans-serif] text-base text-[#737874]">
                  {t('no_shifts_body')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {shifts.map((shift) => (
                  <ShiftRow key={shift.id} shift={shift} locale={locale} onPress={() => navigate(`/cleaner/history/${shift.id}`)} />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

// ─── Mobile layout ────────────────────────────────────────────────────────────

function MobileShiftHistory() {
  const { language } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const [month, setMonth] = useState(() => new Date())
  const { shifts, loading, monthLabel } = useShiftHistoryData(month)
  const containerRef = useRef<HTMLDivElement>(null)
  const locale = DATE_LOCALE[language]

  useGSAP(() => {
    if (loading) return
    gsap.set(['.history-heading', '.history-subtitle', '.history-picker', '.shift-card'], { clearProps: 'all' })
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.history-heading',  { opacity: 0, y: 20, duration: 0.45 })
      .from('.history-subtitle', { opacity: 0, y: 10, duration: 0.35 }, '-=0.2')
      .from('.history-picker',   { opacity: 0, y: 10, duration: 0.3 }, '-=0.15')
      .from('.shift-card',       { opacity: 0, y: 20, duration: 0.4, stagger: 0.07 }, '-=0.15')
  }, { scope: containerRef, dependencies: [loading, month] })

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto px-6 pt-10 pb-[100px]">

        <div className="mb-6">
          <h1 className="history-heading font-['Poppins',sans-serif] font-bold text-[36px] text-[#1A1C19] leading-[1.1] tracking-[-0.5px]">
            {t('shift_history')}
          </h1>
          <p className="history-subtitle font-['Lato',sans-serif] text-[14px] text-[#434844] mt-1 leading-[1.65]">
            {t('shift_history_subtitle')}
          </p>
        </div>

        <div className="history-picker mb-5">
          <MonthPicker month={month} onChange={setMonth} />
        </div>

        {loading ? <Skeleton /> : shifts.length === 0 ? (
          <div className="shift-card bg-white border border-[#C3C8C2] rounded-[12px] p-8 flex flex-col items-center gap-2 text-center">
            <p className="font-['Poppins',sans-serif] font-semibold text-xl text-[#1A1C19]">{t('no_shifts_yet')}</p>
            <p className="font-['Lato',sans-serif] text-base text-[#737874]">{t('no_shifts_body')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {shifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} locale={locale} onPress={() => navigate(`/cleaner/history/${shift.id}`)} />
            ))}
          </div>
        )}

      </div>

      <BottomNav active="history" />
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/** Displays the cleaner's past shift history, loaded from Supabase by month. */
export function ShiftHistory() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopShiftHistory /> : <MobileShiftHistory />
}
