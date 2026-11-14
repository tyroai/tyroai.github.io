import { useEffect } from "react"
import { useMsal } from "@azure/msal-react"
import { currentStickyPeek, setStickyPeek } from "@/lib/stickyCount"
import { readSnapshot } from "@/lib/snapshot"
import { PEEK_SNAPSHOT } from "./stickyStore"

// Özet (sayı + renkler) bir hafta geçerli: not metni taşımaz, yalnız rozet ve deste için.
const PEEK_MAX_AGE = 7 * 24 * 60 * 60 * 1000

/**
 * Yapışkan notların header/çentik yüzünün canlı parçası (`LiveCapsule`). OneNote'a İSTEK ATMAZ:
 * notlar yalnız çentik açılınca okunur (`StickyWidget`). Rozet ve kâğıt destesi
 * (`headerWidgets/faces/StickyDeck`) cihazdaki son özetle çizilir (`lib/snapshot`); panel açılıp
 * liste okununca özet tazelenir. Görünür bir şey eklemez.
 */
export default function StickyTrayFace({ children }) {
  const { accounts } = useMsal()
  const who = accounts[0]?.homeAccountId ?? null

  useEffect(() => {
    if (currentStickyPeek()) return
    const saved = readSnapshot(PEEK_SNAPSHOT, who, { maxAgeMs: PEEK_MAX_AGE })
    if (saved) setStickyPeek(saved.value)
  }, [who])

  return children
}
