import { lazy, Suspense } from "react"

const OneNoteWidget = lazy(() => import("./OneNoteWidget"))

/** OneNote kendi parçasında iner: kartı eklemeyenin açılış paketine girmez. */
export function OneNoteGate({ className }) {
  return (
    <Suspense fallback={<div className={className} />}>
      <OneNoteWidget className={className} />
    </Suspense>
  )
}
