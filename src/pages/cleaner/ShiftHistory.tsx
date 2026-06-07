import { useCallback, useEffect, useRef, useState } from 'react'
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

function currentMonthStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

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

// ─── Data hook ────────────────────────────────────────────────────────────────

function useShiftHistoryData(filterMonth: string) {
  const { user } = useApp()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user || !filterMonth) return
    setLoading(true)

    const [yr, mo] = filterMonth.split('-').map(Number)
    const from = `${yr}-${String(mo).padStart(2, '0')}-01`
    const to   = new Date(yr, mo, 0).toISOString().slice(0, 10)

    const { data: zoneRows } = await supabase
      .from('job_zones')
      .select('job_id, status')
      .eq('cleaner_id', user.id)
      .neq('status', 'deleted')

    if (!zoneRows?.length) { setShifts([]); setLoading(false); return }

    const allJobIds = [...new Set(zoneRows.map((z) => (z as { job_id: string }).job_id))]

    const { data: jobRows } = await supabase
      .from('jobs')
      .select('id, facility_id, scheduled_date, status')
      .in('id', allJobIds)
      .gte('scheduled_date', from)
      .lte('scheduled_date', to)
      .order('scheduled_date', { ascending: false })

    if (!jobRows?.length) { setShifts([]); setLoading(false); return }

    const monthJobIds = new Set(jobRows.map((j) => j.id as string))
    const facilityIds = [...new Set(jobRows.map((j) => j.facility_id as string))]
    const { data: facilityRows } = await supabase
      .from('facilities').select('id, name').in('id', facilityIds)

    type FacRow = { id: string; name: string }
    const facilityMap: Record<string, string> = Object.fromEntries(
      ((facilityRows ?? []) as unknown as FacRow[]).map((f) => [f.id, f.name])
    )

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

    setShifts(result)
    setLoading(false)
  }, [user, filterMonth])

  useEffect(() => { void load() }, [load])

  return { shifts, loading }
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
  const badgeLabel = isComplete ? t('completed')
    : shift.status === 'in_progress' ? t('in_progress')
    : t('not_started')
  const d = new Date(shift.scheduledDate + 'T00:00:00')

  return (
    <button
      onClick={onPress}
      className="sh-card w-full bg-white rounded-[12px] p-5 flex items-center gap-4 text-left border border-[#C3C8C2] hover:shadow-md transition-shadow"
    >
      <div className="w-12 shrink-0 text-center">
        <p className="font-['Poppins',sans-serif] font-bold text-[22px] text-[#1A1C19] leading-none">{d.getDate()}</p>
        <p className="font-['Lato',sans-serif] text-[11px] text-[#737874] uppercase tracking-[0.5px] mt-0.5">
          {d.toLocaleDateString(locale, { month: 'short' })}
        </p>
      </div>
      <div className="w-px h-10 bg-[#E3E3DD] shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1A1C19] leading-tight truncate">
          {shift.siteName}
        </h4>
        <p className="font-['Lato',sans-serif] text-[12px] text-[#737874] mt-0.5">
          {d.toLocaleDateString(locale, { weekday: 'long' })} · {shift.zonesDone}/{shift.zonesTotal} {t('zones')}
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
  const badgeLabel = isComplete ? t('completed')
    : shift.status === 'in_progress' ? t('in_progress')
    : t('not_started')
  const d = new Date(shift.scheduledDate + 'T00:00:00')

  return (
    <button
      onClick={onPress}
      className="sh-card w-full bg-white border border-[#D0CFCA] rounded-[12px] flex items-stretch overflow-hidden text-left hover:shadow-sm transition-shadow"
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
        <ChevronRightIcon />
      </div>
    </button>
  )
}

// ─── Shared content block ─────────────────────────────────────────────────────

interface ContentProps {
  filterMonth: string
  setFilterMonth: (v: string) => void
  shifts: Shift[]
  loading: boolean
  locale: string
  isDesktop: boolean
}

function HistoryContent({ filterMonth, setFilterMonth, shifts, loading, locale, isDesktop }: ContentProps) {
  const t = useTranslation()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef     = useRef(false)
  const isFirstRender  = useRef(true)
  const defaultMonth   = currentMonthStr()

  const monthLabel = filterMonth
    ? new Date(filterMonth + '-01T00:00:00').toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' })

  // One-time entrance — header + filter + initial cards fade in, no y movement
  useGSAP(() => {
    if (loading || mountedRef.current) return
    mountedRef.current = true
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.sh-header', { opacity: 0, duration: 0.4 })
      .from('.sh-filter', { opacity: 0, duration: 0.3 }, '<0.1')
      .from('.sh-card',   { opacity: 0, duration: 0.35, stagger: 0.07 }, '<0.1')
  }, { scope: containerRef, dependencies: [loading] })

  // Cards only on month change — fade in, no y, skip first render
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (loading || !containerRef.current) return
    gsap.from(containerRef.current.querySelectorAll('.sh-card'), {
      opacity: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out',
    })
  }, [filterMonth, loading])

  return (
    <div
      ref={containerRef}
      className={isDesktop ? 'max-w-4xl mx-auto px-8 py-8 pb-12' : 'w-full max-w-[480px] mx-auto px-6 pt-10 pb-[100px]'}
    >
      {/* Header — never re-animates */}
      <div className="sh-header mb-6">
        <h1 className={`font-['Poppins',sans-serif] font-bold text-[#1A1C19] leading-[1.1] tracking-[-0.5px] ${isDesktop ? 'text-[48px]' : 'text-[36px]'}`}>
          {t('shift_history')}
        </h1>
        <p className="font-['Lato',sans-serif] text-[14px] text-[#434844] mt-1">{monthLabel}</p>
      </div>

      {/* Month/year input — never re-animates */}
      <div className="sh-filter flex items-center gap-3 mb-6">
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="h-9 rounded-[8px] border border-[#D0CFCA] bg-white px-3 font-['Lato',sans-serif] text-[13px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
        />
        {filterMonth !== defaultMonth && (
          <button
            onClick={() => setFilterMonth(defaultMonth)}
            className="h-9 px-3 rounded-[8px] border border-[#D0CFCA] bg-white font-['Lato',sans-serif] text-[13px] text-[#737874] hover:text-[#1A1C19] transition-colors"
          >
            {t('pay_clear')}
          </button>
        )}
      </div>

      {/* Animated area */}
      {loading ? <Skeleton /> : shifts.length === 0 ? (
        <div className="sh-card bg-white border border-[#C3C8C2] rounded-[12px] p-8 flex flex-col items-center gap-2 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-xl text-[#1A1C19]">{t('no_shifts_yet')}</p>
          <p className="font-['Lato',sans-serif] text-base text-[#737874]">{t('no_shifts_body')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {isDesktop
            ? shifts.map((s) => <ShiftRow key={s.id} shift={s} locale={locale} onPress={() => navigate(`/cleaner/history/${s.id}`)} />)
            : shifts.map((s) => <ShiftCard key={s.id} shift={s} locale={locale} onPress={() => navigate(`/cleaner/history/${s.id}`)} />)
          }
        </div>
      )}
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/** Cleaner shift history — month/year input matches Pay screen; header stays static on navigation. */
export function ShiftHistory() {
  const { language } = useApp()
  const isDesktop = useIsDesktop()
  const [filterMonth, setFilterMonth] = useState(currentMonthStr)
  const { shifts, loading } = useShiftHistoryData(filterMonth)
  const locale = DATE_LOCALE[language]

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-[#F4F4EE]">
        <DesktopSidebar active="history" />
        <main className="pl-60">
          <HistoryContent
            filterMonth={filterMonth} setFilterMonth={setFilterMonth}
            shifts={shifts} loading={loading} locale={locale} isDesktop
          />
        </main>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <HistoryContent
        filterMonth={filterMonth} setFilterMonth={setFilterMonth}
        shifts={shifts} loading={loading} locale={locale} isDesktop={false}
      />
      <BottomNav active="history" />
    </div>
  )
}
