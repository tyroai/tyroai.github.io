import { PAGES } from "./helpPages"

/** Sayfadaki kısayollar bölümünün çapası ("Arama ve komut paleti" işlevi oraya iner). */
export const SHORTCUTS_ID = "help-shortcuts"
// Bölüm kimlikleri: masaüstündeki sol menü bunlara iner, bölüm izleyici bunları izler.
export const PAGES_ID = "help-pages"
export const SUPPORT_ID = "help-support"
export const TOURS_ID = "help-tours"
/** Destek ve Rehber turları listelerinin satırı (bağlantı ya da düğme). */
export const LIST_ROW =
  "flex min-h-12 items-center gap-3 px-4 py-3 outline-none transition first:rounded-t-2xl last:rounded-b-2xl hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 dark:hover:bg-white/[0.04] pointer-coarse:min-h-14"
/** Sayfa bloğunun kimliği; sol menü satırı da buna iner. */
export const pageDomId = (id) => `help-page-${id}`

/** Destek kişileri: adres ve yedek ad VERİ (çevrilmez); fotoğraf, ad ve unvan dizinden okunur. */
export const SUPPORT_PEOPLE = [
  { address: "omer.gumus@tyrotech.example", name: "Ömer Gümüş" },
  { address: "ayse.demir@tyrotech.example", name: "Ayşe Demir" },
]

/** Sorular, sayfa sırasıyla; numara sözlük anahtarı (`help.faq.qN`) ve derin bağlantı (`#faq-qN`). */
export const ALL_FAQ = PAGES.flatMap((p) => p.faq.map((f) => f.n))

/** Sorunun bulunduğu sayfa; bilinmeyen numara → null. */
export const pageOfFaq = (n) => PAGES.find((p) => p.faq.some((f) => f.n === n))?.id ?? null

export const faqAnchor = (n) => `faq-q${n}`
// DOM kimliği çapadan FARKLI: aynı olsa tarayıcının kendi çapa kaydırması düzenin
// `overflow-hidden` kabını da kaydırıyor (telefonda header'ın altı kayıyordu); kaydırmayı biz yaparız.
export const faqDomId = (n) => `help-${faqAnchor(n)}`

/** `#faq-q4` → 4; geçersiz ya da başka çapa → null. */
export function faqFromHash(hash) {
  const m = /^#?faq-q(\d+)$/.exec(hash ?? "")
  if (!m) return null
  const n = Number(m[1])
  return ALL_FAQ.includes(n) ? n : null
}

/**
 * Sorgunun adresteki hâli (`?q=`; diğer parametreler kalır). Sorgu varken çapa düşer: Geri'yle
 * dönülünce `#faq-qN` aramayı silmesin. Adres zaten aynıysa null (gereksiz replaceState yok).
 */
export function urlWithQuery(href, query) {
  const url = new URL(href)
  const q = query.trim()
  if ((url.searchParams.get("q") ?? "") === q) return null
  if (q) {
    url.searchParams.set("q", q)
    url.hash = ""
  } else url.searchParams.delete("q")
  return `${url.pathname}${url.search}${url.hash}`
}

/** POPÜLER çipleri: beşi de dört dilde ≥ 1 sonuç döndürür (ölçüldü; metin değişirse yeniden ölç). */
export const POPULAR = [1, 2, 3, 4, 5]

/** Bölüm kimlikleri, menüden ve bölüm izleyiciden sıra sırasıyla. */
export function helpSpyIds({ pageIds, shortcuts }) {
  return [...pageIds.map(pageDomId), TOURS_ID, ...(shortcuts ? [SHORTCUTS_ID] : []), SUPPORT_ID]
}

/**
 * Bir sayfa bu kişiye gösterilir mi: hedef sayfa kapalıysa (`canOpen`) ya da yönetici grubuna
 * bağlı bölümse (`gate: "adminGroup"`, Profilim'in Katalog kapısıyla aynı: kesin "evet") gösterilmez.
 */
export const pageVisible = (page, { canOpen, inAdminGroup }) =>
  (!page.to || canOpen(page.to)) && (page.gate !== "adminGroup" || inAdminGroup)

/**
 * Sayfanın altındaki bölümler (turlar, kısayollar, destek) ekrana yaklaşana dek yerleştirilip
 * boyanmaz; boyu son ölçülen (ilk seferde tahmin). Kimlik, çapa, arama ve izleyici aynı kalır.
 */
export const OFFSCREEN_STYLE = { contentVisibility: "auto", containIntrinsicSize: "auto 24rem" }
