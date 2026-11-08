import { listText } from "@/features/selfservice/lib/expenseLine"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { countText } from "../../kinds"

/** İzin formunun tarih ve gün metinleri (etki kartı, tarih düğmeleri, alt şerit). */

const LONG = { weekday: "long", day: "numeric", month: "long" }
const SHORT = { weekday: "short", day: "numeric", month: "short" }
const TIME = { hour: "2-digit", minute: "2-digit" }

/** "Cuma 30 Ekim" — öneri ve uçlarda. */
export const longDay = (day, locale) => getDateTimeFormat(locale, LONG).format(day)

/** "Cum 30 Eki" — tarih düğmeleri ve toplantı satırı. */
export const shortDay = (day, locale) => getDateTimeFormat(locale, SHORT).format(day)

/** "14:30" — toplantı saati. */
export const clock = (date, locale) => getDateTimeFormat(locale, TIME).format(date)

/** Günün nedeni: iş günü, hafta sonu, bayramın adı ya da arife. */
export function reasonText(t, kind, holiday) {
  if (kind === "holiday" && holiday) return t(`special.day.${holiday}`)
  return t(`selfService.leave.reason.${kind}`)
}

/** "Nasıl hesaplandı?" satırının solu: gün (ya da birleşik aralık) · neden. */
export function dayLine(t, locale, line) {
  const fmt = getDateTimeFormat(locale, SHORT)
  const when =
    line.count > 1 && typeof fmt.formatRange === "function"
      ? fmt.formatRange(line.from, line.to)
      : fmt.format(line.from)
  return `${when} · ${reasonText(t, line.kind, line.holiday)}`
}

/** Takvim gününün ekip parçası (erişilebilir ad): "Ekibinden 2 kişi izinde: A ve B (onayda)". */
export function teamDayText(t, locale, people) {
  const pending = t("selfService.leave.pendingStatus")
  const names = people.map((p) => (p.pending ? `${p.name} (${pending})` : p.name))
  return countText(t, locale, "selfService.leave.teamDay", people.length, {
    names: listText(locale, names),
  })
}
