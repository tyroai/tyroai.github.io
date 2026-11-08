// Baş harfler: yazı birimi (grapheme) ile alınır, `s[0]` ile değil: emoji ile başlayan ad ("🦊 Fox")
// yarım vekil çifti ("�") vermesin. Emoji ya da işaretle başlayan sözcükler harf sayılmaz, ama
// hiç harfli sözcük yoksa ilk yazı birimi kalır.
let segmenter
function firstGrapheme(word) {
  if (typeof Intl === "undefined" || !Intl.Segmenter) return Array.from(word)[0] ?? ""
  segmenter ??= new Intl.Segmenter(undefined, { granularity: "grapheme" })
  for (const { segment } of segmenter.segment(word)) return segment
  return ""
}

/**
 * Adın en çok iki baş harfi. `locale` verilirse büyük harf o dilin kuralıyla ("tr": i → İ);
 * verilmezse dilden bağımsız (yabancı adlarda "Ian" → "İ" olmasın).
 */
export function initialsOf(name, locale) {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const lettered = words.filter((w) => /^[\p{L}\p{N}]/u.test(w))
  return (lettered.length ? lettered : words)
    .slice(0, 2)
    .map((w) => {
      const g = firstGrapheme(w)
      return locale ? g.toLocaleUpperCase(locale) : g.toUpperCase()
    })
    .join("")
}
