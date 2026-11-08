import { useDeferredValue, useMemo, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useToday } from "@/hooks/useToday"
import { narrateCalendar } from "@/features/calendar/lib/narrate/calendarIntent"

/**
 * Takvim Anlat kutusunun durumu: yazı ve çözümü (`features/calendar/lib/narrate/calendarIntent`; yazarken canlı, çözüm
 * ertelenmiş değerle — yazı akıcı kalsın). `target`: `{ day, minute }` (Yeni menüsünün açıldığı gün
 * ve boş saate basıldıysa saat: cümle yazmadıklarının varsayılanı), `kinds`: `{ leave, task }` kapı
 * açık mı. `enabled`: çözücü Türkçe — başka dilde Anlat görünmez. `typing`: kutuda yazı var.
 */
export function useCalendarNarrate({ target, kinds }) {
  const { locale } = useLocale()
  const today = useToday()
  const [text, setText] = useState("")
  const deferred = useDeferredValue(text)
  const { day, minute } = target
  const { leave, task } = kinds
  const result = useMemo(
    () => narrateCalendar(deferred, { today, target: { day, minute }, kinds: { leave, task } }),
    [deferred, today, day, minute, leave, task],
  )
  return { text, setText, result, enabled: locale === "tr", typing: text.trim() !== "" }
}
