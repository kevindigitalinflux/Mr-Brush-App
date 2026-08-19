import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { SupervisorDesktopSidebar } from '../../components/supervisor/SupervisorDesktopSidebar'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { useIsDesktop } from '../../hooks/useIsDesktop'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CleanerOption { id: string; name: string; displayId: string }

interface FacilityRate {
  facilityId: string
  name: string
  address: string | null
  cleanerRate: number | null
  cleanerFrom: string | null
  supervisorRate: number | null
  supervisorFrom: string | null
  hours: Record<string, number | null> // cleanerId -> expected hours at this facility
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
  const [cleaners, setCleaners] = useState<CleanerOption[]>([])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: jobRows } = await supabase
      .from('jobs')
      .select('facility_id')
      .eq('supervisor_id', user.id)

    const facilityIds = [...new Set((jobRows ?? []).map((j) => (j as { facility_id: string }).facility_id))]
    if (facilityIds.length === 0) { setFacilities([]); setCleaners([]); setLoading(false); return }

    const today = new Date().toISOString().slice(0, 10)
    const [{ data: facRows }, { data: rateRows }, { data: cleanerRows }, { data: hoursRows }] = await Promise.all([
      supabase.from('facilities').select('id, name, address').in('id', facilityIds),
      supabase.from('facility_rates').select('facility_id, role_type, hourly_rate, effective_from')
        .in('facility_id', facilityIds).lte('effective_from', today).order('effective_from', { ascending: false }),
      supabase.from('profiles').select('id, display_id, full_name')
        .eq('company_id', user.company_id).eq('role', 'cleaner').eq('is_active', true).order('full_name'),
      supabase.from('cleaner_facility_hours').select('cleaner_id, facility_id, expected_hours').in('facility_id', facilityIds),
    ])

    setCleaners((cleanerRows ?? []).map((c) => {
      const r = c as { id: string; display_id: string; full_name: string | null }
      return { id: r.id, displayId: r.display_id, name: r.full_name ?? r.display_id }
    }))

    type RateEntry = { cleanerRate: number | null; cleanerFrom: string | null; supervisorRate: number | null; supervisorFrom: string | null }
    const rateMap: Record<string, RateEntry> = {}
    const hoursMap: Record<string, Record<string, number | null>> = {}
    for (const id of facilityIds) { rateMap[id] = { cleanerRate: null, cleanerFrom: null, supervisorRate: null, supervisorFrom: null }; hoursMap[id] = {} }

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

    for (const row of (hoursRows ?? [])) {
      const r = row as { cleaner_id: string; facility_id: string; expected_hours: number }
      if (!hoursMap[r.facility_id]) hoursMap[r.facility_id] = {}
      hoursMap[r.facility_id][r.cleaner_id] = r.expected_hours
    }

    setFacilities((facRows ?? []).map((f) => {
      const fac = f as { id: string; name: string; address: string | null }
      const rates = rateMap[fac.id] ?? { cleanerRate: null, cleanerFrom: null, supervisorRate: null, supervisorFrom: null }
      return { facilityId: fac.id, name: fac.name, address: fac.address, ...rates, hours: hoursMap[fac.id] ?? {} }
    }))
    setLoading(false)
  }, [user])

  useEffect(() => { void load() }, [load])
  return { loading, facilities, cleaners, reload: load }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface RateRowProps {
  label: string
  rate: number | null
  effectiveFrom: string | null
  onSave: (newRate: number) => Promise<string | null>
}

function RateRow({ label, rate, effectiveFrom, onSave }: RateRowProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(rate !== null ? String(rate) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function startEdit() {
    setValue(rate !== null ? String(rate) : '')
    setError('')
    setEditing(true)
  }

  async function handleSave() {
    const parsed = parseFloat(value)
    if (isNaN(parsed) || parsed <= 0) { setError('Enter a rate greater than £0.00'); return }
    setSaving(true)
    setError('')
    const err = await onSave(parsed)
    setSaving(false)
    if (err) { setError(err); return }
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-[#F4F4EE] rounded-[10px]">
        <p className="font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874]">{label}</p>
        <div className="flex items-center gap-1.5">
          <span className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1A1C19]">£</span>
          <input
            type="number" step="0.01" min="0.01" autoFocus
            value={value}
            onChange={(e) => { setValue(e.target.value); setError('') }}
            className="w-24 h-9 rounded-[6px] border border-[#D5D5CF] bg-white px-2 font-['Lato',sans-serif] text-[14px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
          />
          <span className="font-['Lato',sans-serif] text-[13px] text-[#737874]">/hr</span>
        </div>
        {error && <p className="font-['Lato',sans-serif] text-[12px] text-[#BA1A1A]">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="h-8 px-3 rounded-[6px] bg-[#1A1C19] text-white font-['Lato',sans-serif] text-[12px] font-semibold disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} disabled={saving}
            className="h-8 px-3 rounded-[6px] border border-[#D5D5CF] bg-white text-[#737874] font-['Lato',sans-serif] text-[12px] font-semibold">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-[#F4F4EE] rounded-[10px]">
      <div className="flex items-center justify-between gap-2">
        <p className="font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874]">{label}</p>
        <button onClick={startEdit} className="font-['Lato',sans-serif] text-[12px] font-semibold text-[#B8A77A] hover:text-[#8B7A5A] transition-colors">
          Edit
        </button>
      </div>
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

interface HoursRowProps {
  name: string
  displayId: string
  hours: number | null
  onSave: (newHours: number) => Promise<string | null>
}

function HoursRow({ name, displayId, hours, onSave }: HoursRowProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(hours !== null ? String(hours) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function startEdit() {
    setValue(hours !== null ? String(hours) : '')
    setError('')
    setEditing(true)
  }

  async function handleSave() {
    const parsed = parseFloat(value)
    if (isNaN(parsed) || parsed <= 0) { setError('Enter hours greater than 0'); return }
    setSaving(true)
    setError('')
    const err = await onSave(parsed)
    setSaving(false)
    if (err) { setError(err); return }
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-1.5 px-4 py-2.5 bg-[#F4F4EE] rounded-[8px]">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#1A1C19] truncate">{name}</p>
          <p className="font-['Lato',sans-serif] text-[11px] text-[#737874]">{displayId}</p>
        </div>
        {editing ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="number" step="0.25" min="0.25" autoFocus
              value={value}
              onChange={(e) => { setValue(e.target.value); setError('') }}
              className="w-16 h-8 rounded-[6px] border border-[#D5D5CF] bg-white px-2 font-['Lato',sans-serif] text-[13px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
            />
            <span className="font-['Lato',sans-serif] text-[12px] text-[#737874]">h</span>
            <button onClick={handleSave} disabled={saving}
              className="h-8 px-2.5 rounded-[6px] bg-[#1A1C19] text-white font-['Lato',sans-serif] text-[11px] font-semibold disabled:opacity-50">
              {saving ? '…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} disabled={saving}
              className="h-8 px-2.5 rounded-[6px] border border-[#D5D5CF] bg-white text-[#737874] font-['Lato',sans-serif] text-[11px] font-semibold">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-['Lato',sans-serif] text-[13px] text-[#1A1C19]">
              {hours !== null ? `${hours}h` : <span className="italic text-[#9E9E9E]">Not set</span>}
            </span>
            <button onClick={startEdit} className="font-['Lato',sans-serif] text-[12px] font-semibold text-[#B8A77A] hover:text-[#8B7A5A] transition-colors">
              Edit
            </button>
          </div>
        )}
      </div>
      {error && <p className="font-['Lato',sans-serif] text-[11px] text-[#BA1A1A]">{error}</p>}
    </div>
  )
}

function FacilityCard({ facility, cleaners, onSaveRate, onSaveHours }: {
  facility: FacilityRate
  cleaners: CleanerOption[]
  onSaveRate: (facilityId: string, roleType: 'cleaner' | 'supervisor', rate: number) => Promise<string | null>
  onSaveHours: (facilityId: string, cleanerId: string, hours: number) => Promise<string | null>
}) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <RateRow label="Cleaner Rate" rate={facility.cleanerRate} effectiveFrom={facility.cleanerFrom}
          onSave={(rate) => onSaveRate(facility.facilityId, 'cleaner', rate)} />
        <RateRow label="Supervisor Rate" rate={facility.supervisorRate} effectiveFrom={facility.supervisorFrom}
          onSave={(rate) => onSaveRate(facility.facilityId, 'supervisor', rate)} />
      </div>

      {cleaners.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874]">Worker Hours</p>
          {cleaners.map((c) => (
            <HoursRow
              key={c.id}
              name={c.name}
              displayId={c.displayId}
              hours={facility.hours[c.id] ?? null}
              onSave={(hours) => onSaveHours(facility.facilityId, c.id, hours)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page content ─────────────────────────────────────────────────────────────

function RatesContent() {
  const { user } = useApp()
  const navigate = useNavigate()
  const { loading, facilities, cleaners, reload } = useRatesData()

  async function handleSaveRate(facilityId: string, roleType: 'cleaner' | 'supervisor', rate: number): Promise<string | null> {
    if (!user) return 'Not signed in.'
    const { error } = await supabase.from('facility_rates').insert({
      facility_id: facilityId,
      role_type: roleType,
      hourly_rate: rate,
      effective_from: new Date().toISOString().slice(0, 10),
      company_id: user.company_id,
    })
    if (error) { console.error('Failed to save facility rate:', error); return 'Could not save. Try again.' }
    void reload()
    return null
  }

  async function handleSaveHours(facilityId: string, cleanerId: string, hours: number): Promise<string | null> {
    if (!user) return 'Not signed in.'
    const { error } = await supabase.from('cleaner_facility_hours').upsert({
      facility_id: facilityId,
      cleaner_id: cleanerId,
      company_id: user.company_id,
      expected_hours: hours,
    }, { onConflict: 'cleaner_id,facility_id' })
    if (error) { console.error('Failed to save worker hours:', error); return 'Could not save. Try again.' }
    void reload()
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 md:py-10 pb-[100px] md:pb-10">
      <div className="mb-8">
        <p className="font-['Lato',sans-serif] text-[13px] text-[#B8A77A] font-bold tracking-[1.5px] uppercase mb-1">Pay Management</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[28px] md:text-[36px] text-[#1A1C19] leading-tight">Manage Facilities</h1>
            <p className="font-['Lato',sans-serif] text-[14px] text-[#737874] mt-2">
              Hourly rates and expected worker hours for your facilities.
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
          {facilities.map((fac) => (
            <FacilityCard key={fac.facilityId} facility={fac} cleaners={cleaners} onSaveRate={handleSaveRate} onSaveHours={handleSaveHours} />
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

/** Supervisor portal — manage facility hourly rates and per-worker expected hours. */
export function Rates() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopRates /> : <MobileRates />
}
