import { useSyncExternalStore } from "react"
import { usePwaInstall } from "@/hooks/usePwaInstall"
import { dismissPromo, promoState, promoVisible, subscribePromo } from "@/lib/pwaPromo"

/** Anasayfa kurulum kartı: `{ show, ios, dismiss }` — kurallar `lib/pwaPromo.js`. */
export function useInstallPromo() {
  const pwa = usePwaInstall()
  const promo = useSyncExternalStore(subscribePromo, promoState, promoState)
  return { show: promoVisible(promo, pwa), ios: pwa.ios && !pwa.canPrompt, dismiss: dismissPromo }
}
