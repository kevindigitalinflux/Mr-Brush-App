# Mr Brush App — Polishing List

Items that need fixing, completing, or verifying before the app is production-ready.
Strike through an item when done. Add the date completed.

---

## App / UI

- [ ] **WF-10 fix #1** — *Kevin to confirm exact item*
- [ ] **WF-10 fix #2** — *Kevin to confirm exact item*
- [ ] **WF-10 fix #3** — *Kevin to confirm exact item*
- [ ] **WF-10 fix #4** — *Kevin to confirm exact item*

---

## Data & Automation

- [x] ~~**WF-15 evidence_photos count** — was counting cleaning_log rows, not actual evidence_files. Fixed: node 7 now selects `evidence_files(id)` nested, node 8 reduces over the array. Deployed 2026-06-06.~~
- [ ] **weekly_reports duplicate rows** — no UNIQUE constraint on `(facility_id, week_start)`. Multiple manual WF-15 test runs created 3 identical rows for the same week. Add a unique constraint so re-runs upsert rather than insert.
- [ ] **WF-15 verification** — confirm `evidence_photos` count is accurate on next real weekly run (first Sunday after real cleaning data exists for a full week).

---

## Infrastructure / Config

- [ ] **Cloudflare Pages env var missing** — `VITE_N8N_SHIFT_COMPLETE_WEBHOOK` is in local `.env` but was never added to Cloudflare Pages dashboard. Shift-complete webhook will fail in production until this is set.

---

## Notes
- WF-A/B/C (WhatsApp absence flows) need rewiring from Google Sheets → Supabase — already built, just need node swap. Tracked separately in AUTOMATIONS.md.
- WF-8 (Monthly Payslip Roll-up) not yet built — separate build task, not a polish item.
