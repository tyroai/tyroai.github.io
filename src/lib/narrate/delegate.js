import { readDates } from "./dates"
import { placeOf } from "./places"
import { findStem, fold, words } from "./text"

/**
 * Anlat › temsilci ata (saf): kime ve hangi tarihler arasında. Kişi yalnız ARAMA METNİ olarak çıkar
 * — e-posta, "vekilim Ali", "Ayşe temsilcim", "Mehmet Yılmaz'a devret", "Temsilci: Zeynep",
 * "ayşeye bırak" — kesin kişiyi formdaki seçici bulur, kişi seçer; Anlat kimseyi tahmin etmez.
 * Birden çok aday varsa atama kelimesine en yakını ("İzmir'e gideceğim, Ali'ye devret" → Ali).
 * Tek gün "yarın" o günle biter, "…den itibaren" bitişi boş bırakır (açık uçlu atama kişinin kararı).
 */
const ROOTS = ["temsilci", "vekil", "vekalet", "devret", "devred", "delege"]
// "Onaylarımı / onay yetkimi … bırak, devret" de atamadır.
const HAND_OVER = /\b(?:onay|yetki)\w*(?:\s+\S+){0,3}?\s+(?:birak|devr)/

export const saysDelegate = (folded) =>
  Boolean(findStem(words(folded), ROOTS, 6)) || HAND_OVER.test(folded)

// Ad sanılmasın: aylar, günler, göreli günler, rol ve atama kelimeleri (katlanmış).
const NOT_NAME = new Set([
  ...["ocak", "subat", "mart", "nisan", "mayis", "haziran", "temmuz", "agustos"],
  ...["eylul", "ekim", "kasim", "aralik", "pazartesi", "sali", "carsamba", "persembe"],
  ...["cuma", "cumartesi", "pazar", "yarin", "bugun", "haftaya", "gelecek", "onumuzdeki"],
  ...["temsilci", "temsilcim", "vekil", "vekilim", "onay", "onaylarim", "yetki", "yetkim"],
  ...["izin", "iznim", "ben", "bana", "beni", "mudur", "mudurum", "yonetici", "yoneticim"],
  ...["arkadas", "arkadasim", "ekip", "ekibim", "biri", "birine", "kimse", "herkes"],
])
const named = (s) => {
  const list = words(fold(s))
  return Boolean(list[0]) && !NOT_NAME.has(list[0]) && !/^\d/.test(list[0]) && !placeOf(list)
}

const NAME = "\\p{Lu}\\p{L}+(?:\\s+\\p{Lu}\\p{L}+){0,2}"
const ROLE = "(?:[Vv]ekil|[Tt]emsilci)"
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/
const PATTERNS = [
  // "vekilim Ali Veli olsun", "temsilcim Ayşe"
  new RegExp(`${ROLE}\\p{L}*\\s+(${NAME})`, "gu"),
  // "Ayşe temsilcim olsun", "Ali Veli vekilim"
  new RegExp(`(${NAME})\\s+(?:benim\\s+)?${ROLE}`, "gu"),
  // "Ayşe'ye devret", "Mehmet Yılmaz'ı temsilci yap" (yönelme ya da belirtme eki)
  new RegExp(`(${NAME})['’](?:y?[aeıiuü]|n[aeıiuü])(?![\\p{L}])`, "gu"),
  // "Temsilci ata: Zeynep, 10-14 Kasım"
  new RegExp(`[:–-]\\s*(${NAME})`, "gu"),
]
// Küçük harfle, eksiz yazılmış: "ayşeye devret", "aliye bırak".
const BEFORE_VERB = /(\p{L}{2,}?)y?[ae]\s+(?:devr|bırak|birak)/u
const KEYWORD = /vekil|temsilci|vekalet|devr|bırak|birak|delege/giu

function personOf(raw) {
  const mail = raw.match(EMAIL)?.[0]
  if (mail) return mail.replace(/[.,;:]+$/, "")
  const anchors = [...raw.matchAll(KEYWORD)].map((m) => m.index)
  const near = (at) => Math.min(...anchors.map((a) => Math.abs(a - at)))
  const found = []
  for (const re of PATTERNS)
    for (const m of raw.matchAll(re)) {
      const at = m.index + m[0].indexOf(m[1])
      if (named(m[1])) found.push({ name: m[1], at })
    }
  if (found.length) return found.sort((a, b) => near(a.at) - near(b.at))[0].name
  const low = raw.toLocaleLowerCase("tr").match(BEFORE_VERB)?.[1]
  return low && named(low) ? low : null
}

/** `{ values, parts, warnings }` — `values`: `person` (arama metni), `start`, `end`. */
export function narrateDelegate(folded, raw, today) {
  const values = {}
  const parts = []
  const warnings = []
  const who = personOf(raw)
  if (who) {
    values.person = who
    parts.push({ key: "person", value: who })
  }
  const d = readDates(folded, today)
  if (d.start) {
    // Okuyucu tek tarihte bitişi başlangıçla aynı verir; "itibaren" ile tek tarih açık uçludur.
    const single = !d.end || d.end.getTime() === d.start.getTime()
    const open = /\bitibaren\b|\bsonra(?:si)?\b/.test(folded) && single
    values.start = d.start
    if (!open) values.end = d.end ?? d.start
    parts.push({ key: "range", start: values.start, end: values.end ?? null })
    if (d.past) warnings.push("past")
  }
  return { values, parts, warnings }
}
