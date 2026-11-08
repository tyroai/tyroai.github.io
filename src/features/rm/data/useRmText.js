import { useCallback, useEffect, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { loadRmDictionary, rmDictionaryFor, rmText } from "@/features/rm/lib/i18n"

/**
 * tyroRM metinleri: `rt(anahtar, değişkenler)`. Bölüm sözlüğü dil seçilince iner; inene kadar
 * Türkçe görünür (ham anahtar değil). Ana sözlüğün `t`si de döner (ortak düğme metinleri).
 */
export function useRmText() {
  const { t, locale } = useLocale()
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (rmDictionaryFor(locale)) return undefined
    let alive = true
    loadRmDictionary(locale)
      .then(() => alive && setVersion((v) => v + 1))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [locale])
  const rt = useCallback(
    (key, vars) => rmText(rmDictionaryFor(locale) ? locale : "tr", key, vars),
    // version: sözlük inince metinler yenilensin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, version],
  )
  return { rt, t, locale }
}
