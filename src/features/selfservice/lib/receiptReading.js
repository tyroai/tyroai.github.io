import { CURRENCIES, EXPENSE_CATEGORIES } from "@/data/hrValues"
import { formatAmount } from "@/lib/amountParse"
import { addDays, sameDay, startOfDay } from "@/lib/leaveDays"

/**
 * Fiş okuyucunun (tyroReader ajanı) cevabı → masraf kalemi (saf). Güven yüzdeyle değil kanıtla:
 * tutar ancak ajanın fişte okuduğu toplam satırında (`totalEvidence`) aynı sayı geçiyorsa yazılır;
 * emin olunmayan alan boş kalır. Tarih gelecekte ya da çok eskiyse yazılmaz. Kategori yalnız
 * fişten açıkça belliyse (ajanın ipucu) ve para birimine göre yurtiçi/yurtdışı.
 */

const KINDS = ["receipt", "not_receipt", "multiple", "unreadable"]
const HINTS = {
  food: ["Yemek (Yurtiçi)", "Yemek (Yurtdışı)"],
  transport: ["Ulaşım (Yurtiçi)", "Ulaşım (Yurtdışı)"],
  taxi: ["Ulaşım (Yurtiçi)", "Ulaşım (Yurtdışı)"],
  hotel: ["Konaklama (Yurtiçi)", "Konaklama (Yurtdışı)"],
  fuel: ["Taşıt akaryakıt", "Taşıt akaryakıt"],
  parking: ["Taşıt otopark", "Taşıt otopark"],
}
// Bundan eski fiş tarihi büyük olasılıkla yanlış okumadır (masraflar yıl içinde girilir).
const OLDEST_DAYS = 400

const text = (v, max) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null)

/** Ajanın cevap yazısından JSON nesnesi (başında, sonunda yazı ya da ``` olsa da) ya da null. */
export function parseReaderReply(reply) {
  const s = String(reply ?? "")
  const from = s.indexOf("{")
  const to = s.lastIndexOf("}")
  if (from < 0 || to <= from) return null
  let o
  try {
    o = JSON.parse(s.slice(from, to + 1))
  } catch {
    return null
  }
  if (!o || typeof o !== "object") return null
  const total =
    typeof o.total === "number"
      ? o.total
      : typeof o.total === "string" && /^\d+(\.\d+)?$/.test(o.total.trim())
        ? Number(o.total)
        : null
  return {
    kind: KINDS.includes(o.kind) ? o.kind : "unreadable",
    total: Number.isFinite(total) && total > 0 ? total : null,
    totalEvidence: text(o.totalEvidence, 160),
    currency: typeof o.currency === "string" ? o.currency.trim().toUpperCase() : null,
    date: typeof o.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.date) ? o.date : null,
    firm: text(o.firm, 80),
    receiptNo: text(o.receiptNo, 40),
    categoryHint: typeof o.categoryHint === "string" ? o.categoryHint : null,
  }
}

/** Kanıt yazısında (ör. "TOPLAM *1.250,50") bu tutar geçiyor mu — iki ayraç düzeniyle de. */
export function evidenceHas(total, evidence) {
  if (!total || !evidence) return false
  for (const token of evidence.match(/\d[\d.,]*/g) ?? []) {
    const t = token.replace(/[.,]$/, "")
    const tries = [
      Number(t.replace(/\./g, "").replace(",", ".")),
      Number(t.replace(/,/g, "")),
      Number(t),
    ]
    if (tries.some((n) => Number.isFinite(n) && Math.abs(n - total) < 0.005)) return true
  }
  return false
}

/** Ajanın kategori ipucu → masraf kategorisi (TL dışı birimde yurtdışı) ya da null. */
export function categoryOf(hint, currency) {
  const pair = HINTS[hint]
  if (!pair) return null
  const name = currency && currency !== "TRY" ? pair[1] : pair[0]
  return EXPENSE_CATEGORIES.includes(name) ? name : null
}

/**
 * Okuma → `{ status, values? }`: "done" (kaleme yazılacak alanlar: amount, currency, date,
 * category, firm, receipt) ya da okunamama nedeni ("unreadable", "not_receipt", "multiple").
 */
export function readingToLine(reading, { locale = "tr", today = new Date() } = {}) {
  if (!reading) return { status: "unreadable" }
  if (reading.kind !== "receipt") return { status: reading.kind }
  const values = {}
  if (reading.total && evidenceHas(reading.total, reading.totalEvidence))
    values.amount = formatAmount(reading.total, locale)
  if (CURRENCIES.includes(reading.currency)) values.currency = reading.currency
  if (reading.date) {
    const [y, m, d] = reading.date.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    const day = startOfDay(today)
    if (date.getMonth() === m - 1 && date <= day && date > addDays(day, -OLDEST_DAYS))
      values.date = date
  }
  const category = categoryOf(reading.categoryHint, values.currency ?? reading.currency)
  if (category) values.category = category
  if (reading.firm) values.firm = reading.firm
  if (reading.receiptNo) values.receipt = reading.receiptNo
  return Object.keys(values).length ? { status: "done", values } : { status: "unreadable" }
}

const filled = (v) => v != null && String(v).trim() !== ""

/** Fişle doldurulabilir kalem: tutarı da kategorisi de boş (kişi henüz yazmamış). */
export const isFillableLine = (values) => !filled(values?.amount) && !filled(values?.category)

/**
 * Okunanı kaleme katar, kişinin yazdığını ezmez: boş alan dolar; tarih yalnız varsayılansa
 * (bugün) değişir; para birimi yalnız tutar boşken (tutarla birlikte seçilir).
 */
export function mergeReading(current, read, today = new Date()) {
  const next = { ...current }
  for (const [key, value] of Object.entries(read)) {
    const cur = current?.[key]
    const free =
      key === "date"
        ? !cur || sameDay(cur, today)
        : key === "currency"
          ? !filled(current?.amount)
          : !filled(cur)
    if (free) next[key] = value
  }
  return next
}
