import { useMemo, useState } from "react"
import { useCalendarEvents } from "@/hooks/useCalendarEvents"
import { useLocale } from "@/hooks/useLocale"
import { defaultCalendarRange, startOfDay } from "@/lib/calendarRange"
import { meetingLoad } from "@/features/widgets/lib/meetingLoad"
import { readSharedCalendars } from "@/lib/sharedCalendars"
import { firstDayOfWeek } from "@/lib/weekStart"

// Widget ev sahiplerinin (Anasayfa, Pano, header gövdesi ve tepsisi) ortak takvim kancaları —
// aynı kurulum dört yerde kopyaydı.

/**
 * Takvim: çentiğin ve bütün panoların AYNI aralığı ve kişileri — önbellek anahtarı ortak,
 * Graph'a ikinci kez gidilmez. Gün ve kişi listesi açılışta bir kez.
 */
const SNAPSHOT = { snapshot: true }

export function useBoardCalendar() {
  const [today] = useState(() => startOfDay(new Date()))
  const { rangeStart, rangeEnd } = useMemo(() => defaultCalendarRange(today), [today])
  const [people] = useState(readSharedCalendars)
  // Pano aralığı cihazda son görüntüyle başlar (önce göster, arkada tazele — `lib/homeSnapshots`).
  const cal = useCalendarEvents(rangeStart, rangeEnd, true, people, SNAPSHOT)
  return { cal, rangeStart, rangeEnd }
}

/** Toplantı yükü (ritim kartı): haftanın ilk günü dile göre. */
export function useMeetingLoad(events, now, rangeStart, rangeEnd) {
  const { locale } = useLocale()
  return useMemo(
    () => meetingLoad(events, new Date(now), rangeStart, firstDayOfWeek(locale), rangeEnd),
    [events, now, rangeStart, rangeEnd, locale],
  )
}
