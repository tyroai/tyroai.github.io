import { lazy, Suspense, useEffect, useState } from "react"

const load = () => import("@/features/selfservice/detail/RecordSheet")
const RecordSheet = lazy(() => load().then((m) => ({ default: m.RecordSheet })))
const RecordPane = lazy(() => load().then((m) => ({ default: m.RecordPane })))

/**
 * Self Servis'in kayıt ayrıntısı ayrı parçada: takvim onsuz açılır. Sayfa boştayken önceden
 * yüklenir (ilk çipte ya da satırda beklenmez); ilk açılıştan sonra hep çizilir (kapanış
 * animasyonu). Çağıran `RecordSheet`in özelliklerini verir.
 */
export function LazyRecordSheet(props) {
  const [used, setUsed] = useState(Boolean(props.record))
  if (props.record && !used) setUsed(true)
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500))
    const cancel = window.cancelIdleCallback ?? clearTimeout
    const id = idle(() => load().catch(() => {}))
    return () => cancel(id)
  }, [])
  if (!used) return null
  return (
    <Suspense fallback={null}>
      <RecordSheet {...props} />
    </Suspense>
  )
}

/** Aynı ayrıntı Takvim'in sağ panelinde (pencere yok): parça ön yüklemeyle zaten inmiş olur. */
export function LazyRecordPane(props) {
  return (
    <Suspense fallback={null}>
      <RecordPane {...props} />
    </Suspense>
  )
}
