import { lazy, Suspense } from "react"
import { LOGIN_PALETTE } from "@/providers/PaletteProvider"

// Maskot tembel (21 KB'lık çizici): sayfa kendi parçasında, maskot onun da arkasından iner.
const MascotOrb = lazy(() => import("@/components/brand/mascot/MascotOrb"))

/** Maskotun tuvali 440×470, küre çapı tuvalin 342/440'ı (`BrandOrb` › ORB_RATIO ile aynı). */
const ORB_RATIO = 342 / 440

/**
 * Sayfanın maskotu — kullanıcının "küre / maskot" tercihinden BAĞIMSIZ hep gözlü maskot: sayfanın
 * konusu onun kendisi. Gözler imleci sayfanın her yerinde izler (`followPointer="page"`; dokunmatikte
 * kaydırma olduğu için yalnız fare ve kalem), göz kırpma maskotun kendi döngüsü. Renk girişin
 * paletinden. Kutu maskot inmeden de aynı boyda: başlık ve düğme yerinden oynamaz.
 */
export function LoginMascot({ state, size }) {
  const width = Math.round(size / ORB_RATIO)
  const height = Math.round((width * 470) / 440)
  return (
    <div className="login-mascot" style={{ width, height }} aria-hidden="true">
      <Suspense fallback={null}>
        <MascotOrb
          decorative
          state={state}
          paletteId={LOGIN_PALETTE}
          followPointer="page"
          size={size}
        />
      </Suspense>
    </div>
  )
}
