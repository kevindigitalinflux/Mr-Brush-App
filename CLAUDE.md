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
│   ├── ImageViewer.tsx              # Full-screen photo/video viewer (portal to document.body)
│   ├── VideoRecorder.tsx            # Live camera recorder — 15s max, no file-picker fallback
│   ├── SignOutConfirmButton.tsx
│   ├── supervisor/
│   │   ├── SupervisorNav.tsx        # Mobile bottom nav (fixed)
│   │   ├── SupervisorDesktopSidebar.tsx
│   │   ├── LanguageSheet.tsx
│   │   ├── RecurringRuleForm.tsx    # Add/edit a recurring zone rule
│   │   └── DayOfWeekPicker.tsx
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
│   │   ├── Rates.tsx                # "Manage Facilities" — rates + worker hours
│   │   └── RecurringSchedule.tsx    # Per-facility recurring zone rules + manual WF-16 sync
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
- `id`, `cleaning_log_id`, `public_url`, `storage_path`, `file_type` (MIME type, e.g. `image/jpeg` or `video/webm` — used to distinguish video from photo rows in evidence review screens)

**recurring_zone_rules** (added 2026-08-18) — `(id, facility_id, cleaner_id, zone_name, days_of_week int[], notes, active, created_by, created_at)`. A supervisor-authored template; WF-16 turns due rules into real `jobs`/`job_zones` rows each day (or on manual sync). RLS scoped like other supervisor-facing config tables.

**cleaner_facility_hours** (added 2026-08-19) — `(id, cleaner_id, facility_id, company_id, expected_hours, created_at)`, `unique(cleaner_id, facility_id)`. Per-cleaner, per-facility expected shift length — a cleaner's hours can differ by site. WF-6 reads this first when building a pay record, falling back to `profiles.contracted_hours`, then `8.0`.

**feedback_comments**
- `id`, `cleaning_log_id`, `supervisor_id`, `comment`, `status`, `company_id`

**complaints**
- `id`, `facility_id`, `filed_by`, `title`, `description`, `photo_urls[]`
- `status`: `received` | `acknowledged` | `in_progress` | `resolved` (legacy: `open`)
- `supervisor_note`

**notifications**
- `id`, `user_id`, `title`, `message`, `is_read`, `created_at`

**pay_records**
- `id`, `cleaner_id`, `supervisor_id`, `facility_id`, `job_id`, `company_id`, `shift_date`, `role_type` (`cleaner`|`supervisor`), `is_replacement`, `notes`
- `hours_worked`, `hourly_rate`, `gross_pay` (GENERATED column — never pass in INSERT)
- `status`: `draft` | `confirmed` | `paid`
- RLS (added 2026-08-19): supervisor access is scoped by `facility_id` via `supervisor_facilities`, not just `company_id` — a supervisor can no longer see/edit pay records for a facility they aren't assigned to, even within the same company.

**jobs.recurring_job_key** / **job_zones.recurring_assignment_key** (added 2026-08-19) — nullable `text`, plain `UNIQUE` constraints (deliberately *not* partial/conditional indexes — PostgREST's `on_conflict` upsert doesn't reliably target those). WF-16 upserts against these to avoid duplicate job/zone creation on repeated runs.

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
| Pay Records | `/supervisor/pay-records` | Complete — facility-scoped |
| Absence | `/supervisor/absence` | Complete |
| Recurring Schedule | `/supervisor/jobs?action=recurring&facility=:id` | Complete — includes manual "Sync Today's Zones Now" (WF-16) |

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
- **New `VITE_*` env vars need to be added to Cloudflare Pages' own dashboard, not just `.env`** — `.env` is gitignored and never reaches the deployed build. A webhook helper gated on a new env var that's only local will silently no-op in production with zero error, since `import.meta.env.VITE_X` is just `undefined` there. Hit this 2026-08-19/20 with `VITE_N8N_RECURRING_SYNC_WEBHOOK` — the button looked like it "did nothing," and the fix was two parts: add the var in Cloudflare's dashboard (Workers & Pages → mr-brush-app → Settings → Environment variables) *and* redeploy (env var changes don't apply retroactively to an already-built deployment).
- **A webhook helper that's the direct subject of user-facing success/failure feedback must throw on missing config, not silently no-op** — the existing `postX()` helpers in `lib/webhooks.ts` intentionally no-op when their URL is unset (they're fire-and-forget side effects after some other action already succeeded). `postRecurringSync()` is different: the button's entire purpose *is* that call, so a silent no-op produced a false "Synced!" message. Match the no-op-vs-throw behavior to whether the caller shows the user a direct success/failure state.
- **`Permissions-Policy` in `public/_headers` can silently kill `getUserMedia` app-wide** — it shipped with `camera=(), microphone=()...` from an earlier security pass, before any feature used the camera. Once `VideoRecorder.tsx` needed it, every `getUserMedia` call failed with `NotAllowedError` *before the browser ever showed a permission prompt* — indistinguishable from a real user-denied permission unless you think to check this header. Fixed to `camera=(self)`; microphone stays blocked since video capture is `audio: false`. Check this header first for any future feature needing camera/mic/geolocation/payment.
- **CSP needs an explicit `media-src` directive for any `<video>`/`<audio>` playback** — `img-src` already allowed `blob:` (why photo previews always worked), but there was no `media-src` at all, so it fell back to `default-src 'self'`, which blocks both `blob:` URLs (the in-page recording preview) *and* cross-origin Supabase Storage URLs (the actual uploaded evidence video). Chrome reports a CSP-blocked media source as the generic `MEDIA_ERR_SRC_NOT_SUPPORTED` (error code 4) on the `<video>` element — indistinguishable from a genuinely corrupt/unsupported file unless you check the CSP directly. Fixed: `media-src 'self' blob: https://*.supabase.co https://*.supabase.in;`.
- **`MediaRecorder.start()` with no timeslice can produce a blob Chrome-on-Android's own `<video>` element refuses to play** — even though the exact same bytes decode fine in a native video player outside the page (confirmed by downloading and opening it directly). Symptom is `MEDIA_ERR_SRC_NOT_SUPPORTED` despite a real, non-empty, correctly-typed blob. Recording with an explicit timeslice (`recorder.start(1000)`) instead of relying on the single stop-time chunk fixed it. This took three failed hypotheses to isolate (codecs-qualified Blob type, missing CSP `media-src`) — both were verified-deployed-but-ineffective before landing on this one, which is why the download-and-test-natively step was the decisive piece of evidence.
- **A ref can't be attached to a conditionally-rendered element before that render happens** — `VideoRecorder`'s live preview `<video>` only mounts once `stage === 'live'`, but the code originally set `liveVideoRef.current.srcObject = stream` synchronously *before* calling `setStage('live')`, while the element didn't exist yet. The guard (`if (liveVideoRef.current)`) silently no-op'd rather than erroring, producing a permanently black preview with no error at all. Fix: attach the stream in a `useEffect` keyed on the state that reveals the element, not inline in the async function that fetches the stream.
- **`#root` in `src/index.css` must use `align-items: stretch` and `min-height: 100%`, never `center`/`height: 100%`** — `align-items: center` shrinks every flex-child page to its own content width instead of stretching to the viewport (desktop `min-h-screen` layouts affected; mobile's `fixed inset-0` layouts are immune, since fixed positioning ignores the parent's flex alignment entirely). `height: 100%` (fixed, not `min-`) caps `#root`'s own box at exactly one viewport even when a page's actual content is taller — the page still renders fully via normal overflow, but past that boundary the background is no longer reliably painted, showing up as a seam. Confirm any suspected instance of this via DevTools measuring `#root`'s actual box against the page's real content height — a from-scratch CSS repro of the bug description didn't reproduce the height half, so this needs real measurement, not just reasoning about the CSS.

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
| `VITE_N8N_RECURRING_SYNC_WEBHOOK` | n8n → Recurring Zone Auto-Assignment (WF-16) manual-trigger webhook URL |
| `VITE_GOOGLE_TRANSLATE_API_KEY` | Google Cloud Console → Translate API |

**Every n8n webhook domain must be in `public/_headers`' CSP `connect-src`, and `data:` must be there too** (the offline queue converts saved photos back to blobs via `fetch(dataUrl)`, which needs it). **`media-src` must separately allow `blob:` and the Supabase Storage domains** for video playback (see Known Patterns & Gotchas). **New `VITE_*` vars must also be added directly in Cloudflare Pages' dashboard** — `.env` is gitignored and never reaches the deployed build.

---

## Current Status (as of 2026-08-20 — see session updates below for detail)

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

**n8n automations — all live:**
- WF-5: Proof of Cleaning submission ✓ (updated 2026-08-20 for video evidence)
- WF-6: Shift Completion + Pay Record creation ✓ (updated 2026-08-19 for per-facility hours lookup)
- WF-8: Monthly Payslip Roll-up ✓
- WF-10: Zone Assignment Notification ✓
- WF-11: Evidence Feedback Notification ✓
- WF-12: Reclean Acknowledgement ✓
- WF-15: Weekly Report Compilation ✓
- WF-16: Recurring Zone Auto-Assignment ✓ (built 2026-08-19, activated 2026-08-20 — daily 5am schedule + manual webhook trigger)
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

---

## Session update (2026-08-19/20) — recurring zones shipped, pay records locked to assigned facilities, video evidence built and debugged end-to-end

Continuation of the same day's work above. Three previously-parked/half-built things landed, plus a real multi-fix debugging chain on video evidence.

**1. Recurring zone assignments — merged and live.** The `feature/recurring-zone-assignments` branch (Recurring Schedule screen, `RecurringRuleForm`, `DayOfWeekPicker`) is merged to `main`. WF-16 is now **active** (was deliberately left inactive in the 2026-08-19 note above — its 5am schedule had never actually fired until this). Added a webhook trigger alongside its schedule trigger so a supervisor can materialize today's due zones on demand via a "Sync Today's Zones Now" button on the Recurring Schedule screen — this button is global (fires WF-16 for every due facility company-wide, not just the one you're viewing), styled as a filled Muted Brass CTA distinct from the primary black "Add Recurring Zone +" button. Two real bugs surfaced and got fixed post-merge:
   - The button silently no-op'd in production because its webhook URL env var was never added to Cloudflare Pages' dashboard (see Known Patterns & Gotchas) — also fixed `postRecurringSync()` to throw rather than silently succeed when unconfigured.
   - The button only rendered on desktop — a `replace_all` string-edit meant to add it to both desktop and mobile layouts silently missed the mobile one due to differing surrounding whitespace. Always verify both layouts individually rather than trusting a single find/replace across near-duplicate JSX blocks.

**2. Pay records facility-scoped.** Supervisors could previously see/edit any company's pay record regardless of facility assignment. Scoped `PayRecords.tsx` (list, filters, Log Pay modal's job dropdown) and tightened the `pay_records` RLS policies (select/update/insert) to require a matching `supervisor_facilities` row — verified against live data first (zero orphaned records) before tightening.

**3. Manage Facilities worker-hours UX.** Replaced the "every cleaner listed inline under every facility card" pattern with the existing searchable `CleanerPicker` (imported from `Jobs.tsx`) plus a single hours field for whichever cleaner is selected — avoids an ever-growing list as the roster scales.

**4. Video/photo evidence — merged, WF-5 updated, multiple real bugs fixed.** `feature/multi-photo-video-evidence` (up to 5 photos and/or one 15s live-recorded video per zone) is merged to `main`. WF-5 updated to insert an `evidence_files` row for video the same way it already does for photos (extended the "Build Evidence Items" code node), and fixed a real correctness bug in the process: the "Has Photos?" no-evidence flagging branch only checked `image_urls.length`, which would have wrongly flagged every video-only submission (explicitly allowed by the app — `canSubmit = photos.length > 0 || video !== null`) as having no evidence and falsely alerted the supervisor.

   Getting the recorder actually working end-to-end on a real Android phone took five sequential bugs, each confirmed with real evidence before moving to the next (not guessed) — see the corresponding entries in Known Patterns & Gotchas for the technical detail on each: `Permissions-Policy: camera=()` blocking the permission prompt outright; a `<video>` ref attached before its conditionally-rendered element existed (permanently black live preview); a missing CSP `media-src` directive (blocked both blob: preview and the eventual Supabase-hosted playback); a `MediaRecorder.start()`-with-no-timeslice quirk on Android Chrome that produced a blob no in-page `<video>` element would play despite being valid, non-empty, correctly-typed data (confirmed by downloading and playing it natively before landing on the fix). Two intermediate hypotheses (stripping the Blob's codecs-qualified type, adding CSP media-src) were each verified deployed-and-ineffective via direct evidence before moving on, rather than stacking speculative fixes.

**5. Desktop background didn't fill the viewport — two-part root cause, both in `src/index.css`.** Found on the cleaner Zone Submission desktop screen, but the underlying bug affected every desktop page taller than one viewport, app-wide.
   - **Width:** `#root` had `align-items: center` — flex children center at their intrinsic content width instead of stretching, so every `min-h-screen` desktop layout shrank to roughly its sidebar+content width, revealing `#root`/body's own background past that boundary. Fixed to `align-items: stretch` (the flexbox default).
   - **Height (found after the width fix, on the same screen, via direct DevTools measurement — not guessed):** `#root` also had `height: 100%`, a *fixed* height, so its own box stayed capped at exactly one viewport even when its child's actual content was taller. The child still rendered its full content below that via normal overflow, but past `#root`'s own boundary the background was no longer reliably `#root`'s own painted box — visible as a horizontal seam partway down any page taller than 100vh. Confirmed directly in DevTools (`#root` measured exactly one viewport tall, box stopping precisely at the seam) before fixing — an isolated CSS repro of the naive bug description hadn't reproduced it, so this one needed real measurement, not just reasoning. Fixed by changing `#root` from `height: 100%` to `min-height: 100%` — still fills at least one viewport on short pages (splash, login) but grows to match content on taller ones. `html`/`body` keep `height: 100%` as the base viewport anchor.

   Mobile was never affected by either half of this — every mobile layout uses `fixed inset-0`, which sizes to the viewport directly regardless of the parent's flex alignment or height.

**Rollback tag:** `checkpoint-before-video-evidence` on `main`, pointing at the commit immediately before the video-evidence merge — `git reset --hard checkpoint-before-video-evidence && git push origin main --force` if needed.

**Branch cleanup done:** `feature/recurring-zone-assignments`, `feature/wf16-trigger-facility-scoping-dropdown`, and `feature/multi-photo-video-evidence` — all fully merged into `main`, deleted locally and on GitHub (the recurring/wf16 branches were never pushed remotely to begin with).

**Still pending / not yet done:**
- Stale local n8n JSON exports (`n8n/WF-16-...json` reflects an early v1 design, not the final working version; WF-5 has no local export at all) — only matters if you want them as accurate reference docs, not functionally load-bearing.

---

## Do Not Touch
- Data flow architecture — app sends to n8n, n8n writes to Supabase. No direct `cleaning_logs` writes from the app during submission.
- Role routing logic in `lib/auth.ts` — the C/S/M prefix system is fixed
- RLS policies once set — any change requires a full security review
- Brand colour tokens — exact hex values only
