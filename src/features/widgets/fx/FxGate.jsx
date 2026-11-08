import { lazy, Suspense } from "react"

const FxWidget = lazy(() => import("./FxWidget"))

/** Döviz çevirici kendi parçasında iner: kartı eklemeyenin açılış paketine girmez. */
export function FxGate({ className }) {
  return (
    <Suspense fallback={<div className={className} />}>
      <FxWidget className={className} />
    </Suspense>
  )
}
