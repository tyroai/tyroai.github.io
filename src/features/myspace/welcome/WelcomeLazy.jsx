import { lazy, Suspense } from "react"

// Çekmecenin kodu ve stili yalnız gösterileceği zaman iner (telefon, oturumun ilk ziyareti).
const WelcomeDrawer = lazy(() => import("./WelcomeDrawer"))

export function WelcomeLazy(props) {
  return (
    <Suspense fallback={null}>
      <WelcomeDrawer {...props} />
    </Suspense>
  )
}
