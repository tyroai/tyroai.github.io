import { useEffect, useState } from "react"
import { readBrandStops } from "@/lib/gradientInk"
import { welcomeInk } from "./welcomeInk"

const TOKENS = ["--brand-from", "--brand-via", "--brand-to", "--brand-deep"]
// Ölçülemezse (canvas yok) CSS'teki palet karışımları ve soluk beyaz + beyaz.
const FALLBACK = {
  scheme: "light",
  base: "rgb(255 255 255 / 0.78)",
  mark: "rgb(255 255 255)",
  stops: null,
}
const same = (a, b) => a.base === b.base && a.mark === b.mark && String(a.stops) === String(b.stops)

function measure(el) {
  const stops = readBrandStops(TOKENS, el)
  return stops ? welcomeInk(...stops) : FALLBACK
}

/**
 * Karşılama yazısının iki tonu ve zeminin durakları (`welcomeInk`), palet ya da tema değişince
 * yeniden ölçülür:
 * `<html>`in `data-palette` ve `class` özniteliği izlenir (`useGradientInk` ile aynı yol). `ref`
 * verilirse (karşılama kartı) tonlar o öğeden okunur: kartın kendi paleti de geçerli olur.
 */
export function useWelcomeInk(ref = null) {
  const [ink, setInk] = useState(() => measure(null))
  useEffect(() => {
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const next = measure(ref?.current ?? null)
        setInk((prev) => (same(prev, next) ? prev : next))
      })
    }
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-palette", "class"],
    })
    // Karşılama kartında kartın kendi paleti (görünüm seçeneği) sarmalayıcıda: o da izlenir.
    const own = ref?.current?.closest("[data-widget-look]")
    if (own)
      observer.observe(own, { attributes: true, attributeFilter: ["data-widget-palette", "style"] })
    update()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [ref])
  return ink
}
