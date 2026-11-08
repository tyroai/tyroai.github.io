import { OFFICE_CITIES } from "@/data/worldCities"
import { cityName, wallClock, zoneCityName } from "@/lib/worldClock"
import { ianaOf } from "@/lib/windowsZones"

/**
 * ORTAK SAAT (saf, testli) — seçilen kişilerin şimdiki durumu ve herkesin boş olduğu ilk yarım
 * saat. Kaynak Graph `getSchedule` (`Calendars.Read`, girişte var): kişi başına uygunluk dizisi
 * (yarım saatlik dilim başına bir rakam: 0 boş · 1 belki · 2 meşgul · 3 ofis dışı · 4 başka
 * yerde çalışıyor) ve mesai saatleri + saat dilimi. Ayrıntı: docs/features/widgetlar-ortak-saat.md.
 */

export const SLOT_MIN = 30
const SLOT_MS = SLOT_MIN * 60_000
/** Ortak boşluk bu kadar gün içinde aranır. */
export const DAYS = 5
export const MAX_PEOPLE = 6
// Boş sayılan: boş · başka yerde çalışıyor.
const FREE = new Set(["0", "4"])
const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

/** Yarım saat sınırına yuvarlanmış an (ms): sorgunun ve uygunluk dizisinin ilk dilimi. */
export const slotStart = (now) => Math.floor(now / SLOT_MS) * SLOT_MS

// "08:30:00.0000000" → 510 (dakika).
function minutesOf(value) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(value ?? ""))
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/**
 * getSchedule cevabı (`value`) → kişiler `{ address, tz, view, work, error }`: `view` uygunluk
 * dizisi, `work` mesai `{ days, from, to }` (dakika, kişinin saatiyle), `tz` IANA (bilinmiyorsa
 * null). Takvimi okunamayan kişide `error`.
 */
export function parseSchedules(value) {
  return (value ?? []).map((s) => {
    const wh = s.workingHours ?? null
    const from = minutesOf(wh?.startTime)
    const to = minutesOf(wh?.endTime)
    return {
      address: String(s.scheduleId ?? "").toLowerCase(),
      tz: ianaOf(wh?.timeZone?.name),
      view: typeof s.availabilityView === "string" ? s.availabilityView : "",
      work:
        wh && from != null && to != null && to > from
          ? { days: (wh.daysOfWeek ?? []).map((d) => String(d).toLowerCase()), from, to }
          : null,
      error: Boolean(s.error),
    }
  })
}

// Kişinin o andaki yerel takvim günü ve dakikası.
function local(p, at) {
  const w = wallClock(p.tz, new Date(at))
  return { day: DAY_NAMES[new Date(Date.UTC(w.y, w.mo - 1, w.d)).getUTCDay()], m: w.h * 60 + w.mi }
}

/** `[at, at + len)` kişinin mesaisinde mi; mesai ya da dilim bilinmiyorsa kısıt yok. */
function inWork(p, at, len = SLOT_MS) {
  if (!p.work || !p.tz) return true
  const l = local(p, at)
  return p.work.days.includes(l.day) && l.m >= p.work.from && l.m + len / 60_000 <= p.work.to
}

/**
 * Kişinin şimdiki durumu `{ state, until, wall }`: `off` ofis dışı/izinde · `busy` (+`until`:
 * boşalacağı an, görünümde yoksa null) · `free` · `night` (mesai dışı, yerel 22–07) · `after`
 * (mesai dışı) · `unknown` (takvim okunamadı). `wall` yerel duvar saati, `start` dizinin ilk dilimi.
 */
export function personNow(p, now, start) {
  const wall = p.tz ? wallClock(p.tz, new Date(now)) : null
  if (p.error || !p.view) return { state: "unknown", until: null, wall }
  const i = Math.max(0, Math.floor((now - start) / SLOT_MS))
  const c = p.view[i]
  if (c === "3") return { state: "off", until: null, wall }
  if (c === "1" || c === "2") {
    let j = i + 1
    while (j < p.view.length && !FREE.has(p.view[j])) j += 1
    return { state: "busy", until: j < p.view.length ? start + j * SLOT_MS : null, wall }
  }
  if (!inWork(p, now, 0))
    return { state: wall && (wall.h >= 22 || wall.h < 7) ? "night" : "after", until: null, wall }
  return { state: "free", until: null, wall }
}

/**
 * İlk ortak boşluk (ms) ya da null: herkes (`people`, sen dahil) `need` ardışık dilim boyunca boş
 * ve kendi mesaisinde. Yarısı geçmiş şimdiki dilim atlanır (`now`: kart açık kaldıkça kayar);
 * takvimi okunamayan kişi hesaba katılmaz (çağıran onu ayrıca söyler).
 */
export function commonSlot(people, start, need = 1, now = start) {
  const known = people.filter((p) => !p.error && p.view)
  if (!known.length) return null
  const len = Math.min(...known.map((p) => p.view.length))
  const first = Math.max(1, Math.ceil((now - start) / SLOT_MS))
  for (let i = first; i + need <= len; i += 1) {
    let ok = true
    for (let k = 0; k < need && ok; k += 1) {
      const at = start + (i + k) * SLOT_MS
      ok = known.every((p) => FREE.has(p.view[i + k]) && inWork(p, at))
    }
    if (ok) return start + i * SLOT_MS
  }
  return null
}

/**
 * Mesailer `DAYS` gün içinde hiç kesişiyor mu (takvimler boş sayılır): kesişmiyorsa "ortak boşluk
 * yok" yerine nedeni söylenir (ör. Chicago ile Dubai'nin mesaisi aynı saate düşmez).
 */
export function hoursOverlap(people, start, now = start) {
  const open = people
    .filter((p) => !p.error && p.view)
    .map((p) => ({ ...p, view: "0".repeat(p.view.length) }))
  return commonSlot(open, start, 1, now) != null
}

/** Kişinin şehri: aynı dilimdeki ofis şehri, yoksa IANA adının şehri. */
export function cityOfZone(tz, locale) {
  if (!tz) return null
  const office = OFFICE_CITIES.find((c) => c.tz === tz)
  return office ? cityName(office, locale) : zoneCityName(tz)
}

/** Outlook'ta yeni toplantı penceresi: saat ve davetliler dolu, konuyu ve gönderimi kişi yapar. */
export function composeUrl(at, to, minutes = SLOT_MIN) {
  const url = new URL("https://outlook.office.com/calendar/deeplink/compose")
  url.searchParams.set("startdt", new Date(at).toISOString())
  url.searchParams.set("enddt", new Date(at + minutes * 60_000).toISOString())
  url.searchParams.set("to", to.join(","))
  return url.toString()
}
