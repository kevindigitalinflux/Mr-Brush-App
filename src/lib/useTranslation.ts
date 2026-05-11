import { useApp } from '../context/AppContext'
import { strings } from './i18n'

/** Returns a `t(key)` function scoped to the current app language, with English fallback. */
export function useTranslation() {
  const { language } = useApp()
  return (key: string): string => strings[language]?.[key] ?? strings['en'][key] ?? key
}
