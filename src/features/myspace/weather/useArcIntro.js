import { useEffect } from "react"
import { animate, useMotionValue, useTransform } from "motion/react"
import { useIntroOnce } from "@/features/myspace/hooks/useIntroOnce"

const DURATION = 1.7
const ease = (x) => 1 - Math.pow(1 - x, 3)

/**
 * Yaydaki işaretin girişi: ilk açılışta güneş/ay yayın başından doğup
 * gerçek yerine kayar, renkli gidilen yol onunla dolar. Parametre uzayında
 * (`CARD_ARC.param`) — nokta ile çizginin ucu birlikte yürür.
 *
 * Dönen değer React durumu değil, motion değeri: durum olunca giriş 1,7 sn boyunca her karede
 * kartın tamamını yeniden çizdiriyordu; açılışın engelleme süresinin (TBT) çoğu buydu. Okuyan
 * öğeler motion bileşeni (`CardSymbol`, `motion.path`). Konum yoksa değer `null`.
 */
export function useArcIntro(target) {
  const play = useIntroOnce("weather-arc")
  const progress = useMotionValue(play ? 0 : 1)
  const ready = target != null
  useEffect(() => {
    if (!play || !ready) return undefined
    const run = animate(progress, 1, { duration: DURATION, ease: "linear" })
    return () => run.stop()
  }, [play, ready, progress])
  return useTransform(progress, (k) => (ready ? target * ease(k) : null))
}
