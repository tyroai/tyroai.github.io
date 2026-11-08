import { createContext, useContext, useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { submittedMatch } from "@/features/selfservice/lib/expenseHistory"
import { useRequestData } from "../../requestData"

/**
 * Kalemlerin uyarıları (`lineWarnings`: ERP'de eşi olabilir · formda aynısı var), formun
 * bütün kalemlerinden bir kez hesaplanır (`LineWarningsProvider`). Yoksa (`null`) her kalem
 * yalnız ERP'deki eşine kendisi bakar.
 */
export const LineWarningsContext = createContext(null)

/**
 * Kalemin uyarısı: `{ submitted, twins }` ya da null. Uyarı küçük yapraklarda okunur (numara,
 * ipucu): yazılan kalem değişince bütün satırlar değil yalnız onlar yeniden çizilir.
 */
export function useLineWarning(row) {
  const all = useContext(LineWarningsContext)
  const { expenses } = useRequestData() ?? {}
  const { locale } = useLocale()
  const values = row?.values
  const own = useMemo(() => {
    if (all || !values) return null
    const submitted = submittedMatch(values, expenses, locale)
    return submitted ? { submitted, twins: [] } : null
  }, [all, values, expenses, locale])
  return all ? (all.get(row?.id) ?? null) : own
}
