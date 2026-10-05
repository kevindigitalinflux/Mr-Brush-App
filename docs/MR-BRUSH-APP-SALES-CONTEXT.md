# Mr Brush App — Product & Sales Context

> **Purpose of this file:** hand this to any AI chat or person who needs to talk accurately about the Mr Brush App — to pitch it, write sales copy, answer prospect questions, or prepare a demo. Everything below reflects what is **built and working as of 1 October 2026**. Section 11 lists what is *not* built, so nobody over-claims. Section 12 lists internal-only facts that should not go in front of prospects.

---

## 1. One-paragraph summary

The Mr Brush App is a purpose-built field operations platform for **Mr Brush & Co., a UK commercial cleaning company**. Cleaners photograph or video every cleaned zone on their phone; supervisors review and approve that evidence in real time; building managers (clients) see exactly what was cleaned, when, and by whom, and can rate cleans and raise issues; and shift completion automatically produces pay records and monthly payslips. It replaces the usual mix of WhatsApp groups, spreadsheets and paper sign-off sheets with one system that creates a **timestamped, zone-by-zone proof-of-clean record for every shift**. It runs in the browser on any phone or desktop, works with poor signal, and the cleaner side is fully available in **English, Spanish and Portuguese**.

**Status:** live in production with its first commercial client since August 2026 (rolling contract). Three portals — Cleaner, Supervisor, Client — are complete.

**Where it lives:** `https://app.mrbrushandco.co.uk` (also reachable at `https://mr-brush-app.pages.dev`).

---

## 2. The problem it solves

| Pain in commercial cleaning | How the app addresses it |
|---|---|
| "Was it actually cleaned?" — clients can't verify | Every zone has photo/video evidence with a timestamp and the cleaner's identity |
| Supervisors can't be on every site | Remote review: approve, or reject with feedback, from their phone |
| Disputes and complaints are slow and informal | Clients file issues in-app with severity and photos; status is tracked to resolution |
| Cleaners speak different languages | Cleaner app in EN/ES/PT; their notes are auto-translated to English for supervisors |
| Poor signal in basements, plant rooms, stairwells | Offline queue saves submissions on the device and uploads automatically on reconnect |
| Absences cause chaos | Report an absence, pick a replacement, and the day's zones are reassigned in one step — logged for payroll |
| Payroll is manual and error-prone | Completing a shift auto-creates a pay record using the site's rate and the cleaner's hours; monthly payslips are generated and downloadable as PDF |
| Recurring schedules are re-typed every day | Set a zone once, choose the days, and it is created automatically |
| Reporting to clients is time-consuming | An automatic weekly report is compiled for each site |

---

## 3. Who uses it (three roles)

Login is by **User ID + password** (no email needed). The ID prefix decides which portal opens:

| ID prefix | Role | Portal | Example |
|---|---|---|---|
| `C` | Cleaner (field worker) | `/cleaner/*` | `C0007` |
| `S` | Supervisor | `/supervisor/*` | `S0003` |
| `CL` | Client (building manager) | `/client/*` | `CL0003` |

An **Admin portal** (`A` prefix, for business owners) is planned but not built.

---

## 4. Cleaner portal (mobile-first)

Designed for people using a phone mid-shift: large touch targets, minimal typing, clear progress.

**Getting started**
- Splash screen → **language select** (English / Español / Português) → sign in with User ID and password.
- Language is remembered; every label, button and message follows it.

**Home**
- Time-of-day greeting, today's overview, and three live stats: **Total Jobs, Zones Done, Remaining**.
- "Active Assignments" list of today's jobs; friendly empty states ("No Jobs Today", "All Jobs Completed").

**Working a shift (Zone List)**
- Overall shift progress bar and a list of **their** assigned zones with status (not started / in progress / completed / no photo submitted).
- Supervisor instructions for a zone ("Notes for Cleaners") appear on the zone.
- Progress updates live without refreshing.
- **Mark Shift Complete** unlocks only when every zone is finished.

**Submitting proof of clean (Zone Submission)**
- Up to **5 photos** *or* a **live-recorded video of up to 15 seconds** per zone, plus an optional **note in their own language**.
- Guidance on screen: make sure the area is fully visible and well-lit.
- On success: a "Verified Clean" confirmation, then automatic advance to the next task.
- **"I can't submit a photo"** route: the cleaner must give a written reason; the zone is flagged for the supervisor rather than silently skipped.

**Works offline**
- With no signal, the submission is **saved on the phone** and a persistent "No internet connection" banner appears.
- It **uploads automatically** when signal returns, with a visible "Syncing → Uploaded!" state.
- If an upload fails it stays on the device with a **Retry** button and retries automatically next time.

**After the shift**
- "Shift Completed!" screen; supervisor is notified.
- **Shift History** (completed vs incomplete) and **Shift Detail** (duration, lead specialist, each zone with its note, skipped/flagged zones).
- **Your Pay**: filter by month; see shifts, hours and expected pay, with each shift marked **Pending / Approved / Paid**.
- **Notifications** from supervisors, with an *Urgent* tag and downloadable attachments. Two-pane layout on desktop.
- **Reclean requests**: if a supervisor rejects a zone, the cleaner can acknowledge it with an optional note, and the supervisor is told.

---

## 5. Supervisor portal (mobile + desktop)

Desktop layout adds a fixed sidebar; the same screens work on a phone with a bottom nav.

**Dashboard** — today's active sites, **pending approvals count**, **issues reported count**, workers on shift. Updates in real time, with a notification bell badge.

**Jobs (shift management)**
- Sees only the facilities they are **assigned** to.
- **Start Today's Shift** → a guided **shift builder** to add zones and assign cleaners (or skip and add later).
- Add, **edit, duplicate and delete zones**; give each zone **notes for the cleaner**; assign or reassign a cleaner.
- **Mark Complete / Undo** per cleaner — this is what triggers pay.
- **Recurring Schedule**: define a zone once, pick the days of the week and the cleaner; it is created automatically each matching day. Rules can be **paused, resumed or deleted**. A **"Sync Today's Zones Now"** button creates today's zones on demand.
- **Report Absence & Replace** (see below).

**Evidence review (Pending Approvals / Job Evidence)**
- Every cleaner submission appears as a ticket with photos/video, the cleaner's note (original language **and** auto-translated English), and flags where no photo was supplied.
- **Approve**, or **Not Accepted** with written feedback → the cleaner is notified and can acknowledge a reclean.
- Full-screen viewer with **download** (supervisors reuse evidence photos for marketing).
- Paginated, updates in real time.
- **Retroactive "Mark Shift Complete"** banner: if a supervisor forgot to complete a shift on the day, they can do it later from the job's evidence page — no developer needed.

**History** — "My Shifts" and "All Workers" tabs; each past job shows **Done** or **Part**.

**Workers** — searchable list split into **On Shift / Idle / Replacement Pool**; tap through to a full cleaner profile.

**Cleaner profile & ratings**
- 1–5 star ratings (Poor → Excellent) with written notes and **a minimum of 3 supporting photos**.
- **Fairness guardrail:** ratings of 2 stars or below require the supervisor to confirm the rating is fair and free from bias, and are automatically flagged for management review.
- Rating history shows whether each rating came from a **Supervisor** or a **Client**.

**Absence reports** — pick the absent cleaner, the date, see their assigned zones, choose a replacement. The day's zones are **reassigned automatically** and the replacement's pay record is flagged as a replacement shift.

**Client issues** — complaints raised by clients arrive live. Supervisors **Acknowledge**, then **Mark Resolved** with a note the client sees.

**Notifications** — messages and updates from clients.

**Pay management**
- **Manage Facilities (Rates):** set the **hourly rate per facility**, and the **expected shift hours per cleaner per site** (hours can differ by site).
- **Pay Records:** one record per cleaner per shift, auto-created on shift completion. Supervisors can **log manually, edit drafts, approve, or revert an approval**; paid records are locked. Filter by cleaner and month. Scoped to the facilities the supervisor is assigned to.
- **Payslips:** generate a period summary per cleaner (shifts, hours, gross pay) with a preview, **download as a PDF**, and move it through **Draft → Finalised → Sent**.

**Language** — supervisors can switch their interface between EN / ES / PT.

---

## 6. Client portal (building managers)

Gives the client confidence without phone calls. A client sees only the **sites linked to their organisation**.

- **Overview:** site status, quick stats (**Cleans this month, Open issues, Last issue resolved**), recent evidence, and an expandable **live facility view** showing today's zones as they are completed, with a "Weekly Report Ready" link.
- **Evidence feed:** read-only photo/video proof, filterable **All / Today / This Week / By Zone**, with a full-screen lightbox.
- **Rate a clean:** 1–5 stars on any completed zone; ratings of 3 stars or below require a supporting photo.
- **Complaints:** file an issue with a title, description, photos and a **severity from 1 (Minor) to 5 (Critical)**. Track it through **Received → Acknowledged → In Progress → Resolved** and get notified, with the supervisor's note, when it closes.
- **History:** every cleaning visit by month.
- **Notifications:** supervisor responses and status updates.
- **Weekly report:** jobs completed, zones cleaned, zones flagged, evidence photos taken, and average cleaner rating.

*Note: client-portal screens are currently English only (navigation labels are translated).*

---

## 7. The automation engine (what happens behind the scenes)

The app is deliberately a "thin" interface. Business logic runs in **n8n** workflows, so rules can change without redeploying the app.

| Trigger | What happens automatically |
|---|---|
| Cleaner submits a zone | Evidence and log are recorded; zone marked complete; note translated to English; supervisor notified. A "no photo" submission is flagged instead |
| Supervisor assigns a zone | Cleaner receives a "New Zone Assigned" notification |
| Supervisor approves / rejects | Cleaner is notified with the outcome and feedback |
| Cleaner acknowledges a reclean | Supervisor is notified |
| Shift marked complete | Pay record created using the site's hourly rate and the cleaner's expected hours (falls back to contracted hours, then a default); replacement shifts flagged |
| 1st of every month | Payslip summaries generated per cleaner; supervisor notified to review |
| Sunday 22:00 | Weekly report compiled per site for the client |
| Every 30 minutes | **SLA alert** to the supervisor if a day's job hasn't been completed by the cutoff |
| Every day, early morning | Recurring zones for that day are created automatically |
| Complaint resolved | Client notified with the supervisor's note |

Notifications are in-app (bell badges, real-time).

---

## 8. Languages

- **Cleaner portal and supervisor portal:** English, Spanish, Portuguese.
- **Cleaner notes** can be written in any language; supervisors and clients read the **automatic English translation**.
- **Client portal:** English (nav labels translated; screens are English).
- Built for the UK market (£, UK dates, UK business rules).

---

## 9. Security & data protection

- **Row-level security on every database table** — a user can only ever read or write data they are entitled to. Cleaners see their own work; supervisors see their assigned facilities; clients see only their linked sites. Data is separated per company.
- Login via managed authentication (**Supabase Auth**); all portal routes are guarded, so unauthenticated visits go to login.
- Hardened browser security headers: **HSTS, Content-Security-Policy, X-Frame-Options (anti-clickjacking), nosniff, strict referrer policy**, and restricted camera/microphone/location permissions.
- All traffic over HTTPS; hosted on Cloudflare's global network.
- Private resources use random UUIDs, never guessable sequential IDs; no secrets are shipped to the browser.
- A **security audit** was completed before go-live.
- Photos and videos are stored in managed cloud storage.

---

## 10. Technology (for technical buyers)

- **Front end:** React 18 + TypeScript (strict), Vite, Tailwind CSS, React Router. Responsive, mobile-first; no app-store install — opens in the browser.
- **Back end:** Supabase (PostgreSQL, Auth, Storage, Realtime).
- **Automation:** n8n, triggered by secure webhooks.
- **Hosting:** Cloudflare Pages, auto-deployed from GitHub.
- **Other:** Google Translate (notes), jsPDF (payslips), localForage (offline queue).
- **Quality guards:** automated tests and lint rules guard against calendar/date bugs; the codebase is under version control with small, reviewed commits.
- **Design:** consistent brand system (Soft Ivory, Charcoal, Muted Brass, Deep Green; Poppins/Lato typography).

---

## 11. What it does NOT do (do not over-claim)

- **Not a native app / not in the App Store or Google Play.** It is a web app opened in a browser (it can be saved to a phone's home screen as a shortcut, but it is not a full installable app).
- **WhatsApp absence reporting and replacement-finding** (cleaner messages in → replacement offered) is **designed and partly built but not live**. Absences today are reported by the supervisor in the app.
- **Payslip delivery by email/WhatsApp** is not built; payslips are generated in the app and downloaded as PDF.
- **It calculates pay; it does not pay people.** No bank, payroll-provider or HMRC integration. It produces the numbers and documents for payroll.
- **Admin / business-owner portal** is planned, not built. New user accounts are currently created by the developer, not self-service in the app.
- **Client portal is English only.**
- **UK-only** by design for now; no multi-country, multi-currency or multi-timezone support.
- No built-in invoicing to clients, no GPS/geofenced check-in, no in-app chat, no inventory/consumables tracking.
- New complaints appear live in the supervisor's Issues screen; they do not currently trigger a separate push/WhatsApp alert.

---

## 12. Internal-only notes (do not show prospects)

- Hosted on free-tier infrastructure so far; paid plans (backups, higher storage) are planned as usage grows.
- Built and maintained by Kevin Zamora-Saenz (Digital Influx Dreamlabs) for Mr Brush & Co. The Mr Brush business is the client/owner of the production data.
- Real client names and staff details are deliberately omitted from this document.

---

## 13. Suggested talk track / demo flow (≈10 minutes)

1. **The cleaner's phone (2 min):** log in, show language choice, open a zone, take a photo, add a note in Spanish, submit — show "Verified Clean". Toggle airplane mode to show the offline save and auto-sync.
2. **The supervisor's phone (3 min):** the new submission appears instantly; show the translated note; approve one, reject another with feedback; show the cleaner's notification.
3. **Absence in 30 seconds:** report an absence, pick a replacement, zones reassign.
4. **The client's view (2 min):** live facility view, evidence feed filtered by zone, rate a clean, file a severity-3 complaint and watch it move to Resolved.
5. **Pay (2 min):** complete the shift → pay record appears → generate a payslip → download the PDF.
6. **Close:** "Every clean, every zone, every shift — proven, timestamped and in one place."

---

## 14. Likely questions & honest answers

- **Can cleaners cheat with old photos?** Submissions are timestamped when received and tied to a specific zone, cleaner and shift, and supervisors review them. The app does not currently verify image metadata or GPS.
- **What if there's no signal?** It saves on the device and uploads automatically; nothing is lost.
- **Do cleaners need to install anything?** No — open the link in a browser.
- **Can clients see other clients' data?** No. Access is enforced at the database level per organisation and site.
- **Can we change the workflows?** Yes — business rules live in n8n and can be adjusted without rebuilding the app.
- **Can it do WhatsApp absence handling?** Designed and partly built; not live yet.
- **Does it run payroll?** It produces pay records and payslips for payroll; it does not make payments.
- **How is a new site or cleaner added?** Currently set up by the developer; self-service admin is on the roadmap.

---

## 15. Roadmap (planned, not promised)

Admin portal for business owners · WhatsApp absence reporting and cover requests · automated payslip delivery · self-service account management · translated client portal.
