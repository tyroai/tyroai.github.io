import { getDateTimeFormat } from "@/lib/intl-cache"

const OPTS_TIME = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
const OPTS_DAY = { weekday: "long", day: "numeric", month: "long" }
const OPTS_SHORT = { weekday: "short" }
const MAX_TITLE = 80

const clip = (text) =>
  text.length > MAX_TITLE ? `${text.slice(0, MAX_TITLE - 1).trimEnd()}…` : text

/**
 * Karşılama'nın "Günü / Yarını planla · Haftaya hazırlan" istemi: kısa istek + gerçek gündem
 * (`lib/planAgenda`) — toplantılar saatleriyle, boş saatler, gecikmiş ve açık işler. Okunmamış
 * bölüm (takvim ya da işler yüklenmediyse) yazılmaz. Metin yalnız kişinin kendi sohbetine gider.
 */
export function planQuestion(kind, agenda, t, locale) {
  const time = getDateTimeFormat(locale, OPTS_TIME)
  const span = (a, b) => `${time.format(a)}–${time.format(b)}`
  const day = getDateTimeFormat(locale, OPTS_DAY).format(agenda.day)
  const lines = [t(`widgets.intro.ask.${kind}`)]
  const { meetings, work } = agenda
  if (!meetings && !work) return lines[0]
  lines.push("", t("widgets.intro.ctx.lead"))
  if (meetings) {
    lines.push(
      meetings.list.length
        ? t("widgets.intro.ctx.meetings", { day })
        : t("widgets.intro.ctx.noMeetings", { day }),
    )
    for (const m of meetings.list)
      lines.push(`• ${span(m.start, m.end)} ${clip(m.subject || t("calendar.noSubject"))}`)
    if (meetings.more) lines.push(`• ${t("widgets.intro.ctx.more", { n: meetings.more })}`)
    if (meetings.week) {
      const short = getDateTimeFormat(locale, OPTS_SHORT)
      const counts = meetings.week.map((d) => `${short.format(d.date)} ${d.n}`).join(" · ")
      lines.push(`${t("widgets.intro.ctx.week")}: ${counts}`)
    }
    if (meetings.free.length)
      lines.push(
        `${t("widgets.intro.ctx.free")}: ${meetings.free.map((w) => span(w.start, w.end)).join(", ")}`,
      )
  }
  if (work) {
    if (work.overdue.length) {
      lines.push(t("widgets.intro.ctx.overdue"))
      for (const x of work.overdue) lines.push(`• ${clip(x.title)}`)
    }
    if (work.rest.length) {
      lines.push(t("widgets.intro.ctx.open"))
      for (const x of work.rest) lines.push(`• ${clip(x.title)}`)
    }
    if (work.more) lines.push(`• ${t("widgets.intro.ctx.more", { n: work.more })}`)
  }
  return lines.join("\n")
}
