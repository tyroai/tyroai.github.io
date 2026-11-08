import { KIND_ORDER } from "@/data/changelogRules"
import { isReturningBrowser, readSeenId, writeSeenId } from "@/lib/changelogSeen"

/* Kayıt içeriği TR + EN yazılır; RU/AR bilinçli olarak İngilizceye düşer —
   bir içerik arşivini makineyle çevirmek, okuyanın güvenini metnin
   kendisinden önce kaybettirir (bkz. changelog.js başlığı). */
export function pick(field, locale) {
  if (!field) return ""
  return field[locale] ?? field.en ?? ""
}

/** Tür adı: sayfada "Yeni özellik" (uzun), pencerede ve dar yerde "Yeni" (kısa). */
export function kindText(t, kind, long = false) {
  return t(long && kind === "feature" ? "whatsNew.kindLong.feature" : `whatsNew.kind.${kind}`)
}

/** Tarih uygulamanın her yerindeki biçimde: `dd.MM.yyyy`. */
export function formatEntryDate(iso) {
  const [y, m, d] = String(iso).split("-")
  return y && m && d ? `${d}.${m}.${y}` : iso
}

/* Arama katlaması `lib/fold.js`e taşındı: güvenlik panelleri de aynı
   fonksiyonu okuyor ve iki ekranın araması aynı davranmalı. */
export { fold } from "@/lib/fold"

// Arşive bağlı yardımcılar (visibleEntries, entriesSince…) BURADAN dışa aktarılmaz: bu dosya
// pencere ve güncelleme kartı gibi açılışta inen yerlerden okunuyor ve arşivi (~56 KB gz) onlara
// bağlardı. Sayfa arşivden (`@/data/changelog`), açılıştaki kararlar dizinden (`changelogMeta`) alır.
export { KIND_ORDER, isReturningBrowser, readSeenId, writeSeenId }
