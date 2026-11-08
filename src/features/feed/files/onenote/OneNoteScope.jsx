import { lazy, Suspense } from "react"
import { RowsSkeleton } from "../FilesStates"

const OneNoteFind = lazy(() => import("./OneNoteFind"))

/** Bul'un OneNote kapsamı kendi parçasında iner (okuyucu, metinler): dosya açılışına girmez. */
export function OneNoteScope(props) {
  return (
    <Suspense fallback={<RowsSkeleton rows={6} />}>
      <OneNoteFind {...props} />
    </Suspense>
  )
}
