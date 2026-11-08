import { createContext, useContext, useSyncExternalStore } from "react"

// Göreli parlaklık (WCAG): sRGB 0–255 → 0–1.
function luminance(r, g, b) {
  const ch = (v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
}

/** Saf karar: iki tonun parlaklığından mürekkep, gölge gücü ve ortalama açıklık (testli). */
export function inkFor(from, via, threshold = 0.36) {
  const avg = (from + via) / 2
  return {
    ink: avg > threshold ? "dark" : "light",
    veil: Math.min(0.95, Math.max(0.5, (avg - 0.04) / 0.26)),
    light: avg,
  }
}

const FALLBACK = { ink: "light", veil: 0.95, light: 0.3 }
let value = FALLBACK
const subs = new Set()
let stop = null

let pen = null
/** Renk hex de oklch de olabildiği için 1 piksellik tuvale boyanır, oradan okunur. */
function lum(color) {
  if (!color) return null
  if (!pen) {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    pen = canvas.getContext("2d", { willReadFrequently: true })
  }
  if (!pen) return null
  pen.clearRect(0, 0, 1, 1)
  pen.fillStyle = "#000"
  pen.fillStyle = color
  pen.fillRect(0, 0, 1, 1)
  const [r, g, b] = pen.getImageData(0, 0, 1, 1).data
  return luminance(r, g, b)
}

/** Verilen iki tonun mürekkebi (widget'ın kendi paleti için). */
export function inkOfColors(fromColor, viaColor) {
  const from = lum(fromColor)
  const via = lum(viaColor)
  return from == null || via == null ? null : inkFor(from, via)
}

function read() {
  const root = getComputedStyle(document.documentElement)
  const from = lum(root.getPropertyValue("--brand-from").trim())
  const via = lum(root.getPropertyValue("--brand-via").trim())
  if (from == null || via == null) return
  const next = inkFor(from, via)
  if (next.ink === value.ink && next.veil === value.veil && next.light === value.light) return
  value = next
  for (const fn of subs) fn()
}

function subscribe(fn) {
  subs.add(fn)
  if (!stop) {
    // Tek gözlemci bütün kartlara yeter: palet ya da tema değişince bir kez okunur.
    const id = requestAnimationFrame(read)
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-palette", "data-theme"],
    })
    stop = () => {
      cancelAnimationFrame(id)
      mo.disconnect()
      stop = null
    }
  }
  return () => {
    subs.delete(fn)
    if (!subs.size) stop?.()
  }
}

/** Kendi paleti olan kartın mürekkebi (kabuk verir); yoksa uygulamanınki. */
export const CardInkContext = createContext(null)

/**
 * Marka degradesinin üstündeki yazı beyaz mı, koyu mu olmalı: yazının durduğu tonlar
 * (`--brand-from` ile `--brand-via`nın ortalaması) açıksa koyu mürekkep. `veil`: beyaz yazının
 * altındaki koyu gölgenin gücü — zaten koyu paletlerde hafif (renk canlı kalsın), orta tonlarda
 * güçlü (kontrast AA). Bütün kartlar tek ölçümü paylaşır; palet ya da tema değişince yeniden.
 * Kendi paleti olan kartın içinde (`CardInkContext`) o paletin mürekkebi.
 */
export function useBrandInk() {
  const local = useContext(CardInkContext)
  const global = useSyncExternalStore(
    subscribe,
    () => value,
    () => FALLBACK,
  )
  return local ?? global
}
