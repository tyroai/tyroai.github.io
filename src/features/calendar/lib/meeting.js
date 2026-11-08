import { SLOT_MIN, commonSlot } from "@/lib/commonTime"
import { addDays, startOfDay } from "@/lib/leaveDays"
import { attendeeType, isOptional } from "./attendeeKinds"
import { dayKey, keyToDay } from "./range"

/**
 * Yeni toplantının saf mantığı (testli): varsayılan zaman, saat aritmetiği, doğrulama, Graph
 * gövdesi ve katılımcıların müsaitliği. İstekler `meetingApi.js`te, ekran
 * `features/calendar/meeting/`te.
 */

/** Süre çipleri (dakika) ve varsayılan süre. */
export const DURATIONS = [15, 30, 45, 60]
export const DEFAULT_MINUTES = 30
/** Müsaitlik bu kadar gün ileriye bakılır (ortak boşluk bunun içinde aranır). */
export const SCHEDULE_DAYS = 5

const SLOT_MS = SLOT_MIN * 60_000
const pad = (n) => String(n).padStart(2, "0")
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Yeni toplantının zamanı: gün ve (varsa) saat dakikası. Saat verilmediyse bugünse bir sonraki
 * yarım saat, başka günse 09:00. Süre `minutes`. Gün sınırı takvim günüyle, bitiş duvar saatiyle.
 */
export function meetingSlot(
  day,
  { minute = null, now = new Date(), minutes = DEFAULT_MINUTES } = {},
) {
  let from = minute
  if (from == null) {
    const today = dayKey(now) === dayKey(day)
    const next = Math.ceil((now.getHours() * 60 + now.getMinutes() + 1) / 30) * 30
    from = today ? Math.min(next, 23 * 60) : 9 * 60
  }
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, from)
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, from + minutes)
  return { start, end }
}

/** "HH:mm" → günün dakikası (0–1439); geçersizse null. */
export function toMinutes(hm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hm ?? "").trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  return h > 23 || min > 59 ? null : h * 60 + min
}

/** Günün dakikası → "HH:mm"; günün sonunda (23:59) kırpılır. */
export function toClock(minutes) {
  const m = Math.min(1439, Math.max(0, Math.round(minutes)))
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

/** Tarih ("YYYY-AA-GG") ve saat ("SS:dd") → yerel an; geçersizse null. */
export function wallTime(date, hm) {
  const minutes = toMinutes(hm)
  if (!DATE_RE.test(String(date)) || minutes == null) return null
  const day = keyToDay(date)
  if (dayKey(day) !== date) return null
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes)
}

/** Bitiş saatini başlangıçtan `minutes` sonraya koyar (gün sonunda kırpılır). */
export const endAfter = (from, minutes) => toClock((toMinutes(from) ?? 0) + minutes)

/** Başlangıç ile bitiş arasındaki dakika; geçersiz ya da ters aralıkta null. */
export function minutesBetween(from, to) {
  const a = toMinutes(from)
  const b = toMinutes(to)
  return a == null || b == null || b <= a ? null : b - a
}

/** Başlangıç kayınca bitiş süreyi koruyarak kayar (Outlook gibi); aralık geçersizse yerinde. */
export function shiftEnd(from, to, nextFrom) {
  const length = minutesBetween(from, to)
  const next = toMinutes(nextFrom)
  return length == null || next == null ? to : toClock(next + length)
}

/**
 * Formun tarih ve saat alanları: gün, (varsa) saat dakikası ve süre. Yeni toplantının ilk değerleri
 * ve takvim Anlat'ının önizlemesi aynı hesabı kullanır. Gece yarısını aşan bitiş günün sonuna kırpılır.
 */
export function meetingTimes(
  day,
  { minute = null, now = new Date(), minutes = DEFAULT_MINUTES } = {},
) {
  const { start, end } = meetingSlot(day, { minute, now, minutes })
  const clock = (d) => toClock(d.getHours() * 60 + d.getMinutes())
  return {
    date: dayKey(start),
    from: clock(start),
    to: dayKey(end) === dayKey(start) ? clock(end) : "23:59",
  }
}

// Anlat'ın önceden doldurabildiği alanlar (`target.initial`): öteki alanlar varsayılanda kalır.
const PREFILL = ["title", "date", "from", "to", "teams", "where"]

/**
 * Formun ilk değerleri: tıklanan gün ve saat, 30 dakika, Teams açık. `target.initial` (takvim
 * Anlat'ı: `title`, `date`, `from`, `to`, `teams`, `where`) varsa yalnız verilen alanlar onunla
 * değişir; yoksa varsayılanlar aynen kalır.
 */
export function initialMeeting(target, now = new Date()) {
  const base = {
    title: "",
    ...meetingTimes(target.day, { minute: target.minute, now }),
    people: [],
    draft: "",
    teams: true,
    where: "",
    note: "",
  }
  for (const key of PREFILL) if (target.initial?.[key] != null) base[key] = target.initial[key]
  return base
}

// Yazılmış ama listeden seçilmemiş ad (e-posta değilse) "pick".
const unpicked = (text) => {
  const typed = String(text ?? "").trim()
  return typed && !EMAIL_RE.test(typed) ? "pick" : null
}

/**
 * Doğrulama: `title` boşsa "need", `time` geçersizse "order" (bitiş başlangıçtan sonra olmalı), yazılmış
 * ama listeden seçilmemiş ad varsa `draft` (zorunlu kutusu) ya da `draftOptional` (isteğe bağlı kutusu;
 * alan yazılınca oluşur). Hepsi null ise gönderilebilir.
 */
export function meetingErrors(v) {
  return {
    title: v.title.trim() ? null : "need",
    time: wallTime(v.date, v.from) && minutesBetween(v.from, v.to) ? null : "order",
    draft: unpicked(v.draft),
    draftOptional: unpicked(v.draftOptional),
  }
}

/**
 * Yazılı bir e-posta adresi bekleyen katılımcıya çevrilir (seçilmeden bırakılan adres kaybolmasın);
 * `optional`: isteğe bağlı kutusundaki yazı.
 */
export function withDraft(people, draft, optional = false) {
  const text = String(draft ?? "").trim()
  const known = people.some((p) => p.address.toLowerCase() === text.toLowerCase())
  if (!EMAIL_RE.test(text) || known) return people
  return [
    ...people,
    optional ? { name: text, address: text, optional: true } : { name: text, address: text },
  ]
}

// Gönderilecek katılımcılar: seçilenler ve e-posta olarak yazılıp seçilmemiş iki kutunun yazısı.
const attendeesOf = (v) => withDraft(withDraft(v.people, v.draft), v.draftOptional, true)

const localIso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`

/**
 * Aynı içerikle yeniden denemede aynı kimlik (Graph yinelenen kaydı yaratmaz: ağ zaman aşımında
 * istek sunucuya ulaşmış olabilir), içerik değişince yeni kimlik. `seed`: pencere açılışına özgü.
 */
export function transactionId(seed, v) {
  // Kişiler adres ve türüyle: yazılı adres çipe dönüşse de aynı içerik aynı kimliği alır.
  const who = attendeesOf(v).map((p) => [p.address.toLowerCase(), attendeeType(p)])
  const text = JSON.stringify([v.title, v.date, v.from, v.to, who, v.teams, v.where, v.note])
  let h = 5381
  for (const ch of text) h = ((h * 33) ^ ch.codePointAt(0)) >>> 0
  return `${seed}-${h.toString(36)}`
}

/**
 * Graph `POST /me/events` gövdesi: konu, tarayıcının saat diliminde duvar saati, katılımcılar
 * (`required` ya da `optional`), Teams toplantısı, konum ve not (boşlar hiç gönderilmez).
 */
export function meetingPayload(v, zone, txId) {
  const body = {
    subject: v.title.trim(),
    start: { dateTime: localIso(wallTime(v.date, v.from)), timeZone: zone },
    end: { dateTime: localIso(wallTime(v.date, v.to)), timeZone: zone },
    attendees: attendeesOf(v)
      .filter((p) => p.address)
      .map((p) => ({
        emailAddress: { address: p.address, name: p.name || p.address },
        type: attendeeType(p),
      })),
  }
  if (v.teams) {
    body.isOnlineMeeting = true
    body.onlineMeetingProvider = "teamsForBusiness"
  }
  if (v.where.trim()) body.location = { displayName: v.where.trim() }
  if (v.note.trim()) body.body = { contentType: "text", content: v.note.trim() }
  if (txId) body.transactionId = txId
  return body
}

/** Müsaitlik penceresi: seçilen günün gece yarısından `SCHEDULE_DAYS` gün (ms). */
export function scheduleWindow(date) {
  const from = startOfDay(keyToDay(date))
  return { from: from.getTime(), to: addDays(from, SCHEDULE_DAYS).getTime() }
}

/**
 * Kişinin `[startMs, endMs)` aralığındaki durumu: "free" · "busy" (meşgul ya da belki) · "oof"
 * (ofis dışı) · "unknown" (takvimi okunamadı ya da aralık pencerenin dışında). `p`:
 * `commonTime.parseSchedules` kaydı, `from` pencerenin başı (ms).
 */
export function statusAt(p, from, startMs, endMs) {
  if (!p || p.error || !p.view) return "unknown"
  const a = Math.floor((startMs - from) / SLOT_MS)
  const b = Math.ceil((endMs - from) / SLOT_MS)
  if (a < 0 || b > p.view.length) return "unknown"
  const cells = p.view.slice(a, b)
  if (cells.includes("3")) return "oof"
  return /[12]/.test(cells) ? "busy" : "free"
}

/**
 * Verilen takvimlerin (çağıran zorunlu olanları süzer) hepsinin boş ve kendi mesaisinde olduğu ilk
 * an (ms) ya da null; `after`'dan itibaren.
 */
export function firstCommon(schedules, from, after, minutes) {
  const need = Math.max(1, Math.ceil(minutes / SLOT_MIN))
  return commonSlot(schedules, from, need, after - 1)
}

const lower = (s) => String(s ?? "").toLowerCase()

/**
 * Seçilen aralıkta herkesin (sen dahil, isteğe bağlılar da) durumu ve ilk ortak boşluk. `sched`:
 * `{ schedules, from }` (`fetchSchedules` cevabı ve pencerenin başı), `me` kendi adresin. Dönen:
 * `states` (adres → durum), `busy` (meşgul ya da ofis dışı, isteğe bağlılar dahil), `unknown`
 * (adres listeleri), `blocking` (`busy`nin zorunlu olanları: sen dahil), `next` (zorunlu biri
 * meşgulse ilk ortak boşluk, ms; yalnız zorunlular ve sen aranır, isteğe bağlılar engel olmaz;
 * `now`dan önceye önerilmez; yoksa null).
 */
export function availabilityOf(sched, people, me, { start, end, minutes, now }) {
  const byAddress = new Map(sched.schedules.map((s) => [s.address, s]))
  const addresses = [...new Set([lower(me), ...people.map((p) => lower(p.address))])].filter(
    Boolean,
  )
  // Düzenleyen (sen) hiçbir zaman isteğe bağlı sayılmaz.
  const optional = new Set(people.filter(isOptional).map((p) => lower(p.address)))
  optional.delete(lower(me))
  const states = Object.fromEntries(
    addresses.map((a) => [a, statusAt(byAddress.get(a), sched.from, start, end)]),
  )
  const busy = addresses.filter((a) => states[a] === "busy" || states[a] === "oof")
  const unknown = addresses.filter((a) => states[a] === "unknown")
  const blocking = busy.filter((a) => !optional.has(a))
  const next = blocking.length
    ? firstCommon(
        sched.schedules.filter((s) => !optional.has(s.address)),
        sched.from,
        Math.max(start, now),
        minutes,
      )
    : null
  return { states, busy, unknown, blocking, next }
}
