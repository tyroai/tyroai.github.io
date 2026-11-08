import { bcp47, getNumberFormat } from "@/lib/intl-cache"
import { PROMPT_TEMPLATES } from "@/lib/promptTemplates"
import { parseAmount } from "@/lib/requestForm"

/**
 * Masraf kalemlerinin saf görünüm mantığı (kartlar ve ızgara): kapalı kalemlerin kümeleri,
 * kalemin kalan alanları, ayrıntıda doldurulanlar, fiş küçük resmi, tutarın dinlenirken
 * görünüşü ve yerel liste metni.
 */

// Şablondaki alan sırası: kalan alanlar formdaki sırayla sayılır.
const ORDER = Object.keys(PROMPT_TEMPLATES.expense.slots)

/** Kalem kartının "Ayrıntı"sındaki isteğe bağlı alanlar, gösterim sırasıyla. */
export const LINE_DETAILS = ["receipt", "firm", "location", "people"]

/**
 * Kalemlerin kartta duruşu: açık kalem kendi kartında; arka arkaya kapalı kalemler tek bir liste
 * kartı gibi durur. Her kalem için `{ open, first, last }` — kümenin ilki ve sonu (köşe, çizgi).
 */
export function lineRuns(ids, active) {
  return ids.map((id, i) => {
    const open = id === active
    return {
      open,
      first: open || i === 0 || ids[i - 1] === active,
      last: open || i === ids.length - 1 || ids[i + 1] === active,
    }
  })
}

/** Hatası olan alanlar şablon sırasıyla (`formErrors` çıktısından). */
export function missingFields(errors) {
  const bad = Object.keys(errors ?? {})
  return ORDER.filter((name) => bad.includes(name))
}

/**
 * Ayrıntı alanlarından kişinin doldurdukları, sırayla `[[ad, değer]]`. Varsayılanla görünen ama
 * seçilmemiş alan sayılmaz: cümleye de girmez.
 */
export function filledDetails(values, names = LINE_DETAILS) {
  return names
    .filter((n) => values?.[n] !== undefined && String(values[n]).trim() !== "")
    .map((n) => [n, String(values[n]).trim()])
}

const lists = new Map()

/**
 * Yerel liste metni: `long` "tutar ve kategori" · "amount and category"; `narrow` yalnız
 * virgüllü ("fiş no, firma adı, lokasyon"). Biçimleyici yerel ve stil başına bir kez kurulur.
 */
export function listText(locale, items, style = "long") {
  const key = `${locale}|${style}`
  let format = lists.get(key)
  if (!format) {
    format = new Intl.ListFormat(bcp47(locale), { type: "conjunction", style })
    lists.set(key, format)
  }
  return format.format(items)
}

// Tutarın görünüşü: iki ondalık, yerel ayraç, Latin rakam (yazılanla ve yer tutucuyla aynı rakam).
const AMOUNT = { minimumFractionDigits: 2, maximumFractionDigits: 2, numberingSystem: "latn" }

/**
 * Yazılan tutarın dinlenirken gösterilen biçimi ("1234567,89" → "1.234.567,89", "845,5" →
 * "845,50"). Boş ya da geçersizse null: yazılan olduğu gibi görünür. Yalnız görünüş — değere ve
 * asistana giden cümleye yazılmaz.
 */
export function amountText(raw, locale) {
  const n = parseAmount(raw, locale)
  return n == null ? null : getNumberFormat(locale, AMOUNT).format(n)
}
