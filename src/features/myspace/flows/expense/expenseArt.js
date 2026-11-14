/**
 * MASRAF KATEGORİSİ İLLÜSTRASYONLARI — kategori hapı, fişin başlığı ve kategori kartındaki "sık
 * kullanılanlar". İzin türleriyle aynı aile (Microsoft Fluent Emoji 3B, MIT; 240 px WebP). Anahtar
 * ERP'nin kategori adı (`data/hrValues` › EXPENSE_CATEGORIES, birebir); eşi olmayan kategori simge
 * kutusuyla kalır. Dosyalar `public/tyro-advance/expense/`.
 */
const BASE = `${import.meta.env.BASE_URL}tyro-advance/expense/`

const QUICK = [
  ["Yemek (Yurtiçi)", "meal"],
  ["Konaklama (Yurtiçi)", "hotel"],
  ["Ulaşım (Yurtiçi)", "transport"],
  ["Uçuş rezervasyon", "flight"],
  ["Taşıt akaryakıt", "fuel"],
  ["Taşıt otopark", "parking"],
  ["Temsil ağırlama yemek", "hospitality"],
  ["Eğitim giderleri", "training"],
]
// Aynı konunun öteki kategorileri: listede daire çizmezler ama seçilince illüstrasyonu taşırlar.
const MORE = [
  ["Yemek (Yurtdışı)", "meal"],
  ["Seyahat yemek (Yurtiçi)", "meal"],
  ["Fazla mesai yemek", "meal"],
  ["Departman yemek ekip", "meal"],
  ["Konaklama (Yurtdışı)", "hotel"],
  ["Otel rezervasyon", "hotel"],
  ["Ağırlama ve konaklama", "hotel"],
  ["Ulaşım (Yurtdışı)", "transport"],
  ["Fazla mesai ulaşım", "transport"],
  ["Diğer temsil ağırlama", "hospitality"],
  ["Kargo (Yurtiçi)", "cargo"],
  ["Kargo (Yurtdışı)", "cargo"],
  ["Kırtasiye", "stationery"],
  ["Sertifika", "training"],
]
const BY_NAME = new Map([...QUICK, ...MORE])

/** Sık kullanılan kategoriler, sırasıyla: `{ value, name, src, tip }` (yalnız listede olanlar). */
export function quickCategories(all) {
  return QUICK.filter(([name]) => all.includes(name)).map(([name, file]) => ({
    value: name,
    // Dairenin altı kısa: "(Yurtiçi)" eki ipucunda kalır.
    name: name.replace(/\s*\(Yurtiçi\)$/, ""),
    tip: name,
    src: `${BASE}${file}.webp`,
  }))
}

/** Kategorinin illüstrasyonu ya da `null`. */
export const categoryArt = (name) => (BY_NAME.has(name) ? `${BASE}${BY_NAME.get(name)}.webp` : null)

/** Eşleştirilen bütün kategori adları (test: hepsi ERP listesinde olmalı). */
export const ART_CATEGORIES = [...BY_NAME.keys()]
