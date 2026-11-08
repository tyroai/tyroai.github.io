import { lazy, Suspense } from "react"

const RmPulseWidget = lazy(() => import("./RmPulseWidget"))

/** tyroRM'in hesap motoru büyük ve kartı yalnız yetkili görür: kart kendi parçasında iner. */
export function RmPulseGate({ className }) {
  return (
    <Suspense fallback={<div className={className} />}>
      <RmPulseWidget className={className} />
    </Suspense>
  )
}
