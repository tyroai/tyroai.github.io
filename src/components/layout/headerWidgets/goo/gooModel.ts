/**
 * Yapışkan açılışın saf hesapları (testli): ekran kutuları, filtrenin çalışacağı alan, yerel
 * koordinat, rengin opaklığı ve etkinin açılıp açılmayacağı.
 */

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

interface RectLike {
  left: number
  top: number
  width: number
  height: number
}

export const boxOf = (r: RectLike): Box => ({ x: r.left, y: r.top, w: r.width, h: r.height })

/** İki kutuyu ve bulanıklık payını içine alan alan: filtre yalnız bu kadar alanda çalışsın. */
export function unionBox(a: Box, b: Box, pad: number): Box {
  const x = Math.min(a.x, b.x) - pad
  const y = Math.min(a.y, b.y) - pad
  const right = Math.max(a.x + a.w, b.x + b.w) + pad
  const bottom = Math.max(a.y + a.h, b.y + b.h) + pad
  return { x, y, w: right - x, h: bottom - y }
}

/** Kutu, alanın sol üst köşesine göre. */
export const localBox = (b: Box, origin: Box): Box => ({
  x: b.x - origin.x,
  y: b.y - origin.y,
  w: b.w,
  h: b.h,
})

/** İçe daraltılmış kutu (kartın altında kalsın, kenarından taşmasın). */
export const insetBox = (b: Box, n: number): Box => ({
  x: b.x + n,
  y: b.y + n,
  w: Math.max(0, b.w - 2 * n),
  h: Math.max(0, b.h - 2 * n),
})

/**
 * Hesaplanmış zemin düz ve opak bir renk mi: öyleyse rengin kendisi, değilse `null` (degrade,
 * görsel, saydam ya da yarı saydam). `rgb(…)`, `rgba(…)`, `oklch(… / a)`, `color(… / a)` okunur.
 */
export function opaqueFill(color: string | null | undefined, image?: string | null): string | null {
  if (image && image !== "none") return null
  const c = String(color ?? "").trim()
  if (!c || c === "transparent") return null
  const rgba = c.match(/^rgba?\(([^)]*)\)$/i)
  if (rgba) {
    const parts = rgba[1].split(/[\s,/]+/).filter(Boolean)
    const alpha = parts.length > 3 ? parseFloat(parts[3]) : 1
    return alpha >= 0.99 ? c : null
  }
  const slash = c.match(/\/\s*([\d.]+)(%?)\s*\)$/)
  if (slash) {
    const a = parseFloat(slash[1]) / (slash[2] ? 100 : 1)
    return a >= 0.99 ? c : null
  }
  return /^(oklch|oklab|lch|lab|color|hsl|hwb)\(/i.test(c) ? c : null
}

/** Etki açılsın mı: telefonda çekmece, Safari'de (HTML'de SVG filtresi ağır) ve azaltılmış harekette yok. */
export function gooAllowed(env: { userAgent?: string; reducedMotion?: boolean }): boolean {
  if (env.reducedMotion) return false
  return !/^((?!chrome|android|crios|fxios|edg).)*safari/i.test(env.userAgent ?? "")
}
