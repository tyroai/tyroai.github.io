import { useNavigate } from "react-router-dom"
import { KIND_ORDER } from "./entryText"
import { WhatsNewSheet } from "./dialog/WhatsNewSheet"
import { useWhatsNewDialog } from "./hooks/useWhatsNewDialog"

/**
 * Girişte bir kez açılan Yenilikler penceresi. Açılma kararı `useWhatsNewDialog`, görünüm
 * `dialog/WhatsNewSheet`. Burada yalnız çizim sırası:
 * - Önce yenilik, sonra iyileştirme (önem sırası; sayfa ise zaman çizgisi). `sort` kararlı:
 *   tür içinde yeniden eskiye sıra korunur. Okundu işareti bu diziye bakmaz.
 * - Tavan (`MAX_IN_DIALOG`) sıralamadan SONRA: aşan, "en az öncelikli" olandır ve sayısı
 *   "Tümünü gör"de yazılır (üç ay sonra dönene 40 kartlık pencere kaydırtılmaz).
 * - Tarih sıralamadan ÖNCEKİ ilk kayıttan: en yeni değişiklik, en yeni "yenilik" değil.
 */
const MAX_IN_DIALOG = 5

export function WhatsNewDialog() {
  const navigate = useNavigate()
  const [shown, setShown] = useWhatsNewDialog()

  if (!shown?.items?.length) return null
  const items = [...shown.items].sort(
    (a, b) => (KIND_ORDER[a.kind] ?? 99) - (KIND_ORDER[b.kind] ?? 99),
  )
  const close = () => setShown(null)
  const go = (to) => {
    setShown(null)
    navigate(to)
  }

  return (
    <WhatsNewSheet
      mode={shown.mode}
      items={items.slice(0, MAX_IN_DIALOG)}
      extra={Math.max(0, items.length - MAX_IN_DIALOG)}
      newestDate={shown.items[0].date}
      onClose={close}
      onGo={go}
    />
  )
}
