/** Keşfet'in ortak metin yardımcıları: kanal hashtag'i ve kutlama satırının zaman cümlesi. */

/**
 * ⚠️ Sonraki kelimelerin baş harfi büyür (`#SanaÖzel`, `#ДляВас`): düz
 * birleştirme "Sana özel"i `#Sanaözel` diye okunmaz yapıyordu. Harf dilin
 * kuralıyla büyür — Türkçede `i` → `İ`.
 */
export function hashtag(label, locale) {
  const words = String(label ?? "")
    .trim()
    .split(/\s+/)
  return `#${words.map((w, i) => (i === 0 ? w : w.charAt(0).toLocaleUpperCase(locale) + w.slice(1))).join("")}`
}

/**
 * Satırın tarih cümlesi.
 *
 * ⚠️ **SAYIDAN BAĞIMSIZ KALIP YOK — 0 ve 1 KENDİ CÜMLESİNİ ALIYOR.** Sözlükte
 * çoğul motoru yok; "in 1 days" yazmamanın yolu bugün ve yarını ayrı
 * anahtarlara bağlamak, kalan n her iki dilde de çoğul.
 */
export function celebrationWhen(t, person, kind) {
  if (kind === "joiner") {
    const n = person.agoDays
    if (n === 0) return t("feed.cel.joinedToday")
    if (n === 1) return t("feed.cel.joinedYesterday")
    return t("feed.cel.joinedAgo", { count: n })
  }
  const n = person.inDays
  const when =
    n === 0
      ? t("feed.cel.today")
      : n === 1
        ? t("feed.cel.tomorrow")
        : t("feed.cel.inDays", { count: n })
  // ⚠️ Yıl dönümünde KAÇINCI YIL asıl haber, tarih onun niteleyicisi —
  // o yüzden yıl ÖNCE yazılıyor ("15. yıl · 3 gün sonra").
  return kind === "anniversary" ? `${t("feed.cel.years", { count: person.years })} · ${when}` : when
}
