import { EXPENSE_CATEGORIES } from "@/data/hrValues"
import { parseAmount } from "@/lib/requestForm"
import { statusKind } from "@/lib/selfServiceStatus"

/**
 * MASRAF GEÇMİŞİ — kişinin ERP'deki masraf raporlarından form için iki saf hesap: kategori
 * seçicinin "Son kullandıkların"ı ve "daha önce girilmiş olabilir" uyarısı. Reddedilen ve iptal
 * edilen raporlar sayılmaz: ERP'de duran bir harcama değiller, yeniden girilmeleri olağan.
 */

const TITLES = new Set(EXPENSE_CATEGORIES)
const VOID = new Set(["rejected", "cancelled"])
// Kuruş altı fark aynı tutar (ERP ondalığı ile yazılan tutarın yuvarlaması).
const CENT = 0.005

const isDay = (d) => d instanceof Date && !Number.isNaN(d.getTime())
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()
const currencyOf = (c) =>
  String(c ?? "")
    .trim()
    .toUpperCase() || "TRY"

/** ERP'de duran raporların kalemleri (`{ report, line }`). */
function* standingLines(expenses) {
  for (const report of expenses ?? []) {
    if (!report || VOID.has(report.statusKind ?? statusKind(report.status))) continue
    for (const line of report.lines ?? []) yield { report, line }
  }
}

/**
 * En çok kullanılan kategoriler (formun başlıklarıyla): son `months` ayın kalemleri sayılır,
 * önce sayı sonra en yeni kullanım, eşitse ad. Formda olmayan başlık (ERP'nin bilinmeyen
 * değeri) düşer. Dönüş: en çok `max` başlık; geçmiş yoksa boş dizi.
 */
export function recentCategories(expenses, { today = new Date(), max = 3, months = 12 } = {}) {
  const from = new Date(today.getFullYear(), today.getMonth() - months, today.getDate())
  const by = new Map()
  for (const { line } of standingLines(expenses)) {
    const title = line.categoryName
    if (!TITLES.has(title) || !isDay(line.date) || line.date < from) continue
    const entry = by.get(title) ?? { title, count: 0, last: 0 }
    entry.count += 1
    entry.last = Math.max(entry.last, line.date.getTime())
    by.set(title, entry)
  }
  return [...by.values()]
    .sort((a, b) => b.count - a.count || b.last - a.last || a.title.localeCompare(b.title, "tr"))
    .slice(0, max)
    .map((e) => e.title)
}

/**
 * Formdaki kalemin ERP'deki olası eşi: aynı gün, aynı para birimi, aynı tutar ve aynı kategori
 * (kalemde kategori seçilmemişse kategoriye bakılmaz). Engellemez, yalnız uyarır. Dönüş:
 * `{ number, date, category, amount, currency }` ya da null (tutar ya da tarih yoksa da null).
 */
export function submittedMatch(values, expenses, locale = "tr") {
  const amount = parseAmount(values?.amount, locale)
  const date = values?.date
  if (amount == null || !isDay(date)) return null
  const currency = currencyOf(values.currency)
  const category = values.category || null
  for (const { report, line } of standingLines(expenses)) {
    if (!isDay(line.date) || !sameDay(line.date, date)) continue
    if (currencyOf(line.currency) !== currency) continue
    if (typeof line.amount !== "number" || Math.abs(line.amount - amount) >= CENT) continue
    if (category && line.categoryName !== category) continue
    return {
      number: report.number,
      date: line.date,
      category: line.categoryName || line.category || "",
      amount: line.amount,
      currency,
    }
  }
  return null
}

/** Formun ERP'de eşi olabilecek kalemleri: `[{ rowId, n, match }]`, kalem sırasıyla. */
export function submittedRows(rows, expenses, locale = "tr") {
  if (!expenses?.length) return []
  const out = []
  ;(rows ?? []).forEach((row, i) => {
    const match = submittedMatch(row.values, expenses, locale)
    if (match) out.push({ rowId: row.id, n: i + 1, match })
  })
  return out
}
