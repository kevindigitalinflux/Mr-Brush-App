# Mr Brush App — Polishing List

Items that need fixing, completing, or verifying before the app is production-ready.
Strike through an item when done. Add the date completed.

---

## App / UI

- [x] ~~**Client portal — Overview "10 d ago" overflow** — dropped " ago" suffix from formatResolved (now "10d" not "10d ago"). Done 2026-06-06.~~
- [x] ~~**Client portal — History screen slow** — combined job_zones + profiles into one nested Supabase select, cutting sequential query chain from 5 to 4 round trips. Done 2026-06-06.~~
- [ ] **Client portal / supervisor mobile fix #3** — *Kevin to confirm — may have been resolved*
- [ ] **Client portal / supervisor mobile fix #4** — *Kevin to confirm — may have been resolved*

---

## Data & Automation

- [x] ~~**WF-15 evidence_photos count** — was counting cleaning_log rows, not actual evidence_files. Fixed: node 7 now selects `evidence_files(id)` nested, node 8 reduces over the array. Deployed 2026-06-06.~~
- [x] ~~**weekly_reports duplicate rows** — duplicate test rows deleted, UNIQUE constraint `(facility_id, week_start)` added, WF-15 node 10 switched to upsert (`Prefer: resolution=merge-duplicates`). Re-runs now update in place. Done 2026-06-06.~~
- [ ] **WF-15 verification** — confirm `evidence_photos` count is accurate on next real weekly run (first Sunday after real cleaning data exists for a full week).

---

## Infrastructure / Config

- [x] ~~**Cloudflare Pages env var** — `VITE_N8N_SHIFT_COMPLETE_WEBHOOK` confirmed present in production config. 2026-06-06.~~

---

## Notes
- WF-A/B/C (WhatsApp absence flows) need rewiring from Google Sheets → Supabase — already built, just need node swap. Tracked separately in AUTOMATIONS.md.
- WF-8 (Monthly Payslip Roll-up) not yet built — separate build task, not a polish item.
