const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as string

export interface ZoneSubmissionPayload {
  cleaner_id: string
  job_id: string
  zone_id: string
  image_urls: string[]
  note: string | null
  timestamp: string
}

/** POST a zone submission event to the n8n webhook. */
export async function postZoneSubmission(payload: ZoneSubmissionPayload): Promise<void> {
  const res = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Webhook error: ${res.status}`)
}
