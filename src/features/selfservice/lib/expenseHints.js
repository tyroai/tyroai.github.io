import { EXPENSE_CATEGORIES } from "@/data/hrValues"
import { startOfDay } from "@/lib/leaveDays"

/**
 * Masraf kaleminin kural tabanlı yardımları (saf): açıklama ve firma adındaki kelimelerden kategori
 * önerisi (en çok iki) ve ileri tarih uyarısı. Kategoriler yalnız ERP listesinden
 * (`EXPENSE_CATEGORIES`); kelimeler Türkçe kökleriyle (yumuşayan son ses de: yemek · yemeği).
 * Öneri seçilmeden hiçbir şey yazılmaz.
 */

const RULES = [
  {
    words: ["taksi", "uber", "dolmuş", "otobüs", "metro", "tren", "yht", "marmaray", "vapur"],
    home: "Ulaşım (Yurtiçi)",
    abroad: "Ulaşım (Yurtdışı)",
  },
  {
    words: ["otel", "konaklama", "pansiyon", "hotel"],
    home: "Konaklama (Yurtiçi)",
    abroad: "Konaklama (Yurtdışı)",
  },
  {
    words: ["yemek", "yemeğ", "lokanta", "restoran", "restaurant", "kafe", "cafe", "kahvaltı"],
    home: "Yemek (Yurtiçi)",
    abroad: "Yemek (Yurtdışı)",
    // Müşteriyle yemek temsil ağırlamadır: o öneri önce gelir.
    guest: { words: ["müşteri"], category: "Temsil ağırlama yemek" },
  },
  { words: ["akaryakıt", "benzin", "motorin", "yakıt", "mazot", "lpg"], home: "Taşıt akaryakıt" },
  { words: ["otopark", "park"], home: "Taşıt otopark" },
  { words: ["hgs", "ogs", "otoyol", "köprü"], home: "Taşıt hgs/ogs" },
  { words: ["kargo", "kurye"], home: "Kargo (Yurtiçi)", abroad: "Kargo (Yurtdışı)" },
  { words: ["uçak", "uçağ", "uçuş", "flight"], home: "Uçuş rezervasyon" },
  { words: ["kırtasiye", "toner", "kağıt", "kağıd"], home: "Kırtasiye" },
  { words: ["eczane", "ilaç", "ilac"], home: "İlaç ve tedavi" },
  { words: ["eğitim", "kurs", "seminer"], home: "Eğitim giderleri" },
  { words: ["fuar", "organizasyon", "webinar"], home: "Toplantı, fuar ve organizasyon" },
  { words: ["pasaport", "harç", "harc", "vize"], home: "Çıkış ve pasaport harç (Yurtdışı)" },
]

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
// Kelime başına bir düzenli ifade, bir kez kurulur: öneri açıklamanın her tuşunda yeniden bakılır.
const patterns = new Map()
// Kelimenin başında eşleşir: "taksiye" taksi'dir, "sitaksi" değil.
function startsWord(text, word) {
  let re = patterns.get(word)
  if (!re) {
    re = new RegExp(`(^|[^\\p{L}\\p{N}])${escape(word)}`, "u")
    patterns.set(word, re)
  }
  return re.test(text)
}
const hasAny = (text, words) => words.some((w) => startsWord(text, w))

/**
 * Kalemin değerlerinden kategori önerileri (en çok `max`): açıklama (`note`) ve firma adı
 * (`firm`). Para birimi TRY değilse yurtdışı karşılığı önce.
 */
export function suggestCategories(values, max = 2) {
  const text = [values?.note, values?.firm].filter(Boolean).join(" ").toLocaleLowerCase("tr").trim()
  if (!text) return []
  const foreign = Boolean(values?.currency) && values.currency !== "TRY"
  const out = []
  for (const rule of RULES) {
    if (!hasAny(text, rule.words)) continue
    if (rule.guest && hasAny(text, rule.guest.words)) out.push(rule.guest.category)
    if (foreign && rule.abroad) out.push(rule.abroad, rule.home)
    else out.push(rule.home)
  }
  return [...new Set(out)].filter((c) => EXPENSE_CATEGORIES.includes(c)).slice(0, max)
}

/** Tarih bugünden sonra mı (uyarı; engellemez). */
export function isFutureDate(date, today) {
  return date instanceof Date && startOfDay(date) > startOfDay(today)
}
