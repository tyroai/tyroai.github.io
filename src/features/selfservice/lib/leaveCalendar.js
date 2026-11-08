import { addDays, sameDay, startOfDay } from "@/lib/leaveDays"

/**
 * İzin formunun satır içi aralık takvimi — saf kurallar: ay ızgarası, iki dokunuşla seçim,
 * Shift+ok ile genişletme, klavye hedefi ve görünür ay. Bileşen `leave/RangeCalendar.jsx`.
 */

export const monthStart = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
/** Ay sırası (yıl × 12 + ay): iki ayı karşılaştırmak için. */
export const monthIndex = (d) => d.getFullYear() * 12 + d.getMonth()

/** `n` ay öteye; gün ayın sonuna kırpılır (31 Mart → 28/29 Şubat). */
export function addMonths(d, n) {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate()
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last))
}

/** Ayın hücreleri: haftanın ilk gününe göre baştaki ve sondaki boşluklar `null`; 7'nin katı. */
export function monthCells(month, firstDay = 1) {
  const y = month.getFullYear()
  const m = month.getMonth()
  const lead = (new Date(y, m, 1).getDay() - firstDay + 7) % 7
  const count = new Date(y, m + 1, 0).getDate()
  const cells = Array.from({ length: lead }, () => null)
  for (let i = 1; i <= count; i++) cells.push(new Date(y, m, i))
  while (cells.length % 7) cells.push(null)
  return cells
}

/**
 * Bir güne dokunuldu. `active`: sıradaki uç. Başlangıç seçilince sıra bitişe geçer; başlangıçtan
 * önceki gün yeni başlangıç olur (hata yok); aynı gün iki kez tek günlük izin; bitişten sonraki
 * güne başlangıç seçmek yeni aralık açar. Dönüş `{ start, end, active }`.
 */
export function pickDay({ start, end, active }, day) {
  const d = startOfDay(day)
  if (active === "end" && start) {
    if (d < start) return { start: d, end: end ?? null, active: "end" }
    return { start, end: d, active: "start" }
  }
  if (end && d > end) return { start: d, end: null, active: "end" }
  return { start: d, end: end ?? null, active: "end" }
}

/**
 * Shift+ok: odaktaki günden (`from`) yeni güne (`to`) aralığı uzatır ya da kısaltır. Odak
 * başlangıçtaysa bitiş sabit kalır, değilse başlangıç; seçim yoksa odaktaki gün başlangıçtır.
 */
export function shiftRange({ start, end }, from, to) {
  const f = startOfDay(from)
  const n = startOfDay(to)
  let anchor = start ?? f
  if (start && end && sameDay(f, start) && !sameDay(start, end)) anchor = end
  return anchor <= n ? { start: anchor, end: n } : { start: n, end: anchor }
}

/**
 * Takvim tuşunun hedef günü: oklar gün/hafta, PageUp/PageDown ay, Home/End haftanın başı/sonu
 * (`firstDay`: dilin hafta başı). Takvimin tuşu değilse null.
 */
export function keyTarget(key, day, firstDay = 1) {
  const lead = (day.getDay() - firstDay + 7) % 7
  const moves = {
    ArrowLeft: () => addDays(day, -1),
    ArrowRight: () => addDays(day, 1),
    ArrowUp: () => addDays(day, -7),
    ArrowDown: () => addDays(day, 7),
    PageUp: () => addMonths(day, -1),
    PageDown: () => addMonths(day, 1),
    Home: () => addDays(day, -lead),
    End: () => addDays(day, 6 - lead),
  }
  return moves[key]?.() ?? null
}

/** Gün görünsün diye ilk ay: zaten görünüyorsa aynı, değilse gün ilk ya da son ayda. */
export function showMonth(first, months, day) {
  const at = monthIndex(day)
  const from = monthIndex(first)
  if (at < from) return monthStart(day)
  if (at > from + months - 1) return monthStart(addMonths(monthStart(day), -(months - 1)))
  return first
}

/**
 * Fareyle üstüne gelinen günün ön izlemesi: sıra bitişteyken başlangıçtan o güne aralık
 * (`{ start, end }`); gün başlangıçtan önceyse ön izleme yok (tıklanırsa yeni başlangıç olur).
 */
export function previewRange({ start, active }, hover) {
  if (!hover || !start || active !== "end") return null
  const h = startOfDay(hover)
  return h < start ? null : { start, end: h }
}
