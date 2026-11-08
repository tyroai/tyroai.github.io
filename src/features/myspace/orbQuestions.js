import { getDateTimeFormat } from "@/lib/intl-cache"

const OPTS_TIME = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
const OPTS_SHORT = { weekday: "short" }
const MAX_MEETINGS = 15

const clip = (text, n) => (text.length > n ? `${text.slice(0, n - 1).trimEnd()}…` : text)

/**
 * Küre kartı önerilerinin TYRO'ya giden soruları: kısa istek + o önerinin gerçek verisi. Metin
 * yalnız kişinin kendi sohbetine gider (toplantıya hazırlık ve Keşfet özeti gibi).
 */

/** Toplantı yükü: bu haftanın (pazartesi–pazar) toplantıları, gün ve saatiyle. */
export function loadQuestion(events, now, t, locale) {
  const time = getDateTimeFormat(locale, OPTS_TIME)
  const short = getDateTimeFormat(locale, OPTS_SHORT)
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 7)
  const mine = (events ?? [])
    .filter(
      (e) =>
        !e.owner &&
        !e.isAllDay &&
        e.myResponse !== "declined" &&
        e.start >= monday &&
        e.start < sunday,
    )
    .sort((a, b) => a.start - b.start)
  const lines = [t("widgets.nudge.ask.load"), ""]
  for (const e of mine.slice(0, MAX_MEETINGS)) {
    const subject = clip(e.subject || t("calendar.noSubject"), 80)
    lines.push(
      `• ${short.format(e.start)} ${time.format(e.start)}–${time.format(e.end)} ${subject}`,
    )
  }
  if (mine.length > MAX_MEETINGS)
    lines.push(`• ${t("widgets.intro.ctx.more", { n: mine.length - MAX_MEETINGS })}`)
  return lines.join("\n")
}
