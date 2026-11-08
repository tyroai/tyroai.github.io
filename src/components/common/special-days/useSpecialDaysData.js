import { useMemo } from "react"
import { useCelebrations, STATUS } from "@/hooks/useCelebrations"
import { useLocale } from "@/hooks/useLocale"
import { useMyIdentity } from "@/hooks/useMyCelebration"
import { isMine } from "@/lib/myCelebration"
import { startOfDay } from "@/lib/calendarRange"
import { endOfNextWeek } from "@/lib/weekStart"
import { specialDaysOfYear, isoOf } from "@/data/specialDays"

/**
 * Çanın ve Özel günler panelinin ortak verisi: bugün, yaklaşan tatiller ("bu ya da gelecek hafta",
 * pencere `lib/weekStart.js`) ve İK kütüğünden kutlamalar (`useCelebrations`ın önbelleği, ek
 * istek yok). Yaklaşanlar BUGÜNE göre — takvimde gezilen yıla göre değil: rozet gezinmeyle
 * değişmesin; yıl sonunda gelecek yılın ilk tatilleri de girer. Kişinin kendisi listede kalır
 * ("Senin günün") ama rozete girmez (`self`).
 */
export function useSpecialDaysData() {
  const { locale } = useLocale()
  const today = startOfDay(new Date())
  const todayIso = isoOf(today)

  const soon = useMemo(() => {
    const until = isoOf(endOfNextWeek(startOfDay(new Date()), locale))
    const y = Number(todayIso.slice(0, 4))
    return [...specialDaysOfYear(y), ...specialDaysOfYear(y + 1)].filter(
      (s) => s.to >= todayIso && s.from <= until,
    )
  }, [todayIso, locale])

  const celebrations = useCelebrations()
  const ids = useMyIdentity()
  const peopleKnown = celebrations.status === STATUS.ready
  const people = useMemo(() => {
    if (!peopleKnown) return []
    const pick = (list, kind) =>
      (list ?? []).map((p) => ({ ...p, kind, self: isMine(ids, p.mail) }))
    return [
      ...pick(celebrations.birthdays, "birthday"),
      ...pick(celebrations.anniversaries, "anniversary"),
      ...pick(celebrations.joiners, "joiner"),
    ]
  }, [celebrations, ids, peopleKnown])

  return { today, todayIso, soon, people, peopleKnown }
}
