import { COMPANIES, COMPANY_CODES } from "@/data/hrValues"
import { formatAmount } from "@/lib/amountParse"
import { pickAmount, readAmounts } from "./amount"
import { readDates } from "./dates"
import { placeOf } from "./places"
import { fold, findStem, mask, stem, words } from "./text"

/**
 * Anlat › iş avansı (saf): tutar ve para birimi ("15 bin TL", "€2.500", "on beş bin lira" —
 * birimi yazılan, yoksa en büyük sayı), amaç, gidilecek yer (ERP'nin 16 konumu; yurt dışı →
 * "Diğer"), ödeme, belge, şirket (kodu ya da adındaki marka kelimesi: "timeks", "giresunport";
 * "Trabzon", "Yıldız" gibi şehir ve soyadı olabilen kelimeler değil). Tarih okunmaz: avansın tarihi
 * talebin yapıldığı gündür (yazılmışsa uyarı; "10.11 tarihinde" de).
 */
const PURPOSES = [
  ["fair", ["fuar", "expo", "fair"]],
  ["congress", ["kongre", "konferans", "zirve", "seminer", "sempozyum"]],
  ["visit", ["musteri", "ziyaret"]],
  ["other", ["egitim", "kurs"]],
]
const PAYMENT = [
  ["cash", ["kasa", "nakit", "elden"]],
  ["bank", ["banka", "hesab", "havale", "eft", "iban"]],
]
// Şirketi ayırt eden marka kelimeleri (unvanda tek şirkette geçen). Şehir, soyadı ve sektör
// kelimeleri ("trabzon", "yildiz", "anadolu", "nakliyat") bilerek yok: cümlede başka anlamda geçer.
const BRAND = new Set([
  "timeks",
  "yildirsan",
  "gunsan",
  "ozuberk",
  "safoz",
  "egenut",
  "lonca",
  "giresunport",
  "mercurius",
  "agrynova",
  "orvital",
  "pagoda",
  "yesilkure",
  "denizcilik",
  "depoculuk",
  "tohumculuk",
  "havacilik",
  "almanar",
  "nahreen",
  "fayhaa",
  "shinaar",
  "suhool",
  "hubub",
])

let nameIndex = null
/** Marka kelimesi → şirket kodu (yalnız tek şirketin unvanında geçen). */
function companyNames() {
  if (nameIndex) return nameIndex
  const seen = new Map()
  for (const code of COMPANY_CODES)
    for (const w of new Set(words(fold(COMPANIES[code])))) {
      if (BRAND.has(w)) seen.set(w, seen.has(w) ? null : code)
    }
  nameIndex = [...seen].filter(([, code]) => code)
  return nameIndex
}

function companyOf(list) {
  const code = COMPANY_CODES.find((c) => list.includes(fold(c)))
  if (code) return code
  return companyNames().find(([w]) => list.some((x) => stem(x, w, 4)))?.[1] ?? null
}

const pick = (list, table, max) => {
  for (const [key, roots] of table) if (findStem(list, roots, max)) return key
  return null
}

/** `{ values, parts, warnings }` — `values` forma yazılacaklar (tutar dilin biçiminde). */
export function narrateAdvance(folded, today, locale = "tr") {
  const values = {}
  const parts = []
  const warnings = []
  const dates = readDates(folded, today, { numeric: false })
  let rest = folded
  for (const [a, b] of dates.spans) rest = mask(rest, a, b)
  // Rakamla tarih ancak "tarihinde" gibi bir kelimeyle: "10.11" tutar da olabilir.
  const dotted = rest.match(/\b\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?(?= ?(?:tarih|gun))/)
  if (dotted) rest = mask(rest, dotted.index, dotted.index + dotted[0].length)
  if (dates.start || dotted) warnings.push("advanceDate")
  const amount = pickAmount(readAmounts(rest, locale))
  if (amount?.ambiguous) warnings.push("ambiguousAmount")
  else if (amount?.value) {
    values.amount = formatAmount(amount.value, locale)
    if (amount.currency) values.currency = amount.currency
    parts.push({ key: "amount", value: amount.value, currency: amount.currency })
  }
  const list = words(rest)
  const set = (key, value) => {
    if (!value) return
    values[key] = value
    parts.push({ key, value })
  }
  const explicitBusiness = /\bis (seyahat|gezi|icin|toplanti)/.test(rest)
  set("purpose", pick(list, PURPOSES) ?? (explicitBusiness ? "business" : null))
  set("destination", placeOf(list)?.code)
  set("payment", pick(list, PAYMENT))
  set(
    "document",
    findStem(list, ["belgesiz", "faturasiz"], 4)
      ? "undocumented"
      : findStem(list, ["belgeli", "belgeyle", "fatura"], 4) || /\bbelge ile\b/.test(rest)
        ? "documented"
        : null,
  )
  set("company", companyOf(list))
  return { values, parts, warnings }
}

/** Avans cümlesi mi (sözcüğü yazılmasa da): okunan tutarla birlikte amaç ya da yer var. */
export function looksLikeAdvance(folded, today) {
  const { parts } = narrateAdvance(folded, today)
  return parts.some((p) => p.key === "amount") && parts.length > 1
}
