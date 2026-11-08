import { useEffect, useState } from "react"

// Sayfa yüklemesi başına bir kez: Anasayfa'ya geri dönen kişi girişi yeniden izlemez.
const seen = new Set()

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

// Bakan yokken (pencere odakta değil: arka plan sekmesi, DevTools'tan Lighthouse) giriş oynamaz,
// son hâl çizilir — kareler boşa ve açılışla yarışıyordu (`lib/restMode` › açılış sakinliği).
const unwatched = () => typeof document !== "undefined" && document.hasFocus?.() === false

/**
 * `key`in giriş animasyonu bu yüklemede oynatılsın mı (hareket azaltılmışsa ya da bakan yoksa hiç).
 * Bakan yokken atlanan giriş "görüldü" sayılmaz: Anasayfa'ya bir sonraki dönüşte oynar.
 */
export function useIntroOnce(key) {
  const [play] = useState(() => !seen.has(key) && !reducedMotion() && !unwatched())
  useEffect(() => {
    if (play) seen.add(key)
  }, [key, play])
  return play
}
