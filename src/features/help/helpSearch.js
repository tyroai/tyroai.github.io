/**
 * Yardım sayfası araması (saf). `toLowerCase()` Türkçede tek başına yetmez: "İ" küçülünce
 * `i` + U+0307 kalır, "kisayol" yazan "kısayol"u bulamaz, "gorunum" "Görünüm"ü bulamaz.
 * Katlama yalnız aramada; ekrandaki metin değişmez. Ayrıntı: docs/features/yardim.md.
 */
const TR_FOLD = { ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i", û: "u" }

// Sade `toLowerCase()`: katlamadan sonra Türkçe kiple aynı sonuç (ölçüldü); dört dilde aynı kural.
// Birleşen işaret sınıfı kaçış dizisiyle yazılı (çıplak karakter editörde bozulur).
const foldChunk = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ışğüöçâîû]/g, (c) => TR_FOLD[c] ?? c)

/** Aramalık biçim: küçük harf, işaretsiz, Türkçe harfler ASCII'ye katlı. */
export function norm(value) {
  return foldChunk(value ?? "").trim()
}

/** Sorgunun kelimeleri (boşlukla ayrık, katlanmış). */
export function queryTerms(query) {
  return norm(query).split(/\s+/).filter(Boolean)
}

/** Kelimelerin HEPSİ metinde geçiyor mu (AND: "kilitli asistan" daralır, genişlemez). */
export function matchesAll(text, terms) {
  if (!terms.length) return true
  const folded = norm(text)
  return terms.every((term) => folded.includes(term))
}

const LATIN = /[a-z0-9]/

/**
 * `term`in `folded` içinde `from`dan sonraki ilk yeri (yoksa -1). Latin harfle başlayan kelime yalnız
 * KELİME BAŞINDA sayılır: "fiş" → "fişler"i bulur, "ofis"i bulmaz (Türkçe ve İngilizce ek alır, önek
 * almaz). Kiril ve Arapça metinde parça eşleşmesi kalır (Arapça öneklerle yapışık yazılır: "والإشعارات").
 */
function termAt(folded, term, from) {
  let at = folded.indexOf(term, from)
  if (!LATIN.test(term[0])) return at
  while (at > 0 && LATIN.test(folded[at - 1])) at = folded.indexOf(term, at + 1)
  return at
}

/** `matchesAll` gibi AND, ama Latin kelimeler kelime başında aranır (Yardım sayfası bunu kullanır). */
export function matchesWords(text, terms) {
  if (!terms.length) return true
  const folded = norm(text)
  return terms.every((term) => termAt(folded, term, 0) !== -1)
}

/**
 * Katlanmış metin + her katlı karakterin özgün metindeki yeri. Katlama uzunluğu değiştirir
 * ("İ" → "i", birleşen işaret → hiç), vurgu özgün metinde doğru yeri bulmalı.
 */
export function foldWithMap(text) {
  let folded = ""
  const map = []
  let index = 0
  for (const char of text ?? "") {
    const part = foldChunk(char)
    for (let i = 0; i < part.length; i += 1) map.push(index)
    folded += part
    index += char.length
  }
  map.push(index)
  return { folded, map }
}

/**
 * Metinde kelimelerin geçtiği yerler, özgün metne göre `[başlangıç, bitiş)` aralıkları;
 * sıralı ve birleşik (iç içe/örtüşen vurgu olmaz).
 */
export function highlightRanges(text, terms) {
  if (!text || !terms?.length) return []
  const { folded, map } = foldWithMap(text)
  const raw = []
  for (const term of terms) {
    if (!term) continue
    let at = termAt(folded, term, 0)
    while (at !== -1) {
      // Bitiş: sonraki katlı karakterin özgün yeri — ardındaki birleşen işaretler de vurguda kalır.
      const end = Math.max(map[at + term.length], map[at + term.length - 1] + 1)
      raw.push([map[at], end])
      at = termAt(folded, term, at + term.length)
    }
  }
  raw.sort((a, b) => a[0] - b[0])
  const merged = []
  for (const range of raw) {
    const last = merged[merged.length - 1]
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
    else merged.push([...range])
  }
  return merged
}

/** Metni vurgulu ve düz parçalara böler: `[{ text, hit }]`. */
export function splitHighlight(text, terms) {
  const ranges = highlightRanges(text, terms)
  if (!ranges.length) return [{ text, hit: false }]
  const parts = []
  let cursor = 0
  for (const [start, end] of ranges) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), hit: false })
    parts.push({ text: text.slice(start, end), hit: true })
    cursor = end
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false })
  return parts
}
