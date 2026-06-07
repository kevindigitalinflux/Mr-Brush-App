# Mr Brush App — Polishing List

Items that need fixing, completing, or verifying before the app is production-ready.
Strike through an item when done. Add the date completed.

---

## App / UI

- [x] ~~**Client portal — Overview "10 d ago" overflow** — dropped " ago" suffix from formatResolved (now "10d" not "10d ago"). Done 2026-06-06.~~
- [x] ~~**Client portal — History screen slow** — combined job_zones + profiles into one nested Supabase select, cutting sequential query chain from 5 to 4 round trips. Done 2026-06-06.~~
- [ ] **Client portal / supervisor mobile fix #3** — *Kevin to confirm — may have been resolved*
- [ ] **Client portal / supervisor mobile fix #4** — *Kevin to confirm — may have been resolved*
- [ ] **Mobile device testing** — test all recent fixes (overview overflow, history load, animations) on a real device once available. Also confirm fixes #3 and #4 are still needed or already resolved.
- [x] ~~**Page refresh — blank content bug** — added `supabase.auth.getSession()` call on mount in AppContext so existing sessions are rehydrated into React state. Previously `onAuthStateChange` didn't fire for the initial session, leaving `user` as null permanently. Done 2026-06-07.~~

---

## Security

- [x] ~~**Create New Zone crash** — `CleanerPicker` search filter threw `null.toLowerCase()` when a cleaner profile had a null `full_name`, crashing the component tree to a white screen. Fixed: guard with `(c.full_name ?? '').toLowerCase()` and fall back to `display_id` in the picker display. Done 2026-06-07.~~
- [ ] **Route protection — unauthenticated URL access** — anyone who pastes a portal URL directly should be blocked and redirected to login, not shown a blank or broken screen. Verify all routes (`/cleaner/*`, `/supervisor/*`, `/client/*`) are properly guarded by an auth check. Unauthenticated users must never see portal content.
- [ ] **SEO & security headers audit** — run a full SEO audit and review HTTP security headers (CSP, X-Frame-Options, HSTS, etc.) before the app goes live with real clients. Cloudflare Pages supports header rules via `_headers` file.

---

## Data & Automation

- [x] ~~**WF-15 evidence_photos count** — was counting cleaning_log rows, not actual evidence_files. Fixed: node 7 now selects `evidence_files(id)` nested, node 8 reduces over the array. Deployed 2026-06-06.~~
- [x] ~~**weekly_reports duplicate rows** — duplicate test rows deleted, UNIQUE constraint `(facility_id, week_start)` added, WF-15 node 10 switched to upsert (`Prefer: resolution=merge-duplicates`). Re-runs now update in place. Done 2026-06-06.~~
- [ ] **WF-15 verification** — confirm `evidence_photos` count is accurate on next real weekly run (first Sunday after real cleaning data exists for a full week).
- [ ] **WF-8 real data test** — WF-8 built and deployed (n8n ID: `9fL3t334AwDqmFJi`, active). To test: mark at least one pay_record as `approved` in the supervisor portal, then manually trigger. Currently all test data is `draft` so the workflow exits early with no output.

---

## Infrastructure / Config

- [x] ~~**Cloudflare Pages env var** — `VITE_N8N_SHIFT_COMPLETE_WEBHOOK` confirmed present in production config. 2026-06-06.~~

---

## Notes
- WF-A/B/C (WhatsApp absence flows) need rewiring from Google Sheets → Supabase — already built, just need node swap. Tracked separately in AUTOMATIONS.md.
