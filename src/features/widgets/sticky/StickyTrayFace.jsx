import { useEffect, useMemo } from "react"
import { useMsal } from "@azure/msal-react"
import { loadStickyNotes } from "./stickyStore"

/**
 * Yapışkan notların header/çentik yüzünün canlı parçası (`LiveCapsule`): yalnız notları okur ki
 * tepsideki ve çentikteki kâğıt destesi (`headerWidgets/faces/StickyDeck`) gerçek renkleri ve
 * sayıyı göstersin. Görünür bir şey eklemez (çerçeve ve "+" kaldırıldı: deste düğmenin kendisi,
 * yeni not widget'ın penceresinden).
 */
export default function StickyTrayFace({ children }) {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const ctx = useMemo(() => ({ instance, account }), [instance, account])

  // Liste açılışta bir kez okunur (5 dk tazeyse yeniden istenmez; yoklama yok).
  useEffect(() => {
    loadStickyNotes(ctx)
  }, [ctx])

  return children
}
