import { lazy, Suspense } from "react"

const StickyWidget = lazy(() => import("./StickyWidget"))

/** Yapışkan notlar kendi parçasında iner: kartı eklemeyenin açılış paketine girmez. */
export function StickyGate({ className }) {
  return (
    <Suspense fallback={<div className={className} />}>
      <StickyWidget className={className} />
    </Suspense>
  )
}
