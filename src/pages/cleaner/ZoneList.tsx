import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { MOCK_JOBS } from '../../lib/mockJobs'
import { useTranslation } from '../../lib/useTranslation'
import { gsap, useGSAP } from '../../lib/gsap'
import { DesktopSidebar } from '../../components/DesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'

// ─── Types & styles ──────────────────────────────────────────────────────────

type ZoneStatus = 'not_started' | 'completed'

interface DisplayZone {
  id: string
  name: string
  description: string
  status: ZoneStatus
}

const ZONE_STYLES: Record<ZoneStatus, {
  accent: string; badge: string; badgeText: string; border: string; opacity: string; label: string
}> = {
  completed:   { accent: 'bg-black',     badge: 'bg-black',     badgeText: 'text-white',     border: 'border border-[#C3C8C2]', opacity: '',          label: 'Completed'   },
  not_started: { accent: 'bg-[#C3C8C2]', badge: 'bg-[#E3E3DD]', badgeText: 'text-[#434844]', border: 'border border-[#C3C8C2]', opacity: 'opacity-75', label: 'Not Started' },
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Shared data hook ─────────────────────────────────────────────────────────

function useZoneListData() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { completedZones } = useApp()
  const t = useTranslation()

  const mockJob = MOCK_JOBS.find((j) => j.id === jobId)
  const zones: DisplayZone[] = (mockJob?.zones ?? []).map((z) => ({
    ...z,
    status: completedZones.has(z.id) ? 'completed' : 'not_started',
  }))

  const totalZones = zones.length
  const doneZones = zones.filter((z) => z.status === 'completed').length
  const allDone = totalZones > 0 && doneZones === totalZones
  const progressPct = totalZones > 0 ? (doneZones / totalZones) * 100 : 0
  const siteName = mockJob?.siteName ?? 'Site'

  return { jobId, navigate, zones, totalZones, doneZones, allDone, progressPct, siteName, t }
}

// ─── ZoneCard ────────────────────────────────────────────────────────────────

function ZoneCard({ zone, jobId }: { zone: DisplayZone; jobId: string }) {
  const navigate = useNavigate()
  const s = ZONE_STYLES[zone.status]

  function handlePress() {
    if (zone.status !== 'completed') navigate(`/cleaner/job/${jobId}/zone/${zone.id}`)
  }

  return (
    <div
      onClick={handlePress}
      role={zone.status !== 'completed' ? 'button' : undefined}
      tabIndex={zone.status !== 'completed' ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && handlePress()}
      className={[
        'zone-card relative flex items-stretch overflow-hidden rounded-[12px] shadow-sm bg-white w-full',
        s.border, s.opacity,
        zone.status !== 'completed' ? 'cursor-pointer hover:shadow-md transition-shadow' : '',
      ].join(' ')}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${s.accent}`} />
      <div className="flex-1 flex flex-col gap-3 pl-8 pr-4 py-4">
        <h4 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] leading-tight">
          {zone.name}
        </h4>
        <p className="font-['Lato',sans-serif] text-base text-[#434844] leading-[1.6]">
          {zone.description}
        </p>
        <span className={`${s.badge} ${s.badgeText} font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] px-3 h-8 inline-flex items-center rounded-full self-start`}>
          {s.label}
        </span>
      </div>
    </div>
  )
}

// ─── Desktop layout ───────────────────────────────────────────────────────────

function DesktopZoneList() {
  const { jobId, navigate, zones, totalZones, doneZones, allDone, progressPct, siteName, t } = useZoneListData()
  const containerRef = useRef<HTMLDivElement>(null)
  const progressFillRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
    tl.from('.dzl-header', { opacity: 0, x: -16, duration: 0.4 })
    tl.from('.dzl-progress', { opacity: 0, duration: 0.3 }, '-=0.1')
    if (progressFillRef.current) {
      gsap.fromTo(progressFillRef.current,
        { width: '0%' },
        { width: `${progressPct}%`, duration: 0.7, ease: 'power2.out', delay: 0.35 }
      )
    }
    tl.from('.dzl-heading', { opacity: 0, y: 10, duration: 0.35 }, '-=0.3')
    tl.from('.zone-card', { opacity: 0, y: 20, duration: 0.4, stagger: 0.06 }, '-=0.15')
    tl.from('.dzl-cta', { opacity: 0, y: 12, duration: 0.35 }, '-=0.1')
  }, { scope: containerRef, dependencies: [progressPct] })

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
      <DesktopSidebar active="jobs" />
      <main className="flex-1 overflow-y-auto">
        <div ref={containerRef} className="max-w-5xl mx-auto px-8 py-8 flex flex-col gap-8">

          <div className="flex flex-col gap-5">
            <div className="dzl-header flex items-center gap-4">
              <button
                onClick={() => navigate('/cleaner/home')}
                aria-label="Go back"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer"
              >
                <BackIcon />
              </button>
              <div>
                <h1 className="font-['Poppins',sans-serif] font-semibold text-[40px] tracking-[-0.5px] text-[#1A1C19] leading-tight">
                  {t('shift_progress')}
                </h1>
                <p className="font-['Lato',sans-serif] text-base text-[#737874]">{siteName}</p>
              </div>
            </div>

            <div className="dzl-progress flex flex-col gap-2">
              <div className="w-full h-3 bg-[#C3C8C2] rounded-full overflow-hidden">
                <div
                  ref={progressFillRef}
                  className="h-full bg-[#F1DEAD] rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844] uppercase">
                  {t('overall_progress')}
                </span>
                <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844]">
                  {doneZones} of {totalZones} zones completed
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <h2 className="dzl-heading font-['Poppins',sans-serif] font-semibold text-[28px] text-[#1A1C19]">
              {t('your_zones')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {zones.map((zone) => (
                <ZoneCard key={zone.id} zone={zone} jobId={jobId ?? ''} />
              ))}
            </div>
          </div>

          <div className="dzl-cta flex items-center justify-end gap-4 pb-8">
            <p className="font-['Lato',sans-serif] text-base text-[#434844]">
              {allDone ? t('all_zones_finished') : t('finish_all_zones')}
            </p>
            <button
              onClick={() => allDone && navigate(`/cleaner/job/${jobId}/complete`)}
              disabled={!allDone}
              className={[
                'h-[56px] px-8 rounded-[8px] font-["Poppins",sans-serif] font-semibold text-base shadow-sm transition-colors whitespace-nowrap',
                allDone
                  ? 'bg-[#B8A77A] text-[#F8F8F2] cursor-pointer hover:bg-[#a8976a]'
                  : 'bg-[#E3E3DD] text-[#737874] opacity-50 cursor-not-allowed',
              ].join(' ')}
            >
              {t('mark_shift_complete')}
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}

// ─── Mobile layout ────────────────────────────────────────────────────────────

function MobileZoneList() {
  const { jobId, navigate, zones, totalZones, doneZones, allDone, progressPct, t } = useZoneListData()
  const containerRef = useRef<HTMLDivElement>(null)
  const progressFillRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
    tl.from('.zonelist-header', { opacity: 0, x: -16, duration: 0.4 })
    tl.from('.progress-track', { opacity: 0, duration: 0.3 }, '-=0.1')
    if (progressFillRef.current) {
      gsap.fromTo(progressFillRef.current,
        { width: '0%' },
        { width: `${progressPct}%`, duration: 0.7, ease: 'power2.out', delay: 0.35 }
      )
    }
    tl.from('.progress-labels', { opacity: 0, duration: 0.3 }, '-=0.4')
    tl.from('.zones-heading', { opacity: 0, y: 10, duration: 0.35 }, '-=0.1')
    tl.from('.zone-card', { opacity: 0, y: 20, duration: 0.4, stagger: 0.07 }, '-=0.15')
    tl.from('.shift-cta', { opacity: 0, y: 12, duration: 0.35 }, '-=0.1')
  }, { scope: containerRef, dependencies: [progressPct] })

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto pb-24 p-8 flex flex-col gap-8">

        <div className="flex flex-col gap-4 pb-4">
          <div className="zonelist-header flex items-center gap-4">
            <button
              onClick={() => navigate('/cleaner/home')}
              aria-label="Go back"
              className="w-8 h-10 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer -ml-2"
            >
              <BackIcon />
            </button>
            <h2 className="font-['Poppins',sans-serif] font-semibold text-[32px] tracking-[-0.32px] text-[#1A1C19]">
              {t('shift_progress')}
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            <div className="progress-track w-full h-3 bg-[#C3C8C2] rounded-full overflow-hidden">
              <div
                ref={progressFillRef}
                className="h-full bg-[#F1DEAD] rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="progress-labels flex items-center justify-between">
              <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844] uppercase">
                {t('overall_progress')}
              </span>
              <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844]">
                {doneZones} of {totalZones} zones completed
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <h3 className="zones-heading font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] pb-2">
            {t('your_zones')}
          </h3>
          <div className="flex flex-col gap-4">
            {zones.map((zone) => (
              <ZoneCard key={zone.id} zone={zone} jobId={jobId ?? ''} />
            ))}
          </div>
        </div>

        <div className="shift-cta flex flex-col gap-2 pt-8">
          <button
            onClick={() => allDone && navigate(`/cleaner/job/${jobId}/complete`)}
            disabled={!allDone}
            className={[
              'w-full h-[56px] rounded-[8px] font-["Poppins",sans-serif] font-semibold text-base text-center shadow-sm transition-colors',
              allDone
                ? 'bg-[#B8A77A] text-[#F8F8F2] cursor-pointer hover:bg-[#a8976a]'
                : 'bg-[#E3E3DD] text-[#737874] opacity-50 cursor-not-allowed',
            ].join(' ')}
          >
            {t('mark_shift_complete')}
          </button>
          <p className="font-['Lato',sans-serif] text-base text-[#434844] text-center">
            {allDone ? t('all_zones_finished') : t('finish_all_zones')}
          </p>
        </div>

      </div>
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/** Zone-by-zone progress view for a specific job. */
export function ZoneList() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopZoneList /> : <MobileZoneList />
}
