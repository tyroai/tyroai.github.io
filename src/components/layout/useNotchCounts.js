import { useEffect, useMemo, useState } from "react"
import { useCalendarEvents, groupEventsByDay } from "@/hooks/useCalendarEvents"
import { useMailMessages } from "@/hooks/useMailMessages"
import { defaultCalendarRange, startOfDay } from "@/lib/calendarRange"
import { useFocusMode } from "@/lib/focusMode"
import { STATUS } from "@/lib/graph"
import { readSharedCalendars } from "@/lib/sharedCalendars"

/**
 * Çentiğin sayıları (yan ray ve telefon şeridi ortak): okunmamış posta ve bugün kalan
 * toplantı; üçüncü düğme (Saatler) sayı taşımaz, halkası hep boş. Veri hazır değilse `null` (halka
 * çizilmez). Odak modunda posta sayısı susar (takvim kalır: plan bilgisi, bildirim değil).
 *
 * ⚠️ Önbellek anahtarları HEADER'LA AYNI (`useMailMessages(12)`, varsayılan takvim
 * aralığı + paylaşılan takvimler).
 */
export function useNotchCounts() {
  // "Şimdi" dakikada bir ilerler: biten toplantı sayısı sekme açık kaldıkça bayatlamasın.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  const [today] = useState(() => startOfDay(new Date()))
  const { rangeStart, rangeEnd } = useMemo(() => defaultCalendarRange(today), [today])
  const [people] = useState(readSharedCalendars)

  const mail = useMailMessages(12)
  const cal = useCalendarEvents(rangeStart, rangeEnd, true, people)

  const calReady = cal.status === STATUS.ready
  const todayEvents = useMemo(
    () => (calReady ? (groupEventsByDay(cal.events, today, 1)[0]?.events ?? []) : []),
    [calReady, cal.events, today],
  )
  const done = todayEvents.filter((e) => e.end && e.end.getTime() <= now).length

  const quiet = useFocusMode().until != null
  return {
    mail: mail.status === STATUS.ready && !quiet ? mail.unread : null,
    calendar: calReady ? todayEvents.length - done : null,
  }
}
