import { lazy, Suspense } from "react"

const TranslateWidget = lazy(() => import("./TranslateWidget"))

/** Çevir kendi parçasında iner: kartı eklemeyenin açılış paketine girmez. */
export function TranslateGate({ className }) {
  return (
    <Suspense fallback={<div className={className} />}>
      <TranslateWidget className={className} />
    </Suspense>
  )
}
