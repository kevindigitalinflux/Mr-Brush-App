# Mr Brush & Co. — Cleaning Operations App

## What This Is
An internal field operations app for Mr Brush & Co., a commercial cleaning company. The app enables cleaners (field workers), supervisors, and building managers (clients) to manage and verify cleaning jobs in real time. The system is role-based: a user's `display_id` prefix (C = cleaner, S = supervisor, M = manager) determines which portal they access on login. The app never holds automation logic — it sends events to n8n, which handles all processing, database writes, and notifications.

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
│   └── manager/                     # Client/manager portal — NOT YET STARTED
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
- `display_id` (text) — e.g. `C002`, `S001`, `M003`
- `role` (text) — `cleaner` | `supervisor` | `manager`
- `full_name` (text)
- `company_id` (uuid → companies)
- `language` (text) — `en` | `es` | `pt`

**facilities**
- `id`, `name`, `company_id`

**jobs**
- `id`, `supervisor_id`, `facility_id`, `company_id`
- `scheduled_date` (date), `status` (text)

**job_zones**
- `id`, `job_id`, `cleaner_id`, `zone_name`
- `status`: `not_started` | `in_progress` | `completed` | `flagged_no_photo` | `deleted`

**cleaning_logs**
- `id`, `job_id`, `cleaner_id`, `job_zone_id`, `company_id`
- `note`, `note_translated`, `created_at`
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
- `status`: `draft` | `approved` | `paid`

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
| `M` | Manager | `/manager/*` | Not started |

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

## Client Portal (Manager) — NOT STARTED

Next build phase. Key questions to nail before coding:
- Can a manager see multiple facilities or just their own?
- Read-only evidence view, or can they sign off / raise issues?
- Do they receive notifications when a job is ready for review?
- Do they need downloadable PDF clean reports?
- Any KPI dashboard (completion %, average rating)?
- Same login flow (display_id + password) as other roles?

Route prefix: `/manager/*` — role detected from `M` prefix on login.

---

## Known Patterns & Gotchas

- **CSS containing block**: Any element with a CSS `transform` (including GSAP animations) becomes the containing block for `position: fixed` children. Never apply transform animations to elements that contain fixed-position descendants (e.g. `SupervisorNav`). Keep `pageRef` on inner content wrappers only.
- **`gross_pay` is GENERATED**: Never include it in INSERT statements on `pay_records`.
- **Legacy complaint status**: Old data may have `status = 'open'` — treat as `'received'` in the UI.
- **UUID validation**: UUIDs must be hex-only (0–9, a–f). Characters like `j`, `z` are invalid and will be rejected by Postgres.
- **Desktop scrollbar pattern**: Use `min-h-screen` + `pl-60` on main content, not `flex h-screen overflow-hidden` + `flex-1 ml-60 overflow-y-auto` (the latter creates a mid-screen trapped scrollbar).

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
| `VITE_N8N_WEBHOOK_URL` | n8n → Proof of Cleaning webhook URL |
| `VITE_GOOGLE_TRANSLATE_API_KEY` | Google Cloud Console → Translate API |

---

## Current Status (as of 2026-06-08)

**Cleaner portal:** Complete. Real Supabase auth, zone-by-zone photo submission, offline queue, multilingual.

**Supervisor portal:** Complete. All screens built and working with live Supabase data and realtime subscriptions:
- Dashboard with live pending count, issues count, unread bell badge
- Jobs — facility list, zone builder, shift management, cleaner grouping
- Evidence review — pagination (5/page), approve/reject with feedback
- Client Issues — status workflow (received → acknowledged → in progress → resolved)
- Notifications — unread badge, mark all read, complaint deep-link
- Workers + Cleaner profiles + star ratings
- Payslips with jsPDF download
- Pay Records, Absence management

**Manager/client portal:** Not started — next build phase.

**Security hardening (2026-06-07 / 2026-06-08):** Full DI-Dreamlabs 50-check security audit completed and all CRITICAL/HIGH findings resolved:
- Route protection: `RequireAuth` layout guard wraps all portal routes. `sessionChecked` flag prevents flash-redirect on page refresh.
- Security headers: `public/_headers` deployed to Cloudflare Pages (X-Frame-Options, CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). Source maps disabled in `vite.config.ts`.
- RLS hardening: 14 supervisor policies missing `company_id` scope fixed. `weekly_reports` open-read policy replaced with company-scoped join. `companies` table policy added.
- SECURITY DEFINER functions: `get_my_role()` and `get_my_company_id()` recreated as STABLE with `SET search_path = public`. `notify_client_on_complaint_update()` fixed same. All 6 SECURITY DEFINER functions have `anon` EXECUTE revoked — `notify_client_on_complaint_update` and `rls_auto_enable` also revoked from `authenticated` (trigger/utility only).
- Storage: broad `evidence-photos` listing policy replaced with company-scoped path filter.
- Sign-out: `supabase.auth.signOut()` now called explicitly before clearing React state.
- File uploads: MIME type + 10MB size validation added in `ZoneSubmission`, `CleanerProfile`, `RateCleanModal`, `Complaints`.
- Defense-in-depth: ownership filters added to zone delete, log status update, and complaint delete queries.

**Known plan limitations (free tier — revisit at first contracts):**
- Supabase PITR backups — Pro plan only ($25/mo)
- Leaked password protection (HaveIBeenPwned) — Pro plan only
- Cloudflare WAF / Rate Limiting — paid add-on (Supabase Auth rate limits cover sign-in brute-force)

**Known issues:** None outstanding.

**Mock data seeded for testing:**
- Supervisor: `S001` (password in `.env` / Supabase auth)
- Facility: "Riverfront Tower" + "Skyline Plaza" + "Metro Hub"
- Jobs and cleaning_logs seeded for 2026-05-30 and 2026-06-01
- Complaints and notifications seeded for realistic supervisor testing

---

## Do Not Touch
- Data flow architecture — app sends to n8n, n8n writes to Supabase. No direct `cleaning_logs` writes from the app during submission.
- Role routing logic in `lib/auth.ts` — the C/S/M prefix system is fixed
- RLS policies once set — any change requires a full security review
- Brand colour tokens — exact hex values only
