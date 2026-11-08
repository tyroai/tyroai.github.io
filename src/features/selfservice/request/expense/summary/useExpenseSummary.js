import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useToday } from "@/hooks/useToday"
import { expenseInsights } from "@/features/selfservice/lib/expenseInsights"
import { focusField } from "./focusField"

/**
 * Masraf özetinin ortak hesabı — gövdedeki `SummaryPanel` ile telefonun alt şeridindeki
 * `ExpenseDetails` aynı sayıları okusun: içgörüler (`features/selfservice/lib/expenseInsights`; yalnız formdan ve
 * kişinin masraf kayıtlarından, `history`), gönderme denendikten sonra hatası görünen kalemler
 * (denemeden sonra eklenen kalem sakin: özetin kırmızısı alt şeritteki sayıyla ve kalemlerdeki
 * hatalarla aynı), hata sayısı ve alana götüren `go`.
 */
export function useExpenseSummary({ form, idBase, history }) {
  const { locale } = useLocale()
  const today = useToday()
  const { expense } = form
  const { rows } = expense
  const receipts = expense.receipts.length
  const info = useMemo(
    () => expenseInsights(rows, { locale, today, receipts, history }),
    [rows, locale, today, receipts, history],
  )
  const errorRows = new Set(
    rows.filter((r, i) => Object.keys(form.rowErrors?.[i] ?? {}).length).map((r) => r.id),
  )
  return {
    info,
    tried: form.invalid > 0,
    errors: form.invalid,
    errorRows,
    go: (rowId, field) => focusField(expense, idBase, rowId, field),
  }
}
