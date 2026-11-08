import { useEffect, useState } from "react"
import { inkReport, SHADE_BELOW } from "@/lib/gradientInk"

/**
 * Marka gradyanının üstündeki mürekkep (`"light"` · `"dark"`), palet ya da
 * tema değişince YENİDEN ÖLÇÜLÜR (kural ve ölçümler `lib/gradientInk.js`).
 *
 * ⚠️ **`<html>`İ İZLER, sağlayıcıyı değil.** Palet ve tema sağlayıcıları
 * özniteliği ebeveynin PASİF etkisinde yazıyor; çocuğun etkisi ondan ÖNCE
 * koşuyor ve eski paleti okurdu. `MutationObserver` özniteliğin gerçekten
 * değiştiği anı yakalıyor; ölçüm bir sonraki karede (stil çözülmüş olsun).
 */
function useInkReport() {
  const [report, setReport] = useState(() => inkReport())
  useEffect(() => {
    const root = document.documentElement
    let raf = 0
    const measure = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const next = inkReport()
        setReport((prev) => (prev.ink === next.ink && prev.worst === next.worst ? prev : next))
      })
    }
    measure()
    const observer = new MutationObserver(measure)
    observer.observe(root, { attributes: true, attributeFilter: ["data-palette", "class"] })
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])
  return report
}

export function useGradientInk() {
  return useInkReport().ink
}

/**
 * Karşılama kartının mürekkebi ve örtüsü: `{ ink, shade }` — `shade` örtü gerekiyorsa mürekkep
 * (`"light"` · `"dark"`), gerekmiyorsa `null` (`lib/gradientInk.js` › `SHADE_BELOW`).
 */
export function useHeroInk() {
  const { ink, worst } = useInkReport()
  return { ink, shade: worst != null && worst < SHADE_BELOW ? ink : null }
}
