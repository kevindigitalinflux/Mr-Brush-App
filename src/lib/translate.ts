const TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY as string

/** Translates text to English using the Google Translate API. Used by n8n on the server side — this helper is for client-side fallback only. */
export async function translateToEnglish(text: string, sourceLang: string): Promise<string> {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${TRANSLATE_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source: sourceLang, target: 'en', format: 'text' }),
  })
  if (!res.ok) throw new Error(`Translate error: ${res.status}`)
  const data = await res.json()
  return data.data.translations[0].translatedText as string
}
