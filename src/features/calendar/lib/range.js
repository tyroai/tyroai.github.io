import { defaultCalendarRange } from "@/lib/calendarRange"
import { addDays, startOfDay } from "@/lib/leaveDays"

/**
 * Takvim sayfasının tarih aritmetiği (saf, testli). Her şey TAKVİM GÜNÜ üzerinden: `addDays` ve
 * `setDate` kullanılır, "+24 saat" asla — yaz saati geçişinde gün kaymaz. Haftanın ilk günü dile
 * göre (`lib/weekStart`), hafta numarası ISO 8601.
 */

/** Görünümler: gün · hafta (dar kapta 3 gün) · ay. */
export const VIEWS = ["day", "week", "month"]
export const GRID_DAYS = 42

/** Günün bulunduğu haftanın ilk günü (yerel gece yarısı). */
export function weekStartOf(date, firstDay = 1) {
  const d = startOfDay(date)
  return addDays(d, -((d.getDay() - firstDay + 7) % 7))
}

/**
 * ISO 8601 hafta numarası (Perşembe kuralı). Saatsiz, UTC alanlarıyla hesaplanır: saat dilimi
 * ve yaz saati sonucu değiştiremez.
 */
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  return Math.ceil(((d - yearStart) / 86_400_000 + 1) / 7)
}

/**
 * Görünen haftanın numarası: haftanın ORTA günündeki ISO numarası. Pazartesi başlayan haftada
 * Perşembe'ye, Pazar ya da Cumartesi başlayanda aynı ISO haftasındaki bir güne denk gelir —
 * "46. hafta · 8–14 Kas" dilden bağımsız tutarlı.
 */
export const weekNumber = (weekStart) => isoWeek(addDays(weekStart, 3))

/** Ayın 6 satırlık ızgarası: 42 gün, ayın 1'ini içeren haftanın ilk gününden başlar. */
export function monthGrid(anchor, firstDay = 1) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const start = weekStartOf(first, firstDay)
  return Array.from({ length: GRID_DAYS }, (_, i) => addDays(start, i))
}

/**
 * Görünümün günleri: gün → bir; hafta → 7 (ya da dar kapta `cols` = 3, çapadan başlayan üç gün);
 * ay → 42 günlük ızgara.
 */
export function visibleDays(view, anchor, firstDay = 1, cols = 7) {
  const day = startOfDay(anchor)
  if (view === "day") return [day]
  if (view === "month") return monthGrid(day, firstDay)
  if (cols < 7) return Array.from({ length: cols }, (_, i) => addDays(day, i))
  const start = weekStartOf(day, firstDay)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** Bir görünümün sınırı: `{ start, end }` — `end` DIŞLAYICI (son günün ertesi gece yarısı). */
export function rangeOf(view, anchor, firstDay = 1, cols = 7) {
  const days = visibleDays(view, anchor, firstDay, cols)
  return { start: days[0], end: addDays(days.at(-1), 1), days }
}

/**
 * "Özet"in dönemi: görünen gün · hafta · AY. Ay görünümünde 42 günlük ızgara değil ayın kendisi
 * (ızgaranın 16. günü hep o ayın içinde). `kind`: "day" · "week" (tam 7 gün) · "days" (dar kapta
 * üç gün) · "month"; `first`–`last` uçlar DAHİL (yerel gece yarısı).
 */
export function periodOf(view, days) {
  if (view === "month") {
    const mid = days[15]
    const first = new Date(mid.getFullYear(), mid.getMonth(), 1)
    return { kind: "month", first, last: new Date(mid.getFullYear(), mid.getMonth() + 1, 0) }
  }
  const kind = days.length === 1 ? "day" : days.length === 7 ? "week" : "days"
  return { kind, first: days[0], last: days.at(-1) }
}

/** Ay adımı: gün ayın son gününü aşarsa o ayın sonuna oturur (31 Ocak + 1 ay = 28 Şubat). */
export function addMonths(date, n) {
  const target = new Date(date.getFullYear(), date.getMonth() + n, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), last))
}

/** Önceki/sonraki dönem: gün ±1 · hafta ±7 (dar kapta ±`cols`) · ay ±1 ay. */
export function shiftAnchor(view, anchor, dir, cols = 7) {
  const day = startOfDay(anchor)
  if (view === "month") return addMonths(day, dir)
  if (view === "day") return addDays(day, dir)
  return addDays(day, dir * (cols < 7 ? cols : 7))
}

/**
 * Graph'tan çekilecek aralık: ÇAPANIN AYININ ızgarası — hafta ve gün görünümü de o aralığın içinde
 * kalır (bir ayın 6 satırı ayın bütün haftalarını kapsar), yani hafta gezerken yeniden istek
 * yok, yalnız ay değişince. Bu ay için header, çentik ve Anasayfa'nın ortak aralığı: aynı
 * önbellek anahtarı, ek Graph çağrısı yok (`lib/calendarRange`).
 */
export function fetchWindow(anchor, today, firstDay = 1) {
  const now = startOfDay(today)
  if (anchor.getFullYear() === now.getFullYear() && anchor.getMonth() === now.getMonth()) {
    const { rangeStart, rangeEnd } = defaultCalendarRange(now)
    return { start: rangeStart, end: rangeEnd }
  }
  const grid = monthGrid(anchor, firstDay)
  return { start: grid[0], end: addDays(grid.at(-1), 1) }
}

/** Anahtar karşılaştırması için tek biçim: "YYYY-MM-DD" (yerel, sıfır dolgulu). */
export { ymd as dayKey } from "@/lib/leaveDays"

/** Gün anahtarı → yerel gece yarısı (saat dilimi kayması yok). */
export { parseYmd as keyToDay } from "@/lib/leaveDays"

/** Günün dakikası (0–1439): DUVAR SAATİNDEN, milisaniye farkından değil — yaz saati günlerinde de tutar. */
export const minuteOf = (date) => date.getHours() * 60 + date.getMinutes()
