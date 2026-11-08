/**
 * Anlat çözücüsünün yazı araçları (saf). Türkçe katlama: küçük harf (tr), Türkçe harfler ve
 * şapkalar sadeleşir, kesme işaretleri silinir — "Cuma'ya" → "cumaya", "İzmir'e" → "izmire".
 * Uzunluk korunur (yalnız harf değişir, kesme silinir): eşleşmeler katlanmış yazı üstünde aranır.
 */
const LETTERS = { ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i", û: "u" }

export function fold(text) {
  return String(text ?? "")
    .toLocaleLowerCase("tr")
    .replace(/[’'`´]/g, "")
    .replace(/[ışğüöçâîû]/g, (c) => LETTERS[c])
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
}

/** Kelimeler (harf ya da rakam dizileri). */
export const words = (folded) => folded.match(/[\p{L}\p{N}]+/gu) ?? []

/** Kelime bir kökle mi başlıyor (ek en çok `max` harf): "cumaya" ← "cuma", "izmirdeki" ← "izmir". */
export const stem = (word, root, max = 6) =>
  word.startsWith(root) && word.length - root.length <= max

/** Kelimelerden biri köklerden biriyle başlıyorsa o kök, yoksa null. */
export function findStem(list, roots, max) {
  for (const w of list) for (const r of roots) if (stem(w, r, max)) return r
  return null
}

/** Eşleşen aralıkları boşlukla kapatır (aynı yer iki kez okunmasın; uzunluk aynı kalır). */
export const mask = (text, from, to) => text.slice(0, from) + " ".repeat(to - from) + text.slice(to)
