import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { postRecurringSync } from '../../lib/webhooks'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { SupervisorDesktopSidebar } from '../../components/supervisor/SupervisorDesktopSidebar'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { RecurringRuleForm, type RecurringRule } from '../../components/supervisor/RecurringRuleForm'
import type { Cleaner } from './Jobs'

const DAY_LABEL_KEYS = ['sv_day_sun', 'sv_day_mon', 'sv_day_tue', 'sv_day_wed', 'sv_day_thu', 'sv_day_fri', 'sv_day_sat']

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SyncIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={spinning ? 'animate-spin' : ''}>
      <path d="M4 4v6h6M20 20v-6h-6M5.5 9a7 7 0 0 1 12.3-3M18.5 15a7 7 0 0 1-12.3 3" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RuleRow({ rule, cleanerName, onEdit, onToggleActive, onDeleteClick, confirming, mutating, t }: {
  rule: RecurringRule
  cleanerName: string
  onEdit: () => void
  onToggleActive: () => void
  onDeleteClick: () => void
  confirming: boolean
  mutating: boolean
  t: (key: string) => string
}) {
  const dayLabels = [...rule.days_of_week].sort().map((d) => t(DAY_LABEL_KEYS[d])).join(', ')

  return (
    <div className="flex items-center gap-3 bg-white border border-[#D0CFCA] rounded-[10px] px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19] truncate">{rule.zone_name}</p>
        <p className="font-['Lato',sans-serif] text-[12px] text-[#737874] truncate">{cleanerName} · {dayLabels}</p>
      </div>
      <span className={[
        "shrink-0 font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.5px] px-2 py-0.5 rounded-full",
        rule.active ? 'bg-[#D7E6DB] text-[#2F4A3D]' : 'bg-[#E3E3DD] text-[#737874]',
      ].join(' ')}>
        {rule.active ? t('sv_recurring_active') : t('sv_recurring_paused')}
      </span>
      <button onClick={onToggleActive} disabled={mutating}
        className="h-8 px-3 border border-[#D0CFCA] rounded-[6px] font-['Poppins',sans-serif] font-semibold text-[12px] text-[#434844] hover:border-[#B8A77A] transition-colors shrink-0 disabled:opacity-40">
        {rule.active ? t('sv_recurring_pause') : t('sv_recurring_resume')}
      </button>
      <button onClick={onEdit} aria-label="Edit rule" disabled={mutating}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F4F4EE] transition-colors shrink-0 disabled:opacity-40">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="#737874" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button onClick={onDeleteClick} disabled={mutating} aria-label={confirming ? 'Confirm delete rule' : 'Delete rule'}
        className={[
          'shrink-0 transition-colors disabled:opacity-40',
          confirming
            ? "h-8 px-3 flex items-center justify-center rounded-[6px] bg-[#BA1A1A] font-['Poppins',sans-serif] font-semibold text-[12px] text-white"
            : 'w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FDECEA]',
        ].join(' ')}>
        {confirming ? (
          t('sv_recurring_confirm_delete')
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="#BA1A1A" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  )
}

/** Manage a facility's recurring zone assignments — dispatched from Jobs.tsx via ?action=recurring. */
export function RecurringSchedule({ facilityId }: { facilityId: string }) {
  const { user } = useApp()
  const t = useTranslation()
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()

  const [rules, setRules] = useState<RecurringRule[]>([])
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [facilityName, setFacilityName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list')
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set())
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ text: string; isError: boolean } | null>(null)

  // `t` intentionally left out of the dependency array below — it's a new closure
  // every render (see useTranslation), and including it would re-trigger the
  // mount effect on every render instead of only when `user`/`facilityId` change.
  const load = useCallback(async (silent = false) => {
    if (!user) return
    if (!silent) setLoading(true)
    const [rulesRes, cleanersRes, facilityRes] = await Promise.all([
      supabase.from('recurring_zone_rules')
        .select('id, zone_name, cleaner_id, days_of_week, notes, active')
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: true }),
      supabase.from('profiles').select('id, full_name, display_id')
        .eq('company_id', user.company_id).in('role', ['cleaner']),
      supabase.from('facilities').select('name').eq('id', facilityId).single(),
    ])
    const loadError = rulesRes.error ?? cleanersRes.error ?? facilityRes.error
    if (loadError) {
      console.error('Failed to load recurring schedule data:', loadError)
      setError(t('sv_recurring_load_failed'))
      setLoading(false)
      return
    }
    setError('')
    setRules((rulesRes.data ?? []) as unknown as RecurringRule[])
    setCleaners((cleanersRes.data ?? []) as unknown as Cleaner[])
    setFacilityName((facilityRes.data as { name: string } | null)?.name ?? '')
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, facilityId])

  useEffect(() => { void load() }, [load])

  function cleanerName(cleanerId: string): string {
    const c = cleaners.find((x) => x.id === cleanerId)
    return c?.full_name ?? c?.display_id ?? t('sv_unassigned')
  }

  function addMutating(id: string) {
    setMutatingIds((prev) => new Set(prev).add(id))
  }

  function removeMutating(id: string) {
    setMutatingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
  }

  async function toggleActive(rule: RecurringRule) {
    addMutating(rule.id)
    const { error: err } = await supabase.from('recurring_zone_rules').update({ active: !rule.active }).eq('id', rule.id)
    if (err) {
      console.error('Failed to toggle recurring rule active state:', err)
      setError(t('sv_recurring_load_failed'))
      removeMutating(rule.id)
      return
    }
    removeMutating(rule.id)
    void load(true)
  }

  async function deleteRule(rule: RecurringRule) {
    addMutating(rule.id)
    const { error: err } = await supabase.from('recurring_zone_rules').delete().eq('id', rule.id)
    if (err) {
      console.error('Failed to delete recurring rule:', err)
      setError(t('sv_recurring_load_failed'))
      removeMutating(rule.id)
      setConfirmingDeleteId(null)
      return
    }
    removeMutating(rule.id)
    setConfirmingDeleteId(null)
    void load(true)
  }

  function handleEditClick(rule: RecurringRule) {
    setConfirmingDeleteId(null)
    setEditingRule(rule)
    setMode('edit')
  }

  function handleToggleClick(rule: RecurringRule) {
    setConfirmingDeleteId(null)
    void toggleActive(rule)
  }

  function handleDeleteClick(rule: RecurringRule) {
    if (confirmingDeleteId === rule.id) {
      void deleteRule(rule)
      return
    }
    setConfirmingDeleteId(rule.id)
  }

  function goBackToJobs() {
    navigate(`/supervisor/jobs?facility=${facilityId}`)
  }

  async function handleSyncNow() {
    setSyncing(true)
    setSyncMessage(null)
    try {
      await postRecurringSync()
      setSyncMessage({ text: t('sv_recurring_sync_success'), isError: false })
    } catch (err) {
      console.error('Failed to trigger recurring sync:', err)
      setSyncMessage({ text: t('sv_recurring_sync_error'), isError: true })
    } finally {
      setSyncing(false)
    }
  }

  if (mode === 'add' || mode === 'edit') {
    return (
      <RecurringRuleForm
        facilityId={facilityId}
        cleaners={cleaners}
        initialRule={mode === 'edit' ? editingRule : null}
        onSaved={() => { setMode('list'); void load(true) }}
        onCancel={() => setMode('list')}
      />
    )
  }

  const body = loading ? (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => <div key={i} className="h-[72px] bg-white border border-[#D0CFCA] rounded-[10px] animate-pulse" />)}
    </div>
  ) : rules.length === 0 && !error ? (
    <div className="bg-white border border-dashed border-[#C3C8C2] rounded-[12px] p-8 flex flex-col items-center gap-1 text-center">
      <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19]">{t('sv_recurring_no_rules')}</p>
      <p className="font-['Lato',sans-serif] text-[13px] text-[#9E9E9E] max-w-[280px]">{t('sv_recurring_no_rules_body')}</p>
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      {error && <p className="font-['Lato',sans-serif] text-[13px] text-[#BA1A1A]">{error}</p>}
      {rules.map((rule) => (
        <RuleRow
          key={rule.id}
          rule={rule}
          cleanerName={cleanerName(rule.cleaner_id)}
          confirming={confirmingDeleteId === rule.id}
          mutating={mutatingIds.has(rule.id)}
          onEdit={() => handleEditClick(rule)}
          onToggleActive={() => handleToggleClick(rule)}
          onDeleteClick={() => handleDeleteClick(rule)}
          t={t}
        />
      ))}
    </div>
  )

  const addButton = (
    <button onClick={() => { setConfirmingDeleteId(null); setMode('add') }}
      className="w-full h-[52px] bg-[#1A1C19] rounded-[10px] font-['Poppins',sans-serif] font-semibold text-sm text-white hover:bg-[#2e3130] transition-colors">
      {t('sv_add_recurring_zone')} +
    </button>
  )

  const syncButton = (
    <div className="flex flex-col gap-1.5">
      <button onClick={handleSyncNow} disabled={syncing}
        className="w-full h-[52px] bg-[#B8A77A] rounded-[10px] font-['Poppins',sans-serif] font-semibold text-sm text-[#1A1C19] hover:bg-[#a8976a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        <SyncIcon spinning={syncing} />
        {syncing ? t('sv_recurring_syncing') : t('sv_recurring_sync_now')}
      </button>
      <p className="font-['Lato',sans-serif] text-[11px] text-[#9E9E9E] text-center">
        {t('sv_recurring_sync_note')}
      </p>
      {syncMessage && (
        <p className={`font-['Lato',sans-serif] text-[12px] text-center ${syncMessage.isError ? 'text-[#BA1A1A]' : 'text-[#2F4A3D]'}`}>
          {syncMessage.text}
        </p>
      )}
    </div>
  )

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-[#F4F4EE]">
        <SupervisorDesktopSidebar active="jobs" />
        <main className="pl-60">
          <div className="max-w-2xl mx-auto px-10 py-10 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <button onClick={goBackToJobs} aria-label="Back"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors shrink-0">
                <BackIcon />
              </button>
              <div className="min-w-0">
                <p className="font-['Lato',sans-serif] font-bold text-[11px] tracking-[1.2px] text-[#B8A77A] uppercase mb-0.5">
                  {facilityName || '…'}
                </p>
                <h1 className="font-['Poppins',sans-serif] font-bold text-[32px] text-[#1A1C19] leading-[1.1] tracking-[-0.5px]">
                  {t('sv_recurring_schedule_title')}
                </h1>
                <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">{t('sv_recurring_schedule_subtitle')}</p>
              </div>
            </div>
            {addButton}
            {syncButton}
            {body}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] flex flex-col">
      <div className="w-full max-w-[480px] mx-auto px-6 flex flex-col flex-1 overflow-y-auto pb-[100px]">
        <div className="flex items-center gap-3 pt-10 pb-4">
          <button onClick={goBackToJobs} aria-label="Back"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors shrink-0">
            <BackIcon />
          </button>
        </div>
        <div className="pb-6">
          <p className="font-['Lato',sans-serif] font-bold text-[11px] tracking-[1.2px] text-[#B8A77A] uppercase mb-0.5">
            {facilityName || '…'}
          </p>
          <h1 className="font-['Poppins',sans-serif] font-bold text-[22px] text-[#1A1C19] leading-[1.1] tracking-[-0.3px]">
            {t('sv_recurring_schedule_title')}
          </h1>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">{t('sv_recurring_schedule_subtitle')}</p>
        </div>
        <div className="flex flex-col gap-4">
          {addButton}
          {syncButton}
          {body}
        </div>
      </div>
      <SupervisorNav active="jobs" />
    </div>
  )
}
