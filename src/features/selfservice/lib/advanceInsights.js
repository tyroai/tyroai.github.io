import { COMPANIES } from "@/data/hrValues"
import { parseAmount } from "@/lib/amountParse"
import { formErrors } from "@/lib/requestForm"

/**
 * İş avansı özetinin saf hesabı (formun sağındaki "Avans özeti"): yazılan tutarın nasıl
 * anlaşıldığı (serbest yazı dahil: "15 bin", "€2.500"), gönderimi engelleyen eksikler (formdaki
 * sırayla) ve seçilen yansıtma şirketinin unvanı. Hepsi yalnız formun değerlerinden; tahmin yok.
 */

// Eksiklerin sırası: formda yukarıdan aşağı (tutar, altında ilk karo tarih — bugünle dolu gelir).
const ORDER = ["amount", "date", "purpose", "destination", "company", "payment", "document"]

/**
 * Tutarın okunuşu: `empty` (boş), `ok` (`value` + `currency`), `ambiguous` (iki aday,
 * `options`) ya da `unread` (okunamadı). Yazıdaki para birimi seçicininkinden önce gelir:
 * alandan çıkınca seçiciye o geçer (`AmountHero`).
 */
export function readAdvanceAmount(values, locale = "tr") {
  const currency = values?.currency || "TRY"
  const raw = String(values?.amount ?? "").trim()
  if (!raw) return { state: "empty", currency }
  const got = parseAmount(raw, locale)
  if (!got) return { state: "unread", currency }
  const cur = got.currency ?? currency
  if (got.ambiguous) return { state: "ambiguous", options: got.ambiguous, currency: cur }
  return { state: "ok", value: got.value, currency: cur }
}

/**
 * `{ amount, missing, company }` — `missing`: `[{ field, error }]` (`formErrors` türleriyle).
 * Okunabilen serbest yazı ("15 bin") eksik sayılmaz: alandan çıkınca biçimlenir, gönderimi
 * engellemez. `company`: `{ code, title }` ya da null.
 */
export function advanceInsights(values, { locale = "tr" } = {}) {
  const amount = readAdvanceAmount(values, locale)
  const errors = formErrors("advance", values)
  if (amount.state === "ok") delete errors.amount
  const rank = (k) => (ORDER.includes(k) ? ORDER.indexOf(k) : ORDER.length)
  const missing = Object.keys(errors)
    .sort((a, b) => rank(a) - rank(b))
    .map((field) => ({ field, error: errors[field] }))
  const code = values?.company || null
  return { amount, missing, company: code ? { code, title: COMPANIES[code] ?? null } : null }
}

/** Kapatılmamış avansların kalanı, para birimine göre: `[[currency, sum]]` (ilk görülen önce). */
export function openTotals(list) {
  const by = new Map()
  for (const a of list ?? []) by.set(a.currency, (by.get(a.currency) ?? 0) + (a.balance ?? 0))
  return [...by]
}
