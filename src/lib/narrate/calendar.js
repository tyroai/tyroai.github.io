import { addDays, dayInfo } from "@/lib/leaveDays"

/**
 * Anlat'ın takvim yardımcıları (saf): ay adları (Türkçe yumuşamasıyla: "aralığın" → "aralig",
 * "ocağa" → "ocag"), gün adları, iş günü, ayın haftaları. Tarihler gün başında (saat yok).
 */

const MONTH_ROOTS = [
  ["ocak", "ocag"],
  ["subat"],
  ["mart"],
  ["nisan"],
  ["mayis"],
  ["haziran"],
  ["temmuz"],
  ["agustos"],
  ["eylul"],
  ["ekim"],
  ["kasim"],
  ["aralik", "aralig"],
]
const SHORT = ["oca", "sub", "mar", "nis", "may", "haz", "tem", "agu", "eyl", "eki", "kas", "ara"]
/** Ay adı kalıbı (tek yakalama grubu): tam ad (ekli) ya da üç harflik kısaltma. */
export const MONTH = `((?:${MONTH_ROOTS.flat().join("|")})[a-z]*|(?:${SHORT.join("|")})\\b)`

/** Ay kelimesinin sırası (0–11) ya da -1. */
export function monthOf(word) {
  const at = MONTH_ROOTS.findIndex((roots) => roots.some((r) => word.startsWith(r)))
  return at >= 0 ? at : SHORT.indexOf(word)
}

/** Gün adları; uzun ad önce ("cumartesi" "cuma"dan, "pazartesi" "pazar"dan önce denensin). */
export const DAYS = ["pazartesi", "sali", "carsamba", "persembe", "cumartesi", "cuma", "pazar"]
const DAY_INDEX = {
  pazar: 0,
  pazartesi: 1,
  sali: 2,
  carsamba: 3,
  persembe: 4,
  cuma: 5,
  cumartesi: 6,
}

/**
 * Haftanın günü: "next" en yakın gelecek (bugün değil) · "nextWeek" gelecek haftanınki · "past"
 * en yakın geçmiş (bugünse bugün; masraf) · "pastStrict" en yakın geçmiş, bugün değil ("geçen
 * cuma") · "lastWeek" geçen haftanınki ("geçen hafta cuma").
 */
export function weekday(name, mode, today) {
  const target = DAY_INDEX[name]
  const dow = today.getDay()
  const monday = addDays(today, -((dow + 6) % 7))
  if (mode === "nextWeek") return addDays(monday, 7 + ((target + 6) % 7))
  if (mode === "lastWeek") return addDays(monday, -7 + ((target + 6) % 7))
  if (mode === "past") return addDays(today, -((dow - target + 7) % 7))
  if (mode === "pastStrict") return addDays(today, -((dow - target + 7) % 7 || 7))
  return addDays(today, (target - dow + 7) % 7 || 7)
}

/** Gün/ay(/yıl) → tarih. Yılsızsa: gelecek (izin) ya da geçmiş (`past`, masraf) en yakını. */
export function dayMonth(day, month, year, today, past = false) {
  const d = Number(day)
  if (month < 0 || month > 11 || d < 1 || d > 31) return null
  const y = year ? Number(year.length === 2 ? `20${year}` : year) : today.getFullYear()
  const date = new Date(y, month, d)
  if (date.getMonth() !== month) return null
  if (year) return date
  if (past) return date > today ? new Date(y - 1, month, d) : date
  return date < today ? new Date(y + 1, month, d) : date
}

/** Ayın günü ("ayın 20'si"): izinde bugün ya da sonrası, masrafta bugün ya da öncesi. */
export function dayOfMonth(day, today, past = false) {
  const d = Number(day)
  if (d < 1 || d > 31) return null
  const shift = past ? (d > today.getDate() ? -1 : 0) : d < today.getDate() ? 1 : 0
  const date = new Date(today.getFullYear(), today.getMonth() + shift, d)
  return date.getDate() === d ? date : null
}

export const isWorkday = (d) => dayInfo(d).weight > 0

/** `d` ya da sonraki ilk iş günü. */
export function nextWorkday(d) {
  let x = d
  for (let i = 0; i < 14 && !isWorkday(x); i++) x = addDays(x, 1)
  return x
}

/** `end`de biten `n` iş günlük aralığın ilk günü ("bayramdan önce 2 gün"). */
export function backWorkdays(end, n) {
  let d = end
  let count = 0
  for (let i = 0; i < 120; i++) {
    if (isWorkday(d) && ++count >= n) return d
    d = addDays(d, -1)
  }
  return d
}

/** `start`tan başlayıp `n` iş günü süren aralığın son günü (tatil ve hafta sonu sayılmaz). */
export function addWorkdays(start, n) {
  let d = start
  let count = 0
  for (let i = 0; i < 120; i++) {
    if (isWorkday(d) && ++count >= n) return d
    d = addDays(d, 1)
  }
  return d
}

/** `b`, `a`dan sonra ve arada (uçlar hariç) iş günü yok mu: "yarın ve öbür gün" aralık sayılır. */
export function adjacent(a, b) {
  if (b <= a) return false
  for (let d = addDays(a, 1); d < b; d = addDays(d, 1)) if (isWorkday(d)) return false
  return true
}

/**
 * Ayın bir haftası (pazartesi–cuma, iş günleriyle): 1–4 sıra, "last" son, "mid" ortası (15'ini
 * taşıyan hafta; 15'i hafta sonuysa sonraki), "all" bütün ay. Üç iş gününden kısa ilk ya da son
 * hafta yerine komşu tam hafta alınır ("aralık son hafta" yılbaşı haftası tek gün kalmasın).
 */
export function monthPart(year, month, which) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  if (which === "all") return { start: first, end: last }
  const weeks = []
  let key = null
  for (let d = first; d <= last; d = addDays(d, 1)) {
    if (!isWorkday(d)) continue
    const monday = addDays(d, -((d.getDay() + 6) % 7)).getTime()
    if (monday !== key) weeks.push([])
    key = monday
    weeks.at(-1).push(d)
  }
  if (!weeks.length) return null
  let week
  if (which === "last")
    week = weeks.at(-1).length < 3 && weeks.length > 1 ? weeks.at(-2) : weeks.at(-1)
  else if (which === "mid") {
    const mid = new Date(year, month, 15)
    week = weeks.find((w) => w.at(-1) >= mid) ?? weeks.at(-1)
  } else {
    const skip = weeks[0].length < 3 ? 1 : 0
    week = weeks[Math.min(which - 1 + skip, weeks.length - 1)]
  }
  return { start: week[0], end: week.at(-1) }
}
