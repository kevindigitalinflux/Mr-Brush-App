# Mr Brush & Co. — n8n Automations Master Reference

## Architecture Rule (Non-Negotiable)

```
App (React) → n8n webhook → Supabase
```

The app **never** writes directly to `cleaning_logs`, `pay_records`, or `notifications`.
It fires webhook events; n8n receives them, does all processing, and writes to Supabase.
This keeps all business logic in one place and keeps the app as a pure UI layer.

---

## Supabase Connection Details

- **Project ref:** `bstohwxzufebufbybxtd`
- **URL:** `https://bstohwxzufebufbybxtd.supabase.co`
- **Service role key:** in `.env` as `SUPABASE_SERVICE_ROLE_KEY` — use this in n8n (bypasses RLS)
- **Anon key:** in `.env` as `VITE_SUPABASE_ANON_KEY` — do NOT use this in n8n (RLS-restricted)

---

## Relevant Database Schema

### `profiles` — all users (cleaners, supervisors, clients)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | matches `auth.uid()` |
| `display_id` | text | e.g. `C0001`, `S0001`, `CL0001` |
| `role` | text | `cleaner` \| `supervisor` \| `manager` |
| `full_name` | text | |
| `company_id` | uuid | |
| `language` | text | `en` \| `es` \| `pt` |
| `contracted_hours` | numeric | default hours per shift for pay calc |

### `facilities`
| Column | Type |
|---|---|
| `id` | uuid |
| `name` | text |
| `company_id` | uuid |

### `jobs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `supervisor_id` | uuid → profiles | |
| `facility_id` | uuid → facilities | |
| `company_id` | uuid | |
| `scheduled_date` | date | |
| `status` | text | `scheduled` \| `in_progress` \| `completed` |

### `job_zones`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `job_id` | uuid → jobs | |
| `cleaner_id` | uuid → profiles | |
| `zone_name` | text | |
| `notes` | text | optional instructions |
| `status` | text | `not_started` \| `in_progress` \| `completed` \| `flagged_no_photo` \| `deleted` |
| `priority` | boolean | |

### `cleaning_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `job_id` | uuid → jobs | |
| `cleaner_id` | uuid → profiles | |
| `job_zone_id` | uuid → job_zones | |
| `company_id` | uuid | |
| `note` | text \| null | cleaner's original language |
| `note_translated` | text \| null | English translation (written by n8n) |
| `status` | text | `pending` \| `approved` \| `needs_attention` \| `reclean_requested` |
| `created_at` | timestamptz | |

### `evidence_files`
| Column | Type |
|---|---|
| `id` | uuid |
| `cleaning_log_id` | uuid → cleaning_logs |
| `public_url` | text |

### `feedback_comments`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `cleaning_log_id` | uuid → cleaning_logs | |
| `supervisor_id` | uuid → profiles | |
| `comment` | text | |
| `status` | text | `approved` \| `not_accepted` |
| `company_id` | uuid | |

### `notifications`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `user_id` | uuid → profiles | recipient |
| `title` | text | |
| `message` | text | |
| `is_read` | boolean | default false |
| `created_at` | timestamptz | |

### `pay_records`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `cleaner_id` | uuid → profiles | |
| `supervisor_id` | uuid → profiles | |
| `company_id` | uuid | |
| `shift_date` | date | |
| `facility_id` | uuid → facilities | |
| `hours_worked` | numeric | from `profiles.contracted_hours` |
| `hourly_rate` | numeric | from `facility_rates` |
| `gross_pay` | numeric | **GENERATED column — never pass in INSERT** |
| `status` | text | `draft` \| `approved` \| `paid` |
| `is_replacement` | boolean | |

### `payslips`
| Column | Type |
|---|---|
| `id` | uuid |
| `pay_record_id` | uuid → pay_records |
| `cleaner_id` | uuid → profiles |
| `pay_period_start` | date |
| `pay_period_end` | date |
| `total_shifts` | integer |
| `total_hours` | numeric |
| `total_gross_pay` | numeric |
| `status` | text (`draft` \| `sent` \| `acknowledged`) |

### `facility_rates`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `facility_id` | uuid → facilities | |
| `role_type` | text | `cleaner` \| `supervisor` |
| `hourly_rate` | numeric | |
| `effective_from` | date | use most recent row where effective_from ≤ today |

### `absence_reports` (written by the app)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `cleaner_id` | uuid → profiles | absent cleaner |
| `replacement_id` | uuid → profiles | replacement cleaner |
| `job_id` | uuid → jobs | |
| `reported_by` | uuid → profiles | supervisor |
| `created_at` | timestamptz | |

### `complaints`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `facility_id` | uuid → facilities | |
| `filed_by` | uuid → profiles | client user |
| `title` | text | |
| `description` | text | |
| `photo_urls` | text[] | |
| `status` | text | `received` \| `acknowledged` \| `in_progress` \| `resolved` |
| `supervisor_note` | text \| null | |

---

## Webhook Payload Reference

### Zone Evidence Submission (sent by app → WF-5)
```json
{
  "cleaner_id": "uuid",
  "job_id": "uuid",
  "zone_id": "uuid",
  "image_urls": ["https://...", "https://..."],
  "note": "Optional note in cleaner's language, or null",
  "timestamp": "2026-06-01T14:32:00.000Z"
}
```
Endpoint env var: `VITE_N8N_WEBHOOK_URL`

---

## WhatsApp API

- Provider: Meta WhatsApp Cloud API
- Phone number ID and access token stored in existing n8n credentials
- ⚠️ **Access token is a 24-hour Meta temp token** — must be regenerated at `developers.facebook.com → WhatsApp → API Setup → Generate token` if messages fail
- Supervisor WhatsApp: +447449553055 (Orfa)

---

---

# EXISTING WORKFLOWS — Need Rewiring to Supabase

These three workflows were built before the app existed. They currently read/write from **Google Sheets**. They must be updated to use **Supabase** instead.

---

## WF-A — Absence Detection
**Workflow ID:** `gkQPGPOGMRPd2yPC`
**Trigger:** Incoming WhatsApp message from a cleaner

### What it does now (Google Sheets)
1. Receives a WhatsApp message
2. Passes message through AI to detect if it's an absence report
3. Looks up the cleaner in Google Sheets by phone number
4. Marks them absent in Google Sheets
5. Triggers WF-B (replacement request)

### What it needs to do (Supabase)
1. Receive WhatsApp message
2. AI detects absence intent (keep as-is)
3. **Look up cleaner in Supabase:**
   ```sql
   SELECT id, full_name, company_id
   FROM profiles
   WHERE phone = '{{whatsapp_from_number}}'
     AND role = 'cleaner'
   ```
   *(Note: `phone` column may need to be added to `profiles` if not already there)*
4. Find today's job assigned to this cleaner:
   ```sql
   SELECT jz.id as zone_id, jz.job_id, j.supervisor_id
   FROM job_zones jz
   JOIN jobs j ON j.id = jz.job_id
   WHERE jz.cleaner_id = '{{cleaner_id}}'
     AND j.scheduled_date = CURRENT_DATE
   LIMIT 1
   ```
5. **INSERT into `absence_reports`:**
   ```json
   {
     "cleaner_id": "{{cleaner_id}}",
     "job_id": "{{job_id}}",
     "reported_by": "{{supervisor_id}}"
   }
   ```
6. **INSERT into `notifications`** for supervisor:
   ```json
   {
     "user_id": "{{supervisor_id}}",
     "title": "Absence Reported",
     "message": "{{cleaner_name}} has reported absent for today's shift."
   }
   ```
7. Trigger WF-B

---

## WF-B — Replacement Request
**Workflow ID:** `hvkwNOApbGwh72dH`
**Trigger:** Called by WF-A when absence confirmed

### What it does now (Google Sheets)
1. Fetches a list of available replacement cleaners from Google Sheets
2. Sends a WhatsApp message to each asking if they can cover
3. Waits for response

### What it needs to do (Supabase)
1. **Fetch available replacement cleaners:**
   ```sql
   SELECT p.id, p.full_name, p.phone
   FROM profiles p
   WHERE p.role = 'cleaner'
     AND p.company_id = '{{company_id}}'
     AND p.id != '{{absent_cleaner_id}}'
   -- optionally filter out cleaners already on shift today
   ```
2. Send WhatsApp message to each candidate (keep existing message template)
3. Store the `absence_report_id` in workflow context so WF-C can reference it

---

## WF-C — Cover Confirmation
**Workflow ID:** `pK7fNdCmWX7RYMpd`
**Trigger:** Incoming WhatsApp "YES" reply from a replacement cleaner

### What it does now (Google Sheets)
1. Identifies which replacement said YES
2. Marks them as the cover in Google Sheets
3. Notifies supervisor

### What it needs to do (Supabase)
1. Identify the replacement cleaner (by phone number):
   ```sql
   SELECT id, full_name FROM profiles WHERE phone = '{{whatsapp_from}}'
   ```
2. **UPDATE `absence_reports`** to set `replacement_id`:
   ```sql
   UPDATE absence_reports
   SET replacement_id = '{{replacement_id}}'
   WHERE id = '{{absence_report_id}}'
   ```
3. **UPDATE `job_zones`** — swap cleaner_id to replacement:
   ```sql
   UPDATE job_zones
   SET cleaner_id = '{{replacement_id}}'
   WHERE job_id = '{{job_id}}'
     AND cleaner_id = '{{absent_cleaner_id}}'
   ```
4. **INSERT into `notifications`** for supervisor:
   ```json
   {
     "user_id": "{{supervisor_id}}",
     "title": "Cover Confirmed",
     "message": "{{replacement_name}} will cover {{absent_cleaner_name}}'s shift today."
   }
   ```
5. Send WhatsApp confirmation to supervisor and replacement (keep existing)

---

---

# NEW WORKFLOWS — To Be Built

---

## WF-5 — Proof of Cleaning Submission ⬅ BUILD THIS FIRST
**Trigger:** HTTP webhook POST from cleaner app
**Priority:** Critical — the core evidence loop

### Incoming payload
```json
{
  "cleaner_id": "uuid",
  "job_id": "uuid",
  "zone_id": "uuid",
  "image_urls": ["https://...", "https://..."],
  "note": "string or null",
  "timestamp": "ISO 8601"
}
```

### Actions
1. **INSERT `cleaning_logs`:**
   ```json
   {
     "job_id": "{{job_id}}",
     "cleaner_id": "{{cleaner_id}}",
     "job_zone_id": "{{zone_id}}",
     "company_id": "{{lookup from profiles.company_id}}",
     "note": "{{note}}",
     "status": "pending"
   }
   ```
2. **INSERT `evidence_files`** — one row per URL:
   ```json
   { "cleaning_log_id": "{{new_log_id}}", "public_url": "{{url}}" }
   ```
3. **UPDATE `job_zones`:**
   ```sql
   UPDATE job_zones SET status = 'completed' WHERE id = '{{zone_id}}'
   ```
4. **Translate note** (if `note` is not null and not English):
   - Call Google Translate API: detect language → translate to English
   - **UPDATE `cleaning_logs`:** set `note_translated = '{{translated}}'`
   - If note is null or already English, skip
5. **Look up supervisor** for this job:
   ```sql
   SELECT supervisor_id FROM jobs WHERE id = '{{job_id}}'
   ```
6. **INSERT `notifications`** for supervisor:
   ```json
   {
     "user_id": "{{supervisor_id}}",
     "title": "Zone Submitted",
     "message": "{{cleaner_name}} submitted evidence for {{zone_name}}."
   }
   ```

---

## WF-6 — Shift Completion + Pay Record
**Trigger:** HTTP webhook POST from app (supervisor marks cleaner complete, or cleaner taps Complete Shift)
**OR:** Polling check — when all `job_zones` for a job reach terminal status

### Incoming payload (from app webhook)
```json
{
  "job_id": "uuid",
  "cleaner_id": "uuid",
  "supervisor_id": "uuid"
}
```

### Actions
1. **Verify all zones are done** (optional guard):
   ```sql
   SELECT COUNT(*) FROM job_zones
   WHERE job_id = '{{job_id}}'
     AND cleaner_id = '{{cleaner_id}}'
     AND status NOT IN ('completed', 'flagged_no_photo', 'deleted')
   ```
2. **UPDATE `jobs.status`** → `completed` (only if ALL cleaners on the job are done)
3. **Look up rate and hours:**
   ```sql
   -- Hourly rate (most recent rate for this facility + role)
   SELECT hourly_rate FROM facility_rates
   WHERE facility_id = (SELECT facility_id FROM jobs WHERE id = '{{job_id}}')
     AND role_type = 'cleaner'
     AND effective_from <= CURRENT_DATE
   ORDER BY effective_from DESC LIMIT 1

   -- Contracted hours
   SELECT contracted_hours FROM profiles WHERE id = '{{cleaner_id}}'

   -- Check if replacement
   SELECT id FROM absence_reports
   WHERE replacement_id = '{{cleaner_id}}' AND job_id = '{{job_id}}'
   ```
4. **INSERT `pay_records`:**
   ```json
   {
     "cleaner_id": "{{cleaner_id}}",
     "supervisor_id": "{{supervisor_id}}",
     "company_id": "{{company_id}}",
     "shift_date": "{{job.scheduled_date}}",
     "facility_id": "{{job.facility_id}}",
     "hours_worked": "{{contracted_hours}}",
     "hourly_rate": "{{hourly_rate}}",
     "status": "draft",
     "is_replacement": true/false
   }
   ```
   ⚠️ Do NOT include `gross_pay` — it is a GENERATED column
5. **INSERT `notifications`** for supervisor confirming pay record created

---

## WF-7 — No-Photo Zone Flagging
**Trigger:** Part of WF-5 — when `zone_id` is submitted via the "No Photo Note" route

The cleaner app sends the same webhook payload as WF-5 but with an empty `image_urls` array and a text note reason. n8n detects this and:

1. **UPDATE `job_zones`:** `status = 'flagged_no_photo'`
2. **INSERT `cleaning_logs`** with the reason as `note`, `status = 'needs_attention'`
3. **INSERT `notifications`** for supervisor flagging the zone

*Simplest approach: handle this inside WF-5 with an IF branch on `image_urls.length === 0`*

---

## WF-8 — Monthly Payslip Roll-up
**Trigger:** Cron — 1st of each month at 06:00

### Actions
1. Calculate prior month date range: `pay_period_start` = 1st of last month, `pay_period_end` = last day of last month
2. **SELECT** all `pay_records` for prior month grouped by `cleaner_id`:
   ```sql
   SELECT
     cleaner_id,
     supervisor_id,
     company_id,
     COUNT(*) as total_shifts,
     SUM(hours_worked) as total_hours,
     SUM(gross_pay) as total_gross
   FROM pay_records
   WHERE shift_date >= '{{period_start}}'
     AND shift_date <= '{{period_end}}'
     AND status IN ('approved', 'paid')
   GROUP BY cleaner_id, supervisor_id, company_id
   ```
3. **INSERT one `payslips` row** per cleaner with the aggregated values, `status = 'draft'`
4. **INSERT `notifications`** for supervisor: "Monthly payslips ready for review"

---

## WF-9 — Payslip Distribution (Future)
**Trigger:** `payslips.status` updated to `sent` (supervisor action in the app)

### Actions
1. Look up cleaner email/contact from `profiles`
2. Generate PDF summary (or use a pre-built template)
3. Send PDF to cleaner via email or WhatsApp
4. **INSERT `notifications`** for cleaner: "Your payslip for [month] is ready"

---

## WF-10 — Job Assignment Notification
**Trigger:** INSERT on `job_zones` table (Supabase webhook or DB trigger → n8n)

### Actions
1. **INSERT `notifications`** for the assigned cleaner:
   ```json
   {
     "user_id": "{{cleaner_id}}",
     "title": "New Zone Assigned",
     "message": "You have been assigned {{zone_name}} at {{facility_name}} for {{date}}."
   }
   ```

---

## WF-11 — Supervisor Evidence Feedback
**Trigger:** INSERT on `feedback_comments` table (Supabase webhook → n8n)

### Actions
1. Look up the `cleaner_id` from the associated `cleaning_log`
2. **INSERT `notifications`** for the cleaner:
   ```json
   {
     "user_id": "{{cleaner_id}}",
     "title": "Zone Feedback Received",
     "message": "Your submission for {{zone_name}} has been {{approved/not accepted}}."
   }
   ```

---

## WF-12 — Complaint Received (Client Portal)
**Trigger:** INSERT on `complaints` table (Supabase webhook → n8n)

### Actions
1. Look up supervisor via `jobs → supervisor_id` for the facility
2. **INSERT `notifications`** for supervisor:
   ```json
   {
     "user_id": "{{supervisor_id}}",
     "title": "Client Complaint",
     "message": "{{client_name}} raised a complaint: {{complaint.title}}"
   }
   ```
3. Optionally send WhatsApp alert to supervisor for urgent visibility

---

## WF-13 — Complaint Resolved Notification
**Trigger:** UPDATE on `complaints.status` → `resolved` (Supabase webhook → n8n)

### Actions
1. Look up client user via `complaints.filed_by`
2. **INSERT `notifications`** for client:
   ```json
   {
     "user_id": "{{client_id}}",
     "title": "Issue Resolved",
     "message": "Your complaint '{{title}}' has been resolved. Note: {{supervisor_note}}"
   }
   ```

---

## WF-14 — SLA Breach Alert
**Trigger:** Cron — every 30 minutes during business hours

### Actions
1. Query jobs that are past their scheduled end time but not yet `completed`:
   ```sql
   SELECT j.id, j.supervisor_id, f.name as facility_name
   FROM jobs j
   JOIN facilities f ON f.id = j.facility_id
   WHERE j.scheduled_date = CURRENT_DATE
     AND j.status != 'completed'
     AND NOW() > (j.scheduled_date + INTERVAL '18 hours')
     -- adjust threshold to your SLA window
   ```
2. For each: **INSERT `notifications`** for supervisor + optionally WhatsApp message

---

## WF-15 — Weekly Report Compilation
**Trigger:** Cron — Sunday night at 22:00

### Actions
1. Find all jobs completed in the past 7 days per facility
2. Aggregate: zones completed, total evidence photos, any flagged zones, average cleaning logs per zone
3. Write a summary to a `weekly_reports` table (create this table if needed):
   ```json
   {
     "facility_id": "uuid",
     "week_start": "date",
     "week_end": "date",
     "jobs_completed": 3,
     "zones_completed": 24,
     "zones_flagged": 1,
     "evidence_photos": 68
   }
   ```
4. **INSERT `notifications`** for client: "Your weekly cleaning report is ready"

---

---

# Build Priority Order

| Priority | Workflow | Why |
|---|---|---|
| 1 | **WF-5** — Proof of Cleaning | Core evidence loop — nothing else works without this |
| 2 | **WF-A/B/C** — Rewire to Supabase | Already built, just swap Google Sheets nodes for Supabase HTTP nodes |
| 3 | **WF-6** — Shift Completion + Pay | Needed for pay records to populate |
| 4 | **WF-7** — No-Photo Flag | Can be an IF branch inside WF-5, minimal extra work |
| 5 | **WF-10** — Zone Assignment Notify | Improves cleaner UX immediately |
| 6 | **WF-11** — Evidence Feedback Notify | Closes the feedback loop for cleaners |
| 7 | **WF-12/13** — Complaint flows | Client portal polish |
| 8 | **WF-8** — Monthly Payslip Rollup | Finance — can wait until pay records have real data |
| 9 | **WF-14** — SLA Breach | Operational nicety |
| 10 | **WF-15** — Weekly Report | Client portal nicety |
| 11 | **WF-9** — Payslip Distribution | Future — once payslip PDF format is decided |

---

# n8n Hosting Options Summary

| Option | Pros | Cons |
|---|---|---|
| **Hetzner VPS** (self-hosted n8n) | Cheapest (~€4–6/mo CAX11 ARM), unlimited workflows, full control | Requires server setup, you manage updates |
| **n8n Cloud** | Fully managed, no server ops, instant setup | Monthly subscription, execution limits on lower tiers |
| **Localhost** | Free | No internet access for webhooks — not viable |

**Recommendation to evaluate:** Start with n8n Cloud on the Starter plan to move fast, migrate to Hetzner VPS once workflows are stable and you want to reduce running costs long-term.
