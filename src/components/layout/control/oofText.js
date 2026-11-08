import { getDateTimeFormat } from "@/lib/intl-cache"

const DAY = { day: "numeric", month: "long" }
const WEEKDAY = { weekday: "long", day: "numeric", month: "long" }

/** "12–16 Kasım" · "30 Ekim – 2 Kasım" (dilin kendi aralık yazımı). */
export function rangeText(locale, start, end) {
  const f = getDateTimeFormat(locale, DAY)
  return typeof f.formatRange === "function"
    ? f.formatRange(start, end)
    : `${f.format(start)} – ${f.format(end)}`
}

/** "17 Kasım Pazartesi" (dönüş günü). */
export const dayText = (locale, d) => getDateTimeFormat(locale, WEEKDAY).format(d)

/**
 * Hazır yanıt metinleri: kurum içi kişinin dilinde; kurum dışı Türkçe + İngilizce (iki dilli —
 * dış muhatapların çoğu Türkçe bilmiyor). İzin türü ya da nedeni yazılmaz. İkisi de düzenlenir.
 */
export function oofTexts(t, locale, leave, back) {
  const args = (loc) => ({
    range: rangeText(loc, leave.start, leave.end),
    back: dayText(loc, back),
  })
  return {
    internal: t("control.oof.msg", args(locale)),
    external: `${t("control.oof.msgTr", args("tr-TR"))}\n\n${t("control.oof.msgEn", args("en-GB"))}`,
  }
}
