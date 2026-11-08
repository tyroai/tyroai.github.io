import { lazy, Suspense } from "react"

const RadioDisc = lazy(() => import("./RadioDisc"))

/**
 * Tyrofy Disk (`tyro-radio-disc`): dönen CD'li kompakt radyo kartı. Kendi parçasında iner:
 * kartı eklemeyenin açılış paketine girmez.
 */
export function TyroDiscGate({ className }) {
  return (
    <Suspense fallback={<div className={className} />}>
      <RadioDisc className={className} />
    </Suspense>
  )
}
