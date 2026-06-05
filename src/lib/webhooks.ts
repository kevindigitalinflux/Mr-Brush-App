const N8N_WEBHOOK_URL           = import.meta.env.VITE_N8N_WEBHOOK_URL as string
const N8N_SHIFT_COMPLETE_URL    = import.meta.env.VITE_N8N_SHIFT_COMPLETE_WEBHOOK as string

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
