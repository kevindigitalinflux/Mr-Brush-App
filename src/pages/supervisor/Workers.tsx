import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { SupervisorDesktopSidebar } from '../../components/supervisor/SupervisorDesktopSidebar'
import { StarDisplay } from '../../components/supervisor/StarDisplay'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Worker {
  id: string
  display_id: string
  full_name: string
  current_zone: string | null
  status: 'active' | 'idle' | 'replacement'
  role: string
  avg_rating: number | null
}

// ─── Shared data hook ─────────────────────────────────────────────────────────

function useWorkersData() {
  const { user } = useApp()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (silent = false) => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    if (!silent) setLoading(true)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_id, full_name, role')
      .eq('company_id', user.company_id)
      .in('role', ['cleaner', 'replacement_cleaner'])
      .order('full_name')

    if (!profiles) { setLoading(false); return }

    const { data: zones } = await supabase
      .from('job_zones')
      .select('id, cleaner_id, zone_name, status, jobs!inner( scheduled_date )')
      .eq('jobs.scheduled_date', today)

    const { data: ratingRows } = await supabase
      .from('cleaner_ratings')
      .select('cleaner_id, rating')

    const ratingsByCleanerId = new Map<string, number[]>()
    for (const r of (ratingRows as { cleaner_id: string; rating: number }[] ?? [])) {
      const list = ratingsByCleanerId.get(r.cleaner_id) ?? []
      list.push(r.rating)
      ratingsByCleanerId.set(r.cleaner_id, list)
    }

    const activeZoneMap = new Map<string, string>()
    for (const z of zones ?? []) {
      if (z.cleaner_id && (z.status === 'in_progress' || z.status === 'not_started')) {
        activeZoneMap.set(z.cleaner_id, z.zone_name)
      }
    }

    setWorkers(profiles.map((p) => {
      const ratingList = ratingsByCleanerId.get(p.id) ?? []
      const avg = ratingList.length > 0
        ? ratingList.reduce((s, v) => s + v, 0) / ratingList.length
        : null
      return {
        id: p.id,
        display_id: p.display_id,
        full_name: p.full_name ?? p.display_id,
        current_zone: activeZoneMap.get(p.id) ?? null,
        status: p.role === 'replacement_cleaner'
          ? 'replacement'
          : activeZoneMap.has(p.id) ? 'active' : 'idle',
        role: p.role,
        avg_rating: avg,
      }
    }))
    setLoading(false)
  }, [user])

  useEffect(() => { if (user) load() }, [load, user])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('supervisor-workers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_zones' }, () => load(true))
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [user, load])

  return { workers, loading }
}

// ─── Worker card ──────────────────────────────────────────────────────────────

const STATUS_PILL: Record<Worker['status'], string> = {
  active:      'bg-[#D7E6DB] text-[#2F4A3D]',
  idle:        'bg-[#E3E3DD] text-[#737874]',
  replacement: 'bg-[#FFF3D1] text-[#6F613A]',
}

function WorkerCard({ worker, onClick, selected }: { worker: Worker; onClick: () => void; selected?: boolean }) {
  const t = useTranslation()
  const initials = worker.full_name
    .split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const pill = STATUS_PILL[worker.status]
  const statusLabels: Record<Worker['status'], string> = {
    active:      t('sv_active_worker'),
    idle:        t('sv_idle_worker'),
    replacement: t('sv_replacement_worker'),
  }
  const label = statusLabels[worker.status]

  return (
    <button
      onClick={onClick}
      className={[
        'worker-card w-full bg-white border rounded-[12px] p-4 flex items-center gap-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8A77A]',
        selected ? 'border-[#B8A77A] bg-[#FDFCF8]' : 'border-[#D0CFCA] hover:border-[#B8A77A]',
      ].join(' ')}
    >
      <div className="w-11 h-11 rounded-full bg-[#1A1C19] flex items-center justify-center shrink-0">
        <span className="font-['Poppins',sans-serif] font-bold text-sm text-[#B8A77A]">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19] truncate">
          {worker.full_name}
        </p>
        <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
          {worker.display_id}
          {worker.current_zone ? ` · ${worker.current_zone}` : ''}
        </p>
        {worker.avg_rating !== null && (
          <div className="mt-1">
            <StarDisplay value={worker.avg_rating} size="sm" />
          </div>
        )}
      </div>
      <span className={`shrink-0 font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.5px] px-2.5 py-1 rounded-full ${pill}`}>
        {label}
      </span>
    </button>
  )
}

// ─── Workers list (shared rendering) ─────────────────────────────────────────

function WorkersList({
  workers, loading, search, onSearchChange, onSelect, selectedId,
}: {
  workers: Worker[]; loading: boolean; search: string
  onSearchChange: (v: string) => void; onSelect: (id: string) => void; selectedId: string | null
}) {
  const t = useTranslation()
  const filtered = workers.filter((w) =>
    !search || w.full_name.toLowerCase().includes(search.toLowerCase()) || w.display_id.toLowerCase().includes(search.toLowerCase())
  )
  const active      = filtered.filter((w) => w.status === 'active')
  const idle        = filtered.filter((w) => w.status === 'idle')
  const replacement = filtered.filter((w) => w.status === 'replacement')

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="8" stroke="#737874" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="#737874" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('sv_search_workers')}
          className="w-full h-[48px] bg-white border border-[#C3C8C2] rounded-[8px] pl-10 pr-4 font-['Lato',sans-serif] text-sm text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[76px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-8 flex flex-col items-center gap-2 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">
            {search ? t('sv_no_results') : t('sv_no_workers_yet')}
          </p>
          <p className="font-['Lato',sans-serif] text-sm text-[#737874]">
            {search ? t('sv_no_results_body') : t('sv_no_workers_body')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {active.length > 0 && (
            <section>
              <h2 className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.2px] text-[#737874] uppercase mb-2">
                {t('sv_on_shift_section')} ({active.length})
              </h2>
              <div className="flex flex-col gap-3">
                {active.map((w) => (
                  <WorkerCard key={w.id} worker={w} selected={selectedId === w.id} onClick={() => onSelect(w.id)} />
                ))}
              </div>
            </section>
          )}
          {idle.length > 0 && (
            <section>
              <h2 className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.2px] text-[#737874] uppercase mb-2">
                {t('sv_idle_section')} ({idle.length})
              </h2>
              <div className="flex flex-col gap-3">
                {idle.map((w) => (
                  <WorkerCard key={w.id} worker={w} selected={selectedId === w.id} onClick={() => onSelect(w.id)} />
                ))}
              </div>
            </section>
          )}
          {replacement.length > 0 && (
            <section>
              <h2 className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.2px] text-[#737874] uppercase mb-2">
                {t('sv_replacement_section')} ({replacement.length})
              </h2>
              <div className="flex flex-col gap-3">
                {replacement.map((w) => (
                  <WorkerCard key={w.id} worker={w} selected={selectedId === w.id} onClick={() => onSelect(w.id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Desktop Workers ──────────────────────────────────────────────────────────

function DesktopWorkers() {
  const t = useTranslation()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const { workers, loading } = useWorkersData()
  const [search, setSearch] = useState('')

  useGSAP(() => {
    if (loading) return
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.dw-heading',  { opacity: 0, y: 14, duration: 0.4 })
      .from('.worker-card', { opacity: 0, y: 10, duration: 0.3, stagger: 0.05 }, '-=0.2')
  }, { scope: containerRef, dependencies: [loading] })

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
      <SupervisorDesktopSidebar active="workers" />
      <main className="flex-1 overflow-y-auto ml-60 bg-[#F4F4EE]" style={{ scrollbarGutter: 'stable' }}>
        <div ref={containerRef} className="max-w-5xl mx-auto px-10 py-10">
          <div className="dw-heading mb-8">
            <h1 className="font-['Poppins',sans-serif] font-bold text-[32px] text-[#1A1C19] leading-[1.1] tracking-[-0.5px]">
              {t('sv_workers_title')}
            </h1>
          </div>
          <WorkersList
            workers={workers}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            onSelect={(id) => navigate(`/supervisor/workers/${id}`)}
            selectedId={null}
          />
        </div>
      </main>
    </div>
  )
}

// ─── Mobile Workers ───────────────────────────────────────────────────────────

function MobileWorkers() {
  const navigate = useNavigate()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const { workers, loading } = useWorkersData()
  const [search, setSearch] = useState('')

  useGSAP(() => {
    if (loading) return
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.workers-heading', { opacity: 0, y: 16, duration: 0.4 })
      .from('.worker-card', { opacity: 0, y: 12, duration: 0.35, stagger: 0.06 }, '-=0.2')
  }, { scope: containerRef, dependencies: [loading] })

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto px-6 pt-10 pb-[100px]">
        <h1 className="workers-heading font-['Poppins',sans-serif] font-bold text-[32px] text-[#1A1C19] leading-[1.1] tracking-[-0.4px] mb-5">
          {t('sv_workers_title')}
        </h1>
        <WorkersList
          workers={workers}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          onSelect={(id) => navigate(`/supervisor/workers/${id}`)}
          selectedId={null}
        />
      </div>
      <SupervisorNav active="workers" />
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

/** Lists all cleaners with their current status. Tapping a card opens their profile. */
export function Workers() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopWorkers /> : <MobileWorkers />
}
