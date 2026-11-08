import { lazy, Suspense } from "react"

// İpucunun talep listesi ve talep penceresi yalnız açılınca iner (Anasayfa paketine girmez).
const TicketTipList = lazy(() => import("./TicketTipList"))
const TicketSheet = lazy(() => import("./TicketSheet").then((m) => ({ default: m.TicketSheet })))

/** İpucundaki talepler (`kind`: "onMe" | "waiting", `onOpen`); Günün özeti, brifing, karşılama. */
export function TicketTipListLazy(props) {
  return (
    <Suspense fallback={null}>
      <TicketTipList {...props} />
    </Suspense>
  )
}

/** İpucundan açılan talebin penceresi (yalnız `row` varken iner). */
export function TicketSheetLazy({ row, onClose }) {
  if (!row) return null
  return (
    <Suspense fallback={null}>
      <TicketSheet row={row} onOpenChange={(o) => !o && onClose()} />
    </Suspense>
  )
}
