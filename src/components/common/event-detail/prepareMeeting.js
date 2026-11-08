import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { OPTS_DAY_FULL, OPTS_TIME } from "./eventFormat"

/**
 * Toplantıya asistanla hazırlan: soruyu sohbete bırakır ve sohbeti açar. `extra`: 1:1 bağlamı
 * (`useOneOnOnePrep`) — istemin altına eklenir.
 */
export function prepareMeeting(event, t, locale, extra = null) {
  const time = getDateTimeFormat(locale, OPTS_TIME)
  const base = t("calendar.preparePrompt", {
    title: event.subject || t("calendar.noSubject"),
    date: getDateTimeFormat(locale, OPTS_DAY_FULL).format(event.start),
    time: event.isAllDay
      ? t("calendar.allDay")
      : `${time.format(event.start)} - ${time.format(event.end)}`,
    organizer: event.organizer || "—",
  })
  setPendingAsk({
    question: extra ? `${base}\n\n${extra}` : base,
    // Toplantı hazırlığı ofis işi: posta taslağıyla aynı asistana gider.
    agent: "tyroOffice",
  })
  requestOpenChat({ focusComposer: true })
}
