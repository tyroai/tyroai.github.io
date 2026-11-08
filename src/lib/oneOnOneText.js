import { getDateTimeFormat } from "@/lib/intl-cache"

const OPTS_DAY = { day: "numeric", month: "short" }
const MAX_RECAP = 400

const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

/** Özetin kısa hâli: görevler önce (yöneticinin takibi), sonra not başlıkları. */
function recapText(insight) {
  const actions = insight.actions.map((a) => [a.title, a.text].filter(Boolean).join(": "))
  const notes = insight.notes.map((n) => n.title || n.text)
  return clip([...actions, ...notes].filter(Boolean).join("; "), MAX_RECAP)
}

/**
 * Asistana giden bağlam (kişinin dilinde): 1:1 olduğu, kalan ve yaklaşan izin, son görüşme ve özeti,
 * ortak Planner işleri, gündem isteği. Bilinmeyen (`null`) satır yazılmaz.
 */
export function oneOnOneContext(person, data, t, locale) {
  const day = getDateTimeFormat(locale, OPTS_DAY)
  // "10–12 Kas": aralık dilin kendi biçimiyle (`formatRange`).
  const range = (l) =>
    l.end && l.end.getTime() !== l.start.getTime()
      ? day.formatRange(l.start, l.end)
      : day.format(l.start)
  const lines = [t("calendar.prep.oneOnOne", { name: person.name })]
  if (data.remain != null) lines.push(t("calendar.prep.remain", { n: data.remain }))
  if (data.upcoming)
    lines.push(
      data.upcoming.length
        ? t("calendar.prep.leave", { dates: data.upcoming.slice(0, 3).map(range).join(", ") })
        : t("calendar.prep.noLeave"),
    )
  if (data.last?.start) lines.push(t("calendar.prep.last", { date: day.format(data.last.start) }))
  if (data.recap) lines.push(t("calendar.prep.recap", { text: recapText(data.recap) }))
  if (data.tasks?.length)
    lines.push(
      t("calendar.prep.tasks", {
        list: data.tasks
          .map((x) => (x.due ? `${x.title} (${day.format(x.due)})` : x.title))
          .join("; "),
      }),
    )
  lines.push(t("calendar.prep.ask"))
  return lines.join("\n")
}
