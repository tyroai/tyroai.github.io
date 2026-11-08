import { SlotSelect } from "../../SlotSelect"
import { useRecentCategories } from "./useRecentCategories"

/**
 * Masraf kategorisinin seçicisi: `SlotSelect` + en üstte kişinin "Son kullandıkların"ı (ERP
 * geçmişi varsa). Kalemin yazdığı kategoriler listeye katılmaz: seçerken sıra kaymasın, el
 * alıştığı yeri bulsun.
 */
export function CategorySelect(props) {
  const recent = useRecentCategories()
  return <SlotSelect {...props} recent={recent} />
}
