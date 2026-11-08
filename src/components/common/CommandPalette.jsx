import { lazy, Suspense, useEffect, useState } from "react"

const load = () => import("./spotlight/Spotlight")
const Spotlight = lazy(() => load().then((m) => ({ default: m.Spotlight })))

/**
 * Ctrl/⌘+K ve header'daki Ara… — ikisi de aynı pencere: Spotlight (`spotlight/`). Katalog (sayfalar,
 * alt yerler, eylemler) tek kaynakta: `spotlight/spotlightCatalog.js`.
 * Pencere ayrı parçada (kişi ve ofis kartı, Yardım cevapları ilk yüklemeye girmesin); sayfa
 * boştayken önceden yüklenir, ilk Ctrl/⌘+K'de beklenmez. İlk açılıştan sonra hep çizilir (kapanış
 * animasyonu).
 */
export function CommandPalette(props) {
  const [used, setUsed] = useState(props.open)
  if (props.open && !used) setUsed(true)
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500))
    const cancel = window.cancelIdleCallback ?? clearTimeout
    const id = idle(() => load().catch(() => {}))
    return () => cancel(id)
  }, [])
  if (!used) return null
  return (
    <Suspense fallback={null}>
      <Spotlight {...props} />
    </Suspense>
  )
}
