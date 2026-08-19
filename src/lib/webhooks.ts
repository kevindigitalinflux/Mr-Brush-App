const N8N_WEBHOOK_URL           = import.meta.env.VITE_N8N_WEBHOOK_URL as string
const N8N_SHIFT_COMPLETE_URL    = import.meta.env.VITE_N8N_SHIFT_COMPLETE_WEBHOOK as string
const N8N_RECLEAN_ACK_URL       = import.meta.env.VITE_N8N_RECLEAN_ACK_WEBHOOK as string
const N8N_RECURRING_SYNC_URL    = import.meta.env.VITE_N8N_RECURRING_SYNC_WEBHOOK as string

export interface ZoneSubmissionPayload {
  cleaner_id: string
  job_id: string
  zone_id: string
  company_id: string
  image_urls: string[]
  note: string | null
  timestamp: string
}

export interface ShiftCompletePayload {
  job_id: string
  cleaner_id: string
  supervisor_id: string
}

/** POST a zone submission event to the n8n webhook. No-ops if the URL is not yet configured. */
export async function postZoneSubmission(payload: ZoneSubmissionPayload): Promise<void> {
  if (!N8N_WEBHOOK_URL) return
  const res = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Webhook error: ${res.status}`)
}

export interface RecleanAckPayload {
  feedback_comment_id: string
  supervisor_id: string
  cleaner_id: string
  cleaner_note: string
  zone_name: string
  facility_name: string
}

/** POST a reclean acknowledgement to WF-12. No-ops if the URL is not yet configured. */
export async function postRecleanAck(payload: RecleanAckPayload): Promise<void> {
  if (!N8N_RECLEAN_ACK_URL) return
  const res = await fetch(N8N_RECLEAN_ACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Webhook error: ${res.status}`)
}

/** POST a shift-complete event to WF-6. No-ops if the URL is not yet configured. */
export async function postShiftComplete(payload: ShiftCompletePayload): Promise<void> {
  if (!N8N_SHIFT_COMPLETE_URL) return
  const res = await fetch(N8N_SHIFT_COMPLETE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Webhook error: ${res.status}`)
}

/** Manually trigger WF-16 to materialize today's due recurring zone assignments. No-ops if the URL is not yet configured. */
export async function postRecurringSync(): Promise<void> {
  if (!N8N_RECURRING_SYNC_URL) return
  const res = await fetch(N8N_RECURRING_SYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ triggered_at: new Date().toISOString() }),
  })
  if (!res.ok) throw new Error(`Webhook error: ${res.status}`)
}
