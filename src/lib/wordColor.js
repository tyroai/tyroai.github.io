import { palettes } from "@/data/palettes"
import { contrast } from "@/lib/gradientInk"

/** "tyro" yazısının varsayılanı: kurumsal lacivert, koyu temada yazı rengi (`--brand-word`). */
export const WORD_CORPORATE = "corporate"

// Kenar çubuğu zemini. Yazı bir logo, metin değil: tonu bozulmasın diye eşik 2:1 — yalnız zeminde
// kaybolan ton (Insta'nın sarısı, Midnight'ın gece mavisi koyu temada) okunana dek kayar.
const BG = { light: [250, 250, 250], dark: [23, 23, 23] }
const MIN = 2

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`

/** Rengi zeminden en az 2:1 ayrılana dek koyu temada beyaza, açık temada siyaha yaklaştırır. */
export function visibleOn(hex, dark) {
  const bg = dark ? BG.dark : BG.light
  const to = dark ? 255 : 0
  const rgb = toRgb(hex)
  for (let step = 0; step <= 20; step += 1) {
    const mixed = rgb.map((v) => v + (to - v) * (step / 20))
    if (contrast(mixed, bg) >= MIN) return toHex(mixed)
  }
  return toHex([to, to, to])
}

/**
 * Yazının dolgu durakları, soldan sağa: kurumsal renkte `null`; düz palette tek renk, degradede
 * paletin üç durağı. Siyah palet koyu temada beyaza döner, uygulamadaki gibi.
 */
export function wordStops(id, dark) {
  const palette = palettes.find((p) => p.id === id)
  if (!palette) return null
  if (palette.id === "black") return [dark ? "#ffffff" : "#000000"]
  const colors = palette.group === "solid" ? palette.swatch.slice(0, 1) : palette.swatch
  return colors.map((hex) => visibleOn(hex, dark))
}
