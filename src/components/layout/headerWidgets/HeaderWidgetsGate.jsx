import { lazy, Suspense } from "react"
import { useBoardEditing } from "@/lib/boardEdit"
import { useHeaderWidgets } from "./headerStore"

const HeaderWidgets = lazy(() => import("./HeaderWidgets"))

/**
 * Header'daki widget tepsisinin kapısı: tepsi yalnız sabitlenmiş widget varken ya da Anasayfa
 * (Pano) düzenlenirken iner ve çizilir — kullanmayanın paketine girmez. `free`: header'daki
 * boşluğu tutan ara parça (tepsi sığıyor mu, `useTrayFits`).
 */
export function HeaderWidgetsGate({ free }) {
  const { items } = useHeaderWidgets()
  const editing = useBoardEditing()
  if (!items.length && !editing) return null
  return (
    <Suspense fallback={null}>
      <HeaderWidgets free={free} editing={editing} />
    </Suspense>
  )
}
