import localforage from 'localforage'
import { supabase } from './supabase'
import { postZoneSubmission } from './webhooks'

const QUEUE_KEY = 'offline_queue_v2'

export interface OfflineEntry {
  id: string
  cleanerId: string
  companyId: string
  jobId: string
  zoneId: string
  photoBase64s: string[] // data URLs: "data:image/jpeg;base64,..."
  note: string | null
  timestamp: string
}

export async function enqueueOfflineSubmission(entry: OfflineEntry): Promise<void> {
  const queue = (await localforage.getItem<OfflineEntry[]>(QUEUE_KEY)) ?? []
  queue.push(entry)
  await localforage.setItem(QUEUE_KEY, queue)
}

export async function getOfflineQueue(): Promise<OfflineEntry[]> {
  return (await localforage.getItem<OfflineEntry[]>(QUEUE_KEY)) ?? []
}

export async function flushOfflineQueue(
  onZoneComplete: (zoneId: string) => void
): Promise<void> {
  const queue = await getOfflineQueue()
  if (queue.length === 0) return
  const failed: OfflineEntry[] = []
  for (const entry of queue) {
    try {
      const imageUrls = await Promise.all(
        entry.photoBase64s.map(async (dataUrl, i) => {
          const blob = await fetch(dataUrl).then((r) => r.blob())
          const ext = blob.type.split('/')[1] ?? 'jpg'
          const path = `${entry.companyId}/${entry.jobId}/${entry.zoneId}/${entry.id}_${i}.${ext}`
          const { error } = await supabase.storage
            .from('evidence-photos')
            .upload(path, blob, { contentType: blob.type, upsert: true })
          if (error) throw error
          return supabase.storage.from('evidence-photos').getPublicUrl(path).data.publicUrl
        })
      )
      await postZoneSubmission({
        cleaner_id: entry.cleanerId,
        job_id: entry.jobId,
        zone_id: entry.zoneId,
        image_urls: imageUrls,
        note: entry.note,
        timestamp: entry.timestamp,
      })
      onZoneComplete(entry.zoneId)
    } catch {
      failed.push(entry)
    }
  }
  await localforage.setItem(QUEUE_KEY, failed)
}
