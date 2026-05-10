Got everything I need. Here's your CLAUDE.md:

```markdown
# Mr Brush & Co. — Cleaning Operations App

## What This Is
An internal field operations app for Mr Brush & Co., a commercial cleaning company. The app enables cleaners (field workers), supervisors, and building managers (clients) to manage and verify cleaning jobs in real time. The first and current build focus is the Proof of Cleaning system — allowing cleaners to upload zone-by-zone photo evidence after completing a clean, which triggers automated workflows via n8n webhooks. The app is role-based: a user's ID prefix (C = cleaner, S = supervisor, M = manager) determines which side of the app they access on login. The cleaner side is the MVP priority. The system is designed so the app never holds automation logic — it sends events to n8n, which handles all processing, database writes, and notifications.

---

## Tech Stack

| Layer | Default |
|---|---|
| Framework | React 18 with TypeScript |
| Build Tool | Vite (latest) |
| Styling | Tailwind CSS v3 — utility classes only, no custom CSS unless absolutely necessary |
| Routing | React Router v6 |
| Database + Auth | Supabase |
| Hosting | Cloudflare Pages (auto-deploy from GitHub main) |
| Version Control | GitHub |
| Component Reference | 21st.dev |
| AI Dev Environment | Claude Code |
| Automation | n8n (webhook-triggered, self-hosted or cloud) |
| Translation | Google Translate API (free tier) — for auto-translating cleaner notes into English for supervisor/manager views |
| Offline Queue | localForage — for queuing submissions when the cleaner has no signal, auto-sending on reconnect |

---

## Project Structure

```
src/
├── components/
│   └── ui/                  # Base design system components (buttons, cards, inputs, badges)
├── pages/
│   ├── cleaner/             # All cleaner-side screens
│   │   ├── Login.tsx
│   │   ├── LanguageSelect.tsx
│   │   ├── Home.tsx
│   │   ├── ZoneList.tsx
│   │   ├── ZoneSubmission.tsx
│   │   ├── NoPhotoNote.tsx
│   │   ├── ShiftCompleted.tsx
│   │   └── ShiftHistory.tsx
│   ├── supervisor/          # Supervisor screens — NOT started yet
│   └── manager/             # Manager/client screens — NOT started yet
├── lib/
│   ├── supabase.ts          # Supabase client init
│   ├── webhooks.ts          # n8n webhook POST helpers
│   ├── translate.ts         # Google Translate API helper
│   ├── offlineQueue.ts      # localForage queue logic for offline submissions
│   └── auth.ts              # Role detection from ID prefix (C/S/M), login logic
├── context/
│   └── AppContext.tsx       # Global state: current user, language, active job
├── assets/
│   ├── logo/                # Mr Brush & Co. logo variants (full colour, white, icon only)
│   └── fonts/               # Poppins + Lato if self-hosted
└── main.tsx
public/
CLAUDE.md
.env
.gitignore
package.json
vite.config.ts
```

---

## Coding Conventions

- Use **TypeScript strict mode** throughout — no `any`, cast to `unknown` first if needed
- **Components in PascalCase** (e.g. `ZoneCard.tsx`)
- **Utility functions in camelCase**
- **Named exports only** — no default exports
- Style exclusively with **Tailwind utility classes** — no custom CSS or inline styles
- Every component must handle **loading, error, and empty states**
- Keep components **under 150 lines** — extract sub-components if needed
- Add **JSDoc comments** to all exported functions
- File extensions: `.ts` for logic, `.tsx` for components

---

## Brand & Design System

| Token | Value |
|---|---|
| Primary background | `#F5F4EF` (Soft Ivory) |
| Primary dark | `#3D3B3A` (Charcoal Black) |
| Action / highlight | `#B8A77A` (Muted Brass) |
| Success / completed | `#2F4A3D` (Deep Green) |
| Secondary text / inactive | `#434B4D` (Slate Grey) |
| Card border | `#D0CFCA` |
| Heading font | Poppins (Bold / SemiBold) |
| Body font | Lato (Regular / Light) |
| Border radius (cards) | 12px |
| Border radius (buttons) | 12px |
| Button height | 56px |
| Input height | 52px |
| Mobile horizontal padding | 24px |
| Max content width (tablet+) | 480px centred |

The design is mobile-first. Tablet and desktop are the same screens with wider margins and the content column centred at 480px max-width on a Soft Ivory full-bleed background. No dark mode.

---

## Data Architecture

### Supabase Tables

**users**
- `id` (uuid)
- `display_id` (text) — e.g. `C002`, `S001`, `M003`
- `role` (enum: `cleaner` | `supervisor` | `manager`)
- `name` (text)
- `language` (text) — `en` | `es` | `pt`
- `password_hash` (text)

**jobs**
- `id` (uuid)
- `site_name` (text)
- `client_name` (text)
- `status` (enum: `not_started` | `in_progress` | `completed`)
- `date` (date)

**job_zones**
- `id` (uuid)
- `job_id` (uuid → jobs)
- `cleaner_id` (uuid → users)
- `zone_name` (text) — e.g. `Kitchen`, `Desk Zone 01`
- `status` (enum: `not_started` | `in_progress` | `completed` | `flagged_no_photo`)

**cleaning_logs**
- `id` (uuid)
- `job_id` (uuid → jobs)
- `cleaner_id` (uuid → users)
- `zone_id` (uuid → job_zones)
- `image_urls` (text[]) — array, 1–3 photos
- `note` (text | null) — cleaner's original language
- `note_translated` (text | null) — auto-translated to English
- `no_photo_reason` (boolean)
- `queued` (boolean) — true if submitted offline and pending send
- `created_at` (timestamptz)

**cleaner_job_assignments**
- `id` (uuid)
- `cleaner_id` (uuid → users)
- `job_id` (uuid → jobs)

> RLS must be enabled on every table. Cleaners can only read/write their own data. Supervisors can read all data for their assigned jobs. Managers can read all data for their assigned sites.

---

## App Data Flow

```
Cleaner selects zone → uploads photo(s) →
App uploads image to Supabase Storage →
App retrieves public URL →
App POSTs to n8n webhook:
  { cleaner_id, job_id, zone_id, image_urls[], note, timestamp } →
n8n handles:
  - inserting cleaning_log row
  - updating job_zone status
  - triggering supervisor/manager notifications
App reads updated state from Supabase and reflects it
```

If offline: submission is queued in localForage and retried automatically on reconnect before sending to the webhook.

---

## Role-Based Routing

Login ID prefix determines the role and routes the user:

| ID Prefix | Role | App Section |
|---|---|---|
| `C` | Cleaner | `/cleaner/*` |
| `S` | Supervisor | `/supervisor/*` — not built yet |
| `M` | Manager | `/manager/*` — not built yet |

---

## Cleaner Side — Screen List

| Screen | Route | Status |
|---|---|---|
| Language Select | `/` | Not started |
| Login | `/login` | Not started |
| Home (Job List) | `/cleaner/home` | Not started |
| Zone List | `/cleaner/job/:jobId` | Not started |
| Zone Submission | `/cleaner/job/:jobId/zone/:zoneId` | Not started |
| No Photo Note | `/cleaner/job/:jobId/zone/:zoneId/note` | Not started |
| Zone Success | (inline state on Zone Submission) | Not started |
| Shift Completed | `/cleaner/job/:jobId/complete` | Not started |
| Shift History | `/cleaner/history` | Not started |
| Offline Banner | (persistent overlay component) | Not started |

---

## Language & Translation

- Supported languages at launch: English (`en`), Spanish (`es`), Portuguese (`pt`)
- Language is selected by the cleaner on first load (Language Select screen) and stored in app context + Supabase user record
- All UI strings must be stored in a `/lib/i18n/` dictionary — no hardcoded English strings in components
- Cleaner notes submitted in any language are passed through Google Translate API on the n8n side, translated to English, and stored in `cleaning_logs.note_translated`
- Supervisor and manager views always display the translated version

---

## AIXD Engineering Rules

### Prompting
- Always break large tasks into smaller focused steps before starting
- One task per prompt — complete and commit before moving to the next
- Give full context in every prompt: file path, component name, expected behaviour, screen size if relevant
- If a prompt was wrong, edit the original — do not send a follow-up correction

### Development Loop
1. Write a focused prompt for one specific task
2. Let Claude Code build it
3. Read the diff — understand every change before accepting
4. Test in the browser at localhost
5. Commit if it works, revert if it does not
6. Move to the next task

### Git Discipline
- Always start from a clean `git status` before new work
- Commit after every meaningful piece of work — small commits, easy rollbacks
- Never auto-accept changes without reviewing the diff
- Commit message format: `feat:`, `fix:`, `refactor:`, `chore:`

### Security (Non-Negotiable)
- Secrets live in `.env` only — never in code, never in a chat, never in a document
- `.env` is in `.gitignore` before the first commit
- If a secret has been committed, treat it as compromised and rotate immediately
- Reference env vars as `import.meta.env.VITE_YOUR_KEY_NAME` — never as hardcoded strings
- RLS is enabled on every Supabase table without exception
- All Supabase queries that return user data must filter by `auth.uid()` or the cleaner's `display_id`
- Never use sequential integer IDs in URLs for private resources — use UUIDs
- CORS whitelisted to your exact domain only — never wildcard `*` in production
- Rate limiting configured on all auth and form endpoints via Cloudflare

### CLAUDE.md
- Update this file at the end of every session
- Document the current state: what works, what doesn't, known issues
- Record any stack decisions or architectural changes made during the session
- Prompt to trigger: `Update CLAUDE.md to reflect today's work`

---

## Environment Variables

| Variable | Source |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `VITE_N8N_WEBHOOK_URL` | n8n → your Proof of Cleaning webhook URL |
| `VITE_GOOGLE_TRANSLATE_API_KEY` | Google Cloud Console → Translate API |

---

## Key Files
*To be populated as the build progresses.*

---

## Current Status
**Working:** Nothing yet — project is being initialised  
**In progress:** Project setup, Vite scaffold, Tailwind config, Supabase connection, brand tokens  
**Not yet started:** All cleaner screens, all supervisor screens, all manager screens, n8n webhook integration, offline queue, translation layer  
**Known issues:** None

---

## Do Not Touch
- The data flow architecture — app sends events to n8n, n8n writes to Supabase. The app must never write directly to `cleaning_logs` or update `job_zone` status itself. That is n8n's job.
- Role routing logic in `lib/auth.ts` — the C/S/M prefix system is fixed
- RLS policies once set — any change requires a full security review
- Brand colour tokens — do not substitute or approximate, use exact hex values from the brand guidelines
```
