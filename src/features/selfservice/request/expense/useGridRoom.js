import { useCallback, useSyncExternalStore } from "react"

// Izgaranın çevresi (rem): pencerenin ekrandan payı 3rem, gövdenin iç boşluğu 3rem ve gövdenin
// dikey kaydırma çubuğu (klasik çubuk 15–17 px).
const FRAME_REM = 7.25

// Kök yazı boyu alçak ekranda küçülür (`theme.css`): bir kez okunur, pencere boyu değişince yeniden.
let rootPx = null
function readRoot() {
  if (rootPx == null) rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  return rootPx
}

function subscribe(cb) {
  const onResize = () => {
    rootPx = null
    cb()
  }
  window.addEventListener("resize", onResize)
  return () => window.removeEventListener("resize", onResize)
}

/**
 * Masraf ızgarası ekrana sığıyor mu: ekranın eni ≥ ızgaranın en dar hâli (`minRem`) + çevresi.
 * Medya sorgusu değil: sorgunun rem'i hep 16 px sayar, alçak ekranda küçülen kökü bilmez —
 * hesap gerçek kökle (alçak dizüstünde ızgara açılır, sığmayan aralıkta kartlar gelir).
 */
export function useGridRoom(minRem) {
  const get = useCallback(() => window.innerWidth >= (minRem + FRAME_REM) * readRoot(), [minRem])
  return useSyncExternalStore(subscribe, get, () => false)
}
