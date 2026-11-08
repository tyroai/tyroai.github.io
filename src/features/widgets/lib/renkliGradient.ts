/**
 * Renkli kartın degradesi (saf, testli). Paletin üç rengi kendi tonunda kalır; her biri beyaz
 * yazının rahatça okunduğu en açık koyuluğa iner — OKLCH'de açıklık düşer, doygunluk ekranın
 * gösterebildiği sınıra (gamut) kadar korunur. Böylece açık paletler (Arctic Mint, Rose Blush,
 * Peach) solgun değil koyu mücevher tonunda, koyu paletler olduğu gibi. Koyulaşınca kahveye dönen
 * sıcaklar kırmızıya kayar (Insta'nın sarısı → mercan), pasteller doygunlaşır. Ölçü: beyaz yazı her durakta
 * `WHITE_MIN` ve %88'lik ikincil yazı ≥ 4,5 (AA) — ikisi birden.
 *
 * Sıra koyudan açığa (sol üst koyu: başlık en kontrastlı yerde) ve geçiş bir skala gibi: renklerin
 * arasına ton çemberinin kısa yayından ara tonlar girer (`SCALE` durak), açıklık adım adım artar;
 * iki renk arasında sert sıçrama olmaz. Ara ton da okunurluk sınırını geçer (geçmezse koyulaşır).
 */

type Rgb = [number, number, number]
type Lch = { l: number; c: number; h: number }

/** Beyaz yazının her duraktaki en düşük kontrastı. */
export const WHITE_MIN = 5.4

const toLinear = (v: number) => {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const fromLinear = (v: number) => {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, c)) * 255)
}

export function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const rgbToHex = ([r, g, b]: Rgb) =>
  `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`

function toLch([r, g, b]: Rgb): Lch {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { l: L, c: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 }
}

/** OKLCH → doğrusal RGB (gamut dışı değerler kırpılmadan: sınırı aramak için). */
function linearOf({ l, c, h }: Lch): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
}

const inGamut = (lch: Lch) => linearOf(lch).every((v) => v >= -1e-4 && v <= 1 + 1e-4)
const toRgb = (lch: Lch): Rgb => linearOf(lch).map(fromLinear) as Rgb

/** Bu açıklık ve tonda gösterilebilen en doygun renk (en çok `want`). */
function clampChroma(l: number, h: number, want: number): number {
  if (inGamut({ l, c: want, h })) return want
  let [lo, hi] = [0, want]
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2
    if (inGamut({ l, c: mid, h })) lo = mid
    else hi = mid
  }
  return lo
}

const lum = ([r, g, b]: Rgb) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
/** Beyazın bu zemin üstündeki kontrastı. */
export const whiteContrast = (rgb: Rgb) => 1.05 / (lum(rgb) + 0.05)

/** Renkli'nin ikincil yazısının (%88 beyaz) bu zemin üstündeki kontrastı. */
export function mutedContrast(bg: Rgb): number {
  const fg = bg.map((c) => Math.round(255 * 0.88 + c * 0.12)) as Rgb
  return (lum(fg) + 0.05) / (lum(bg) + 0.05)
}

/** Zemin yazıya uygun mu: beyaz ≥ `WHITE_MIN`, ikincil yazı ≥ 4,5 (AA). */
const readable = (rgb: Rgb) => whiteContrast(rgb) >= WHITE_MIN && mutedContrast(rgb) >= 4.5

/**
 * Koyulaşınca kahverengiye dönen sıcak tonlar (turuncu, sarı: OKLCH tonu ~40–112) kırmızıya doğru
 * kayar — koyu turuncu kahve, koyu sarı zeytin olur; kiremit ve mercan canlı kalır.
 */
export function warmShift(h: number): number {
  if (h < 40 || h > 112) return h
  return h >= 78 ? 46 : 36 + (h - 36) * 0.4
}

/** Solgun (pastel) renk koyulaşınca bulanık kalmasın: doygunluğu en az bu kadar. */
const MIN_CHROMA = 0.12

/** Bir rengi beyaz yazıya uygun en açık koyuluğa indirir (ton korunur; sıcaklar kırmızıya kayar). */
export function fitStop(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  if (readable(rgb)) return rgbToHex(rgb)
  const src = toLch(rgb)
  const chromatic = src.c > 0.035
  const h = chromatic ? warmShift(src.h) : src.h
  const want = chromatic ? Math.max(src.c * 1.1, Math.min(MIN_CHROMA, src.c * 2.2)) : src.c
  const at = (l: number): Rgb => toRgb({ l, c: clampChroma(l, h, want), h })
  let [lo, hi] = [0, src.l]
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2
    if (readable(at(mid))) lo = mid
    else hi = mid
  }
  return rgbToHex(at(lo))
}

/** Okunmuyorsa açıklığı düşürür (ton ve doygunluk korunur). */
function readableOf(lch: Lch): Rgb {
  const at = (l: number): Rgb => toRgb({ l, c: clampChroma(l, lch.h, lch.c), h: lch.h })
  if (readable(at(lch.l))) return at(lch.l)
  let [lo, hi] = [0, lch.l]
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2
    if (readable(at(mid))) lo = mid
    else hi = mid
  }
  return at(lo)
}

/** Degradenin durak sayısı: üç renk ve aralarında birer ara ton. */
export const SCALE = 5

/** Koyudan açığa en az bu kadar açıklık farkı (OKLab L): eşit parlak paletler de skala olsun. */
const MIN_SPAN = 0.1

/** İki ton arasında kısa yaydan (ara ton gri-kahveye düşmesin: doygunluk korunur). */
function mixLch(x: Lch, y: Lch, t: number): Lch {
  let dh = y.h - x.h
  if (dh > 180) dh -= 360
  if (dh < -180) dh += 360
  return { l: x.l + (y.l - x.l) * t, c: x.c + (y.c - x.c) * t, h: (x.h + dh * t + 360) % 360 }
}

const cache = new Map<string, string[]>()

/**
 * Paletin üç rengi (`swatch`: from · via · to) → kartın degradesinin `SCALE` durağı. Paletin renk
 * sırası korunur, koyu uç başa gelir; aralara ton çemberinin kısa yayından birer ara ton girer. Sonra
 * açıklık rampası: son durak okunurluğun izin verdiği en açık ton, öncekiler adım adım koyulaşır
 * (en az `MIN_SPAN`) — hiçbir durak açılmaz, yalnız koyulaşır.
 */
export function renkliStops(swatch: readonly string[]): string[] {
  const key = swatch.join("|")
  let stops = cache.get(key)
  if (!stops) {
    let seq = swatch.slice(0, 3).map((hex) => toLch(hexToRgb(fitStop(hex)) ?? [0, 0, 0]))
    if (seq[0].l > seq[2].l) seq = [...seq].reverse()
    const raw = [seq[0], mixLch(seq[0], seq[1], 0.5), seq[1], mixLch(seq[1], seq[2], 0.5), seq[2]]
    const top = raw[4].l
    const span = Math.max(MIN_SPAN, top - raw[0].l)
    stops = raw.map((lch, k) => {
      const ramp = top - ((raw.length - 1 - k) / (raw.length - 1)) * span
      return rgbToHex(readableOf({ ...lch, l: Math.min(lch.l, ramp) }))
    })
    cache.set(key, stops)
  }
  return stops
}

/** Degradenin CSS'i: sol üstte koyu, sağ altta açık; duraklar eşit aralıklı. */
export const renkliGradient = (stops: readonly string[]) =>
  `linear-gradient(150deg, ${stops.join(", ")})`
