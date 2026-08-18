# Recurring Zone Assignments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a supervisor define a zone + cleaner assignment once, with a set of repeating weekdays, so it's created automatically each matching day instead of being re-entered by hand.

**Architecture:** A new `recurring_zone_rules` table (RLS-protected, scoped like the existing `job_zones`/`jobs` supervisor policies) holds each rule. A new supervisor screen manages rules per facility, dispatched from the existing `/supervisor/jobs` route via `?action=recurring` — following the exact same convention as `StartShiftScreen`/`AddZoneScreen`/`ZoneEditScreen`. The actual daily auto-creation (WF-16, an n8n Schedule Trigger workflow) is **out of scope for this plan** — it happens on the live Hostinger n8n instance once Kevin connects Claude to it in a future session. This plan covers everything buildable now: the database layer and the full supervisor-facing app UI, so the recurring rules are ready to be read by WF-16 the moment it exists.

**Tech Stack:** React 18 + TypeScript (strict), Tailwind utility classes, React Router v6, Supabase (Postgres + RLS), no test runner (this project has none configured — verified via `package.json`; every task's "test" step is a TypeScript build check plus a manual browser check at `localhost`, matching how the rest of this codebase is developed per its own `CLAUDE.md`).

**Spec:** `docs/superpowers/specs/2026-08-18-recurring-zone-assignments-design.md`

## Global Constraints

- No `any` types — cast to `unknown` first if needed (existing project convention, used throughout `Jobs.tsx`).
- Named exports only, no default exports.
- Tailwind utility classes only, no custom CSS/inline styles.
- Every component handles loading, error, and empty states.
- Keep new components under ~150 lines; split further if a step would push a file over that.
- No JSDoc/comment blocks unless the WHY is genuinely non-obvious.
- All UI strings go through `src/lib/i18n/index.ts` / `useTranslation()` — no hardcoded English in components.
- Brand tokens are fixed hex values (see spec / root `CLAUDE.md`) — do not approximate.
- Supabase project: `bstohwxzufebufbybxtd` — this is the **live production** database serving a real client today. Every migration step in this plan is additive (new table, new policies) and touches no existing table or existing row.
- Flat sequential queries, never nested joins on ambiguous FKs — join in JS (existing project convention, see `Critical Query Patterns` in root `CLAUDE.md`).

---

### Task 1: Database migration — `recurring_zone_rules` table + RLS

**Files:** None in this repo (no local migrations folder exists in this project — schema changes are applied directly to the live Supabase project via the Supabase MCP `apply_migration` tool, the same way the `evidence_files.file_type` / `evidence-videos` bucket work was done in the sibling `feature/multi-photo-video-evidence` branch).

**Interfaces:**
- Produces: table `recurring_zone_rules` with columns `id uuid pk`, `facility_id uuid`, `company_id uuid`, `zone_name text not null`, `cleaner_id uuid not null`, `days_of_week smallint[] not null`, `notes text`, `active boolean not null default true`, `created_by uuid`, `created_at timestamptz default now()`. RLS enabled, four policies (select/insert/update/delete) scoped to `company_id = get_my_company_id()` and `get_my_role() = 'supervisor'`.

- [ ] **Step 1: Apply the migration**

Call the Supabase MCP `apply_migration` tool with `project_id: "bstohwxzufebufbybxtd"`, `name: "add_recurring_zone_rules"`, and this SQL:

```sql
create table recurring_zone_rules (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references facilities(id),
  company_id uuid not null references companies(id),
  zone_name text not null,
  cleaner_id uuid not null references profiles(id),
  days_of_week smallint[] not null,
  notes text,
  active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table recurring_zone_rules enable row level security;

create policy "recurring_zone_rules: supervisor select"
  on recurring_zone_rules for select
  using (get_my_role() = 'supervisor' and company_id = get_my_company_id());

create policy "recurring_zone_rules: supervisor insert"
  on recurring_zone_rules for insert
  with check (get_my_role() = 'supervisor' and company_id = get_my_company_id());

create policy "recurring_zone_rules: supervisor update"
  on recurring_zone_rules for update
  using (get_my_role() = 'supervisor' and company_id = get_my_company_id())
  with check (get_my_role() = 'supervisor' and company_id = get_my_company_id());

create policy "recurring_zone_rules: supervisor delete"
  on recurring_zone_rules for delete
  using (get_my_role() = 'supervisor' and company_id = get_my_company_id());
```

- [ ] **Step 2: Verify the table and policies exist**

Call the Supabase MCP `execute_sql` tool with `project_id: "bstohwxzufebufbybxtd"`:

```sql
select column_name, data_type, is_nullable from information_schema.columns
where table_name = 'recurring_zone_rules' order by ordinal_position;
```

Expected: 10 rows matching the columns above, `cleaner_id`/`facility_id`/`company_id`/`zone_name`/`days_of_week`/`active`/`created_at` all `is_nullable = 'NO'`.

Then:

```sql
select policyname, cmd from pg_policies where tablename = 'recurring_zone_rules' order by policyname;
```

Expected: 4 rows (select/insert/update/delete), all named `recurring_zone_rules: supervisor ...`.

- [ ] **Step 3: Commit**

No repo files changed by this task (the migration lives in Supabase, not in a local migrations folder — this matches the existing project convention). Nothing to commit here; proceed to Task 2.

---

### Task 2: `DayOfWeekPicker` component

**Files:**
- Create: `src/components/supervisor/DayOfWeekPicker.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `export function DayOfWeekPicker(props: { value: number[]; onChange: (days: number[]) => void }): JSX.Element`. `value`/`onChange` use JS `Date.getDay()` convention: `0`=Sunday … `6`=Saturday. Later tasks (Task 5) import this exact name and prop shape.

- [ ] **Step 1: Write the component**

```tsx
import { useTranslation } from '../../lib/useTranslation'

// Displayed Monday-first (more natural for a work schedule), even though
// the stored/emitted values use JS Date.getDay() convention (0=Sun..6=Sat).
const DISPLAY_ORDER: { day: number; labelKey: string }[] = [
  { day: 1, labelKey: 'sv_day_mon' },
  { day: 2, labelKey: 'sv_day_tue' },
  { day: 3, labelKey: 'sv_day_wed' },
  { day: 4, labelKey: 'sv_day_thu' },
  { day: 5, labelKey: 'sv_day_fri' },
  { day: 6, labelKey: 'sv_day_sat' },
  { day: 0, labelKey: 'sv_day_sun' },
]

interface DayOfWeekPickerProps {
  value: number[]
  onChange: (days: number[]) => void
}

/** Mon-first multi-select of weekdays. Emits/accepts JS Date.getDay() values (0=Sun..6=Sat). */
export function DayOfWeekPicker({ value, onChange }: DayOfWeekPickerProps) {
  const t = useTranslation()

  function toggle(day: number) {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort())
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {DISPLAY_ORDER.map(({ day, labelKey }) => {
        const selected = value.includes(day)
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            className={[
              "w-11 h-11 rounded-[8px] font-['Poppins',sans-serif] font-semibold text-[13px] border-2 transition-colors",
              selected
                ? 'bg-[#1A1C19] border-[#1A1C19] text-white'
                : 'border-[#C3C8C2] text-[#434844] bg-white hover:border-[#B8A77A]',
            ].join(' ')}
          >
            {t(labelKey)}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: no new errors (this file has no consumers yet, so it should compile standalone — `t(labelKey)` will show a missing-key fallback in the browser later until Task 3 adds the keys, which is fine at this point).

- [ ] **Step 3: Commit**

```bash
git add src/components/supervisor/DayOfWeekPicker.tsx
git commit -m "feat: add DayOfWeekPicker component for recurring zone schedule"
```

---

### Task 3: i18n strings

**Files:**
- Modify: `src/lib/i18n/index.ts:238` (after `sv_delete_zone` in the `en` block, ~line 238)
- Modify: `src/lib/i18n/index.ts:598` (after `sv_delete_zone` in the `es` block — line number will have shifted by however many lines Task 2/this task's `en` insertion added; find the `es` block's own `sv_delete_zone: 'Eliminar zona',` line and insert after it)
- Modify: `src/lib/i18n/index.ts:958` (same, in the `pt` block, after `sv_delete_zone: 'Excluir zona',`)

**Interfaces:**
- Produces: new translation keys `sv_recurring_schedule_title`, `sv_recurring_schedule_subtitle`, `sv_add_recurring_zone`, `sv_recurring_days_label`, `sv_recurring_days_required`, `sv_recurring_cleaner_required`, `sv_recurring_no_rules`, `sv_recurring_no_rules_body`, `sv_recurring_active`, `sv_recurring_paused`, `sv_recurring_pause`, `sv_recurring_resume`, `sv_day_mon`, `sv_day_tue`, `sv_day_wed`, `sv_day_thu`, `sv_day_fri`, `sv_day_sat`, `sv_day_sun` — consumed by Task 2 (`DayOfWeekPicker`) and Tasks 5–6 (form + list screen).

- [ ] **Step 1: Add English keys**

In `src/lib/i18n/index.ts`, find this exact block in the `en:` section:

```typescript
    sv_zone_notes_placeholder: 'Optional guidance for the cleaner assigned to this zone...',
    sv_save_changes: 'Save Changes',
    sv_duplicate_zone: 'Duplicate',
    sv_delete_zone: 'Delete Zone',
```

Replace it with:

```typescript
    sv_zone_notes_placeholder: 'Optional guidance for the cleaner assigned to this zone...',
    sv_save_changes: 'Save Changes',
    sv_duplicate_zone: 'Duplicate',
    sv_delete_zone: 'Delete Zone',

    // Recurring zone schedule
    sv_recurring_schedule_title: 'Recurring Schedule',
    sv_recurring_schedule_subtitle: 'Zones that repeat automatically on the days you choose',
    sv_add_recurring_zone: 'Add Recurring Zone',
    sv_recurring_days_label: 'Repeats On',
    sv_recurring_days_required: 'Select at least one day',
    sv_recurring_cleaner_required: 'Select a cleaner',
    sv_recurring_no_rules: 'No Recurring Zones',
    sv_recurring_no_rules_body: 'Set up a zone once and it will be created automatically on the days you choose.',
    sv_recurring_active: 'Active',
    sv_recurring_paused: 'Paused',
    sv_recurring_pause: 'Pause',
    sv_recurring_resume: 'Resume',
    sv_day_mon: 'Mon',
    sv_day_tue: 'Tue',
    sv_day_wed: 'Wed',
    sv_day_thu: 'Thu',
    sv_day_fri: 'Fri',
    sv_day_sat: 'Sat',
    sv_day_sun: 'Sun',
```

- [ ] **Step 2: Add Spanish keys**

Find this exact block in the `es:` section:

```typescript
    sv_zone_notes_placeholder: 'Instrucciones opcionales para el limpiador asignado a esta zona...',
    sv_save_changes: 'Guardar cambios',
    sv_duplicate_zone: 'Duplicar',
    sv_delete_zone: 'Eliminar zona',
```

Replace it with:

```typescript
    sv_zone_notes_placeholder: 'Instrucciones opcionales para el limpiador asignado a esta zona...',
    sv_save_changes: 'Guardar cambios',
    sv_duplicate_zone: 'Duplicar',
    sv_delete_zone: 'Eliminar zona',

    // Recurring zone schedule
    sv_recurring_schedule_title: 'Horario recurrente',
    sv_recurring_schedule_subtitle: 'Zonas que se crean automáticamente en los días que elijas',
    sv_add_recurring_zone: 'Añadir zona recurrente',
    sv_recurring_days_label: 'Se repite en',
    sv_recurring_days_required: 'Selecciona al menos un día',
    sv_recurring_cleaner_required: 'Selecciona un limpiador',
    sv_recurring_no_rules: 'Sin zonas recurrentes',
    sv_recurring_no_rules_body: 'Configura una zona una vez y se creará automáticamente en los días que elijas.',
    sv_recurring_active: 'Activo',
    sv_recurring_paused: 'Pausado',
    sv_recurring_pause: 'Pausar',
    sv_recurring_resume: 'Reanudar',
    sv_day_mon: 'Lun',
    sv_day_tue: 'Mar',
    sv_day_wed: 'Mié',
    sv_day_thu: 'Jue',
    sv_day_fri: 'Vie',
    sv_day_sat: 'Sáb',
    sv_day_sun: 'Dom',
```

- [ ] **Step 3: Add Portuguese keys**

Find this exact block in the `pt:` section:

```typescript
    sv_zone_notes_placeholder: 'Orientações opcionais para o limpador atribuído a esta zona...',
    sv_save_changes: 'Salvar alterações',
    sv_duplicate_zone: 'Duplicar',
    sv_delete_zone: 'Excluir zona',
```

Replace it with:

```typescript
    sv_zone_notes_placeholder: 'Orientações opcionais para o limpador atribuído a esta zona...',
    sv_save_changes: 'Salvar alterações',
    sv_duplicate_zone: 'Duplicar',
    sv_delete_zone: 'Excluir zona',

    // Recurring zone schedule
    sv_recurring_schedule_title: 'Horário recorrente',
    sv_recurring_schedule_subtitle: 'Zonas criadas automaticamente nos dias que você escolher',
    sv_add_recurring_zone: 'Adicionar zona recorrente',
    sv_recurring_days_label: 'Repete em',
    sv_recurring_days_required: 'Selecione pelo menos um dia',
    sv_recurring_cleaner_required: 'Selecione um limpador',
    sv_recurring_no_rules: 'Nenhuma zona recorrente',
    sv_recurring_no_rules_body: 'Configure uma zona uma vez e ela será criada automaticamente nos dias escolhidos.',
    sv_recurring_active: 'Ativo',
    sv_recurring_paused: 'Pausado',
    sv_recurring_pause: 'Pausar',
    sv_recurring_resume: 'Retomar',
    sv_day_mon: 'Seg',
    sv_day_tue: 'Ter',
    sv_day_wed: 'Qua',
    sv_day_thu: 'Qui',
    sv_day_fri: 'Sex',
    sv_day_sat: 'Sáb',
    sv_day_sun: 'Dom',
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/index.ts
git commit -m "feat: add i18n strings for recurring zone schedule (en/es/pt)"
```

---

### Task 4: Export `CleanerPicker` from `Jobs.tsx`

**Files:**
- Modify: `src/pages/supervisor/Jobs.tsx` (the `CleanerPicker` function definition, currently unexported — search for `function CleanerPicker({ cleaners, value, onChange, unassignedLabel }`)

**Interfaces:**
- Produces: `export function CleanerPicker(props: { cleaners: Cleaner[]; value: string; onChange: (id: string) => void; unassignedLabel: string }): JSX.Element` — same signature as today, just exported. `Cleaner` shape: `{ id: string; full_name: string; display_id: string }`. Task 5 imports this.

- [ ] **Step 1: Add the export keyword**

In `src/pages/supervisor/Jobs.tsx`, find:

```typescript
function CleanerPicker({ cleaners, value, onChange, unassignedLabel }: {
```

Change to:

```typescript
export function CleanerPicker({ cleaners, value, onChange, unassignedLabel }: {
```

Also find the `Cleaner` interface near the top of the file:

```typescript
interface Cleaner   { id: string; full_name: string; display_id: string }
```

Change to:

```typescript
export interface Cleaner { id: string; full_name: string; display_id: string }
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: no new errors — this is a pure export addition, no behavior change.

- [ ] **Step 3: Commit**

```bash
git add src/pages/supervisor/Jobs.tsx
git commit -m "refactor: export CleanerPicker and Cleaner type for reuse"
```

---

### Task 5: `RecurringRuleForm` component (add/edit)

**Files:**
- Create: `src/components/supervisor/RecurringRuleForm.tsx`

**Interfaces:**
- Consumes: `CleanerPicker`, `Cleaner` from `../../pages/supervisor/Jobs` (Task 4); `DayOfWeekPicker` from `./DayOfWeekPicker` (Task 2); `useTranslation` from `../../lib/useTranslation`; `useApp` from `../../context/AppContext`; `supabase` from `../../lib/supabase`; `useIsDesktop` from `../../hooks/useIsDesktop`; `SupervisorDesktopSidebar` from `./SupervisorDesktopSidebar`; `SupervisorNav` from `./SupervisorNav`.
- Produces: `export interface RecurringRule { id: string; zone_name: string; cleaner_id: string; days_of_week: number[]; notes: string | null; active: boolean }` and `export function RecurringRuleForm(props: { facilityId: string; cleaners: Cleaner[]; initialRule: RecurringRule | null; onSaved: () => void; onCancel: () => void }): JSX.Element`. `initialRule: null` means "add mode"; a populated `RecurringRule` means "edit mode". Task 6 imports both.

- [ ] **Step 1: Write the component**

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: no errors. If `CleanerPicker`/`Cleaner` fail to import, confirm Task 4 was applied correctly (both need the `export` keyword).

- [ ] **Step 3: Commit**

```bash
git add src/components/supervisor/RecurringRuleForm.tsx
git commit -m "feat: add RecurringRuleForm component for add/edit recurring zones"
```

---

### Task 6: `RecurringSchedule` page (list view + wiring)

**Files:**
- Create: `src/pages/supervisor/RecurringSchedule.tsx`

**Interfaces:**
- Consumes: `RecurringRuleForm`, `RecurringRule` from `../../components/supervisor/RecurringRuleForm` (Task 5); `Cleaner` from `./Jobs` (Task 4).
- Produces: `export function RecurringSchedule(props: { facilityId: string }): JSX.Element`. Task 7 imports this and renders it from `Jobs()`.

- [ ] **Step 1: Write the component**

```tsx
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
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

function RuleRow({ rule, cleanerName, onEdit, onToggleActive, onDelete, t }: {
  rule: RecurringRule
  cleanerName: string
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
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
      <button onClick={onToggleActive}
        className="h-8 px-3 border border-[#D0CFCA] rounded-[6px] font-['Poppins',sans-serif] font-semibold text-[12px] text-[#434844] hover:border-[#B8A77A] transition-colors shrink-0">
        {rule.active ? t('sv_recurring_pause') : t('sv_recurring_resume')}
      </button>
      <button onClick={onEdit} aria-label="Edit rule"
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F4F4EE] transition-colors shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="#737874" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button onClick={onDelete} aria-label="Delete rule"
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FDECEA] transition-colors shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" stroke="#BA1A1A" strokeWidth="2" strokeLinecap="round" />
        </svg>
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
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list')
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [rulesRes, cleanersRes, facilityRes] = await Promise.all([
      supabase.from('recurring_zone_rules')
        .select('id, zone_name, cleaner_id, days_of_week, notes, active')
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: true }),
      supabase.from('profiles').select('id, full_name, display_id')
        .eq('company_id', user.company_id).in('role', ['cleaner']),
      supabase.from('facilities').select('name').eq('id', facilityId).single(),
    ])
    setRules((rulesRes.data ?? []) as unknown as RecurringRule[])
    setCleaners((cleanersRes.data ?? []) as unknown as Cleaner[])
    setFacilityName((facilityRes.data as { name: string } | null)?.name ?? '')
    setLoading(false)
  }, [user, facilityId])

  useEffect(() => { void load() }, [load])

  function cleanerName(cleanerId: string): string {
    const c = cleaners.find((x) => x.id === cleanerId)
    return c?.full_name ?? c?.display_id ?? t('sv_unassigned')
  }

  async function toggleActive(rule: RecurringRule) {
    await supabase.from('recurring_zone_rules').update({ active: !rule.active }).eq('id', rule.id)
    void load()
  }

  async function deleteRule(rule: RecurringRule) {
    await supabase.from('recurring_zone_rules').delete().eq('id', rule.id)
    void load()
  }

  function goBackToJobs() {
    navigate(`/supervisor/jobs?facility=${facilityId}`)
  }

  if (mode === 'add' || mode === 'edit') {
    return (
      <RecurringRuleForm
        facilityId={facilityId}
        cleaners={cleaners}
        initialRule={mode === 'edit' ? editingRule : null}
        onSaved={() => { setMode('list'); void load() }}
        onCancel={() => setMode('list')}
      />
    )
  }

  const body = loading ? (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => <div key={i} className="h-[72px] bg-white border border-[#D0CFCA] rounded-[10px] animate-pulse" />)}
    </div>
  ) : rules.length === 0 ? (
    <div className="bg-white border border-dashed border-[#C3C8C2] rounded-[12px] p-8 flex flex-col items-center gap-1 text-center">
      <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19]">{t('sv_recurring_no_rules')}</p>
      <p className="font-['Lato',sans-serif] text-[13px] text-[#9E9E9E] max-w-[280px]">{t('sv_recurring_no_rules_body')}</p>
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      {rules.map((rule) => (
        <RuleRow
          key={rule.id}
          rule={rule}
          cleanerName={cleanerName(rule.cleaner_id)}
          onEdit={() => { setEditingRule(rule); setMode('edit') }}
          onToggleActive={() => void toggleActive(rule)}
          onDelete={() => void deleteRule(rule)}
          t={t}
        />
      ))}
    </div>
  )

  const addButton = (
    <button onClick={() => setMode('add')}
      className="w-full h-[52px] bg-[#1A1C19] rounded-[10px] font-['Poppins',sans-serif] font-semibold text-sm text-white hover:bg-[#2e3130] transition-colors">
      {t('sv_add_recurring_zone')} +
    </button>
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
          {body}
        </div>
      </div>
      <SupervisorNav active="jobs" />
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/supervisor/RecurringSchedule.tsx
git commit -m "feat: add RecurringSchedule list screen"
```

---

### Task 7: Wire into `Jobs.tsx` — dispatch + entry point

**Files:**
- Modify: `src/pages/supervisor/Jobs.tsx` (imports, the `Jobs()` dispatch function, and `FacilityZonesView`'s desktop + mobile render paths)

**Interfaces:**
- Consumes: `RecurringSchedule` from `./RecurringSchedule` (Task 6).

- [ ] **Step 1: Import `RecurringSchedule`**

Near the top of `src/pages/supervisor/Jobs.tsx`, alongside the other imports, add:

```typescript
import { RecurringSchedule } from './RecurringSchedule'
```

- [ ] **Step 2: Add the dispatch line**

Find the `Jobs()` function's action dispatch block:

```typescript
  if (facilityId && action === 'start') return <StartShiftScreen facilityId={facilityId} />
  if (facilityId && action === 'build') return <ShiftBuilderScreen facilityId={facilityId} />
  if (facilityId && action === 'add') return <AddZoneScreen facilityId={facilityId} />
  if (facilityId && action === 'edit' && zoneId) return <ZoneEditScreen facilityId={facilityId} zoneId={zoneId} />
```

Add one line after it:

```typescript
  if (facilityId && action === 'start') return <StartShiftScreen facilityId={facilityId} />
  if (facilityId && action === 'build') return <ShiftBuilderScreen facilityId={facilityId} />
  if (facilityId && action === 'add') return <AddZoneScreen facilityId={facilityId} />
  if (facilityId && action === 'edit' && zoneId) return <ZoneEditScreen facilityId={facilityId} zoneId={zoneId} />
  if (facilityId && action === 'recurring') return <RecurringSchedule facilityId={facilityId} />
```

- [ ] **Step 3: Add the entry-point button**

`FacilityZonesView` itself doesn't branch on `isDesktop` — its two callers (`DesktopFacilityZonesView` and the bare mobile route in `Jobs()`) do — so one insertion point covers both layouts. Find this exact block (the boundary between the header conditional and the zones-loading conditional):

```tsx
            )}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] bg-white border border-[#D0CFCA] rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : !jobId ? (
```

Replace it with:

```tsx
            )}
          </div>
        )}

        <button
          onClick={() => navigate(`/supervisor/jobs?facility=${facilityId}&action=recurring`)}
          className="h-9 px-4 border border-[#D0CFCA] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-[13px] text-[#434844] hover:border-[#B8A77A] hover:text-[#1A1C19] transition-colors bg-white mb-4"
        >
          {t('sv_recurring_schedule_title')}
        </button>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] bg-white border border-[#D0CFCA] rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : !jobId ? (
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 5: Manual browser verification**

Run: `npm run dev`

1. Log in as a supervisor with at least one assigned facility (per project conventions, seeded accounts use display ID + `Welcome123!` — check current seeded accounts before picking one, since these may have changed since this plan was written).
2. Open that facility's Jobs screen, confirm the new "Recurring Schedule" button appears.
3. Click it, confirm the empty state shows ("No Recurring Zones").
4. Click "Add Recurring Zone", fill in a zone name, pick a cleaner, select at least one day, save. Confirm it appears in the list with the correct day labels.
5. Toggle it paused/active, confirm the pill and button label update.
6. Edit it — change the zone name — confirm the change persists after reload.
7. Delete it, confirm it disappears.
8. Test validation: try saving with no zone name / no cleaner / no days selected, confirm each shows its respective inline error and blocks save.
9. Check both desktop (wide window) and mobile (narrow window, `useIsDesktop()`'s breakpoint is ≥768px) layouts.

- [ ] **Step 6: Commit**

```bash
git add src/pages/supervisor/Jobs.tsx
git commit -m "feat: wire Recurring Schedule screen into supervisor Jobs view"
```

---

### Task 8: Lint check and final review

**Files:** None (verification only).

- [ ] **Step 1: Run lint**

Run: `npx eslint .`
Expected: no new errors beyond the project's existing pre-existing baseline (this project has 59 pre-existing `react-hooks/set-state-in-effect` errors unrelated to this feature — confirmed via `git stash`/lint-diff during the sibling `feature/multi-photo-video-evidence` branch work; don't try to fix those here, they're out of scope).

- [ ] **Step 2: Full typecheck**

Run: `npx tsc -b`
Expected: clean.

- [ ] **Step 3: Re-read the spec**

Open `docs/superpowers/specs/2026-08-18-recurring-zone-assignments-design.md` and confirm every section is covered:
- Data model → Task 1
- n8n WF-16 → explicitly out of scope for this plan (documented, not built)
- New screen + entry point + confirmed no `StartShiftScreen` change needed → Tasks 5–7
- i18n → Task 3
- Error handling → built into Task 5/6's inline validation and `catch`-free-but-logged Supabase error checks
- Testing → Task 7 Step 5

- [ ] **Step 4: Report status to the user**

Summarize what's done (DB table + RLS live in production; full supervisor UI built, tested, committed on `feature/recurring-zone-assignments`) and what's still pending (WF-16 in n8n — needs the Hostinger connection Kevin mentioned).
