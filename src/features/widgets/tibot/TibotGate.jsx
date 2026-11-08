import { lazy, Suspense } from "react"

// Tibot widget'ları yalnız kitledekilere: her kart, veri katmanı ve pencere kendi parçasında iner.
const PARTS = {
  "tibot-summary": lazy(() => import("./TibotNextWidget")),
  "tibot-rhythm": lazy(() => import("./TibotRunwayWidget")),
  "tibot-intro": lazy(() => import("./TibotPaceWidget")),
  "tibot-rings": lazy(() => import("./TibotRingsWidget")),
}

/**
 * Tibot widget'larının tembel kapısı: `tibot-rings` (Tibot Talepler · Halka), `tibot-summary` (Sıra sende),
 * `tibot-rhythm` (Pist), `tibot-intro` (Tempo). Kimlikler eski adlarıyla: kayıtlı düzenler korunur.
 */
export function TibotGate({ id = "tibot-rings", className, ...rest }) {
  const Part = PARTS[id] ?? PARTS["tibot-rings"]
  return (
    <Suspense fallback={<div className={className} />}>
      <Part className={className} {...rest} />
    </Suspense>
  )
}
