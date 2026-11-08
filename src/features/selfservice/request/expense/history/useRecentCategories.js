import { useMemo } from "react"
import { useToday } from "@/hooks/useToday"
import { recentCategories } from "@/features/selfservice/lib/expenseHistory"
import { useRequestData } from "../../requestData"

const NONE = []
// Aynı ERP verisi ve gün için tek hesap: her kalemin seçicisi aynı listeyi paylaşır.
const cache = new WeakMap()

/**
 * Kişinin son 12 ayda en çok kullandığı masraf kategorileri (ERP kayıtlarından,
 * `recentCategories`); kayıt yoksa ya da henüz gelmediyse boş. Dizi aynı veri ve günde aynı
 * nesne: seçicinin öğeleri yeniden kurulmaz.
 */
export function useRecentCategories() {
  const { expenses } = useRequestData() ?? {}
  const today = useToday()
  return useMemo(() => {
    if (!expenses?.length) return NONE
    const day = today.getTime()
    const hit = cache.get(expenses)
    if (hit?.day === day) return hit.list
    const list = recentCategories(expenses, { today })
    cache.set(expenses, { day, list: list.length ? list : NONE })
    return cache.get(expenses).list
  }, [expenses, today])
}
