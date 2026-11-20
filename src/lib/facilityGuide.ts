import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { todayString } from './dateRange'
import type { Language } from './i18n'

export type GuideLang = 'en' | 'es'
export interface Loc { en: string; es: string }

export interface GuideStepData {
  t: Loc
  code?: string
  code_label?: Loc
  warn?: Loc
  photos?: string[]
  contact?: { name: string; phone: string; email: string }
}

export interface GuideSectionData {
  id: string
  facility_id: string
  sort: number
  slug: string
  title: Loc
  summary: Loc | null
  time_label: string | null
  steps: GuideStepData[]
}

/** Sections with sort >= this are the day's task list (tickable); earlier ones are "getting in" reference. */
export const TASK_SORT_START = 10

/** The guide only has English and Spanish text, so Portuguese users start in English. */
export function defaultGuideLang(appLang: Language): GuideLang {
  return appLang === 'es' ? 'es' : 'en'
}

/** Picks the text for a language, falling back to English. */
export function pick(loc: Loc | null | undefined, lang: GuideLang): string {
  return loc ? (loc[lang] || loc.en) : ''
}

const LANG_KEY = 'guide-lang'

export function readGuideLang(appLang: Language): GuideLang {
  try {
    const v = localStorage.getItem(LANG_KEY)
    if (v === 'en' || v === 'es') return v
  } catch (err) { console.error('guide lang read failed', err) }
  return defaultGuideLang(appLang)
}

export function saveGuideLang(lang: GuideLang) {
  try { localStorage.setItem(LANG_KEY, lang) } catch (err) { console.error('guide lang save failed', err) }
}

/** Loads the guide sections the signed-in user may read (row-level security decides which) and signed photo URLs. */
export function useFacilityGuide(userId: string | undefined) {
  const [sections, setSections] = useState<GuideSectionData[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function load() {
      const { data, error: err } = await supabase
        .from('facility_guide_sections').select('id, facility_id, sort, slug, title, summary, time_label, steps').order('sort')
      if (cancelled) return
      if (err) { console.error('facility guide load failed', err); setError(true); setLoading(false); return }
      const rows = (data ?? []) as GuideSectionData[]
      setSections(rows)
      setLoading(false)
      const paths = [...new Set(rows.flatMap((s) => s.steps.flatMap((st) => (st.photos ?? []).map((p) => `${s.facility_id}/${p}`))))]
      if (paths.length === 0) return
      const { data: signed, error: signErr } = await supabase.storage.from('facility-guide').createSignedUrls(paths, 3600)
      if (cancelled) return
      if (signErr) { console.error('guide photo signing failed', signErr); return }
      const map: Record<string, string> = {}
      for (const s of signed ?? []) if (s.path && s.signedUrl) map[s.path] = s.signedUrl
      setPhotoUrls(map)
    }
    void load()
    return () => { cancelled = true }
  }, [userId])

  return { sections, photoUrls, loading, error }
}

/** Per-device, per-day tick state for the task list. Resets automatically each day. */
export function useGuideChecks(userId: string | undefined) {
  const key = `guide-done:${userId ?? 'x'}:${todayString()}`
  const [state, setState] = useState(() => ({ key, done: readDone(key) }))
  // If the day or user changed since the state was stored, read that key fresh.
  const done = state.key === key ? state.done : readDone(key)

  const toggle = useCallback((id: string) => {
    setState((prev) => {
      const next = new Set(prev.key === key ? prev.done : readDone(key))
      if (next.has(id)) next.delete(id); else next.add(id)
      try { localStorage.setItem(key, JSON.stringify([...next])) } catch (err) { console.error('guide checks save failed', err) }
      return { key, done: next }
    })
  }, [key])

  return { done, toggle }
}

function readDone(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch (err) {
    console.error('guide checks read failed', err)
    return new Set()
  }
}
