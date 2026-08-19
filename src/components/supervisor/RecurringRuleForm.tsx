import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { SupervisorDesktopSidebar } from './SupervisorDesktopSidebar'
import { SupervisorNav } from './SupervisorNav'
import { CleanerPicker, type Cleaner } from '../../pages/supervisor/Jobs'
import { DayOfWeekPicker } from './DayOfWeekPicker'

export interface RecurringRule {
  id: string
  zone_name: string
  cleaner_id: string
  days_of_week: number[]
  notes: string | null
  active: boolean
}

interface RecurringRuleFormProps {
  facilityId: string
  cleaners: Cleaner[]
  initialRule: RecurringRule | null
  onSaved: () => void
  onCancel: () => void
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Add/edit form for a single recurring zone rule. Pass initialRule=null for add mode. */
export function RecurringRuleForm({ facilityId, cleaners, initialRule, onSaved, onCancel }: RecurringRuleFormProps) {
  const { user } = useApp()
  const t = useTranslation()
  const isDesktop = useIsDesktop()
  const isEdit = initialRule !== null

  const [zoneName, setZoneName] = useState(initialRule?.zone_name ?? '')
  const [cleanerId, setCleanerId] = useState(initialRule?.cleaner_id ?? '')
  const [days, setDays] = useState<number[]>(initialRule?.days_of_week ?? [])
  const [notes, setNotes] = useState(initialRule?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!zoneName.trim()) { setError(t('sv_zone_name_required')); return }
    if (!cleanerId) { setError(t('sv_recurring_cleaner_required')); return }
    if (days.length === 0) { setError(t('sv_recurring_days_required')); return }
    if (!user) return

    setSaving(true)
    setError('')

    if (isEdit) {
      const { error: err } = await supabase.from('recurring_zone_rules').update({
        zone_name: zoneName.trim(),
        cleaner_id: cleanerId,
        days_of_week: days,
        notes: notes.trim() || null,
      }).eq('id', initialRule.id)
      setSaving(false)
      if (err) { console.error('Failed to update recurring rule:', err); setError(t('sv_failed_save_zone')); return }
    } else {
      const { error: err } = await supabase.from('recurring_zone_rules').insert({
        facility_id: facilityId,
        company_id: user.company_id,
        zone_name: zoneName.trim(),
        cleaner_id: cleanerId,
        days_of_week: days,
        notes: notes.trim() || null,
        created_by: user.id,
      })
      setSaving(false)
      if (err) { console.error('Failed to create recurring rule:', err); setError(t('sv_failed_add_zone')); return }
    }

    onSaved()
  }

  const fields = (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase">
          {t('sv_zone_name_label')}
        </label>
        <input
          type="text"
          value={zoneName}
          onChange={(e) => { setZoneName(e.target.value); setError('') }}
          placeholder={t('sv_zone_name_placeholder')}
          className="h-[52px] border border-[#C3C8C2] rounded-[8px] px-4 font-['Lato',sans-serif] text-[15px] text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] transition-colors bg-white"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase">
          {t('sv_assign_cleaner_label')}
        </label>
        <CleanerPicker cleaners={cleaners} value={cleanerId} onChange={(id) => { setCleanerId(id); setError('') }} unassignedLabel={t('sv_unassigned')} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase">
          {t('sv_recurring_days_label')}
        </label>
        <DayOfWeekPicker value={days} onChange={(d) => { setDays(d); setError('') }} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase">
          {t('sv_zone_notes_label')}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('sv_zone_notes_placeholder')}
          rows={4}
          className="border border-[#C3C8C2] rounded-[8px] px-4 py-3 font-['Lato',sans-serif] text-[14px] text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] transition-colors resize-none bg-white"
        />
      </div>

      {error && <p className="font-['Lato',sans-serif] text-[13px] text-[#BA1A1A]">{error}</p>}

      <button onClick={handleSave} disabled={saving}
        className="w-full h-[56px] bg-[#B8A77A] rounded-[12px] font-['Poppins',sans-serif] font-semibold text-base text-white hover:bg-[#a8976a] transition-colors disabled:opacity-60">
        {saving ? t('submitting') : t('sv_save_changes')}
      </button>
      <button onClick={onCancel} className="w-full h-10 font-['Lato',sans-serif] text-[13px] text-[#737874] hover:text-[#1A1C19] transition-colors">
        Cancel
      </button>
    </div>
  )

  const title = isEdit ? t('sv_edit_zone_title') : t('sv_add_recurring_zone')

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-[#F4F4EE]">
        <SupervisorDesktopSidebar active="jobs" />
        <main className="pl-60">
          <div className="max-w-2xl mx-auto px-10 py-10">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={onCancel} aria-label="Back"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors shrink-0">
                <BackIcon />
              </button>
              <h1 className="font-['Poppins',sans-serif] font-bold text-[32px] text-[#1A1C19] leading-[1.1] tracking-[-0.5px]">
                {title}
              </h1>
            </div>
            {fields}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] flex flex-col">
      <div className="w-full max-w-[480px] mx-auto px-6 flex flex-col flex-1 overflow-y-auto pb-[100px]">
        <div className="flex items-center gap-3 pt-10 pb-6">
          <button onClick={onCancel} aria-label="Back"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors shrink-0">
            <BackIcon />
          </button>
          <h1 className="font-['Poppins',sans-serif] font-bold text-[22px] text-[#1A1C19] leading-[1.1] tracking-[-0.3px] flex-1 min-w-0 truncate">
            {title}
          </h1>
        </div>
        {fields}
      </div>
      <SupervisorNav active="jobs" />
    </div>
  )
}
