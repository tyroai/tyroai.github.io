import { lazy, Suspense } from "react"

const SavedSearchWidget = lazy(() => import("./SavedSearchWidget"))

/** Kayıtlı arama kendi parçasında iner: kartı eklemeyenin açılış paketine girmez. */
export function SavedSearchGate({ className }) {
  return (
    <Suspense fallback={<div className={className} />}>
      <SavedSearchWidget className={className} />
    </Suspense>
  )
}
