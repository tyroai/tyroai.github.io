import { getDateTimeFormat } from "@/lib/intl-cache"
import { dayGap, keyNoonDate } from "@/lib/reportDay"

const OPTS_DAY = { weekday: "short", day: "numeric", month: "short" }
const OPTS_DATE = { day: "numeric", month: "short" }
const OPTS_TIME = { hour: "2-digit", minute: "2-digit" }

/**
 * "10 Kas Sal · 20:00" — kişinin saatiyle; saatsiz yayında yalnız gün (kaynağın tarihi).
 * `weekday: false`: dar kart (saat kesilmesin).
 */
export function whenText(release, timed, locale, weekday = true) {
  const opts = weekday ? OPTS_DAY : OPTS_DATE
  if (!timed)
    return getDateTimeFormat(locale, { ...opts, timeZone: "UTC" }).format(keyNoonDate(release.key))
  const day = getDateTimeFormat(locale, opts).format(release.at)
  return `${day} · ${getDateTimeFormat(locale, OPTS_TIME).format(release.at)}`
}

/**
 * Kalan süre hapı: yayımlandıysa "Yayımlandı", bugünse saat (saatsizse "Bugün"), yarın "Yarın",
 * sonra "5g". `sr`: ekran okuyucunun cümlesi.
 */
export function releaseChip(item, now, t, locale) {
  const { release, report, released } = item
  const timed = Boolean(report.time)
  if (released)
    return { tone: "done", text: t("widgets.reports.released"), sr: t("widgets.reports.released") }
  const gap = dayGap(release, timed, now)
  if (gap <= 0) {
    const text = timed
      ? getDateTimeFormat(locale, OPTS_TIME).format(release.at)
      : t("widgets.reports.today")
    return { tone: "today", text, sr: `${t("widgets.reports.today")} ${timed ? text : ""}`.trim() }
  }
  if (gap === 1)
    return { tone: "soon", text: t("widgets.reports.tomorrow"), sr: t("widgets.reports.tomorrow") }
  return {
    tone: "later",
    text: t("headerWidgets.daysShort", { n: gap }),
    sr: t("widgets.reports.inDays", { n: gap }),
  }
}
