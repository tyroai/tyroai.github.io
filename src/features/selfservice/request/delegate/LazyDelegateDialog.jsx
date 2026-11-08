import { lazy, Suspense, useState } from "react"

const DelegateDialog = lazy(() =>
  import("./DelegateDialog").then((m) => ({ default: m.DelegateDialog })),
)

/**
 * Temsilci ata penceresi ayrı parçada: yalnız politikadaki kişi açabildiği için ilk açılışta
 * iner. Açılış başına taze form (`open.seq` anahtar); ilk açılıştan sonra hep çizilir (kapanış
 * animasyonu). `open`: `{ seq, from, initial? }` ya da `null` (`initial`: Anlat'ın değerleri).
 */
export function LazyDelegateDialog({ open, onClose }) {
  const [last, setLast] = useState(open)
  if (open && open !== last) setLast(open)
  if (!last) return null
  return (
    <Suspense fallback={null}>
      <DelegateDialog
        key={last.seq}
        open={Boolean(open)}
        onClose={onClose}
        from={last.from}
        initial={last.initial}
      />
    </Suspense>
  )
}
