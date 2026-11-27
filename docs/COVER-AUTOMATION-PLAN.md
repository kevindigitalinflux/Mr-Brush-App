# Cover automation: build plan (absence reporting, ranked cover candidates, SMS offers)

Written 2026-11-25 by Claude (Opus 5.5) in Fable mode, for Kevin's review. This is a PLAN. Nothing in it has been built, applied or sent. No database, n8n, SMS or git state was changed while writing it; the only file written is this one (not committed).

Decisions already made by Kevin on 2026-11-25 are taken as fixed (see CLAUDE.md "Update 2026-11-25" sections and docs/HANDOFF.md). Where this plan makes a choice Kevin has not made, it is labelled **Claude's call** and can be overruled.

Citations: `file:line` refers to the `mr-brush-app` repo at `main` `6fad8b1`. "SQL:" means a read-only metadata query run on 2026-11-25 against project `bstohwxzufebufbybxtd` through the `supabase-mrbrush` connector. "n8n:" means a read-only listing through `n8n-builder`. Anything else is marked **unverified guess**.

---

## 0. Outside gates (read first; the long waits are at the top)

| # | Gate | Owner | Status 2026-11-25 | Evidence / note | Blocks stage |
|---|---|---|---|---|---|
| G1 | Final SMS provider choice (The SMS Works baseline; FireText and ClickSend being compared in the main session) | Kevin + Claude (main session) | Open | CLAUDE.md:546 | 3 |
| G2 | SMS account opened, test credit or first top-up paid (The SMS Works: BACS minimum GBP 10, CLAUDE.md:542; others not checked) | Kevin only | Not started | Spending: needs Kevin's yes and a cap | 3 |
| G3 | API credential created and stored in n8n's credential store only (never chat, git, vault, `.env` of the app) | Kevin only (hidden-prompt script or the n8n UI) | Not started | CLAUDE.md:546 step 3 | 3 |
| G4 | Sender ID "MrBrush" accepted by the chosen provider | Kevin (account) + Claude (test) | Checked against The SMS Works' published rules only: 7 alphanumeric characters, inside the 4 to 11 range, not on the restricted-terms list (https://thesmsworks.co.uk/developers, read 2026-11-25). FireText allows 3 to 11 alphanumeric (https://www.firetext.co.uk/docs). ClickSend: "alpha tag" allowed, rules per country not read. Real acceptance only proven by a live send. | 3 |
| G5 | Delivery-report webhook URL configured in the provider dashboard (or per message) | Kevin (dashboard click) | Not started | SMS Works: account page "Delivery Reports > Webhook Configuration" or per-message `deliveryreporturl`; FireText: "API Settings" or per-message `receipt`; ClickSend: per-message `url` (pages above) | 3 |
| G6 | Consent from every replacement-pool contact to receive job-offer texts, with date and how it was given | Kevin only | Not started | UK PECR/GDPR: these are job offers to people who asked to be in the pool, but consent and an opt-out are still needed (**unverified guess** on the legal classification; Kevin to confirm with whoever advises on privacy). The privacy notice drafted 2026-10-29 (vault Log.md:10) should mention cover texts. | 3 |
| G7 | Data entry: pool contacts (name, phone, nearest station, English level 1 to 5, manual rating if no app ratings), phone numbers for existing cleaners and supervisors, nearest station for each of the 3 facilities | Kevin only (via the stage 1 screen, or SQL he runs) | Kevin is gathering it (CLAUDE.md:546) | Personal data: database only, never git, vault or chat summaries | 1 sample |
| G8 | Station list source (Tube, Overground, Elizabeth line, DLR, National Rail in London, with coordinates) | Claude | Not checked | TfL open data / NaPTAN are the likely sources under the Open Government Licence (**unverified guess**); a few hundred rows | 1 |
| G9 | Kevin approves each stage at its gate, and every live database migration at the time it runs | Kevin only | Standing rule | docs/HANDOFF.md:88 | all |
| G10 | Role for the build: default is Claude architects and reviews, Codex builds. Any change must be confirmed by Kevin and recorded | Kevin | Not confirmed for this task | Shared agent workflow.md:9 | 1 |

Fallbacks: if the chosen provider refuses the sender ID, use its shared number (replies possible, less recognisable). If no provider is ready, stages 1 and 2 still deliver value (ranked list plus manual phone calls).

---

## 1. Result (habit 1)

What Kevin will see when this works:

1. A cleaner (or a supervisor on their behalf) reports "I can't work on these dates" in the app in English, Spanish or Portuguese. The supervisor gets an in-app notification.
2. The supervisor opens the absence, sees the affected zones and a ranked list of cover candidates (pool contacts plus cleaners with no shift on those dates), each with rating, distance from the site's nearest station, English level, and why they rank where they do.
3. The supervisor (or Kevin) ticks who to text, sees the exact SMS text and its cost, and presses Approve. Nothing is sent before that press.
4. Candidates get one SMS from "MrBrush" with a link. The page shows date, times, area, pay; they tap Apply (optionally share location) or Not for me, or stop future texts. No personal data of anyone else is on that page.
5. The supervisor sees applications arrive, picks one, presses Confirm. The zones move to that person, the old absence_reports log is written, the chosen person gets a confirmation SMS (also approved), and the link for everyone else shows "This shift has been filled".

The check on real data: one real absence (suggested: a single day of Miryam's cover period at Journey, or a made-up absence on a quiet future date), one test pool contact whose phone is Kevin's own, one SMS sent, delivered status visible in the app, the link opened on Kevin's phone, Apply recorded, Confirm moves the zones, and the provider dashboard shows exactly the messages expected and their cost. "Tests pass" or "deployed" alone is not the result.

## 2. The point (habit 5)

This would be technically correct and still wrong for Kevin if: a text reaches someone it should not (unapproved, opted out, the wrong person, at 3am, or twice), or a public link exposes anyone's phone, address, client name or door details, or the ranked list is so empty or badly ordered that the supervisor ignores it and phones people anyway. **A wrong or unwanted text costs more than a missing one; a useful ranked list matters more than the SMS machinery.**

## 3. What exists today (read, not assumed; habit 2)

App:
- Absence screen `/supervisor/absence` (`src/App.tsx:82`) writes `absence_reports` directly from the browser (`src/pages/supervisor/Absence.tsx:177-183`) and then reassigns `job_zones.cleaner_id` directly (`Absence.tsx:187-193`); the zone update's error is not checked. All text on this screen is hard-coded English (`Absence.tsx:205, 304, 356-357, 375`), against the i18n rule (CLAUDE.md:329).
- A second absence flow in the cleaner profile sheet (`src/pages/supervisor/CleanerProfile.tsx:126-190`) does the same for "today" only, uses i18n keys `sv_absence_*` (`src/lib/i18n/index.ts:408-416`, es 834-842, pt 1260-1268), and also ignores the zone update's result (`CleanerProfile.tsx:180-185`).
- Both query `role in ('cleaner','replacement_cleaner')` (`Absence.tsx:57`, `CleanerProfile.tsx:140`), but the live constraint only allows `cleaner | supervisor | client` (SQL: `profiles_role_check`). R001 is `role = cleaner`, `contract_type = replacement` (docs/HANDOFF.md:37; SQL: one profile has `contract_type = replacement`).
- Workers screen links to Absence (`src/pages/supervisor/Workers.tsx:273, 317`). Cleaner Home already hosts cards (`src/pages/cleaner/Home.tsx:317-318, 409-410`), so a "Report absence" card fits there.
- Public routes are `/`, `/language`, `/login` only (`src/App.tsx:48-51`); everything else is behind `RequireAuth`.
- Login routes by prefix; `R\d{3}` maps to cleaner (`src/lib/auth.ts:18`). Login then navigates by role (`src/pages/cleaner/Login.tsx:92`), the natural place for a "phone number missing" step.
- Webhook helpers no-op when unset, except `postRecurringSync` which throws (`src/lib/webhooks.ts:23-80`).
- `public/_headers:5` sets `geolocation=()`, which blocks location sharing; `connect-src` already allows Supabase and the n8n host (`_headers:7`).

Database (SQL, 2026-11-25):
- 23 public tables, all RLS on. `absence_reports` has `id, absent_cleaner_id, replacement_id, reported_by_id, company_id, shift_date, created_at, status` with status in `pending | replacement_found | confirmed | no_cover`; 8 rows, all `pending`, all with a replacement.
- `absence_reports` policies: INSERT checks only `reported_by_id = auth.uid()` (any logged-in user, any `company_id`); SELECT allows anyone whose company matches, which includes cleaners and clients. No UPDATE or DELETE policy.
- `jobs` has only `scheduled_date` (no start or end time); `job_zones` has no time columns (`priority boolean`, `notes`). So "no clashing shift" can only mean "no zone on that date" today. Journey's times live inside zone names (docs/HANDOFF.md:30).
- `profiles` columns include `phone` and `is_active`. Phones present: 5 of 9 cleaners, 1 of 3 supervisors, 0 clients (counts only; no values read).
- `profiles` RLS: `profiles: client reads cleaner names` lets a client read whole cleaner rows in the company, which includes `phone`. **Clients can read cleaners' phone numbers today.**
- `profiles: self update language preference` has `USING id = auth.uid()` and a check only on `language_preference`, and `authenticated` holds column-level UPDATE on every `profiles` column, including `role` and `company_id`. **Any logged-in user can change their own `role` (for example to `supervisor`) through the API today.** `get_my_role()` reads `profiles.role`, so this would unlock supervisor RLS everywhere. This predates this task and must be fixed first (stage 0).
- `cleaner_ratings`: `rating` 1 to 5, `rated_by_role` client or supervisor; 8 rows covering 3 cleaners. Ratings are thin; a manual rating fallback is needed.
- `notifications (user_id, title, message, is_read, cleaning_log_id, metadata jsonb)`; RLS: self read and self update only. Existing DB functions already insert notifications as SECURITY DEFINER (`notify_complaint_event`).
- Database webhooks already call n8n from triggers: `on_job_zone_insert` (zone-assigned, WF-10) and `Feedback notify webhook`, via `supabase_functions.http_request`. Note that WF-10 fires on INSERT only, so reassigning a zone with UPDATE does not notify the new cleaner.
- Extensions installed: `pg_net`, `pgcrypto`, `supabase_vault`. `pg_cron` available but not installed. Edge functions: only `seed-evidence-photos-temp`.
- Storage: `evidence-photos` and `evidence-videos` public; `facility-guide` private.

n8n (2026-11-25): 11 workflows, all active: WF-5, 6, 8, 10, 11, 12, 13, 14, 15, 16, WF-LEAD-NOTIFY. **No WF-A/B/C exist on the live instance**, and the vault records them as obsolete (Decisions.md, 2026-10-29). Nothing to migrate or switch off. The local WF-6 export sets `is_replacement: false` in the pay-record body (`n8n/WF-6-shift-completion-pay-record.json:274`); the live version may differ (exports are stale, CLAUDE.md:500), so payroll's handling of cover shifts is **unverified**.

Provider facts (read 2026-11-25 from provider pages, not tested):
- The SMS Works: JWT auth; `POST https://api.thesmsworks.co.uk/v1/message/send` with `sender`, `destination`, `content`; delivery reports by account webhook or `deliveryreporturl`, payload includes `messageid`, `status`, `failurereason`, `credits`; no webhook signing mentioned; flooding filter of 20 varied or 6 identical messages per number per hour; replies need a paid "reply number" (price not read).
- FireText: `apiKey` (or username and password); `https://www.firetext.co.uk/api/sendsms` with `from`, `to`, `message`; receipt callback set in API Settings or per message `receipt`, returns `mobile`, `status` (0 delivered, 1 declined, 2 undelivered), `reference`, `time`.
- ClickSend: basic auth; `POST /v3/sms/send` with `messages[]` and `senders`; per-message receipt `url`; receipt fields `message_id`, `status_code`, `status_text`, `error_code`, `custom_string`.
- Not checked for any provider: test or sandbox mode, STOP handling, webhook signing, rate limits, UK pricing pages beyond CLAUDE.md:542.

## 4. Surface map (habit 3)

Screens: supervisor Absence (rebuild), supervisor CleanerProfile absence sheet (route into the new flow), supervisor Workers (entry), supervisor Dashboard (pending-absence count, optional), supervisor Notifications (new notification type shown), cleaner Home (Report absence card), new cleaner "My absences" screen, new supervisor "Cover request" detail screen, new supervisor "Cover pool" screen, new public `/c/:token` page, Login (first-login phone step), new "My details" (phone, station, photo).
Tables: `absence_reports` (kept, written on confirm), new `absence_requests`, `cover_offers`, `cover_pool`, `worker_details`, `london_stations`, `sms_log`; `facilities` (new `nearest_station_id`), `job_zones` (reassignment), `notifications` (inserts), `profiles` (stage 0 fix only).
Policies: `profiles` self update, `profiles` client read, `absence_reports` insert and select, plus RLS on every new table.
Functions: new SECURITY DEFINER RPCs (section 6); a trigger to call n8n on approval; retention job.
n8n: new WF-SMS (sub-workflow, the only place that knows the provider), WF-COVER-SEND, WF-COVER-DLR (delivery webhook). Existing workflows untouched.
Headers and env: `public/_headers` Permissions-Policy `geolocation=(self)`; no new `connect-src` domain and no new `VITE_*` variable (Claude's call, section 5). n8n gets a provider credential and a shared secret; Supabase Vault gets the n8n webhook secret.
i18n: new `cover_*` keys in en, es, pt for every new screen and the public page; SMS templates in en, es, pt.
Docs: `docs/AUTOMATIONS.md` does not exist yet (global rule says to record each automation there); create it in stage 3. CLAUDE.md screen lists and data architecture.

## 5. Architecture and where each piece lives

**Chosen design (Claude's call, following the global order: database rules, then server functions, then n8n only where needed):**
- All state changes (report, draft candidates, approve, apply, choose, confirm, cancel) are **SECURITY DEFINER RPCs in Postgres**. They check role, company and facility, enforce caps, and write the rows. The browser never writes the new tables directly.
- **n8n does only what needs a secret or an outside call:** sending SMS (through one sub-workflow, WF-SMS, so the provider is one node) and receiving delivery reports. It is triggered by a database trigger on approval, using `pg_net` with a secret read from Supabase Vault, the same pattern as the existing database webhooks but with the secret kept out of the trigger text.
- **Expiry needs no scheduler:** every RPC treats `expires_at < now()` as expired. Only the retention purge needs a schedule (stage 6; `pg_cron`, one SQL job).

**Strongest alternative:** every action as an n8n webhook (the app posts, n8n writes), matching CLAUDE.md:4 "the app never holds automation logic". Deciding fact: does the convention cover non-submission writes? CLAUDE.md:228 limits the rule to `cleaning_logs` and `job_zone` status during submission, and the app already writes `absence_reports`, `job_zones.cleaner_id`, pay records and recurring rules directly (Absence.tsx:177-193). RPCs keep business rules in the database (the global rule's first choice), are atomic, need no new `VITE_*` webhook URL, and work for the anonymous apply page without exposing an n8n URL. **Deviation recorded:** absence and cover state is written by database functions, not n8n. n8n still owns all SMS sending. The zone reassignment on confirm is a `job_zones.cleaner_id` change (not a status change), which the app already does today.

**Rejected:** a Supabase edge function as the SMS adapter. It would be equally simple, but Kevin decided on one n8n sub-workflow (2026-11-25), and n8n already holds the Supabase service credential.

## 6. Data model

All tables: `company_id` for scoping, RLS on, no grants to `anon` except the two public RPCs, `created_at`. Personal data columns marked (PD).

**`worker_details`** (1:1 with `profiles`, so new personal fields stay out of `profiles`, which clients can read):
`profile_id` PK FK profiles, `company_id`, `phone_e164` (PD, check `^\+44\d{10}$`, UK only), `phone_confirmed_at`, `nearest_station_id` FK, `english_level` smallint 1 to 5 (set by supervisor, Claude's call), `photo_path` (private bucket `profile-photos`, stage 6), `sms_opt_out_at`, `available_for_cover` boolean default true, `updated_at`.
RLS: self SELECT; supervisors SELECT for profiles in their company; no client access. Writes only through `save_my_details(phone, station)` and `supervisor_set_worker_details(...)`.

**`cover_pool`** (people outside the app, plus app users Kevin wants in the pool, for example R001):
`id`, `company_id`, `profile_id` nullable unique FK profiles, `full_name` (PD), `phone_e164` (PD, null if `profile_id` set: phone then comes from `worker_details`), `nearest_station_id`, `english_level`, `manual_rating` 1 to 5 nullable, `consent_at`, `consent_source` text, `sms_opt_out_at`, `active`, `notes`, `created_by`.
RLS: supervisors of the company SELECT; INSERT and UPDATE through RPC only. Clients and cleaners: none.

**`london_stations`**: `id`, `name`, `lat`, `lon`, `lines` text. Read for all authenticated. Seeded once (G8). `facilities.nearest_station_id` added (3 rows to fill).

**`absence_requests`**:
`id`, `company_id`, `facility_id`, `absent_profile_id`, `reported_by`, `reported_by_role`, `start_date`, `end_date` (inclusive, one facility per request, Claude's call), `reason_code` (`sick | personal | emergency | other`), `reason_note` (PD, optional, free text, shown only to supervisors), `start_time`, `end_time`, `paid_hours`, `hourly_rate` (prefilled from `cleaner_facility_hours` and `facility_rates`, editable by the supervisor before approval), `area_label` (what the SMS calls the place, for example "Old Street"; never the client's name), `status`, `chosen_offer_id`, `urgent` boolean, `closed_at`, `updated_at`.
RLS: absent person SELECT own; supervisors SELECT where the facility is in `supervisor_facilities` for them; clients none. Fixes the current "everyone in the company can read absences" leak for the new table.

**`cover_offers`** (one per candidate per request):
`id`, `request_id`, `company_id`, `candidate_kind` (`pool | cleaner`), `pool_id` nullable, `profile_id` nullable, `rank`, `score`, `score_parts` jsonb (rating, distance_km, english, free_days), `status`, `token_hash` bytea unique (sha256 of the link token; the raw token is never stored), `expires_at`, `view_count`, `responded_at`, `response` (`applied | declined`), `distance_now_km` numeric(5,1) nullable (from shared location; raw coordinates never stored), `location_consent_at`, `message_text` (exact approved text), `language`, `approved_by`, `approved_at`, `provider_message_id`, `delivery_status`, `delivery_detail`, `segments`, `cost_pence`.
RLS: supervisors of the facility SELECT; candidate who is an app user may SELECT their own offer (later). No direct writes.

**`sms_log`** (append-only audit of every send attempt, including dry runs): `id`, `company_id`, `offer_id` nullable, `kind` (`offer | confirm | test`), `to_hash` (sha256 of the number, so the log holds no phone), `segments`, `provider`, `provider_message_id`, `status`, `dry_run`, `created_at`. Supervisors SELECT.

**Existing `absence_reports`**: kept as the payroll-facing log. On confirm, the RPC writes one row per date with `status = 'confirmed'` and `replacement_id`. Old 8 rows untouched.

### Personal data handling
- Phones live only in `worker_details.phone_e164` and `cover_pool.phone_e164`. Stage 0 copies the 6 existing `profiles.phone` values into `worker_details` in SQL (never printed), then sets `profiles.phone` to null; the app has no reader of `profiles.phone` (grep of `src/` 2026-11-25 found none). Phones never appear in the public page, logs, n8n execution data kept long-term (set WF-SMS to not save successful execution data; **unverified** whether that per-workflow setting is available on Kevin's n8n version), git, vault or chat.
- Location: optional, only on the apply page, only after a plain consent sentence and the browser prompt. The RPC computes distance to the facility's coordinates and stores `distance_now_km` rounded to 0.1 km and the consent time. Raw latitude and longitude are discarded inside the function.
- Retention (Claude's call): 30 days after a request closes, `distance_now_km`, `reason_note`, `message_text` and `token_hash` are cleared; offers keep status and counts for audit. Pool members who opt out keep a row with `sms_opt_out_at` (so they are never texted again) and their phone is replaced by a hash after 30 days.

## 7. State machines

**Absence request**

| From | Event (RPC) | To | Who |
|---|---|---|---|
| (none) | `report_absence` | `reported` | cleaner (own) or supervisor |
| `reported` | `cancel_absence` | `cancelled` | reporter or supervisor |
| `reported` | `draft_cover(request, limit)` | `drafting` | supervisor |
| `drafting` | `approve_offers(request, offer_ids, message)` | `offering` | supervisor or Kevin |
| `offering` | candidate `respond_offer` | `offering` (applications listed) | candidate via link |
| `offering` | `approve_offers` again (more candidates) | `offering` | supervisor (capped) |
| `offering` | `choose_cover(offer)` | `cover_chosen` | supervisor |
| `cover_chosen` | `confirm_cover(request)` | `covered` | supervisor; reassigns zones, writes `absence_reports`, queues confirmation SMS for approval in the same click |
| `reported`, `drafting`, `offering` | `close_no_cover` | `no_cover` | supervisor |
| any open | `start_date` passed | treated as `expired` | automatic, read-time |

**Offer**: `drafted` → `approved` → `sending` → `sent` → `delivered` or `failed` → `viewed` → `applied` or `declined` → `chosen` or `not_chosen`; plus `expired`, `withdrawn` (request cancelled or filled), `opted_out`. Each link is single-use for a response: after `applied` or `declined` the page shows the recorded answer and accepts nothing more. Viewing is allowed until expiry.

Offers to a cleaner whose pay record matters: on confirm, zones move to the cover person's profile. A pool member without an app account cannot be assigned zones (`job_zones.cleaner_id` references `profiles`). **Open question Q1** below.

## 8. Ranking query

Candidates for a request (function `rank_cover_candidates(request_id)`, SECURITY DEFINER, supervisor-only):
1. Active `cover_pool` rows with a phone, no opt-out, consent recorded.
2. Active cleaners (`profiles.role = 'cleaner'`, `is_active`, same company) with a `worker_details` phone, no opt-out, `available_for_cover`, who have **no `job_zones` row with status other than `deleted` on any date in the request range** (the only clash test the schema supports today, section 3), excluding the absent person.
3. Deduplicate by `profile_id` (an app user in the pool appears once).

Score (Claude's call, shown to the supervisor as three small bars so it can be judged, weights in one SQL constant so they are easy to change after the sample):
- Rating 40%: average `cleaner_ratings.rating` over the last 12 months if at least 2 ratings, else `manual_rating`, else neutral 3. Normalised (r - 1) / 4.
- Proximity 40%: great-circle distance between the candidate's station and the facility's station (plain SQL haversine; `earthdistance` is not needed). 0 km scores 1, 15 km or more scores 0, linear. Missing station scores 0.5 and is flagged "no station".
- English 20%: (level - 1) / 4; missing scores 0.5 and is flagged.
Order by score, then rating, then distance. Return `score_parts` for display. Missing data is shown, never hidden, so Kevin can see what to fill in.

## 9. Screens (all strings in `src/lib/i18n/index.ts`, en, es, pt)

Cleaner side:
- Home card "Can't make a shift?" → `/cleaner/absence/new`: date range, reason (four buttons), optional note, confirm. Shows the shifts affected (their own zones on those dates). Calls `report_absence`.
- `/cleaner/absence`: my reported absences and their status (reported, being covered, covered). Never shows who covers or any candidate data.
- First-login step (stage 6): if `worker_details.phone_e164` is missing, ask for the mobile number and nearest station before Home; skippable twice, then required (Claude's call). Same for supervisors.

Supervisor side:
- `/supervisor/absence` rebuilt as a list of requests by status (needs action first), using i18n, replacing the hard-coded English screen. The old "pick replacement and reassign" path stays available as "Assign directly" for when the supervisor already knows who covers (no SMS).
- `/supervisor/absence/:requestId` detail: affected zones per date; shift details form (times, hours, rate, area label, prefilled); ranked candidates with score bars and flags; tick boxes (default top 5); **SMS preview per language with character count, segment count and cost**; Approve button with an "I have checked the text and recipients" confirmation; then live offer statuses (sent, delivered, failed, viewed, applied, declined) and applicants with distance now; Choose; Confirm.
- `/supervisor/cover-pool`: list, add and edit pool contacts (name, phone, station, English level, manual rating, consent date and source, active). Phone shown masked except the last 3 digits after entry (Claude's call).
- CleanerProfile: show station, English level, phone status (set / missing), and later photo; the old absence sheet links into the new flow.

Public page `/c/:token` (outside `RequireAuth`, no login):
- Calls `view_offer(token)` which returns only: shift dates, weekday, start and end time, paid hours, hourly rate, area label, language, offer status, whether already filled. No names, no client name, no address, no door or guide content, no other candidates.
- Buttons: Apply, Not for me, Stop cover texts. Optional "Share my location so we can see how far you are" with a one-line consent and the browser prompt.
- Language from the offer, switchable en, es, pt.
- Generic message for invalid, expired or used tokens (same response for all three so the page reveals nothing).

## 10. SMS adapter and delivery webhook

**WF-SMS (sub-workflow, the only provider-specific piece):** input `{ to_e164, text, client_ref, dry_run }`; output `{ ok, provider, provider_message_id, segments, status, error }`. Inside: GSM-7 check and segment count (refuse anything over 1 segment unless an explicit `allow_multi` flag), dry-run branch that sends nothing, one HTTP node for the provider, mapping of the provider's reply. Swapping providers means replacing the HTTP node and the mapping.

**WF-COVER-SEND:** webhook with secret header, called by the database on approval with `{ request_id }` only. Reads approved offers with the service credential, checks caps again, for each: generates a random 22-character token, stores its sha256 through RPC `n8n_set_offer_token` (service role only), builds the link, calls WF-SMS, writes status and provider id back through RPC `n8n_record_send`. The raw token exists only in n8n memory and the SMS.

**WF-COVER-DLR:** public webhook for provider delivery reports, protected by a long random path segment plus a shared query secret (and basic auth where the provider supports it; signing is not documented for The SMS Works, read 2026-11-25). It only accepts reports whose `provider_message_id` matches a sent offer, and maps statuses to `delivered | failed | pending`.

What each provider needs (from the pages read 2026-11-25; anything else not checked):

| | The SMS Works | FireText | ClickSend |
|---|---|---|---|
| Credential in n8n | JWT (header `Authorization`) | `apiKey` parameter | basic auth (username + API key) |
| Send call | `POST /v1/message/send` `sender`, `destination`, `content` | `/api/sendsms` `from`, `to`, `message` | `POST /v3/sms/send` `messages[]` (`to`, `body`, `from`) |
| Delivery report | account webhook or `deliveryreporturl`; `messageid`, `status`, `failurereason` | API Settings or `receipt`; `reference`, `status` 0/1/2 | per-message `url`; `message_id`, `status_code`, `custom_string` |
| Our reference field | `tag` or `metadata` (**unverified** which is echoed back) | `reference` | `custom_string` |
| Sender ID | 4 to 11 alphanumeric, restricted terms list | 3 to 11 alphanumeric | alpha tag, per-country rules not read |
| Known limits | 20 varied / 6 identical per number per hour | not read | not read |

## 11. Message text and cost

Template (English, Claude's draft; must be 160 GSM-7 characters or fewer including the link):
`MrBrush: cover shift Tue 9 Dec 06:30-14:30 near Old Street, 8h at £14.80/h. Details and apply: https://app.mrbrushandco.co.uk/c/<22 chars>`
(150 characters with a 22-character token, counted 2026-11-25; a multi-day request uses "9-19 Dec, Mon-Fri" and must be re-counted. Adding " Reply via link only" made it 170, so it was dropped; the opt-out lives on the page.)

Rules: no client name, no exact address, no names of people. "£" is in the GSM-7 set; Spanish and Portuguese versions must avoid characters outside GSM-7 (for example á, í, ó, ú, ç, ã) or the message switches to 70-character parts and costs 3 times as much. The preview shows segment count; WF-SMS refuses more than 1 segment. Shorter link host (for example a short custom domain) is a later option.

Cost per absence (prices from CLAUDE.md:542; Mr Brush is not VAT registered, so VAT is a real cost: 4.4p ex VAT is about 5.3p paid):

| Scenario | Messages | At 4p | At 5p | At 5.3p (4.4p + VAT) |
|---|---|---|---|---|
| Typical: 5 offers + 1 confirmation | 6 | 24p | 30p | 32p |
| Hard cap: 10 offers + 1 confirmation | 11 | 44p | 55p | 58p |
| Two-week cover with a second round (5 + 5 + 1) | 11 | 44p | 55p | 58p |
| Test stage (Kevin's phone, about 10 sends in total) | 10 | 40p | 50p | 53p |

"Shift filled" texts to non-chosen candidates are not sent (the link shows it), which keeps the cost at one text per candidate (Claude's call). At an assumed 4 absences a month this is about GBP 1.30 a month plus any minimum top-up (The SMS Works BACS minimum GBP 10, CLAUDE.md:542; undelivered refunded per the same note).

## 12. Abuse and safety

- Nothing is sent without an approved batch; the n8n workflow re-checks approval, caps and opt-outs, so a bug in the app cannot bypass them.
- Caps (Claude's call, stored in one config table): 10 offers per approval, 2 approvals per request, 1 offer SMS per candidate per request, 3 offer SMS per candidate per 7 days, 30 SMS per company per day, plus a per-day spend alert in the supervisor screen.
- Quiet hours 21:00 to 07:00 Europe/London: approval is allowed but sending waits until 07:00 unless "urgent" is ticked (an early-morning sick call is the real case). Europe/London only.
- Opt-out: every page has "Stop cover texts"; opted-out numbers are excluded in the ranking and in n8n. Alphanumeric senders cannot receive replies, so the SMS does not say "reply STOP" (Claude's call; a reply number would add cost, price not checked).
- Links: 22 random base62 characters (about 131 bits), stored hashed, expire at the earlier of the shift start or 48 hours after sending, one response each, a lock after 20 views. Because guessing is infeasible, per-IP rate limiting is not essential; Cloudflare rate limiting is a paid add-on (CLAUDE.md:410). The two public RPCs return the same generic answer for unknown, expired and used tokens, and do constant work per call.
- `Referrer-Policy: strict-origin-when-cross-origin` (`_headers:4`) already stops the token path leaking to Google Fonts.
- Flooding filter: The SMS Works blocks more than 6 identical texts per hour to one number; tests on Kevin's phone must vary text or space out.

## 13. Headers and Cloudflare

- `public/_headers:5`: `geolocation=()` → `geolocation=(self)` (stage 4). No other header change: the apply page talks only to Supabase (already in `connect-src`).
- No new `VITE_*` variable (approval goes database → n8n). Nothing to add in the Cloudflare Pages dashboard. If that changes, add the variable there and redeploy (CLAUDE.md:308).
- Secrets: n8n webhook secret in Supabase Vault (name `cover_send_secret`) and in n8n; provider credential in n8n only; the delivery-webhook secret in n8n and the provider dashboard. Names only in docs.

## 14. Pre-mortem (habits 6 and Opus add-on)

1. **The ranked list is empty or wrong**, because stations, English levels, phones and ratings are mostly missing (only 3 cleaners have any rating; 5 of 9 cleaners have a phone). Supervisors would ignore it. Change: stage 1 ships the list with no SMS at all and stops for Kevin to look at it for one real absence; missing data is flagged per person. Earliest detection: the stage 1 sample.
2. **Texts go wrong in the real world**: Spanish accents triple the cost, the sender ID is blocked, or messages arrive at 6am to someone who left months ago. Change: GSM-7 and segment check in WF-SMS, quiet hours, consent dates, a first live send only to Kevin's own phone in each language. Earliest detection: stage 3 test send.
3. **Two people turn up, or nobody**: a candidate applies after someone else was chosen, or a cleaner picked as "free" actually has a shift elsewhere that is not in the app. Change: links show "filled" immediately after choose; confirm is one atomic RPC that re-checks clashes; the supervisor always picks, never auto-assign. Accepted risk: off-app shifts are invisible (no shift times exist in the schema); the supervisor screen says "free in the app on these dates".
4. **(Security, found while reading)** the existing `profiles` self-update hole and client access to phones. If cover automation adds more personal fields first, the leak grows. Change: stage 0 before anything else.

## 15. Rollout (each stage on its own feature branch, stop for Kevin at every gate)

| Stage | Branch | Delivers | Gate for Kevin |
|---|---|---|---|
| 0 | `fix/profiles-rls-hardening` | SQL only: restrict self-update to `language_preference` and `tutorial_seen_at` (revoke column UPDATE on other columns from `authenticated`, keep the RPC path), replace client cleaner-read with a view or column list that excludes `phone`, tighten `absence_reports` insert to supervisors of that company and select to supervisors; move phones to `worker_details` (created here) and null `profiles.phone`. Verify every existing screen still works (language switch, tutorial, supervisor lists, client names). | Kevin approves the SQL and the live run; re-test login, language switch, client overview |
| 1 | `feature/cover-ranking` | Tables `london_stations`, `cover_pool`, `absence_requests` (no SMS columns used yet), `facilities.nearest_station_id`, `worker_details` fields; RPCs `rank_cover_candidates`, pool and details save RPCs; supervisor Cover Pool screen; supervisor Absence detail showing affected zones and the ranked list for a request created by a supervisor; i18n. **No SMS, no n8n, no public page.** | Cheap sample: Kevin enters 3 to 5 pool contacts and stations, opens one real absence, reads the ranked list, and says what is wrong. His words recorded verbatim. |
| 2 | `feature/cover-requests` | Cleaner report screens, request state machine RPCs, offer drafting, SMS preview with segments and cost, Approve writes approved offers; database trigger to n8n is **not yet created**, so approval is a dry run that writes `sms_log` with `dry_run = true`. Supervisor in-app notification on report. | Kevin reports a test absence as a cleaner (his C0004 account) and approves a dry run; checks the preview text in en and es |
| 3 | `feature/cover-sms` | WF-SMS, WF-COVER-SEND, WF-COVER-DLR in n8n (new workflows only); Vault secret; trigger on approval; `docs/AUTOMATIONS.md`. Needs G1 to G5. | Live test: one absence, one pool contact "Kevin test" with Kevin's own phone, one SMS. Check provider dashboard count and cost, delivered status in the app. |
| 4 | `feature/cover-apply-page` | Public `/c/:token`, `view_offer`, `respond_offer`, location consent, opt-out, `geolocation=(self)`. | Kevin opens the link on his phone: apply, then reopen (shows answer), wrong token (generic), opt-out, then check the row holds no coordinates |
| 5 | `feature/cover-confirm` | Choose, confirm (zones reassigned atomically, `absence_reports` rows, confirmation SMS through approval), filled state on links. | First real absence with at most 3 real candidates who know a text is coming |
| 6 | `feature/worker-profile-details` | First-login phone and station step (cleaners and supervisors), profile photo (private bucket), facilities shown (permanent from `cleaner_facility_hours` or `recurring_zone_rules`, covering from offers), retention purge (`pg_cron`). | Kevin tests the first-login step on his phone |

Merging any stage to `main` deploys it (Cloudflare auto-deploy, CLAUDE.md:17); merge only with Kevin's OK, with a rollback tag `pre-<branch>-<date>` like earlier releases.

## 16. Rollback

- App: revert the merge commit or reset to the stage's rollback tag (pattern in CLAUDE.md:457).
- Database: each stage's SQL file in `docs/sql/` has a matching `-- rollback` section (drop new functions and tables in reverse order; stage 0 rollback re-grants the previous column privileges and restores the old policies, and copies phones back to `profiles.phone` only if Kevin asks).
- n8n: new workflows are deactivated (not deleted) to stop all sending; existing workflows are never edited, so there is nothing else to roll back. A single "kill switch" row in the cover config table (`sms_enabled = false`) is checked by both the approve RPC and WF-COVER-SEND.
- SMS already sent cannot be recalled; the link page can be switched to "no longer available" by withdrawing offers.

## 17. Testing on real data

- Stage gates above are the real-data tests. The SMS sample gate is exactly: one absence, one pool contact owned by Kevin, one message, visible in the provider dashboard.
- SQL checks per stage, run as each role through `set local role authenticated` plus a JWT claim (pattern already used in the R001 login test, docs/HANDOFF.md:32): a client cannot read any phone; a cleaner cannot change their role; a cleaner sees only their own absences; anon can call only `view_offer` and `respond_offer`.
- `npm test`, `npx tsc -b`, `npm run build`, ESLint on touched files, and both mobile and desktop layouts opened in a browser (the `replace_all` miss in CLAUDE.md:441 is why both layouts are checked separately).

## 18. Notification hooks (later feature; note only)

`report_absence` inserts one `notifications` row per facility supervisor (existing table and screens). The later notifications feature can add push or SMS for supervisors from the same insert point, and notify the chosen cover person in-app on confirm. WF-10 does not fire on reassignment (insert-only trigger), so the confirmation SMS is the only notice the cover person gets in v1.

## 19. Open questions for Kevin (only those that change what gets built)

1. **Q1:** Pool contacts without an app account: when one is chosen, should the system (a) stop and ask you to create their R account first (current manual pattern), or (b) also build in-app account creation (edge function with the admin API, larger stage)?
2. **Q2:** English level: set by you or the supervisor (Claude's call), or self-reported on first login?
3. **Q3:** Should existing contracted cleaners be texted for cover at all, or only shown in the list so the supervisor can ask them in person?
4. **Q4:** Who can approve sends: any supervisor of that facility, or only you?
5. **Q5:** Is the SMS allowed to name the area (for example "near Old Street") or only "central London"?
6. **Q6:** Stage 0 security fix: approve running it first, before any cover work?

## 20. Before you hand over (Fable checklist)

- **Result and evidence:** this plan is the result of this session. Evidence is the cited reads and queries above. The feature result (section 1) is not reached; nothing was built.
- **Read to be sure:** Fable SKILL and four reference packs; shared agent workflow; project CLAUDE.md (whole) and docs/HANDOFF.md; global CLAUDE.md; `Absence.tsx`, `CleanerProfile.tsx:1-230`, `webhooks.ts`, `auth.ts`, `App.tsx`, `_headers`, greps of `Home.tsx`, `Workers.tsx`, `Login.tsx`, `AppContext.tsx`, i18n; live schema, constraints, policies, grants, functions, triggers, extensions, buckets, edge functions and phone counts; n8n workflow list; vault Decisions and Backlog on WF-A/B/C; three provider documentation pages. **Remaining guesses:** legal classification of cover texts (G6), station data source (G8), which provider field echoes our reference, whether n8n can skip saving execution data per workflow, live WF-6's handling of `is_replacement`, provider sandbox and STOP behaviour, real deliverability of "MrBrush".
- **Open gates:** G1 to G8 (Kevin for accounts, money, consent, data; Claude for station data); G10 role confirmation.
- **Not verified:** no code compiled or run, no SQL tested (all designs above are untested), the privilege-escalation finding was inferred from policies and grants, not exploited or tested; WF-A/B/C searched only on the live instance and in the vault, not in old exports elsewhere; Portuguese template text not drafted.
- **Stronger model needed:** a Codex security consultation (or Fable) on the stage 0 fix and the two anonymous RPCs before they go live, because both are security-sensitive and costly to get wrong. Exact question: "Given these policies and grants, does the revised SQL close self role change and client phone reads without breaking language switch, tutorial seen and client name display, and can `view_offer`/`respond_offer` leak anything or be abused by an anonymous caller?"

---

# Build brief: Cover automation stage 1 (ranking and cover pool, no SMS)

Project / worktree / branch / base commit: `C:\Users\kevin\Projects\mr-brush-app`, new branch `feature/cover-ranking` from `main` at `6fad8b1` (recheck `git log -1` and a clean `git status` before starting; stop if different).
Role and limits: Codex builds on the branch. May edit app code and write SQL files. May NOT apply SQL to the live database, change n8n, send any SMS, push, merge or deploy, or spend money. Live SQL is applied later by Claude or Kevin after Kevin's approval. Stage 0 (`docs/COVER-AUTOMATION-PLAN.md` section 15) is a separate task; do not do it here and do not touch existing `profiles` policies or grants.

## Purpose
Mr Brush needs to find cover when a cleaner is absent. Before any texting is built, Kevin wants to see a ranked list of suitable cover people for a real absence, so he can correct the ranking cheaply. Full context: `docs/COVER-AUTOMATION-PLAN.md`.

## The point
A list that looks finished but hides missing data, shows people who already work that day, or exposes phone numbers to the wrong role is worse than no list. A wrong or leaked phone number costs more than a missing candidate.

## Result and acceptance
1. `docs/sql/2026-11-26-cover-stage1.sql` exists, runs top to bottom on a fresh copy without error (check: read through; Codex cannot run it live), and contains a `-- rollback` section that drops everything it creates in reverse order.
2. It creates `london_stations`, `worker_details` (if stage 0 has not created it: `create table if not exists` with the columns in plan section 6), `cover_pool`, `absence_requests` (columns in section 6; status limited to `reported | drafting | offering | cover_chosen | covered | no_cover | cancelled`), and adds `facilities.nearest_station_id`. RLS is enabled on every new table, policies exactly as section 6, and no grant to `anon`.
3. It creates SECURITY DEFINER functions with `set search_path = public`: `rank_cover_candidates(p_request_id uuid)` returning candidate rows with `candidate_kind, pool_id, profile_id, display_name, score, rating_used, rating_source, distance_km, english_level, flags text[]`; `save_cover_pool_member(...)`; `supervisor_create_absence_request(...)`. Each raises an exception unless `get_my_role() = 'supervisor'` and the facility is in that supervisor's `supervisor_facilities`. Ranking follows plan section 8 exactly, with weights in one place. The function never returns a phone number.
4. Clash rule: a cleaner with any `job_zones` row (status not `deleted`) on any date from `start_date` to `end_date` is excluded. The absent person is excluded. Opted-out people and people without a phone are excluded.
5. New screens, mobile and desktop, all strings in `src/lib/i18n/index.ts` in en, es and pt, under 150 lines per component, named exports, Tailwind only, loading, error and empty states:
   - `/supervisor/cover-pool`: list and add or edit pool members (name, phone entered once and then shown masked as `•••• ••• 123`, station picker searching `london_stations`, English level 1 to 5, manual rating 1 to 5, consent date and source, active).
   - `/supervisor/absence/:requestId`: request summary, affected zones grouped by date (flat queries, joined in JS, per CLAUDE.md "Critical Query Patterns"), and the ranked list with score parts and missing-data flags shown as chips.
   - The existing `/supervisor/absence` page gets a "New cover request" button that calls `supervisor_create_absence_request` and opens the detail page. The existing report modal and its behaviour stay as they are.
6. No `catch {}` without logging; every RPC error is shown to the user and logged with `console.error`.
7. `npx tsc -b`, `npm test`, `npm run build` and ESLint on touched files pass (a pre-existing ESLint error in `supervisor/Dashboard.tsx` is known; do not fix it here).
8. A short section is appended to `docs/HANDOFF.md` with branch, commit, what was built and what is untested. CLAUDE.md is not edited in this stage.

## Current state (read 2026-11-25)
- Live schema facts: plan section 3 (tables, constraints, policies, functions). `jobs` has only `scheduled_date`; `job_zones` has no time columns. `cleaner_ratings.rating` is 1 to 5 with `rated_by_role` client or supervisor. `profiles.role` allows only `cleaner | supervisor | client`; R001 is `cleaner` with `contract_type = replacement`.
- Existing helpers: `get_my_role()`, `get_my_company_id()` (SECURITY DEFINER). `supervisor_facilities(profile_id, facility_id)`.
- Existing Absence screen: `src/pages/supervisor/Absence.tsx` (hard-coded English; do not refactor beyond adding the button and its i18n key).
- Routing: `src/App.tsx:69-83` supervisor routes; add the two new routes there inside `RequireAuth`.
- Dates: use `src/lib/dateRange.ts`, never `toISOString().slice` (ESLint rule enforces this).
- Desktop layout pattern: `min-h-screen` + `SupervisorDesktopSidebar` + `pl-60`; mobile `fixed inset-0` + `SupervisorNav` (see `Absence.tsx:399-417`).

## Surface
`docs/sql/2026-11-26-cover-stage1.sql` (new), `src/App.tsx`, `src/pages/supervisor/Absence.tsx` (button only), new `src/pages/supervisor/CoverPool.tsx`, new `src/pages/supervisor/CoverRequest.tsx`, new components under `src/components/cover/`, new `src/lib/cover.ts` (typed RPC wrappers), `src/lib/i18n/index.ts`, `docs/HANDOFF.md`.

## Do not change
`profiles` policies and grants; `absence_reports`; `job_zones`; any n8n file or workflow; `public/_headers`; `src/lib/auth.ts`; `src/lib/webhooks.ts`; existing i18n keys; brand colour tokens; WF-16 behaviour.

## Steps
1. Branch from `main`; confirm clean tree. Check: `git status` empty.
2. Write the SQL file (tables, RLS, functions, rollback). Check: every new table has `enable row level security` and at least one policy; no `grant ... to anon`; grep shows no `phone` in any function's return columns.
3. Add a small station seed: a `london_stations` insert of only the stations for the three facilities' areas plus 20 common central stations, as a separate file `docs/sql/2026-11-26-london-stations-seed.sql`, with a header comment naming the data source used and its licence. If you cannot cite a source, write the file with the table structure only and STOP point 2 below applies.
4. Build `src/lib/cover.ts` and the two screens and the Absence button. Check: tsc and build pass.
5. Run tests and ESLint. Check: commands in acceptance 7.
6. Update `docs/HANDOFF.md`. Commit on the branch with `feat:` messages. Do not push.
7. STOP for Kevin: he (or Claude) applies the SQL after approval, Kevin enters 3 to 5 pool members and stations, creates one request for a real absence, and judges the ranked list. That review is the gate for stage 2.

## Stop and ask if
- `main` is not at `6fad8b1` or the tree is dirty.
- Any acceptance item would require changing `profiles` policies, `absence_reports` or `job_zones`.
- You cannot find a citable, openly licensed station data source.
- A component cannot stay under 150 lines without splitting in a way that changes behaviour.
- Anything would send a message, call n8n or touch live data.

## Report back
Use the brief-execution report format: what was done per acceptance item with evidence, commit hashes, what was not run (live SQL, browser checks on a phone), and any deviation from this brief with the reason.
