import { lazy, Suspense, useSyncExternalStore } from "react"
import { isRadioActive, subscribeRadioActive } from "@/lib/radioSignal"

const RadioTrayFace = lazy(() =>
  import("./HeaderWidgets").then((m) => ({ default: m.RadioTrayFace })),
)

/**
 * Çalan radyonun header'daki yüzü — radyo tepside DEĞİLKEN (çentikte ya da hiçbir yerde): tepsinin
 * radyo düğmesi ve kapsülü (`RadioTrayFace`), eski hap değil. Yalnız bir istasyon açıkken iner ve
 * çizilir: radyo kullanmayanın paketine girmez (ana pakette yalnız `radioSignal` bayrağı).
 */
export function RadioFaceGate() {
  const active = useSyncExternalStore(subscribeRadioActive, isRadioActive, isRadioActive)
  return active ? (
    <Suspense fallback={null}>
      <RadioTrayFace />
    </Suspense>
  ) : null
}
