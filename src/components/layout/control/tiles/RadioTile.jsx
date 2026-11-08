import { lazy, Suspense } from "react"
import { TRAY_TILE } from "../../headerWidgets/trayIcon"
import { useControlLook } from "../controlStore"
import { preloadPanel } from "../panelPreload"
import { TileShell } from "./TileShell"

// Yüz kendi parçasında (diskin çizimi, sayaç, ses dalgası) ama panelle birlikte önden iner:
// kutucuk açılışta boş görünmesin.
const DiscTile = lazy(TRAY_TILE.radio)
TRAY_TILE.radio().catch(() => {})

/**
 * Tyrofy (iki satır): Tyrofy Disk kartının küçük hâli — üst kenardan taşan yarım plak,
 * çalarken dönen kanal görseli ve altında ses dalgası, tür · yer, ad ve süre (`DiscTile`).
 * Kutucuğa dokununca radyonun sahnesi panelin içinde açılır; sağ üstteki düğme çalar/duraklatır.
 */
export function RadioTile({ onOpen, ...shell }) {
  // Cam görünümde canlı yüz durgun: bulanık camın içinde sürekli hareket her kareyi yeniden boyatır.
  const still = useControlLook() === "glass"
  return (
    <TileShell id="radio" {...shell}>
      <Suspense fallback={<span aria-hidden="true" className="cc-disc-skel" />}>
        <DiscTile
          onOpen={() => onOpen("radio")}
          onIntent={() => preloadPanel("radio")}
          still={still}
        />
      </Suspense>
    </TileShell>
  )
}
