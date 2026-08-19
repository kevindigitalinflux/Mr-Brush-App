# Mr Brush & Co. — Cleaning Operations App

## What This Is
An internal field operations app for Mr Brush & Co., a commercial cleaning company. The app enables cleaners (field workers), supervisors, and building managers (clients) to manage and verify cleaning jobs in real time. The system is role-based: a user's `display_id` prefix (C = cleaner, S = supervisor, CL = client/building manager) determines which portal they access on login. The app never holds automation logic — it sends events to n8n, which handles all processing, database writes, and notifications.

---

## Tech Stack

| Layer | Default |
|---|---|
| Framework | React 18 with TypeScript |
| Build Tool | Vite (latest) |
| Styling | Tailwind CSS v3 — utility classes only, no custom CSS |
| Routing | React Router v6 |
| Database + Auth | Supabase |
| Hosting | Cloudflare Pages (auto-deploy from GitHub main) |
| Version Control | GitHub |
| Component Reference | 21st.dev |
| AI Dev Environment | Claude Code |
| Automation | n8n (webhook-triggered, self-hosted or cloud) |
| PDF Generation | jsPDF — client-side payslip PDF download |
| Translation | Google Translate API (free tier) |
| Offline Queue | localForage — queues submissions when offline, auto-retries on reconnect |

---

## Project Structure

```
src/
├── components/
│   ├── ImageViewer.tsx              # Lightbox for photo thumbnails
│   ├── SignOutConfirmButton.tsx
│   ├── supervisor/
│   │   ├── SupervisorNav.tsx        # Mobile bottom nav (fixed)
│   │   ├── SupervisorDesktopSidebar.tsx
│   │   └── LanguageSheet.tsx
│   └── ui/                          # Base design system components
├── pages/
│   ├── cleaner/                     # All cleaner-side screens — COMPLETE
│   │   ├── Login.tsx
│   │   ├── LanguageSelect.tsx
│   │   ├── Home.tsx
│   │   ├── ZoneList.tsx
│   │   ├── ZoneSubmission.tsx
│   │   ├── NoPhotoNote.tsx
│   │   ├── ShiftCompleted.tsx
│   │   └── ShiftHistory.tsx
│   ├── supervisor/                  # All supervisor-side screens — COMPLETE
│   │   ├── Dashboard.tsx
│   │   ├── Jobs.tsx
│   │   ├── Evidence.tsx
│   │   ├── History.tsx
│   │   ├── Workers.tsx
│   │   ├── CleanerProfile.tsx
│   │   ├── Issues.tsx
│   │   ├── SupervisorNotifications.tsx
│   │   ├── Payslips.tsx
│   │   ├── PayRecords.tsx
│   │   ├── Absence.tsx
│   │   └── Rates.tsx
│   └── client/                      # Client/building-manager portal — COMPLETE
├── supervisor-preview/              # Standalone phone-frame preview (mock data)
│   ├── App.tsx
│   ├── MockAppProvider.tsx
│   └── PreviewShell.tsx
├── hooks/
│   └── useIsDesktop.ts              # Breakpoint hook (≥768px = desktop layout)
├── lib/
│   ├── supabase.ts
│   ├── gsap.ts                      # GSAP + useGSAP re-exports
│   ├── useTranslation.ts
│   ├── i18n/index.ts                # All UI strings — en / es / pt
│   ├── webhooks.ts
│   ├── translate.ts
│   ├── offlineQueue.ts
│   └── auth.ts
├── context/
│   └── AppContext.tsx               # user, language, active job — global state
└── main.tsx
```

---

## Coding Conventions

- Use **TypeScript strict mode** throughout — no `any`, cast to `unknown` first if needed
- **Components in PascalCase**, utility functions in camelCase
- **Named exports only** — no default exports
- Style exclusively with **Tailwind utility classes** — no custom CSS or inline styles
- Every component must handle **loading, error, and empty states**
- Keep components **under 150 lines** — extract sub-components if needed
- File extensions: `.ts` for logic, `.tsx` for components
- No JSDoc/comment blocks unless the WHY is genuinely non-obvious

---

## Brand & Design System

| Token | Value |
|---|---|
| Primary background | `#F4F4EE` (Soft Ivory) |
| Primary dark | `#1A1C19` (Near Black) |
| Action / highlight | `#B8A77A` (Muted Brass) |
| Success / completed | `#2F4A3D` (Deep Green) |
| Error / alert | `#BA1A1A` (Deep Red) |
| Secondary text | `#737874` (Warm Grey) |
| Card border | `#D0CFCA` |
| Heading font | Poppins (Bold / SemiBold) |
| Body font | Lato (Regular / Light) |
| Border radius (cards) | 12px |
| Border radius (buttons) | 8–12px |
| Button height | 56px (primary), 40–52px (secondary) |
| Mobile horizontal padding | 24px (`px-6`) |
| Content max-width (mobile) | 480px centred |
| Content max-width (desktop forms) | 672px (`max-w-2xl`) |
| Content max-width (desktop lists) | 1280px (`max-w-5xl`) |

Mobile-first. Desktop = same screens with 240px left sidebar (`pl-60`), wider content columns. No dark mode.

---

## Data Architecture (Live Schema)

### Key Tables

**profiles** (extends Supabase auth.users)
- `id` (uuid) — matches auth.uid()
- `display_id` (text) — e.g. `C0002`, `S0001`, `CL0003` (4-digit; `R001` replacement cleaners are 3-digit)
- `role` (text) — `cleaner` | `supervisor` | `client` (NOT `manager` — live constraint, see Role-Based Routing note)
- `full_name` (text), `phone`, `language_preference` (`en`|`es`|`pt`, default `en`)
- `company_id` (uuid → companies)
- `supervisor_id` (uuid → profiles, nullable) — cleaner's assigned supervisor
- `contract_type` (`contracted`|`replacement`, nullable), `contracted_hours`

**facilities**
- `id`, `display_id` (e.g. `F0001`), `name`, `address`, `org_id` (→ client_organisations), `company_id`

**client_organisations** — the client company that owns a facility (e.g. "Journey London Office"); `client_org_members (profile_id, org_id)` links a `client`-role profile to the orgs they can see.

**supervisor_facilities** (added 2026-08-17) — `(profile_id, facility_id)` many-to-many. Controls which facilities show up on a supervisor's Jobs screen. RLS-enabled, admin-managed only (no app-facing write policy yet — assignments are made directly via SQL). Without a row here, a supervisor sees nothing on that screen, even if they have jobs at that facility — see Known Patterns & Gotchas.

**jobs**
- `id`, `supervisor_id`, `facility_id`, `company_id`
- `scheduled_date` (date), `status` (text)

**job_zones**
- `id`, `job_id`, `cleaner_id`, `zone_name`
- `status`: `not_started` | `in_progress` | `completed` | `flagged_no_photo` | `deleted`

**cleaning_logs**
- `id`, `job_id`, `cleaner_id`, `job_zone_id` — **no `company_id` column** (get it via `jobs.company_id` if needed; a supervisor-update query once filtered on `cleaning_logs.company_id` directly and silently errored — see Known Patterns & Gotchas)
- `note`, `note_translated`, `note_language`, `submitted_at`, `created_at`
- `status`: `pending` | `approved` | `needs_attention` | `reclean_requested`

**evidence_files**
- `id`, `cleaning_log_id`, `public_url`

**feedback_comments**
- `id`, `cleaning_log_id`, `supervisor_id`, `comment`, `status`, `company_id`

**complaints**
- `id`, `facility_id`, `filed_by`, `title`, `description`, `photo_urls[]`
- `status`: `received` | `acknowledged` | `in_progress` | `resolved` (legacy: `open`)
- `supervisor_note`

**notifications**
- `id`, `user_id`, `title`, `message`, `is_read`, `created_at`

**pay_records**
- `id`, `cleaner_id`, `supervisor_id`, `company_id`, `pay_period_start/end`
- `hours_worked`, `hourly_rate`, `gross_pay` (GENERATED column — never pass in INSERT)
- `status`: `draft` | `confirmed` | `paid`

**payslips**
- `id`, `pay_record_id`, `cleaner_id`, `supervisor_id`, `company_id`
- `pay_period_start/end`, `hours_worked`, `hourly_rate`, `gross_pay`
- `status`: `draft` | `sent` | `acknowledged`

**cleaner_ratings** — supervisor ratings for cleaners (1–5 stars + notes + evidence photos)

> RLS enabled on every table. Queries must always scope to `company_id`, `supervisor_id`, or `user_id` as appropriate.

---

## Critical Query Patterns

### Flat sequential queries (NEVER nested joins on ambiguous FKs)
`cleaning_logs` has FKs to both `jobs` and `job_zones` — nested joins silently return empty arrays. Always query flat and join in JS:
```typescript
// Round 1 — parallel, independent
const [jobsRes, notifRes] = await Promise.all([...])
// Round 2 — depends on IDs from Round 1
const [logsRes] = await Promise.all([
  supabase.from('cleaning_logs').in('job_id', jobIds)...
])
```

### Count queries
```typescript
supabase.from('table').select('*', { count: 'exact', head: true }).eq(...)
// result.count gives the number
```

---

## App Data Flow

```
Cleaner submits zone → evidence_files uploaded to Supabase Storage →
App POSTs to n8n webhook: { cleaner_id, job_id, zone_id, image_urls[], note } →
n8n: inserts cleaning_log, updates job_zone status, sends supervisor notification →
Supervisor reviews in Evidence screen → inserts feedback_comment, updates cleaning_log.status
```

The app must **never** write directly to `cleaning_logs` during initial submission or update `job_zone.status` itself during submission. That is n8n's job.

---

## Role-Based Routing

| ID Prefix | Role | Portal | Status |
|---|---|---|---|
| `C` | Cleaner | `/cleaner/*` | Complete |
| `S` | Supervisor | `/supervisor/*` | Complete |
| `CL` | Client (building manager) | `/client/*` | Complete |
| `A` | Admin (business owner) | `/admin/*` | Planned — future build |

---

## Supervisor Portal — Screen List

| Screen | Route | Status |
|---|---|---|
| Dashboard | `/supervisor/dashboard` | Complete — live data, realtime, bell badge |
| Jobs (facility list + zone builder) | `/supervisor/jobs` | Complete |
| Pending Approvals / Job Evidence | `/supervisor/evidence` + `/supervisor/evidence/:jobId` | Complete — pagination, realtime |
| Job History | `/supervisor/history` | Complete |
| Workers | `/supervisor/workers` | Complete |
| Cleaner Profile + Ratings | `/supervisor/workers/:cleanerId` | Complete |
| Client Issues | `/supervisor/issues` | Complete — realtime, status workflow |
| Notifications | `/supervisor/notifications` | Complete — mark read, complaint link |
| Payslips | `/supervisor/payslips` | Complete — PDF download via jsPDF |
| Pay Records | `/supervisor/pay-records` | Complete |
| Absence | `/supervisor/absence` | Complete |

Desktop layout: 240px fixed sidebar + main content area. All screens use `useIsDesktop()` to conditionally render sidebar vs bottom nav.

---

## Cleaner Portal — Screen List

| Screen | Route | Status |
|---|---|---|
| Language Select | `/` | Complete |
| Login | `/login` | Complete — display_id prefix routing |
| Home (Job List) | `/cleaner/home` | Complete |
| Zone List | `/cleaner/job/:jobId` | Complete |
| Zone Submission | `/cleaner/job/:jobId/zone/:zoneId` | Complete |
| No Photo Note | `/cleaner/job/:jobId/zone/:zoneId/note` | Complete |
| Shift Completed | `/cleaner/job/:jobId/complete` | Complete |
| Shift History | `/cleaner/history` | Complete |
| Offline Banner | (persistent overlay) | Complete |

---

## Client Portal (Building Manager) — COMPLETE

Route prefix: `/client/*` — role detected from `CL` prefix on login. CL prefix must be checked before C in parseDisplayId. (Internal role value in `profiles.role` is `client`, not `manager` — this doc previously said `manager` throughout; the schema and routes have always used `client`.)

---

## Admin Portal — PLANNED (future build)

For Kevin (business owner) and future business admins. Not building managers — those use the client portal above.

Route prefix: `/admin/*` — role detected from `A` prefix on login (e.g. `A001`).

Scope TBD — likely: cross-company overview, user management, company-wide reporting, system config. Build when operationally needed.

---

## Known Patterns & Gotchas

- **CSS containing block**: Any element with a CSS `transform` (including GSAP animations) becomes the containing block for `position: fixed` children. Never apply transform animations to elements that contain fixed-position descendants (e.g. `SupervisorNav`). Keep `pageRef` on inner content wrappers only.
- **`gross_pay` is GENERATED**: Never include it in INSERT statements on `pay_records`.
- **Legacy complaint status**: Old data may have `status = 'open'` — treat as `'received'` in the UI.
- **UUID validation**: UUIDs must be hex-only (0–9, a–f). Characters like `j`, `z` are invalid and will be rejected by Postgres.
- **Desktop scrollbar pattern**: Use `min-h-screen` + `pl-60` on main content, not `flex h-screen overflow-hidden` + `flex-1 ml-60 overflow-y-auto` (the latter creates a mid-screen trapped scrollbar).
- **CSP `connect-src` must list every external domain the app calls, including `data:`**: any URL `fetch()`-ed from the app that isn't in `connect-src` fails silently in the browser with a generic `TypeError: Failed to fetch` — no console warning that names CSP as the cause unless you check devtools. Forgetting the n8n webhook domain broke all three webhook calls (zone submission, shift completion, reclean ack) with no server-side trace at all (n8n showed zero executions). Forgetting `data:` broke the offline queue's `fetch(dataUrl)` blob conversion the same way, silently, after the n8n domain fix. Whenever a new external call is added anywhere in the app, check `public/_headers` first.
- **Never use a bare `catch {}` on a multi-step async operation**: it collapses genuinely different failures (network/CSP block, RLS denial, bad column reference) into one generic user-facing message, which is exactly what made both bugs above take real investigation instead of a 30-second console check. Always `catch (err) { console.error(...) }` at minimum.
- **`cleaning_logs` has no `company_id` column** — don't filter or scope queries on it directly; go through `jobs.company_id` (RLS policies already do this via a join, so app-side filters usually don't need to duplicate it).
- **Supervisor facility visibility is scoped via `supervisor_facilities`, not `company_id`**: a supervisor with real jobs at a facility still won't see it on the Jobs screen (and RLS will hide the `facilities` row entirely) unless there's a matching `supervisor_facilities` row. This is enforced at both the app-query and RLS level — assign new supervisors to their facilities as part of onboarding them, not as an afterthought.
- **Verify Cloudflare Pages' GitHub integration is actually connected before assuming a push will deploy** — it can silently disconnect (happened 2026-08-17) with no notification; pushes succeed on GitHub's side but nothing builds. Check the Pages project dashboard for a "disconnected from Git" banner if a deploy seems stuck.

---

## Language & Translation

- Supported: English (`en`), Spanish (`es`), Portuguese (`pt`)
- All UI strings in `src/lib/i18n/index.ts` — no hardcoded English in components
- `useTranslation()` hook returns the `t(key)` function scoped to the user's language
- Cleaner notes translated to English by n8n (Google Translate API) → stored in `cleaning_logs.note_translated`

---

## AIXD Engineering Rules

### Prompting
- One task per prompt — complete and commit before moving to the next
- Give full context: file path, component name, expected behaviour, screen size if relevant

### Development Loop
1. Focused prompt → Claude Code builds → review the diff → test at localhost → commit

### Git Discipline
- Always start from a clean `git status`
- Commit after every meaningful piece of work
- Commit message format: `feat:`, `fix:`, `refactor:`, `chore:`

### Security (Non-Negotiable)
- Secrets in `.env` only — never in code, chat, or docs
- RLS enabled on every table without exception
- Queries scoped to `auth.uid()` or `company_id` — never return data for other companies
- Never use sequential IDs in URLs for private resources — use UUIDs
- CORS whitelisted to exact domain only in production

---

## Environment Variables

| Variable | Source |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `VITE_N8N_WEBHOOK_URL` | n8n → Proof of Cleaning (WF-5) webhook URL |
| `VITE_N8N_SHIFT_COMPLETE_WEBHOOK` | n8n → Shift Completion + Pay Record (WF-6) webhook URL |
| `VITE_N8N_RECLEAN_ACK_WEBHOOK` | n8n → Reclean Acknowledgement (WF-12) webhook URL |
| `VITE_GOOGLE_TRANSLATE_API_KEY` | Google Cloud Console → Translate API |

**All three n8n webhook domains must be in `public/_headers`' CSP `connect-src`, and `data:` must be there too** (the offline queue converts saved photos back to blobs via `fetch(dataUrl)`, which needs it) — see Known Patterns & Gotchas.

---

## Current Status (as of 2026-08-17)

**All three portals complete and production-ready:** Cleaner (`/cleaner/*`), Supervisor (`/supervisor/*`), Client (`/client/*`).

**First commercial client — Journey London Office:** Deep clean ran 2026-08-17 (physical only, app not used that day). Rolling contract onboarding is 2026-08-18. Facility `F0003`, org "Journey London Office" created 2026-08-16. Accounts:
- `CL0003` — Karis Reed (building manager)
- `S0003` — Kevin Zamora-Saenz (2nd account, separate from his existing `C0004` cleaner account — supervises Journey remotely)
- `C0006` — Andres Figuero (cleaner, es)
- `C0007` — Myriam (cleaner, es; surname unknown, full_name to be updated when known)

All four are seeded directly via SQL (`crypt()` + `gen_salt('bf')` on `auth.users`, matching how earlier seed users were created) — there's no in-app account creation flow yet.

**Bugs found and fixed this session (2026-08-16/17), all verified live in production:**
1. CSP `connect-src` didn't include the n8n webhook domain → all three webhook calls (zone submission, shift completion, reclean ack) silently failed client-side with zero server-side trace, surfaced to cleaners as a misleading "check your connection" message from a bare `catch {}`.
2. CSP `connect-src` also needed `data:` → the offline queue's `fetch(dataUrl)` blob conversion was silently blocked the same way, discovered only after fixing #1. Added a real "Upload Failed" state with a Retry button to `ZoneOfflineQueued.tsx` — previously a failed flush spun on "Uploading…" forever with no feedback.
3. Supervisor "not accepted" feedback flow updated `cleaning_logs` filtered on `.eq('company_id', ...)`, but that table has no such column — PostgREST rejected the query. Fixed by dropping the redundant filter (RLS already scopes it via the `jobs` join).
4. Every supervisor could see every company facility (unscoped query) — added `supervisor_facilities` join table + RLS policies, scoped `Jobs.tsx`'s facility list query through it. S0001's 16 pre-existing demo jobs at Downtown Corporate Hub were reassigned to S0002 as part of the same migration (S0001 is a real account reserved for near-term use and needed a clean slate).
5. Cloudflare Pages' GitHub integration had silently disconnected at some point — pushes to `main` weren't deploying at all. Reconnected via the dashboard.

**Rollback tags** left on each commit from this session (`pre-csp-webhook-fix-20260816`, `pre-evidence-status-fix-20260816`, `pre-facility-scoping-20260817`, `pre-offline-queue-fix-20260817`) in case any need reverting.

**Cloudflare hosting:** Deliberately staying on the kevindigitalinflux@gmail.com personal account for now (not mrbrushandco@gmail.com) — a migration was scoped (new Pages project + `app.mrbrushandco.co.uk` custom domain + n8n CORS allowlist update, since Cloudflare has no native cross-account Pages transfer) but shelved because it needs SSH access to the Hostinger VPS that wasn't available in the moment. Revisit once that access is sorted and things are less time-pressured.

**n8n automations — all live and re-verified 2026-08-17:**
- WF-5: Proof of Cleaning submission ✓
- WF-6: Shift Completion + Pay Record creation ✓
- WF-8: Monthly Payslip Roll-up ✓
- WF-10: Zone Assignment Notification ✓
- WF-11: Evidence Feedback Notification ✓
- WF-12: Reclean Acknowledgement ✓
- WF-15: Weekly Report Compilation ✓
- WF-A/B/C: WhatsApp absence flows — built, still need Google Sheets → Supabase node swap

**Known plan limitations (free tier — revisit as Journey's usage grows):**
- Supabase PITR backups, leaked password protection — Pro plan only ($25/mo)
- Cloudflare WAF / Rate Limiting — paid add-on (Supabase Auth rate limits cover auth endpoints)
- Watch Supabase Storage usage (Project Settings → Usage) now that real cleaning-verification photos are landing — that's the trigger point for upgrading to Pro

**Key data note — pay_records.status values (live DB constraint):**
`draft` | `confirmed` | `paid` — NOT `approved`.

---

## Session update (2026-08-19) — first live shift, bugs found + fixed, WF-16 built

Journey's rolling contract had its first officially-used shift today. Feedback surfaced four issues, all fixed and merged to `main`:

1. **History screen excluded today's shifts** — `.lt('scheduled_date', today)` on both "My Shifts" and "All Workers" tabs meant a shift completed *today* never showed up, only from the next day onward. Changed to `.lte`.
2. **Pay records had no edit path once logged** — draft records had no edit action at all, and "confirmed" ones were permanently static (an accidental Approve click was unrecoverable). Added an Edit action on drafts and a "Revert to Draft" action on confirmed records; "paid" stays locked since money's already moved.
3. **Rates screen was read-only** ("Contact an administrator to update rates") even though supervisors already had full RLS write access — the restriction was frontend-only. Turned it into "Manage Facilities": rates are now inline-editable, and a new `cleaner_facility_hours` table (per cleaner, per facility) backs a per-worker expected-hours list, since a cleaner's hours can differ by site.
4. **Evidence full-screen viewer showed a cropped, boxed-in image, not true full-screen** — root cause: `ImageViewer` used `position: fixed`, but was rendered as a child of cards with `hover:-translate-y-px` (`Evidence.tsx`'s `evidence-ticket`). A transformed ancestor becomes the containing block for `fixed` descendants — this is the *exact* class of bug already documented above from the SupervisorNav incident. Fixed at the root by rendering `ImageViewer` through a React portal to `document.body`, so no ancestor's transform can ever trap it again, in any of its call sites. Also added a download button (blob-fetch + save, new-tab fallback) since supervisors want to reuse evidence photos for social media.

**Root cause of #2/#3's underlying data problem:** Andres's first Aug 19 pay record auto-generated with 8h/£12.50 defaults (`profiles.contracted_hours` was unset, Journey had zero `facility_rates` rows) and got accidentally approved before anyone could fix it. Corrected directly in the DB as a stopgap (4h/£14.80) alongside the UI fixes.

**n8n — WF-6 updated (live, 2026-08-19):** the pay-record hours lookup now reads `cleaner_facility_hours.expected_hours` first, falling back to `profiles.contracted_hours`, then `8.0` — added a new "Get Cleaner Facility Hours" Supabase node feeding the existing "Build Pay Record" code node. Applied directly via the n8n REST API (`N8N_API_KEY` in `.env`, expires — see comment above the key). Local export refreshed at `n8n/WF-6-shift-completion-pay-record.json`.

**n8n — WF-16 built (NEW, inactive pending test run):** "Recurring Zone Auto-Assignment" — daily 05:00 schedule trigger that turns `recurring_zone_rules` into real `job_zones` each matching day. Built via direct REST API calls (id `24EqOIbqQiQze45K`), no interactive editor testing was possible from this session. **Left inactive deliberately** — recommend an "Execute Workflow" test run in the n8n editor before activating. Low risk either way right now since `recurring_zone_rules` has 0 rows in production (the app UI for supervisors to create rules lives on the still-parked `feature/recurring-zone-assignments` branch, not yet merged) — activating it today would just be a harmless no-op daily until that branch lands. Export at `n8n/WF-16-recurring-zone-auto-assignment.json`. Uses direct PostgREST HTTP Request calls (not the Supabase node) for the job/zone bulk reads and inserts, matching WF-6's `Insert Pay Record` pattern — needed because `job_zones` has real historical duplicate `(job_id, zone_name, cleaner_id)` rows (from the app's own "Duplicate Zone" feature) so a DB unique-constraint-based upsert wasn't safe to add; dedup is done explicitly in a Code node instead.

**Still pending:** WF-5 update for video evidence (`file_type='video'` row) — belongs to the *separate*, still-unmerged `feature/multi-photo-video-evidence` branch, explicitly deferred, not touched this session.

---

## Do Not Touch
- Data flow architecture — app sends to n8n, n8n writes to Supabase. No direct `cleaning_logs` writes from the app during submission.
- Role routing logic in `lib/auth.ts` — the C/S/M prefix system is fixed
- RLS policies once set — any change requires a full security review
- Brand colour tokens — exact hex values only
