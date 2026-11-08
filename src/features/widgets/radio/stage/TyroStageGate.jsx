import { lazy, Suspense } from "react"

// Header'daki sahneyle aynı parça (`TRAY_PANEL.radio`): bir kez iner.
const RadioStage = lazy(() => import("./RadioStage"))

/**
 * Tyrofy Sahne (`tyro-radio-stage`): header'daki sahne kartı panoda — mini kartta dikey,
 * büyük kartta yatay sahne. Kendi parçasında iner: kartı eklemeyenin açılış paketine girmez.
 */
export function TyroStageGate({ className }) {
  return (
    <Suspense fallback={<div className={className} />}>
      <RadioStage variant="card" className={className} />
    </Suspense>
  )
}
