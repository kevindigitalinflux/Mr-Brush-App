# Handoff: Journey replacement cover (R001), Journey guide, tutorial video

Written 2026-11-20 by Claude (Sonnet 5.5) for Kevin. This is the authoritative task record. The vault copy at `Mr Brush & Co/Handoff.md` is a summary that points here.

## Identity and authority
- Task: (A) cover for Journey's in-house cleaner Miryam using replacement cleaner R001 Ze Roberto Mejia; (B) a user-friendly, Spanish/English Journey guide inside the app; (C) a tutorial video on the cleaner Home screen. After these: two new features, supervisor/cleaner notifications and an in-app absence-and-cover flow, which are only at the discussion stage.
- Roles: Kevin directs. Kevin confirmed on 2026-11-20 that Claude builds this on a feature branch and stops for his review before merging ("All cleaners, I build on a branch"). This replaces the usual Claude-architect/Codex-builder split for this task only. Fable mode (Claude skill `fable-mode`) was loaded at Kevin's request on 2026-11-20.
- Publishing: nothing merged to `main` or deployed. Live database writes for the R001 cover were authorized by Kevin on 2026-11-20 and applied (see "R001 cover APPLIED" below). Every other database write (e.g. the tutorial SQL) still needs Kevin's OK at the time.
- Paid usage: none authorized or used.

## Where the work is
- Repo: `C:\Users\kevin\Projects\mr-brush-app`, GitHub kevindigitalinflux/Mr-Brush-App.
- Branch `feature/cleaner-tutorial-video`, HEAD `94731e42ec8d40fe1bde86c72e6753502987dfba`, base `main` at `0a108bd91ed9b7b5aa716a0d34f4f0d25e9c5c1b`. Not pushed. Clean working tree before this handoff file was added.
- This handoff file and the CLAUDE.md pointer are committed on the same branch.

## Current state

### C. Tutorial video (built, committed, not tested in a browser, not merged)
- Loom link: https://www.loom.com/share/69bcfaf6516340d7b8b866d866e099f0 (embedded as `/embed/69bcfaf6516340d7b8b866d866e099f0`). The video is in Spanish. Shown to all cleaners.
- Files: `src/components/cleaner/TutorialVideo.tsx` (new), `src/pages/cleaner/Home.tsx` (adds the component on the mobile and desktop layouts), `src/lib/i18n/index.ts` (keys `tutorial_*` in en/es/pt), `public/_headers` (adds `frame-src https://www.loom.com`).
- Behaviour: a first-visit Watch/Skip prompt per account (stored in `profiles.tutorial_seen_at`), and a permanent "How to use the app" card. Any read error is treated as "seen", so the prompt never blocks the app.
- NOT YET APPLIED: `docs/sql/2026-11-20-tutorial-seen.sql` adds the column and a security-definer function `mark_tutorial_seen()`. Until it is run, nobody sees the first-visit prompt but the card works.
- `tsc` and ESLint on the touched files passed. Not run: `npm test`, `npm run build`, a localhost test (needs a login and the new column), a mobile check.
- Risk to check: the prompt and video use `position: fixed`. They are not inside GSAP-animated elements as written, but confirm in a browser (see the transform gotcha in CLAUDE.md).

### A. R001 cover at Journey: APPLIED 2026-11-20 (login tested)
**R001 cover APPLIED (2026-11-20, each write approved by Kevin):**
- Profile `fd84d732-22a7-4be5-9aad-3819fe1e30fc`: `language_preference` es, `supervisor_id` S0003 (`e6e5364c-0196-4acc-98fc-bb53156ce60d`). `cleaner_facility_hours`: 8h at Journey. Password set by SQL (`crypt`/`gen_salt('bf')`) and checked against the hash; not recorded here.
- 20 jobs created at Journey (Mon-Fri 7-18 Dec 2026, 4-15 Jan 2027), supervisor S0003, status `scheduled`, `recurring_job_key` = `facilityId::date` (the WF-16 key, so WF-16 reuses them and adds Cristina's Wed/Thu zones to the same job; WF-16 untouched). 316 R001 `job_zones` created, `recurring_assignment_key` = `jobId::zone_name::cleanerId`. Per day: 17 zones Mon/Tue/Fri, 14 Wed/Thu. Names carry the number ("01 · 06:30 Open studio, Ground floor"), notes in Spanish, no door or alarm codes in any note.
- Rules as built: the approved 18-zone list; R001 has NO reception-related zones (06 reception, 07 kitchen reception area, 14 popcorn machine) on Wed/Thu, because Cristina does them; they run Mon/Tue/Fri only. Showers Mon/Wed/Fri; groceries Tue/Thu. 18 Dec was built as a normal Friday set; Kevin will update it or instruct R001 by phone later.
- Login test PASSED 2026-11-20: password grant for `r001@internal.mrbrush.app` returned HTTP 200, and RLS returned only R001's own profile (`R001`, es, cleaner) and his zones. Two older May test zones ("Kitchen") also belong to him (2026-05-19/20), not part of this work.
- Script used (scratchpad, not in git): the full SQL is reproducible from the zone list above. Idempotent via the unique keys.
- Still open: client's pay answer (hours assumed 8 at £14.80/h), the unpaid handover day, the stale `cleaner_facility_hours` row for C0008 (Christian, banned) was not touched.

Original investigation notes (before the changes): facts read from Kevin's SQL result on 2026-11-20:
- R001 exists: profile id `fd84d732-22a7-4be5-9aad-3819fe1e30fc`, role `cleaner`, `contract_type` `replacement`, `contracted_hours` 8, language `en`, supervisor `d007469e-4802-4cb9-b548-d44961ad91ac` (not S0003). An `auth.users` row `r001@internal.mrbrush.app` exists and is not banned. The `R` prefix already routes to `/cleaner/home` (`src/lib/auth.ts`). Not yet checked: his `auth.identities` row and the empty-string token columns (see CLAUDE.md seeding gotcha).
- Journey facility `f9155a38-2d1f-422a-894d-bd0db6503fb3` (F0003). Its only supervisor link is S0003 (`e6e5364c-0196-4acc-98fc-bb53156ce60d`). Cleaner rate at Journey: £14.80/h (`facility_rates`, two rows, effective 2026-08-16 and 2026-08-19). `cleaner_facility_hours`: Andres (C0006) 4h and Cristina (C0007) 4h. R001 has none yet.
- Cristina (C0007, now language `es`) has 9 active recurring rules, days `[3,4]` (Wed and Thu, JS getDay numbering), including "Helping Myriam 1" and "Helping Myriam 2". `recurring_zone_rules` columns: id, facility_id, company_id, zone_name, cleaner_id, days_of_week, notes, active, created_by, created_at. There are no date or order columns.
- Cover dates, from the client's email (Karis Reed): Mon 7 Dec to Fri 18 Dec 2026 and Mon 4 Jan to Fri 15 Jan 2027, every working day, 06:30 to 14:30 with a one-hour lunch (flexible), no loud hoovering after 09:00, someone present after the lunch rush. Miryan returns Mon 18 Jan. Keys, fob and alarm codes must be issued before 7 Dec; the client suggests one handover day the week before with Miryam. Occasionally he is asked to stand at reception to open the door while reception is at lunch. On 18 Dec the client asks for a later start so all rubbish is cleared before the 18:00 close (no times given).
- Kevin's decisions: assume the full 8 paid hours for now (to update when the client replies); the handover day is unpaid (Kevin manages this contract); Dec 18 is built as a separate, different set of zones and Kevin will agree times with R001; Cristina's zones are left completely alone because she still does the Helping Miryam work. R001 username `R001`; Kevin supplied his password in chat. The password is not recorded in this file; set it only at the time of the database change.
- Zones: numbered in the zone name, in chronological order, so he simply follows the numbers. No WF-16 change is needed for order. The draft list of 18 zones is in the conversation and is reproduced in "Draft zones" below. Kevin has NOT yet approved it.
- Reception rule from Kevin: R001 only does the reception work on the days Cristina is not there (Mon, Tue, Fri). Proposed: reception lower, reception upper, kitchen reception area and the popcorn machine run on days `[1,2,5]` only, and the reception-area desks are done only on those days. Kevin phrased this as a question, so confirm it.
- Open design choice: create the 20 shifts directly in the database (Claude's recommendation: no change to live n8n, sets dates and order exactly) versus adding start/end date columns to `recurring_zone_rules` and teaching live WF-16 about them (Kevin's earlier choice, made before the ordering issue was found). Kevin's latest reply settled ordering (numbered names) but did not restate this choice, so ask again. Reason for the recommendation: WF-16 inserts a day's zones in one batch, so `created_at` ties and the cleaner's zone list sorts by `priority` then `created_at` (`src/pages/cleaner/ZoneList.tsx:76-77`); numbering in the name makes order readable either way.

Draft zones (not approved), Mon to Fri, names in English, notes in Spanish:
1. 06:30 Open studio, Ground floor; 2. 06:40 Open studio, First floor; 3. 06:50 Open studio, Second floor (different alarm code); 4. Dishwashers, empty all floors; 5. Desks and meeting rooms; 6. Reception area, lower and upper (Mon/Tue/Fri); 7. Kitchen reception area (Mon/Tue/Fri); 8. Fruit bowls; 9. 08:00 Hoovering first floor and meeting rooms (before 09:00); 10. 08:20 Bins; 11. 08:40 Dishwashers, reload; 12. 09:00 Toilets x5 and floors; 13. Showers x2 (every 2 days); 14. Popcorn machine (Mon/Tue/Fri); 15. 10:30 Coffee machines and general check; 16. Groceries (Tue and Thu only); 17. 14:00 Afternoon check, kitchen tables, final dishwasher load (note: may be asked to open the reception door at lunch); 18. Taking out rubbish. Numbers get added to the names when approved. Dec 18 set is separate and pending times.

### B. Journey guide (designed, not built)
- Source: `C:\Users\kevin\Downloads\Cleaner Cover Vyner.md` and `.pdf` (14 pages, 39 photos, 93 MB), from the client. Contains real door codes: keep the codes out of git, the vault and chat summaries.
- Decisions: visible to cleaners linked to Journey (R001, Cristina, Andres) and Journey supervisors only; codes always visible once inside; Spanish and English, switchable, with fresh natural Spanish written for the whole guide (the client's Spanish covers only the task list and omits the fruit bowls and the grocery days); photos reused from the PDF; very user friendly.
- Codes must not be in `.env` or the code. `VITE_*` values are baked into the public JavaScript, so they would reach everyone. Design: guide text and codes in a database table with RLS limited by facility, photos in a private Supabase Storage bucket served by signed URLs. The seed SQL containing codes is kept outside git (not yet written).
- Gate: Kevin must upload the compressed photos into the private bucket in the Supabase dashboard (Claude cannot reach the project until the connector works). Claude will prepare the compressed, named images. Image extraction from the PDF has not been done; PyMuPDF is installed (`python -m pip install pymupdf`), small page previews are in the session scratchpad and may be cleared.
- Source ambiguities to confirm with the client: the 06:30 versus 06:45 starts; what "put keys back and change code" means; alarm "A" versus "ENT"; the "22.30 - 12.30" and "10.30pm" typos; the full 18 Dec plan.

## Remaining, in order
1. DONE 2026-11-20: Kevin restarted Claude Code and signed in to `supabase-mrbrush` via `/mcp` ("Signed in and connected"). VERIFIED 2026-11-20: `get_project_url` returned `https://bstohwxzufebufbybxtd.supabase.co` and `list_tables` returned 22 public tables, all RLS-enabled (read-only). Also added to local scope for `C:/Users/kevin` (exact folder only); VERIFIED from a live session started there (2026-11-20).
2. DONE 2026-11-20: Kevin approved the 18 zones, the reception rule (none on Wed/Thu) and direct creation (WF-16 untouched).
3. DONE 2026-11-20: R001 profile, hours, password, 20 jobs and 316 zones created; login tested (HTTP 200). His auth identity and token columns were already correct.
4. Next: run `docs/sql/2026-11-20-tutorial-seen.sql`, test the tutorial video on localhost and a phone, run `npm test` and `npm run build`, then merge only with Kevin's OK.
5. Build the Journey guide: table, RLS, private bucket, screens, Spanish and English text, and a "Guide" entry for Journey staff on Home. Needs Kevin's photo upload.
6. Later, after Kevin discusses the logistics: plan the two new features with Opus in Fable mode. (a) In-app notifications: supervisors told when shifts need checking and when clients file complaints; cleaners told when a shift is accepted or a reclean is flagged. (b) Absence flow: a cleaner reports an absence with a reason; the supervisor is notified; replacement cleaners are messaged (SMS from the company phone versus WhatsApp, which has per-message API costs) with pay, start time and days; those who accept are listed for the supervisor to choose. Decide the channel first.

## Access
- The Supabase connector installed as a plugin (`plugin:supabase:supabase`) is signed in to Kevin's personal account and gets "permission denied" on this project, which sits under mrbrushandco@gmail.com. On 2026-11-20 Claude added a separate local-scope server `supabase-mrbrush` (HTTP, `https://mcp.supabase.com/mcp?project_ref=bstohwxzufebufbybxtd`, stored in the Claude config for this repo only). Restarted and signed in through `/mcp` as mrbrushandco@gmail.com on 2026-11-20 (connected). The CLI printed the URL without the `project_ref`, but the live check confirmed it targets `bstohwxzufebufbybxtd`.
- `SUPABASE_MCP_KEY` in `.env` did not work against the Supabase Management API (`JWT could not be decoded`) and was not investigated further. Do not try to read or use credentials without Kevin's permission.
- Fallback if the connector fails: Kevin runs SQL in the Supabase SQL Editor, as in earlier sessions.

## Verification, risks, rollback
- Verified in this session: the app source reads cited above; Kevin's SQL results; the PDF text and 5 page previews (pages 3, 5, 7, 8 seen as images; the rest not yet viewed).
- Unverified: whether `job_zones` has `priority` and `notes` columns and how WF-16 copies notes; who supervisor `d007469e…` is; R001's auth identity row.
- Independent review: pending. Claude's own checks are not an independent review.
- Rollback: the tutorial feature is one commit on a branch; `main` is untouched. n8n is unchanged. Database rollback for the R001 cover: delete `job_zones` where `cleaner_id` = R001's id and the job's `scheduled_date` is in the cover dates, then the 20 jobs by `recurring_job_key` (only if they hold no other cleaner's zones, check first), the `cleaner_facility_hours` row, and revert the profile fields.
- Secrets: names only. `SUPABASE_MCP_KEY`, `N8N_API_KEY` live in the project `.env`. R001's password and the door codes are not stored in any repo or vault file.

## Usage and continuation
- Usage reading: not available to Claude in this session. Checkpoint written at a natural milestone, not at a measured limit.
- Exact next action: tutorial branch (step 4), then the Journey guide (step 5). Kevin's order on 2026-11-20: login test, handoff update, tutorial branch, then the user-friendly, interactive Journey guide.
- Needs Kevin's confirmation before: any database write, any n8n change, any merge or deploy, any role change.
