import { MARKET_REPORTS } from "@/data/marketReports"
import { STATUS, browserTimeZone, graphPost, requestGraphScopes } from "@/lib/graph"
import { offsetMinutes } from "@/lib/worldClock"

const DAY = 86_400_000
// Yayından sonra bu kadar süre satır "Yayımlandı" der ve raporu açtırır; sonra sıradakine geçer.
export const RELEASED_MS = 3 * 3_600_000

/** Kaynağın saat dilimindeki gün ve saat → an (yaz saati dahil; ABD'de 1 Kasım'da biter). */
export function zonedInstant(tz, dateKey, time) {
  const [y, mo, d] = dateKey.split("-").map(Number)
  const [h, mi] = (time ?? "00:00").split(":").map(Number)
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  const first = guess - offsetMinutes(tz, new Date(guess)) * 60_000
  return new Date(guess - offsetMinutes(tz, new Date(first)) * 60_000)
}

/** Raporun yayınları `{ key, at, end }`: saatli yayın anında başlar; saatsiz yayın gün boyu. */
export function releasesOf(report) {
  return report.dates.map((key) => {
    const at = zonedInstant(report.tz, key, report.time)
    return { key, at, end: report.time ? at : new Date(at.getTime() + DAY) }
  })
}

/**
 * Her raporun sıradaki yayını — şu andan sonra ya da az önce yayımlanmış (`RELEASED_MS`; saatsiz
 * yayın gün bitene dek): `{ report, release, released }`, yakın önce. Takvimi biten rapor düşer.
 */
export function upcomingReports(now, reports = MARKET_REPORTS) {
  return reports
    .map((report) => {
      const release = releasesOf(report).find((r) =>
        report.time ? r.at.getTime() + RELEASED_MS > now : r.end.getTime() > now,
      )
      if (!release) return null
      return { report, release, released: Boolean(report.time) && release.at.getTime() <= now }
    })
    .filter(Boolean)
    .sort((a, b) => a.release.at - b.release.at)
}

/** Raporun şu andan sonraki `count` yayını. */
export const nextReleases = (report, now, count = 3) =>
  releasesOf(report)
    .filter((r) => r.end.getTime() > now)
    .slice(0, count)

const localDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** Anahtarın ("YYYY-AA-GG") öğlesi (UTC) — günü saat diliminden bağımsız yazmak için. */
export const keyNoonDate = (key) => new Date(`${key}T12:00:00Z`)

/**
 * Kişinin takvim günü farkı (0 bugün, 1 yarın …). Saatsiz yayında kaynağın tarihi kişinin
 * takvim günü sayılır (FAO "6 Kasım" her yerde 6 Kasım).
 */
export function dayGap(release, timed, now) {
  const [y, mo, d] = release.key.split("-").map(Number)
  const day = timed ? localDay(release.at) : new Date(y, mo - 1, d).getTime()
  return Math.round((day - localDay(new Date(now))) / DAY)
}

const pad = (n) => String(n).padStart(2, "0")
const nextKey = (key) => new Date(Date.parse(`${key}T12:00:00Z`) + DAY).toISOString().slice(0, 10)
const localStamp = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`

/**
 * Yayını takvime yazar: "boş" görünür (toplantı saatini kapatmaz), saatliyse 15 dk önce hatırlatır,
 * gövdede raporun adresi. `Calendars.ReadWrite` ilk yazmada sorulur (Odak bloğunun yolu).
 */
export async function addReleaseToCalendar(instance, account, { subject, release, timed, url }) {
  const zone = browserTimeZone()
  const body = {
    subject,
    showAs: "free",
    isReminderOn: timed,
    body: { contentType: "text", content: url },
    ...(timed
      ? {
          reminderMinutesBeforeStart: 15,
          start: { dateTime: localStamp(release.at), timeZone: zone },
          end: {
            dateTime: localStamp(new Date(release.at.getTime() + 30 * 60_000)),
            timeZone: zone,
          },
        }
      : {
          // Saatsiz yayın bir TAKVİM günüdür: kaynağın tarihi, kişinin saat dilimine çevrilmez.
          isAllDay: true,
          start: { dateTime: `${release.key}T00:00:00`, timeZone: zone },
          end: { dateTime: `${nextKey(release.key)}T00:00:00`, timeZone: zone },
        }),
  }
  const send = () =>
    graphPost(instance, account, { path: "/me/events", scopes: ["Calendars.ReadWrite"], body })
  const first = await send()
  if (first.status !== STATUS.denied || first.httpStatus) return first
  const granted = await requestGraphScopes(instance, account, ["Calendars.ReadWrite"])
  return granted ? send() : first
}
