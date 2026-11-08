import { listText } from "@/features/selfservice/lib/expenseLine"

/**
 * Kalemin uyarı metinleri, önemine göre: ERP'de eşi olabilir ("Daha önce girilmiş olabilir:
 * EXP-0310"; kalemde kategori yoksa eşin kategorisi de), formda aynısı var ("Kalem 3 ile aynı
 * görünüyor"). Uyarı yoksa boş dizi.
 */
export function warningTexts(t, locale, warning, values) {
  if (!warning) return []
  const out = []
  const seen = warning.submitted
  if (seen) {
    const ref =
      values?.category || !seen.category ? seen.number : `${seen.number} · ${seen.category}`
    out.push(t("selfService.expense.seenBefore", { ref }))
  }
  if (warning.twins?.length) {
    const list = listText(locale, warning.twins.map(String))
    out.push(t("selfService.expense.sameAs", { list }))
  }
  return out
}
