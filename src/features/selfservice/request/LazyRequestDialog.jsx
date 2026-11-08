import { lazy, Suspense, useEffect, useState } from "react"

const load = () => import("./RequestDialog")
const RequestDialog = lazy(() => load().then((m) => ({ default: m.RequestDialog })))

/**
 * Talep formu ayrı parçada (`RequestDialog`: üç form, takvim, ızgara, yapıştırma, önizleme
 * araçları) — Self Servis sayfası onsuz açılır, telefonda da hızlı. Sayfa boştayken önceden
 * yüklenir: ilk "Yeni"de beklenmez. İlk açılıştan sonra hep çizilir (kapanış animasyonu, taslak).
 */
export function LazyRequestDialog(props) {
  const [used, setUsed] = useState(Boolean(props.request))
  if (props.request && !used) setUsed(true)
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500))
    const cancel = window.cancelIdleCallback ?? clearTimeout
    const id = idle(() => load().catch(() => {}))
    return () => cancel(id)
  }, [])
  if (!used) return null
  return (
    <Suspense fallback={null}>
      <RequestDialog {...props} />
    </Suspense>
  )
}
