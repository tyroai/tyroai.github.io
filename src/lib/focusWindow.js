import { STATUS, browserTimeZone, graphDelete, graphPost, requestGraphScopes } from "@/lib/graph"
import { setClock, WORK_HOURS } from "@/lib/workHours"

/**
 * Odak penceresi — mesai içinde (08:00–17:30) toplantısız boşluklar ve tek
 * tıkla takvime "Odak zamanı" bloğu. Hesap saf (`freeWindows`, testli);
 * yazma `Calendars.ReadWrite` ile (izin zaten var; ilk yazmada sorulabilir).
 */

const STEP = 15 * 60_000

/** Günün mesai sınırları (`from`–`to` saat). */
export function workday(day, from = WORK_HOURS.from, to = WORK_HOURS.to) {
  return { start: setClock(new Date(day), from), end: setClock(new Date(day), to) }
}

// Mesaiyi dolduran kendi toplantıların (reddedilen, tüm gün ve başkasınınki sayılmaz), sıralı.
function busySpans(events, start, end) {
  return (events ?? [])
    .filter(
      (e) =>
        !e.owner && !e.isAllDay && e.myResponse !== "declined" && e.start < end && e.end > start,
    )
    .map((e) => [
      Math.max(e.start.getTime(), start.getTime()),
      Math.min(e.end.getTime(), end.getTime()),
    ])
    .sort((a, b) => a[0] - b[0])
}

/** Mesaideki meşgul aralıklar, örtüşenler birleşik: `[{ start, end }]` (gün şeridi). */
export function busyBlocks(events, day, { from = WORK_HOURS.from, to = WORK_HOURS.to } = {}) {
  const { start, end } = workday(day, from, to)
  const out = []
  for (const [s, e] of busySpans(events, start, end)) {
    const last = out[out.length - 1]
    if (last && s <= last[1]) last[1] = Math.max(last[1], e)
    else out.push([s, e])
  }
  return out.map(([s, e]) => ({ start: new Date(s), end: new Date(e) }))
}

/** Bir günün boş pencereleri: `[{ start, end, minutes }]`, en az `min` dakika. */
export function freeWindows(
  events,
  day,
  now,
  { from = WORK_HOURS.from, to = WORK_HOURS.to, min = 60 } = {},
) {
  const { start, end } = workday(day, from, to)
  // Bugünse şimdiden sonrası, çeyrek saate yuvarlanmış.
  const nowMs = typeof now === "number" ? now : now?.getTime?.()
  const floor = nowMs && nowMs > start.getTime() ? Math.ceil(nowMs / STEP) * STEP : start.getTime()
  const busy = busySpans(events, start, end)
  const out = []
  let cursor = floor
  for (const [s, e] of busy) {
    if (s - cursor >= min * 60_000) out.push([cursor, s])
    cursor = Math.max(cursor, e)
  }
  if (end.getTime() - cursor >= min * 60_000) out.push([cursor, end.getTime()])
  return out.map(([s, e]) => ({
    start: new Date(s),
    end: new Date(e),
    minutes: Math.round((e - s) / 60_000),
  }))
}

const pad = (n) => String(n).padStart(2, "0")
const local = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`

/** Takvime "meşgul" görünen bir odak bloğu yazar. */
export async function createFocusBlock(instance, account, { start, end, subject }) {
  const zone = browserTimeZone()
  const send = () =>
    graphPost(instance, account, {
      path: "/me/events",
      scopes: ["Calendars.ReadWrite"],
      body: {
        subject,
        start: { dateTime: local(start), timeZone: zone },
        end: { dateTime: local(end), timeZone: zone },
        showAs: "busy",
        isReminderOn: false,
        sensitivity: "private",
      },
    })
  const first = await send()
  if (first.status !== STATUS.denied || first.httpStatus) return first
  const granted = await requestGraphScopes(instance, account, ["Calendars.ReadWrite"])
  return granted ? send() : first
}

/** Odak bloğunu geri alır (bildirimin "Geri al"ı): `createFocusBlock`un döndürdüğü kimlikle. */
export function deleteFocusBlock(instance, account, id) {
  return graphDelete(instance, account, {
    path: `/me/events/${encodeURIComponent(id)}`,
    scopes: ["Calendars.ReadWrite"],
  })
}
