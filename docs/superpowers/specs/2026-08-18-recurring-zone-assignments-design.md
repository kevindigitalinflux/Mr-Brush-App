# Recurring Zone Assignments — Design

## Context

Supervisors currently build a job's zones by hand every day: open a facility, click "Start Today's Shift" (or "Add Zone" on an existing job), type a zone name, and pick a cleaner from a dropdown. For cleaners with a fixed weekly pattern (e.g. Andres working Wednesdays and Thursdays at Journey London Office), this means re-entering the same zones on every matching day.

This feature lets a supervisor define a zone assignment once, with a set of weekdays it repeats on, and have the app create that day's `job_zones` automatically — no daily manual re-entry.

Feature request originated from supervisor/client feedback ahead of Andres's first shift (2026-08-19).

## Non-goals (v1)

- No interaction with the absence workflows (WF-A/B/C) — those are not yet fully wired (still need a Google Sheets → Supabase node swap per project status). A recurring zone is created even if the assigned cleaner is later marked absent; reassignment stays a manual supervisor action, same as any other zone today.
- No end date / expiry on a rule — rules run indefinitely until a supervisor deletes or pauses them.
- No retroactive backfill — a new rule takes effect from the next matching day the schedule runs, not the day it's created.
- No change to `StartShiftScreen` or `FacilityZonesView` routing logic — confirmed below that the existing "does a job already exist for today" check already does the right thing once recurring zones start landing automatically.

## Data model

New table `recurring_zone_rules`:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, pk | |
| `facility_id` | uuid → facilities | |
| `company_id` | uuid → companies | denormalized for RLS scoping, same pattern as other tables |
| `zone_name` | text, not null | copied onto each generated `job_zones.zone_name` |
| `cleaner_id` | uuid → profiles, **not null** | a rule always names a specific cleaner — an unassigned recurring rule isn't meaningful |
| `days_of_week` | smallint[], not null | `0`=Sunday … `6`=Saturday (JS `Date.getDay()` convention, matches what the n8n Code node will compute) |
| `notes` | text, nullable | copied onto generated `job_zones.notes` |
| `active` | boolean, not null, default true | pause without deleting |
| `created_by` | uuid → profiles | the supervisor who created it; also used as `jobs.supervisor_id` when WF-16 needs to create a new job |
| `created_at` | timestamptz, default now() | |

RLS: enable on the table. Supervisors can select/insert/update/delete rows where `company_id` matches their own `profiles.company_id` **and** they have a `supervisor_facilities` row for `facility_id` — same scoping already enforced on the `facilities`/`jobs` visibility path (see `Known Patterns & Gotchas` in root `CLAUDE.md`: supervisor facility visibility goes through `supervisor_facilities`, not `company_id` alone).

No changes to any existing table or existing RLS policy.

## n8n — WF-16 "Recurring Zone Auto-Assignment"

New workflow, numbered WF-16 (next free slot after WF-15).

1. **Schedule Trigger** — daily, early morning (e.g. 05:00), timezone Europe/London.
2. **Compute today** — Code node: `today = new Date().getDay()` (0–6).
3. **Get due rules** — Supabase node (or raw query): `select * from recurring_zone_rules where active = true and today = any(days_of_week)`.
4. **Group by facility_id** — Code node.
5. **Per facility group**:
   a. **Find today's job** — query `jobs` where `facility_id = ... and scheduled_date = today and status != 'cancelled'`.
   b. **If none found** — insert a new `jobs` row: `facility_id`, `company_id`, `scheduled_date = today`, `status = 'scheduled'`, `supervisor_id = <rule.created_by>` (use the first rule in the group's `created_by` — if a facility somehow has rules created by different supervisors, any one of them is an acceptable owner; this is a cosmetic assignment, not an access-control one, since visibility is via `supervisor_facilities`).
   c. **For each rule in the group** — check whether a `job_zones` row already exists for `(job_id, zone_name, cleaner_id)` (guards against the workflow being re-run, or a supervisor having already added the same zone manually that morning). If not present, insert `job_zones`: `job_id`, `zone_name`, `cleaner_id`, `notes`, `status = 'not_started'` (`priority` left at its column default — see note below).
6. Each `job_zones` insert fires the existing `on_job_zone_insert` Supabase Database Webhook → WF-10 → cleaner notification. **No new notification logic needed.**

This workflow is built and wired in n8n directly (not in this repo's codebase) once Kevin connects Claude to the Hostinger-hosted n8n instance. The local `n8n/` folder in this repo holds JSON exports of existing workflows for reference/documentation — a WF-16 export should be added there once built, following the same convention.

## App changes

### New screen: Recurring Schedule (`src/pages/supervisor/RecurringSchedule.tsx`)

Route: `/supervisor/recurring/:facilityId`.

List view — for the given facility, list all `recurring_zone_rules` rows: zone name, assigned cleaner, day-of-week badges (e.g. "Wed, Thu"), active/paused toggle, edit and delete actions. Empty state when a facility has no rules yet. Follows the existing supervisor screen conventions: `SupervisorDesktopSidebar` / `SupervisorNav` + `useIsDesktop()` split, `BackHeader`, card styling matching `ZoneEditScreen`/`AddZoneScreen`.

Add/Edit form — reuses `CleanerPicker` (already exported from `Jobs.tsx`; will need to be extracted to a shared location or imported directly, matching how other supervisor screens already share it) for cleaner selection. New `DayOfWeekPicker` component: 7 toggle buttons (Mon–Sun, ISO display order even though storage is JS-`getDay()` order — Monday-first is the more familiar week-start for a work schedule UI). Fields: zone name (text input, required), cleaner (required — no "unassigned" option, unlike ad-hoc zones), days of week (at least one required), notes (optional textarea). Save inserts/updates `recurring_zone_rules` directly via the Supabase client — this is supervisor-authored configuration, not part of the cleaning-evidence submission pipeline, so it's not subject to the "app never writes automation data" rule (which is specifically about `cleaning_logs` writes and `job_zone.status` changes during zone *submission* — the app already writes `jobs`/`job_zones` directly today for ad-hoc zone creation, and this follows the same existing pattern).

Note on `priority`: `job_zones.priority` exists in the schema and affects cleaner-side sort order (`ZoneList.tsx`), but no supervisor screen exposes an editor for it today — it's set only via direct SQL. Rather than introduce the first-ever UI for a field nothing has asked for, WF-16 leaves it at its column default when generating zones. Add it later if a real need shows up.

### Entry point

Add a "Recurring Schedule" link/button on the existing facility Jobs view (`FacilityZonesView` in `Jobs.tsx`) navigating to the new route. Exact placement: near the existing zone-management actions, visible regardless of whether today's job exists yet (recurring schedule is facility-level config, independent of any single day's job).

### Confirmed: no change needed to `StartShiftScreen` / `FacilityZonesView`

`FacilityZonesView.load()` (`Jobs.tsx` ~line 1110–1165) already queries for a job matching `facility_id` + `scheduled_date = today` before deciding what to render: if one exists, it shows the zones directly via `CleanerGroupSection`; the "Start Today's Shift" button (which routes to `StartShiftScreen`, the job-creation flow) is only reachable when `jobId` is `null` — i.e. no job exists yet for today. Once WF-16 creates a job with zones at 5am, a supervisor opening that facility later will see those zones immediately, with the existing "Add Zone" / shift-builder screens available to add more zones to the *same* job. There is no duplicate-job path to guard against — this was a concern raised during design but the existing code already handles it correctly.

## i18n

New UI strings needed in `src/lib/i18n/index.ts` (en/es/pt), following the existing `sv_*` naming convention used for supervisor-side strings: `sv_recurring_schedule_title`, `sv_add_recurring_zone`, `sv_recurring_days_label`, `sv_recurring_zone_required` (validation), `sv_recurring_cleaner_required`, `sv_recurring_days_required`, `sv_recurring_active`, `sv_recurring_paused`, `sv_recurring_no_rules`, `sv_recurring_no_rules_body`, day abbreviations (`sv_day_mon` … `sv_day_sun`).

## Error handling

- Save with no zone name / no cleaner / no days selected → inline validation errors, matching the existing pattern in `AddZoneScreen`/`ZoneEditScreen` (`setError(t('...'))`).
- Delete → same confirm-then-delete pattern as `ZoneEditScreen`'s zone delete (`confirmDelete` state, second click confirms).
- Supabase insert/update/delete failures → inline error banner, matching existing screens' `catch`/error-state conventions (never a bare `catch {}` — always at least `console.error`).
- WF-16 failures (e.g. Supabase insert error mid-run) are an n8n-side concern, handled when the workflow is built on the Hostinger instance — out of scope for this repo's code.

## Testing

Manual, per the project's standard workflow (no automated test runner configured):
1. Create a recurring rule for a test facility/cleaner/day combination, verify it appears in the list, edit it, pause it, delete it.
2. Verify RLS: a supervisor without a `supervisor_facilities` row for a given facility cannot see or manage its rules.
3. Once WF-16 is built in n8n: manually trigger it (or wait for the scheduled run) on a day matching a rule, verify the job/zones are created correctly and the cleaner receives the existing zone-assignment notification.
4. Verify a supervisor opening the facility on a day with auto-created zones sees them immediately (no "Start Today's Shift" button), and can still add further ad-hoc zones to the same job.
5. Verify pausing/deleting a rule stops future auto-creation without affecting already-created `job_zones`.
