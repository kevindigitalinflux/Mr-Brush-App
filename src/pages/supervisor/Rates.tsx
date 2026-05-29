import { useCallback, useEffect, useState } from 'react'
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

interface EditState {
  facilityId: string
  roleType: 'cleaner' | 'supervisor'
  value: string
  saving: boolean
  error: string | null
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
  return { loading, facilities, reload: load }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface RateRowProps {
  label: string
  rate: number | null
  effectiveFrom: string | null
  editing: EditState | null
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onChange: (v: string) => void
}

function RateRow({ label, rate, effectiveFrom, editing, onEdit, onSave, onCancel, onChange }: RateRowProps) {
  return (
    <div className="flex flex-col gap-2 p-4 bg-[#F4F4EE] rounded-[10px]">
      <p className="font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874]">{label}</p>
      {editing ? (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-['Poppins',sans-serif] font-semibold text-[18px] text-[#1A1C19]">£</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={editing.value}
              onChange={(e) => onChange(e.target.value)}
              className="w-24 h-9 rounded-[8px] border border-[#D5D5CF] bg-white px-3 font-['Lato',sans-serif] text-[14px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
              autoFocus
            />
            <span className="font-['Lato',sans-serif] text-[13px] text-[#737874]">/hr</span>
            <button
              onClick={onSave}
              disabled={editing.saving || !editing.value}
              className="h-9 px-4 rounded-[8px] bg-[#1A1C19] text-white font-['Lato',sans-serif] text-[13px] font-semibold disabled:opacity-50"
            >
              {editing.saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={onCancel}
              className="h-9 px-3 rounded-[8px] bg-white border border-[#D5D5CF] text-[#737874] font-['Lato',sans-serif] text-[13px]"
            >
              Cancel
            </button>
          </div>
          {editing.error && (
            <p className="font-['Lato',sans-serif] text-[12px] text-[#BA1A1A]">{editing.error}</p>
          )}
        </>
      ) : (
        <div className="flex items-end justify-between gap-2">
          <div>
            {rate !== null ? (
              <>
                <span className="font-['Poppins',sans-serif] font-semibold text-[22px] text-[#1A1C19]">
                  £{Number(rate).toFixed(2)}<span className="text-[14px] font-normal text-[#737874]">/hr</span>
                </span>
                {effectiveFrom && (
                  <p className="font-['Lato',sans-serif] text-[11px] text-[#737874] mt-0.5">
                    Effective {formatDate(effectiveFrom)}
                  </p>
                )}
              </>
            ) : (
              <span className="font-['Lato',sans-serif] text-[14px] text-[#B8A77A] italic">Not set</span>
            )}
          </div>
          <button
            onClick={onEdit}
            className="shrink-0 text-[12px] font-['Lato',sans-serif] font-bold text-[#B8A77A] hover:text-[#8B7A5A] uppercase tracking-[0.5px] transition-colors"
          >
            {rate !== null ? 'Edit' : 'Set rate'}
          </button>
        </div>
      )}
    </div>
  )
}

interface CardProps {
  facility: FacilityRate
  editState: EditState | null
  onEdit: (fId: string, role: 'cleaner' | 'supervisor') => void
  onSave: () => void
  onCancel: () => void
  onChange: (v: string) => void
}

function FacilityCard({ facility, editState, onEdit, onSave, onCancel, onChange }: CardProps) {
  const editingCleaner = editState?.facilityId === facility.facilityId && editState.roleType === 'cleaner' ? editState : null
  const editingSupervisor = editState?.facilityId === facility.facilityId && editState.roleType === 'supervisor' ? editState : null
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
        <RateRow label="Cleaner Rate" rate={facility.cleanerRate} effectiveFrom={facility.cleanerFrom}
          editing={editingCleaner} onEdit={() => onEdit(facility.facilityId, 'cleaner')}
          onSave={onSave} onCancel={onCancel} onChange={onChange} />
        <RateRow label="Supervisor Rate" rate={facility.supervisorRate} effectiveFrom={facility.supervisorFrom}
          editing={editingSupervisor} onEdit={() => onEdit(facility.facilityId, 'supervisor')}
          onSave={onSave} onCancel={onCancel} onChange={onChange} />
      </div>
    </div>
  )
}

// ─── Page content ─────────────────────────────────────────────────────────────

function RatesContent() {
  const { user } = useApp()
  const { loading, facilities, reload } = useRatesData()
  const [editState, setEditState] = useState<EditState | null>(null)

  function startEdit(facilityId: string, roleType: 'cleaner' | 'supervisor') {
    const fac = facilities.find((f) => f.facilityId === facilityId)
    const current = roleType === 'cleaner' ? fac?.cleanerRate : fac?.supervisorRate
    setEditState({ facilityId, roleType, value: current ? Number(current).toFixed(2) : '', saving: false, error: null })
  }

  async function handleSave() {
    if (!editState || !user) return
    const parsed = parseFloat(editState.value)
    if (isNaN(parsed) || parsed <= 0) {
      setEditState((s) => s && ({ ...s, error: 'Enter a rate greater than £0.00.' })); return
    }
    setEditState((s) => s && ({ ...s, saving: true, error: null }))
    const { error } = await supabase.from('facility_rates').insert({
      facility_id: editState.facilityId,
      role_type: editState.roleType,
      hourly_rate: parsed,
      effective_from: new Date().toISOString().slice(0, 10),
      company_id: user.company_id,
    })
    if (error) { setEditState((s) => s && ({ ...s, saving: false, error: 'Could not save. Try again.' })); return }
    setEditState(null)
    void reload()
  }

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 md:py-10 pb-[100px] md:pb-10">
      <div className="mb-8">
        <p className="font-['Lato',sans-serif] text-[13px] text-[#B8A77A] font-bold tracking-[1.5px] uppercase mb-1">Pay Management</p>
        <h1 className="font-['Poppins',sans-serif] font-bold text-[28px] md:text-[36px] text-[#1A1C19] leading-tight">Facility Rates</h1>
        <p className="font-['Lato',sans-serif] text-[14px] text-[#737874] mt-2">
          Set hourly rates per facility. New rates take effect immediately for all future pay records.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-52 rounded-[12px] bg-white border border-[#D5D5CF] animate-pulse" />)}
        </div>
      ) : facilities.length === 0 ? (
        <div className="bg-white border border-[#D5D5CF] rounded-[12px] p-10 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19]">No facilities found</p>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">Facilities appear here once jobs are assigned to you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {facilities.map((fac) => (
            <FacilityCard key={fac.facilityId} facility={fac} editState={editState}
              onEdit={startEdit} onSave={handleSave}
              onCancel={() => setEditState(null)}
              onChange={(v) => setEditState((s) => s && ({ ...s, value: v }))} />
          ))}
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

/** Supervisor portal — view and set hourly rates per facility. */
export function Rates() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopRates /> : <MobileRates />
}
