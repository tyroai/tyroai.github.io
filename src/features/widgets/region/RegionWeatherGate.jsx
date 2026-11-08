import { lazy, Suspense } from "react"

const RegionWeatherWidget = lazy(() => import("./RegionWeatherWidget"))

/** Bölge havası kendi parçasında iner: kartı eklemeyenin açılış paketine girmez. */
export function RegionWeatherGate({ className }) {
  return (
    <Suspense fallback={<div className={className} />}>
      <RegionWeatherWidget className={className} />
    </Suspense>
  )
}
