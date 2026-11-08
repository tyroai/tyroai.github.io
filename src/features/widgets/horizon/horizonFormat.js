import { bcp47, getDateTimeFormat, getNumberFormat } from "@/lib/intl-cache"
import { keyToDate } from "@/lib/todoInsights"

// Miladi takvim açıkça: `ar-SA`nın varsayılanı bazı tarayıcılarda hicri.
const OPTS_DAY = { calendar: "gregory", day: "2-digit" }
const OPTS_MONTH = { calendar: "gregory", month: "short" }
const OPTS_YEAR = { calendar: "gregory", year: "numeric" }
const OPTS_LONG = {
  calendar: "gregory",
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
}

/** Tarih karosunun parçaları: "01" · "OCA" · "2027". */
export function dateParts(dueKey, locale) {
  const d = keyToDate(dueKey)
  return {
    day: getDateTimeFormat(locale, OPTS_DAY).format(d),
    month: getDateTimeFormat(locale, OPTS_MONTH)
      .format(d)
      .replace(/\.$/, "")
      .toLocaleUpperCase(bcp47(locale)),
    year: getDateTimeFormat(locale, OPTS_YEAR).format(d),
  }
}

/** "1 Ocak 2027 Cuma". */
export const longDate = (dueKey, locale) =>
  getDateTimeFormat(locale, OPTS_LONG).format(keyToDate(dueKey))

/** Miktar: "12 gün" · "5 ay" · "2 yıl" (dilin kendi çoğulu ve kısaltması). */
const amountOf = (cd, locale) =>
  getNumberFormat(locale, { style: "unit", unit: cd.unit, unitDisplay: "short" }).format(cd.n)

/** Hapın kısa metni: "Bugün" · "Yarın" · "12 gün". */
export function countdownText(cd, t, locale) {
  if (cd.kind === "today") return t("todo.due.today")
  if (cd.kind === "tomorrow") return t("todo.due.tomorrow")
  return amountOf(cd, locale)
}

/**
 * Header tepsisinin kısa hâli: "3g" · "3a" · "2s" (gün · ay · sene); gecikmişte "−3g", bugün
 * "Bugün". Görsel: ekran okuyucuya tam cümle (`countdownPhrase`).
 */
export function countdownShort(cd, t) {
  if (cd.kind === "today") return t("todo.due.today")
  const text = t(`widgets.horizon.short.${cd.unit}`, { n: cd.n })
  return cd.late ? `−${text}` : text
}

/** Tam cümle (ekran okuyucu ve ayrıntı): "12 gün kaldı" · "3 gün gecikti" · "Bugün". */
export function countdownPhrase(cd, t, locale) {
  if (cd.kind) return countdownText(cd, t, locale)
  const amount = amountOf(cd, locale)
  return t(cd.late ? "widgets.horizon.late" : "widgets.horizon.left", { amount })
}

/** Hedefin tonu: biten · gecikmiş · sıradaki · diğerleri. */
export function toneOf(item, cd, next) {
  if (item.done) return "done"
  if (cd.late) return "late"
  return item.id === next?.id ? "next" : "base"
}
