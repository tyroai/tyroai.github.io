import { addDays, startOfDay } from "@/lib/leaveDays"
import {
  DAYS,
  MONTH,
  addWorkdays,
  adjacent,
  backWorkdays,
  dayMonth,
  monthOf,
  nextWorkday,
  weekday,
} from "./calendar"
import { readHolidays } from "./holidayDates"
import { readPeriods } from "./periods"
import { mask } from "./text"

/**
 * Anlat'ın tarih okuyucusu (saf; katlanmış yazı, `text.fold`, sayılar rakamla `numbers.js`).
 * Okunanlar: bugün · yarın · öbür gün (masrafta dün · önceki gün); gün adları (izinde en yakın
 * gelecek, masrafta en yakın geçmiş; "haftaya salı", "geçen pazartesi"); "bu hafta", "gelecek
 * hafta"; "3 kasım", "3-5 kasım", "28 ekimden 3 kasıma", "3.11", "3.11.2026"; ay içi dönemler
 * (`periods.js`: "aralık ilk hafta", "kasım sonu", "tüm aralık", "ayın 20'si", "20-24 arası");
 * tatiller (`holidayDates.js`: "bayram sonrası", "29 ekim köprüsü", "yılbaşı haftası"); süre "3
 * gün" / "iki hafta" (iş günü), "1 ay". Tarihin yanındaki gün adı ("2 kasım pazartesi") ayrı
 * tarih değildir. Tek tarihten sonra "kadar": yarından o güne. Birden çok tarihte: "itibaren"li
 * olan çapadır, yazılan aralık tek günden ve tatil adından önce gelir; iki tarih "ve"/virgülle
 * ayrıysa ayrı günlerdir (`apart`) — arada iş günü yoksa yine aralık ("yarın ve öbür gün", "cuma ve
 * pazartesi"). `past` (masraf): yılsız tarih ve gün adı geçmişe bakar. Kelime içindeki adlar tarih
 * değildir ("Kahve Dünyası", "Salim", "pazarlama").
 */

const NEXT = "haftaya|gelecek hafta(?:nin)?|onumuzdeki hafta(?:nin)?|onumuzdeki|gelecek"
const LAST = "gecen hafta(?:nin)?|gecen"
// Gün ve "dün/yarın" kelimelerinin ekleri: yalnız bunlar ("salıya", "dünkü"; "Salim", "dünya" değil).
const DAY_SUFFIX = "(ya|ye|yi|a|e|i|si|dan|den|da|de|ki|nin|in|leri|lari)?"
const REL_SUFFIX = "(?:ku|ki|den|dan|nden|ndan|e|a|de|da|nde|nda)?"
// Gün.ay(.yıl): "3.11", "3/11/2026".
const D = "(\\d{1,2})[./](\\d{1,2})(?:[./](\\d{2,4}))?"
// Para birimiyle biten sayı ("7.5 TL") gün.ay değildir.
const NOT_MONEY = "(?![.,]?\\d)(?!\\s*(?:tl|try|lira|eur|euro|avro|usd|dolar|gbp|sterlin|[€$£₺]))"

export function readDates(folded, todayIn, { numeric = true, past = false } = {}) {
  const today = startOfDay(todayIn)
  let s = folded
  const found = []
  const spans = []
  const take = (re, read) => {
    for (const m of [...s.matchAll(re)]) {
      const got = read(m)
      if (!got) continue
      found.push({ from: m.index, to: m.index + m[0].length, ...got })
      spans.push([m.index, m.index + m[0].length])
      s = mask(s, m.index, m.index + m[0].length)
    }
  }
  const dm = (d, mon, y) => dayMonth(d, mon, y, today, past)
  // Aynı yer iki kez okunmasın: uzun kalıplar önce.
  take(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, (m) => {
    const a = dm(m[3], Number(m[2]) - 1, m[1])
    return a ? { start: a } : null
  })
  readHolidays(take, today, { past })
  take(
    new RegExp(
      `\\b(\\d{1,2}) ?${MONTH} ?(\\d{4})? ?(?:-|ile|ila)? ?(\\d{1,2}) ?${MONTH} ?(\\d{4})?`,
      "g",
    ),
    (m) => {
      const a = dm(m[1], monthOf(m[2]), m[3])
      let b = dm(m[4], monthOf(m[5]), m[6] ?? m[3])
      if (!a || !b) return null
      if (b < a) b = new Date(b.getFullYear() + 1, b.getMonth(), b.getDate())
      return { start: a, end: b, range: true }
    },
  )
  take(new RegExp(`\\b(\\d{1,2}) ?(?:-|ile|ila) ?(\\d{1,2}) ?${MONTH}(?: (\\d{4}))?`, "g"), (m) => {
    const a = dm(m[1], monthOf(m[3]), m[4])
    const b = dm(m[2], monthOf(m[3]), m[4])
    return a && b && b >= a ? { start: a, end: b, range: true } : null
  })
  // "3 ve 4 kasım", "3, 4 ve 5 kasım": bitişikse aralık, değilse ilki (ayrı günler).
  take(
    new RegExp(`\\b(\\d{1,2})((?:\\s*(?:,|ve)\\s*\\d{1,2})+)\\s*${MONTH}(?:\\s+(\\d{4}))?`, "g"),
    (m) => {
      const list = [m[1], ...m[2].match(/\d{1,2}/g)].map((d) => dm(d, monthOf(m[3]), m[4]))
      if (list.some((d) => !d)) return null
      const chain = list.every((d, i) => !i || adjacent(list[i - 1], d))
      return chain
        ? { start: list[0], end: list.at(-1), range: true }
        : { start: list[0], apart: true }
    },
  )
  readPeriods(take, today, { past })
  if (numeric) {
    take(new RegExp(`(?<![€$£₺]\\s?)\\b${D} ?(?:-|ile|ila) ?${D}\\b${NOT_MONEY}`, "g"), (m) => {
      const a = dm(m[1], Number(m[2]) - 1, m[3])
      const b = dm(m[4], Number(m[5]) - 1, m[6] ?? m[3])
      return a && b && b >= a ? { start: a, end: b, range: true } : null
    })
  }
  take(new RegExp(`\\b(\\d{1,2}) ?${MONTH}(?: (\\d{4}))?`, "g"), (m) => {
    const a = dm(m[1], monthOf(m[2]), m[3])
    return a ? { start: a } : null
  })
  if (numeric) {
    take(new RegExp(`(?<![€$£₺]\\s?)\\b${D}\\b${NOT_MONEY}`, "g"), (m) => {
      const a = dm(m[1], Number(m[2]) - 1, m[3])
      return a ? { start: a } : null
    })
  }
  take(
    new RegExp(
      `\\b(bugun|yarin|obur gun|ertesi gun|dun|evvelsi gun|onceki gun)${REL_SUFFIX}\\b`,
      "g",
    ),
    (m) => {
      const n = { bugun: 0, yarin: 1, "obur gun": 2, "ertesi gun": 2, dun: -1 }[m[1]] ?? -2
      return { start: addDays(today, n) }
    },
  )
  take(new RegExp(`\\b(?:(${NEXT}|${LAST}|bu) )?(${DAYS.join("|")})${DAY_SUFFIX}\\b`, "g"), (m) => {
    const p = m[1] ?? ""
    // "pazardan/pazarda/pazarı" çoğunlukla çarşı: ancak "itibaren", "kadar" gibi bir bağla gün.
    if (
      m[2] === "pazar" &&
      /^(dan|da|i)$/.test(m[3] ?? "") &&
      !p &&
      !/^\s+(?:itibaren|baslayarak|sonra|kadar|gunu|aksam|sabah)/.test(
        s.slice(m.index + m[0].length),
      )
    )
      return null
    const mode = p.startsWith("gecen hafta")
      ? "lastWeek"
      : p === "gecen"
        ? "pastStrict"
        : p && p !== "bu"
          ? "nextWeek"
          : past
            ? "past"
            : "next"
    return { start: weekday(m[2], mode, today), weekday: true }
  })
  take(/\b(bu hafta|haftaya|gelecek hafta|onumuzdeki hafta|gecen hafta)[a-z]*/g, (m) => {
    const mode = m[1] === "gecen hafta" ? "lastWeek" : m[1] === "bu hafta" ? "this" : "nextWeek"
    let monday = weekday("pazartesi", mode === "this" ? "nextWeek" : mode, today)
    // "Bu hafta": içinde bulunulan hafta; cuması geçmişse (hafta sonu) gelecek hafta.
    if (mode === "this") {
      const thisMonday = addDays(monday, -7)
      monday = addDays(thisMonday, 4) >= today ? thisMonday : monday
    }
    return { start: monday, end: addDays(monday, 4) }
  })
  // "Önümüzdeki iki hafta": gelecek pazartesiden n. haftanın cumasına (takvim haftası); "gelecek 3
  // gün": yarından (ilk iş gününden) o kadar iş günü.
  take(/\b(?:onumuzdeki|gelecek)\s+(\d{1,2})\s+(gun|hafta)[a-z]*/g, (m) => {
    const n = Number(m[1])
    if (m[2] === "hafta") {
      const monday = weekday("pazartesi", "nextWeek", today)
      return { start: monday, end: addDays(monday, n * 7 - 3) }
    }
    const start = nextWorkday(addDays(today, 1))
    return { start, end: addWorkdays(start, n) }
  })
  // Süre ("3 gün", "iki hafta", "1 haftalık", "2 ay"): tarih değil, aralığın uzunluğu.
  let days = null
  let months = null
  for (const m of [
    ...s.matchAll(/\b(\d{1,2}) ?(?:is ?)?(?:(gun|hafta)[a-z]*|(ay)(?:lik|ligina|ligi)?\b)/g),
  ]) {
    if (m[3]) months = Number(m[1])
    else days = Number(m[1]) * (m[2] === "hafta" ? 5 : 1)
    spans.push([m.index, m.index + m[0].length])
    s = mask(s, m.index, m.index + m[0].length)
  }
  found.sort((a, b) => a.from - b.from)
  const [first, second] = mentions(withoutDayNames(found, folded), folded)
  let start = first?.start ?? null
  let end = first?.end ?? null
  let apart = Boolean(first?.apart)
  let merged = false
  if (second) {
    const between = folded.slice(first.to, second.from)
    // Sonraki gün adı öncekinden sonra gelir: "cuma ve pazartesi" 23 ve 26 Ekim.
    let next = second.start
    while (second.weekday && next <= (first.end ?? start)) next = addDays(next, 7)
    const b = second.end ?? next
    if (/(^|\s)ve(\s|$)|,/.test(between) && !adjacent(first.end ?? start, next)) apart = true
    else {
      end = b
      merged = true
      if (end < start) [start, end] = [end, start]
    }
  } else if (
    first &&
    !first.range &&
    !past &&
    /^\s*(?:e|a|ye|ya)?\s*kadar/.test(folded.slice(first.to))
  ) {
    // "Cumaya kadar", "ekim sonuna kadar": yarından (ilk iş gününden) o güne.
    end = first.end ?? first.start
    start = nextWorkday(addDays(today, 1))
    if (start > end) start = end
  }
  // Süre: tek tarihten ya da dönemden ("aralık ortasında 3 gün") sayılır; yazılan aralıkta değil.
  const stretch =
    start &&
    !merged &&
    !first.range &&
    (days || months) &&
    (!end || (first.period && end === first.end))
  if (stretch && days && first.before) {
    end = start
    start = backWorkdays(end, days)
  } else if (stretch) {
    // Süreli izin ilk iş gününden sayılır ("yarından itibaren 3 gün" pazara denk gelse de).
    start = nextWorkday(start)
    end = spanEnd(start, days, months)
  }
  if (start && !end) end = start
  return { start, end, days, months, apart, past: Boolean(start && start < today), spans }
}

/** Süreli aralığın son günü: iş günüyle ("3 gün") ya da takvimle ("1 ay": bir ay sonrasının dünü). */
export function spanEnd(start, days, months) {
  if (!months) return addWorkdays(start, days)
  const d = new Date(start.getFullYear(), start.getMonth() + months, start.getDate())
  // 31 Ocak + 1 ay → 28 Şubat (ay taşmasın).
  if (d.getDate() !== start.getDate()) d.setDate(0)
  return addDays(d, -1)
}

/**
 * Birden çok tarih: "itibaren"li olan tek başına (çapa); yalın tatil adı başka tarih varsa düşer;
 * yazılan aralık varsa yalnız o ("düğünüm 21 kasımda, 16-20 kasım evlilik izni").
 */
function mentions(found, folded) {
  const anchor = found.find((f) => /^\s*(?:itibaren|baslayarak)/.test(folded.slice(f.to)))
  if (anchor) return [anchor]
  let list = found.length > 1 ? found.filter((f) => !f.holiday) : found
  if (!list.length) list = found
  const range = list.length > 1 && list.find((f) => f.range)
  return range ? [range] : list
}

/** Tarihin hemen yanındaki aynı günün adı ayrı tarih değildir: "2 kasım pazartesi", "cuma 23 ekim". */
function withoutDayNames(found, folded) {
  return found.filter((f, i) => {
    if (!f.weekday) return true
    const near = [found[i - 1], found[i + 1]].find((g) => {
      if (!g || g.weekday) return false
      const gap = g.to <= f.from ? folded.slice(g.to, f.from) : folded.slice(f.to, g.from)
      return /^[\s,]*$/.test(gap) && g.start.getDay() === f.start.getDay()
    })
    return !near
  })
}
