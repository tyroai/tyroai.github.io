import { useDeferredValue, useMemo, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useToday } from "@/hooks/useToday"
import { narrate } from "@/lib/narrate"

/**
 * Anlat kutusunun durumu: yazı ve çözümü (`lib/narrate`; yazarken canlı, çözüm ertelenmiş
 * değerle — yazı akıcı kalsın). `kind`: form içinde formun türü; menüde null (cümleden bulunur).
 * `enabled`: çözücü Türkçe — başka dilde Anlat görünmez. `delegate`: kişi temsilci atayabiliyorsa
 * menüde temsilci cümlesi de anlaşılır (`lib/narrate/delegate`).
 */
export function useNarrate(kind = null, { delegate = false } = {}) {
  const { locale } = useLocale()
  const today = useToday()
  const [text, setText] = useState("")
  const deferred = useDeferredValue(text)
  const result = useMemo(
    () => narrate(deferred, { today, kind, locale, delegate }),
    [deferred, today, kind, locale, delegate],
  )
  return { text, setText, result, enabled: locale === "tr" }
}
