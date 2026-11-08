import { SLOT_MIN, parseSchedules } from "@/lib/commonTime"
import { STATUS, graphPost, requestGraphScopes } from "@/lib/graph"

/**
 * Yeni toplantının iki Graph çağrısı: kaydı yazmak ve katılımcıların müsaitliğini sormak. Ekran
 * ve kancalar yalnız buradan geçer (denemede bu dosya taklit edilir).
 */

/**
 * Takvime toplantıyı yazar (`Calendars.ReadWrite`, davetler Graph'tan gider). İzin oturumda yoksa
 * ilk yazmada bir kez sorulur (`createFocusBlock` ile aynı yol); sorulamazsa ya da verilmezse
 * `denied` döner. Dönen `{ status, data?, error? }`.
 */
export async function createMeeting(instance, account, body) {
  const scopes = ["Calendars.ReadWrite"]
  const send = () => graphPost(instance, account, { path: "/me/events", scopes, body })
  const first = await send()
  // HTTP 403 kalıcı ret; belirteç sorunu (httpStatus yok) tıklamadan istenebilir.
  if (first.status !== STATUS.denied || first.httpStatus) return first
  return (await requestGraphScopes(instance, account, scopes)) ? send() : first
}

// Graph'ın saat dilimsiz biçimi: "2026-10-26T10:00:00" (dilim ayrı alanda, UTC).
const utc = (ms) => ({ dateTime: new Date(ms).toISOString().slice(0, 19), timeZone: "UTC" })

/**
 * Adreslerin (ilki sen) `[from, to)` aralığındaki uygunluğu: `getSchedule`, 30 dakikalık dilimler.
 * `{ status: "ready", schedules }` (`parseSchedules` biçimi) ya da `{ status: "denied" | "error" }`.
 */
export async function fetchSchedules(instance, account, { addresses, from, to }) {
  const res = await graphPost(instance, account, {
    path: "/me/calendar/getSchedule",
    scopes: ["Calendars.Read"],
    body: {
      schedules: addresses,
      startTime: utc(from),
      endTime: utc(to),
      availabilityViewInterval: SLOT_MIN,
    },
  })
  if (res.status === STATUS.ready) {
    return { status: "ready", schedules: parseSchedules(res.data?.value) }
  }
  return { status: res.status === STATUS.denied ? "denied" : "error" }
}
