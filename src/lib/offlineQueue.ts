import localforage from 'localforage'
import { postZoneSubmission, type ZoneSubmissionPayload } from './webhooks'

const QUEUE_KEY = 'offline_queue'

export async function enqueueSubmission(payload: ZoneSubmissionPayload): Promise<void> {
  const queue = (await localforage.getItem<ZoneSubmissionPayload[]>(QUEUE_KEY)) ?? []
  queue.push(payload)
  await localforage.setItem(QUEUE_KEY, queue)
}

export async function flushQueue(): Promise<void> {
  const queue = (await localforage.getItem<ZoneSubmissionPayload[]>(QUEUE_KEY)) ?? []
  if (queue.length === 0) return
  const failed: ZoneSubmissionPayload[] = []
  for (const item of queue) {
    try {
      await postZoneSubmission(item)
    } catch {
      failed.push(item)
    }
  }
  await localforage.setItem(QUEUE_KEY, failed)
}
