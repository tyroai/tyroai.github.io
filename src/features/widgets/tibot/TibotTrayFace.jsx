import "@/lib/i18n/tibot"
import { useEffect } from "react"
import { loadTickets } from "@/lib/tibot/tibotApi"

/**
 * Ticket'un header/çentik yüzünün canlı parçası (`LiveCapsule`, hep `bare`): listeyi bir kez okur
 * (5 dk tazeyse yeniden istemez; yoklama yok) — tepsideki bilet simgesinin sayısı ve çentiğin
 * göstergesi `lib/tibot/tibotPeek`ten çizilir. Görünür bir şey eklemez.
 */
export default function TibotTrayFace({ children }) {
  useEffect(() => {
    // Okunamazsa yüz yalnız simge kalır; hata widget açılınca görünür.
    loadTickets().catch(() => {})
  }, [])
  return children
}
