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

function measure() {
  const stops = readBrandStops(TOKENS)
  return stops ? welcomeInk(...stops) : FALLBACK
}

/**
 * Karşılama yazısının iki tonu ve zeminin durakları (`welcomeInk`), palet ya da tema değişince
 * yeniden ölçülür:
 * `<html>`in `data-palette` ve `class` özniteliği izlenir (`useGradientInk` ile aynı yol).
 */
export function useWelcomeInk() {
  const [ink, setInk] = useState(measure)
  useEffect(() => {
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const next = measure()
        setInk((prev) => (same(prev, next) ? prev : next))
      })
    }
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-palette", "class"],
    })
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])
  return ink
}
