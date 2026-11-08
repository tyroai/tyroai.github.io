import { mask } from "@/lib/narrate/text"

/**
 * Takvim Anlat'ının saat ve süre okuyucusu (saf; katlanmış yazı, `text.fold`). Tarihten ÖNCE koşar:
 * "14.30" gün.ay, "14-15 arası" ay içi aralık okunmasın. Okunanlar: "14:00" · "14.30" · "saat 3'te" ·
 * "3'te" · "saat üçte" · "sabah 9" · "öğleden sonra 2" · "öğlen"; aralık "14-15 arası" · "10:00-11:30" ·
 * "14'ten 15'e"; süre "1 saat" · "30 dk" · "yarım saat" · "bir buçuk saat". Mesai varsayımı: yalın
 * saat 1–7 öğleden sonradır ("saat 3" 15:00), dakikalı saatte 1–6.
 * "17:00'e kadar", "saat 5'e kadar" son saattir, başlangıç değil (`until`; saat sayılmaz).
 * Dönen `{ from, to, minutes, soft, until, spans, rest }`: dakikalar günün dakikası; `soft` yalnız gün
 * dilimi söylenmiş ("sabah", "akşam": saat tahmini, kesin saat değil); `rest` okunanlar boşlukla
 * kapatılmış yazı (uzunluk aynı).
 */

const WORD_HOUR = {
  bir: 1,
  iki: 2,
  uc: 3,
  dort: 4,
  bes: 5,
  alti: 6,
  yedi: 7,
  sekiz: 8,
  dokuz: 9,
  on: 10,
  "on bir": 11,
  "on iki": 12,
  "on uc": 13,
  "on dort": 14,
  "on bes": 15,
  "on alti": 16,
  "on yedi": 17,
  "on sekiz": 18,
  "on dokuz": 19,
  yirmi: 20,
  "yirmi bir": 21,
  "yirmi iki": 22,
  "yirmi uc": 23,
}
// Uzun ad önce ("on beş", "on"dan önce denensin).
const WORDS = Object.keys(WORD_HOUR)
  .sort((a, b) => b.length - a.length)
  .join("|")
// Saatin ekleri: "3'te", "10'da", "3 te" (boşluklu), "9'a", "ona", "14'ten".
const SFX = "(?: ?(?:te|ta|de|da)|ye|ya|e|a|ten|tan|den|dan)?"
// Rakam dizisinin içinden ya da tarihin ucundan okunmasın ("3.11.2026", "1.500").
const NOT_DIGITS = "(?<![\\d.:])"
const NOT_MORE = "(?![\\d:.]\\d)"
// Gün dilimleri: `soft` tek başına söylenince saat tahmini, `shift` "sabah 9" gibi sayıyla gelince dönüşüm.
const PART = {
  "ogleden sonra": { soft: 14 * 60, shift: (h) => (h < 12 ? h + 12 : h) },
  "ogleden once": { soft: 10 * 60, shift: (h) => h },
  oglen: { soft: 12 * 60, shift: (h) => (h <= 6 ? h + 12 : h) },
  ogle: { soft: 12 * 60, shift: (h) => (h <= 6 ? h + 12 : h) },
  sabah: { soft: 9 * 60, shift: (h) => h },
  aksam: { soft: 18 * 60, shift: (h) => (h < 12 ? h + 12 : h) },
}
const PARTS = "ogleden sonra|ogleden once|oglen|ogle|sabah|aksam"

const num = Number
/** Yalın saat (mesai varsayımı): 1–7 → 13–19. */
const office = (h) => (h >= 1 && h <= 7 ? h + 12 : h)
/** Dakikalı saat: 1–6 → öğleden sonra ("2:30"), 7:30 sabah kalır. */
const clockHour = (h) => (h >= 1 && h <= 6 ? h + 12 : h)
const valid = (h, m = 0) => h >= 0 && h <= 23 && m >= 0 && m <= 59
const half = (text) => (/bucuk/.test(text) ? 30 : 0)

/** İki yalın saatten aralık; yalnız mesai içindeyse (≤ 19): "20-24 arası" gün aralığıdır. */
function hoursRange(h1, h2) {
  if (h1 > 23 || h2 > 24) return null
  const a = office(h1)
  let b = office(h2)
  if (b <= a && b + 12 <= 23) b += 12
  return a < b && b <= 19 ? { from: a * 60, to: b * 60 } : null
}

/** Noktalı çift ("3.11", "14.05") tarihe benziyorsa saat sayılmaz; "saat" öneki ya da ":" saat yapar. */
const looksDate = (sep, minute, saat) => sep === "." && !saat && minute >= 1 && minute <= 12

const re = (source) => new RegExp(source, "g")
const at = (minute) => ({ from: minute })

// Aralıklar: "14:00-15:30", "14-15 arası", "saat 14-15", "14'ten 15'e (kadar)".
const RANGES = [
  [
    re(
      `${NOT_DIGITS}(saat )?(\\d{1,2})([:.])(\\d{2}) ?(?:-|ile|ila|ve) ?(\\d{1,2})([:.])(\\d{2})${NOT_MORE}${SFX}(?: arasi\\w*)?\\b`,
    ),
    (m) => {
      const [h1, m1, h2, m2] = [m[2], m[4], m[5], m[7]].map(num)
      if (looksDate(m[3], m1, m[1]) && looksDate(m[6], m2, m[1])) return null
      if (!valid(h1, m1) || !valid(h2, m2)) return null
      const [a, b] = [clockHour(h1) * 60 + m1, clockHour(h2) * 60 + m2]
      return a < b ? { from: a, to: b } : null
    },
  ],
  [
    re(`${NOT_DIGITS}(?:saat )?(\\d{1,2}) ?(?:-|ile|ila|ve) ?(\\d{1,2}) arasi\\w*`),
    (m) => hoursRange(num(m[1]), num(m[2])),
  ],
  [
    re(`\\bsaat (\\d{1,2}) ?(?:-|ile|ila) ?(\\d{1,2})${NOT_MORE}\\b`),
    (m) => hoursRange(num(m[1]), num(m[2])),
  ],
  [
    re(`${NOT_DIGITS}(\\d{1,2})(?:ten|tan|den|dan) (\\d{1,2})(?:ye|ya|e|a)(?: kadar)?\\b`),
    (m) => hoursRange(num(m[1]), num(m[2])),
  ],
]

// Tek saat; gün dilimi + sayı ("sabah 9") dakikalı yalın saatten önce: "sabah" konuda kalmasın.
const SINGLES = [
  [
    re(`\\b(?:bu )?(${PARTS}) (?:saat )?(\\d{1,2})(?:([:.])(\\d{2}))?${NOT_MORE}${SFX}\\b`),
    (m) => {
      const [h, min] = [num(m[2]), num(m[4] ?? 0)]
      return valid(h, min) ? at(PART[m[1]].shift(h) * 60 + min) : null
    },
  ],
  [
    re(`\\b(?:bu )?(${PARTS}) (?:saat )?(${WORDS})${SFX}\\b`),
    (m) => at(PART[m[1]].shift(WORD_HOUR[m[2]]) * 60),
  ],
  [
    re(`${NOT_DIGITS}(saat )?(\\d{1,2})([:.])(\\d{2})${NOT_MORE}${SFX}\\b`),
    (m) => {
      const [h, min] = [num(m[2]), num(m[4])]
      return valid(h, min) && !looksDate(m[3], min, m[1]) ? at(clockHour(h) * 60 + min) : null
    },
  ],
  [
    re(`\\bsaat (\\d{1,2})(?: bucuk\\w*)?${NOT_MORE}${SFX}\\b`),
    (m) => (num(m[1]) >= 1 && valid(num(m[1])) ? at(office(num(m[1])) * 60 + half(m[0])) : null),
  ],
  [
    re(`\\bsaat (${WORDS})(?: bucuk\\w*)?${SFX}\\b`),
    (m) => at(office(WORD_HOUR[m[1]]) * 60 + half(m[0])),
  ],
  [
    re(`${NOT_DIGITS}(\\d{1,2})(?: ?(?:te|ta|de|da))\\b`),
    (m) => (num(m[1]) >= 1 && valid(num(m[1])) ? at(office(num(m[1])) * 60) : null),
  ],
]

// Yalnız gün dilimi ("yarın sabah", "bu akşam", "öğlen"): saat tahmini, kesin saat sayılmaz. Ardından
// öğün ya da vardiya adı geliyorsa ("öğle yemeği", "sabah vardiyası") kelime adın parçasıdır, konuda kalır.
const NAMED = /^ (?:yemek|yemeg|kahvalti|cay|kahve|mesai|vardiya)/
const SOFT = [
  re(`\\b(?:bu )?(${PARTS})(?:ki|leyin|dan|den)?\\b`),
  (m) => ({
    from: PART[m[1]].soft,
    soft: true,
    keep: NAMED.test(m.input.slice(m.index + m[0].length)),
  }),
]

// Süre: "yarım saat", "1 saat", "30 dk", "bir buçuk saat" ("3 saat sonra" süre değil).
const DURATIONS = [
  [re("\\b(yarim|ceyrek) saat\\w*"), (m) => ({ minutes: m[1] === "yarim" ? 30 : 15 })],
  [
    re(
      `${NOT_DIGITS}(\\d+(?:[.,]\\d+)?|${WORDS})(?: (bucuk))? ?(saat|dakika|dk|dak)\\w*\\b(?! sonra)`,
    ),
    (m) => {
      const n = WORD_HOUR[m[1]] ?? num(m[1].replace(",", "."))
      const minutes = Math.round((n + (m[2] ? 0.5 : 0)) * (m[3] === "saat" ? 60 : 1))
      return minutes >= 5 && minutes <= 720 ? { minutes } : null
    },
  ],
]

export function readTime(folded) {
  let s = folded
  const out = { from: null, to: null, minutes: null, soft: false, until: false, spans: [] }
  // Tablodaki ilk geçerli eşleşmeyi okur ve boşlukla kapatır (`keep`: yazıda bırakılır). `deadline`:
  // "…'e kadar" ile biten tek saat başlangıç değil son saattir.
  const first = (table, deadline = false) => {
    for (const [pattern, read] of table) {
      for (const m of s.matchAll(pattern)) {
        const got = read(m)
        if (!got) continue
        const end = m.index + m[0].length
        const { keep, ...fields } = got
        if (deadline && /[ea]$/.test(m[0]) && m.input.slice(end).startsWith(" kadar"))
          out.until = true
        else Object.assign(out, fields)
        if (!keep) {
          out.spans.push([m.index, end])
          s = mask(s, m.index, end)
        }
        return true
      }
    }
    return false
  }
  if (!first(RANGES) && !first(SINGLES, true)) first([SOFT])
  first(DURATIONS)
  return { ...out, rest: s }
}
