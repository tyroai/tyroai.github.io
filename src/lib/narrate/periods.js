import { MONTH, dayOfMonth, monthOf, monthPart } from "./calendar"

/**
 * Ay içi dönemler (Anlat; katlanmış yazı): "aralık ilk hafta", "aralığın ikinci haftası",
 * "ayın son haftası", "gelecek ayın ilk haftası", "kasım sonu", "ay başı", "aralık ortası",
 * "tüm aralık" / "aralık boyunca", "aralıktan itibaren", "ayın 20'si", "aralığın 2'si", "3'ünden
 * 7'sine", "20-24 arası". `take(kalıp, okuyucu)` dates.js'in okuyucusu; her okuyucu `{ start,
 * end? }` ya da null döner. Ayın haftası ve başı/sonu `period`: ardından süre gelirse oradan sayılır
 * ("aralık ortasında 3 gün").
 */

const ORDINAL = {
  ilk: 1,
  birinci: 1,
  1: 1,
  ikinci: 2,
  2: 2,
  ucuncu: 3,
  3: 3,
  dorduncu: 4,
  4: 4,
  son: "last",
}
const PART = { bas: 1, son: "last", orta: "mid" }
const WHICH_MONTH = `(?:(bu|gelecek|onumuzdeki|sonraki)\\s+)?(?:(ayin|ay)|${MONTH}(?:\\s+ayi(?:nin)?)?)`
// Ayın gününün ekleri (katlanmış): "20si", "23unde", "26sindan", "5te", "15ine".
const SUFFIX = "(?:(?:si|i|u)(?:n(?:de|da|den|dan|e|a))?|[td][ae]n?)"
const FROM = "(?:si|i|u)?n?(?:den|dan|ten|tan)"
const TO = "(?:si|i|u)?n?(?:e|a|ye|ya)"

/**
 * Hangi ayın: adı verilmişse en yakın gelecek (bu ay dahil; masrafta en yakın geçmiş); "ayın" bu
 * ay, "gelecek ayın" sonraki.
 */
function monthYear(prefix, plain, named, today, past = false) {
  if (named) {
    const m = monthOf(named)
    if (m < 0) return null
    const now = today.getMonth()
    const y = today.getFullYear() + (past ? (m > now ? -1 : 0) : m < now ? 1 : 0)
    return [y, m]
  }
  if (!plain) return null
  const shift = prefix && prefix !== "bu" ? 1 : 0
  const d = new Date(today.getFullYear(), today.getMonth() + shift, 1)
  return [d.getFullYear(), d.getMonth()]
}

export function readPeriods(take, today, { past = false } = {}) {
  // "aralık ilk hafta", "ayın son haftası", "gelecek ayın 2. haftası"
  take(
    new RegExp(
      `\\b${WHICH_MONTH}\\s+(ilk|birinci|ikinci|ucuncu|dorduncu|son|[1-4])\\.?\\s+hafta[a-z]*`,
      "g",
    ),
    (m) => {
      const my = monthYear(m[1], m[2], m[3], today, past)
      const got = my && monthPart(my[0], my[1], ORDINAL[m[4]])
      return got && { ...got, period: true }
    },
  )
  // "kasım sonu", "ay başı", "aralık ortasında", "gelecek ayın başında"
  take(
    new RegExp(
      `\\b${WHICH_MONTH}\\s+(bas|son|orta)(?:i|u|si|inda|unda|sinda|indan|undan|sindan|ina|una|sina|lar[a-z]*)\\b`,
      "g",
    ),
    (m) => {
      const my = monthYear(m[1], m[2], m[3], today, past)
      const got = my && monthPart(my[0], my[1], PART[m[4]])
      return got && { ...got, period: true }
    },
  )
  // "tüm aralık", "bütün kasım ayı", "aralık boyunca", "aralığın tamamı"
  take(
    new RegExp(
      `\\b(?:(tum|butun)\\s+)?${MONTH}(?:\\s+ayi(?:nin)?)?(?:\\s+(boyunca|tamami[a-z]*))?`,
      "g",
    ),
    (m) => {
      if (!m[1] && !m[3]) return null
      const my = monthYear(null, null, m[2], today, past)
      return my && monthPart(my[0], my[1], "all")
    },
  )
  // "aralıktan itibaren", "kasım ayından başlayarak": ayın ilk günü (ardından süre gelebilir).
  take(
    new RegExp(`(?<!\\d\\s?)\\b${MONTH}(?:\\s+ayi)?(?=\\s+(?:itibaren|baslayarak))`, "g"),
    (m) => {
      if (!/(?:dan|den|tan|ten)$/.test(m[0])) return null
      const my = monthYear(null, null, m[1], today, past)
      return my && { start: new Date(my[0], my[1], 1) }
    },
  )
  // "20-24 arası" (ay yazılmadan): bu ay ya da sonraki
  take(/\b(\d{1,2})\s*(?:-|ile|ila)\s*(\d{1,2})\s*(?:arasi[a-z]*)/g, (m) => {
    const a = dayOfMonth(m[1], today, past)
    if (!a) return null
    const b = new Date(a.getFullYear(), a.getMonth(), Number(m[2]))
    return b.getDate() === Number(m[2]) && b >= a ? { start: a, end: b, range: true } : null
  })
  // "aralığın 3'ünden 7'sine (kadar)", "ayın 3'ünden 7'sine": iki uç aynı ayda.
  take(
    new RegExp(`\\b(?:(ayin)\\s+|${MONTH}\\s+)?(\\d{1,2})${FROM}\\s+(\\d{1,2})${TO}\\b`, "g"),
    (m) => {
      const my = m[2] ? monthYear(null, null, m[2], today, past) : null
      const a = my ? dayIn(my, m[3]) : dayOfMonth(m[3], today, past)
      const b = a && dayIn([a.getFullYear(), a.getMonth()], m[4])
      return a && b && b >= a ? { start: a, end: b, range: true } : null
    },
  )
  // "aralığın 2'si", "kasımın 5'inde"
  take(new RegExp(`\\b${MONTH}\\s+(\\d{1,2})${SUFFIX}\\b`, "g"), (m) => {
    const my = monthYear(null, null, m[1], today, past)
    const a = my && dayIn(my, m[2])
    return a ? { start: a } : null
  })
  // "ayın 20'si", "5'inde", "23'ünde", "15'ine kadar"
  take(new RegExp(`\\b(?:ayin\\s+)?(\\d{1,2})${SUFFIX}\\b`, "g"), (m) => {
    const a = dayOfMonth(m[1], today, past)
    return a ? { start: a } : null
  })
}

/** `[yıl, ay]`ın günü (ayda yoksa null: "31 kasım"). */
function dayIn([y, m], day) {
  const d = new Date(y, m, Number(day))
  return d.getMonth() === m ? d : null
}
