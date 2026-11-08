import { lazy, Suspense } from "react"
import { TRAY_LIVE } from "../trayIcon"

// Her canlı yüz bir kez `lazy` olur (çizim sırasında bileşen kurulmaz).
const FACES = Object.fromEntries(Object.entries(TRAY_LIVE).map(([id, load]) => [id, lazy(load)]))

/**
 * Tepsideki widget'ın canlı kapsülü (Tyrofy'ın mini oynatıcısı gibi): widget'ın kendi parçası
 * düğmeyi (`children`: ikon ve penceresi) alıp yanına canlı içeriğini koyar. Parça inene kadar
 * ve yüzü olmayan widget'ta düğme tek başına. `bare`: kapsül çizilmez, yüzün parçası yalnız
 * verisini canlı tutar (çentik, toplu tepsi, "yalnız simge").
 */
export function LiveCapsule({ id, bare = false, children = null }) {
  const Face = FACES[id]
  if (!Face) return children
  return (
    <Suspense fallback={children}>
      <Face bare={bare}>{children}</Face>
    </Suspense>
  )
}
