import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { SupervisorDesktopSidebar } from '../../components/supervisor/SupervisorDesktopSidebar'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { useIsDesktop } from '../../hooks/useIsDesktop'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FacilityRate {
  facilityId: string
  name: string
  address: string | null
  cleanerRate: number | null
  cleanerFrom: string | null
  supervisorRate: number | null
  supervisorFrom: string | null
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5" stroke="#B8A77A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useRatesData() {
  const { user } = useApp()
  const [loading, setLoading] = useState(true)
  const [facilities, setFacilities] = useState<FacilityRate[]>([])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: jobRows } = await supabase
      .from('jobs')
      .select('facility_id')
      .eq('supervisor_id', user.id)

    const facilityIds = [...new Set((jobRows ?? []).map((j) => (j as { facility_id: string }).facility_id))]
    if (facilityIds.length === 0) { setFacilities([]); setLoading(false); return }

    const { data: facRows } = await supabase
      .from('facilities')
      .select('id, name, address')
      .in('id', facilityIds)

    const today = new Date().toISOString().slice(0, 10)
    const { data: rateRows } = await supabase
      .from('facility_rates')
      .select('facility_id, role_type, hourly_rate, effective_from')
      .in('facility_id', facilityIds)
      .lte('effective_from', today)
      .order('effective_from', { ascending: false })

    type RateEntry = { cleanerRate: number | null; cleanerFrom: string | null; supervisorRate: number | null; supervisorFrom: string | null }
    const rateMap: Record<string, RateEntry> = {}
    for (const id of facilityIds) rateMap[id] = { cleanerRate: null, cleanerFrom: null, supervisorRate: null, supervisorFrom: null }

    for (const row of (rateRows ?? [])) {
      const r = row as { facility_id: string; role_type: string; hourly_rate: number; effective_from: string }
      const entry = rateMap[r.facility_id]
      if (!entry) continue
      if (r.role_type === 'cleaner' && entry.cleanerRate === null) {
        entry.cleanerRate = r.hourly_rate; entry.cleanerFrom = r.effective_from
      } else if (r.role_type === 'supervisor' && entry.supervisorRate === null) {
        entry.supervisorRate = r.hourly_rate; entry.supervisorFrom = r.effective_from
      }
    }

    setFacilities((facRows ?? []).map((f) => {
      const fac = f as { id: string; name: string; address: string | null }
      return { facilityId: fac.id, name: fac.name, address: fac.address, ...(rateMap[fac.id] ?? { cleanerRate: null, cleanerFrom: null, supervisorRate: null, supervisorFrom: null }) }
    }))
    setLoading(false)
  }, [user])

  useEffect(() => { void load() }, [load])
  return { loading, facilities }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface RateRowProps {
  label: string
  rate: number | null
  effectiveFrom: string | null
}

function RateRow({ label, rate, effectiveFrom }: RateRowProps) {
  return (
    <div className="flex flex-col gap-2 p-4 bg-[#F4F4EE] rounded-[10px]">
      <p className="font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874]">{label}</p>
      {rate !== null ? (
        <>
          <span className="font-['Poppins',sans-serif] font-semibold text-[22px] text-[#1A1C19]">
            £{Number(rate).toFixed(2)}<span className="text-[14px] font-normal text-[#737874]">/hr</span>
          </span>
          {effectiveFrom && (
            <p className="font-['Lato',sans-serif] text-[11px] text-[#737874]">
              Effective {formatDate(effectiveFrom)}
            </p>
          )}
        </>
      ) : (
        <span className="font-['Lato',sans-serif] text-[14px] text-[#737874] italic">Not set</span>
      )}
    </div>
  )
}

function FacilityCard({ facility }: { facility: FacilityRate }) {
  return (
    <div className="bg-white border border-[#D5D5CF] rounded-[12px] p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-[#F4F4EE] flex items-center justify-center shrink-0">
          <BuildingIcon />
        </div>
        <div>
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1A1C19] leading-snug">{facility.name}</h3>
          {facility.address && <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">{facility.address}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <RateRow label="Cleaner Rate" rate={facility.cleanerRate} effectiveFrom={facility.cleanerFrom} />
        <RateRow label="Supervisor Rate" rate={facility.supervisorRate} effectiveFrom={facility.supervisorFrom} />
      </div>
    </div>
  )
}

// ─── Page content ─────────────────────────────────────────────────────────────

function RatesContent() {
  const navigate = useNavigate()
  const { loading, facilities } = useRatesData()

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 md:py-10 pb-[100px] md:pb-10">
      <div className="mb-8">
        <p className="font-['Lato',sans-serif] text-[13px] text-[#B8A77A] font-bold tracking-[1.5px] uppercase mb-1">Pay Management</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[28px] md:text-[36px] text-[#1A1C19] leading-tight">Facility Rates</h1>
            <p className="font-['Lato',sans-serif] text-[14px] text-[#737874] mt-2">
              Current hourly rates for your facilities. Contact an administrator to update rates.
            </p>
          </div>
          <button
            onClick={() => navigate('/supervisor/pay-records')}
            className="shrink-0 mt-1 flex items-center gap-1.5 px-4 h-9 rounded-[8px] bg-[#1A1C19] text-white font-['Lato',sans-serif] text-[13px] font-semibold whitespace-nowrap"
          >
            Pay Records
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-44 rounded-[12px] bg-white border border-[#D5D5CF] animate-pulse" />)}
        </div>
      ) : facilities.length === 0 ? (
        <div className="bg-white border border-[#D5D5CF] rounded-[12px] p-10 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19]">No facilities found</p>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">Facilities appear here once jobs are assigned to you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {facilities.map((fac) => <FacilityCard key={fac.facilityId} facility={fac} />)}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function MobileRates() {
  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <RatesContent />
      <SupervisorNav active="rates" />
    </div>
  )
}

function DesktopRates() {
  return (
    <div className="min-h-screen bg-[#F4F4EE]">
      <SupervisorDesktopSidebar active="rates" />
      <main className="pl-60">
        <RatesContent />
      </main>
    </div>
  )
}

/** Supervisor portal — view current hourly rates per facility (read-only). */
export function Rates() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopRates /> : <MobileRates />
}
