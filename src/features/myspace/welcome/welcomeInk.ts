import { contrast, luminance } from "@/lib/gradientInk"

export type Rgb = [number, number, number]

/** Büyük yazı (≥ 18,66 px kalın) için AA eşiği. Çekmecenin en küçük yazısı 22 px kalın. */
export const LARGE_AA = 3

/**
 * Zeminin yukarıdan aşağı durakları (% yükseklik) ve her durağın hedef parlaklığı (göreli ışıklılık).
 * Ürün sahibinin örneğinden ölçüldü: üstte açık ve sıcak (0,47), yazı bandı orta açıklıkta
 * (0,30 → 0,26), alt kenar banttan biraz koyu (0,20). Bant bu aralıkta kaldıkça hem zeminin koyu
 * tonundaki yazı hem beyaz vurgu 3:1'i geçer; daha açık bantta beyaz, daha koyu bantta koyu ton okunmaz.
 */
export const STOPS = [0, 12, 24, 48, 72, 88, 100]
const TARGET_Y = [0.56, 0.4, 0.285, 0.255, 0.222, 0.2, 0.18]
/** Yazının oturduğu duraklar: yüksekliğin ~%24–72'si (yazı orta-üstte, ~%28–70). */
const BAND = [2, 3, 4]
/** Zeminin tonunda koyu yazı: yarı saydam, zemin değiştikçe tonu da değişir (örnekteki bordo). */
const BASE_ALPHA = 0.84
const MIN_BASE = 3.05

export interface WelcomeInk {
  /** `duo`: zeminin koyu tonunda yazı + beyaz vurgu (örneğin görünüşü) · `light`: siyah palet. */
  scheme: "duo" | "light"
  base: string
  mark: string
  /** Zeminin durakları (`STOPS` sırasıyla), CSS rengi. */
  stops: string[]
  /** Yazı bandının renkleri (ölçüm ve test için). */
  band: Rgb[]
}

const WHITE: Rgb = [255, 255, 255]
const BLACK: Rgb = [0, 0, 0]

export const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb =>
  [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as Rgb

const css = ([r, g, b]: Rgb, alpha = 1): string =>
  alpha >= 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`

/** Yarı saydam yazının zemin üstündeki görünen rengi. */
export const over = (fg: Rgb, alpha: number, bg: Rgb): Rgb => mixRgb(bg, fg, alpha)

/**
 * Paletin rampası boyunca (beyaz → `to` → `via` → `from` → `deep` → siyah) hedef parlaklığa ilk
 * varılan renk. Durak paletin kendi renklerinden çıkar: altın üst, mercan bant, koyu alt.
 */
function along(path: Rgb[], target: number): Rgb {
  for (let i = 0; i < path.length - 1; i++) {
    const [a, b] = [path[i], path[i + 1]]
    const ya = luminance(a) - target
    if (ya === 0) return a
    if (ya * (luminance(b) - target) > 0) continue
    let [lo, hi] = [0, 1]
    for (let k = 0; k < 20; k++) {
      const mid = (lo + hi) / 2
      if ((luminance(mixRgb(a, b, mid)) - target) * ya > 0) lo = mid
      else hi = mid
    }
    return mixRgb(a, b, hi)
  }
  return path[path.length - 1]
}

/** Bandın her noktasında 3:1'i geçen en açık koyu ton: zeminin ortasındaki renk koyulaştırılarak. */
function tonalBase(band: Rgb[]): Rgb {
  const worst = (c: Rgb) => Math.min(...band.map((bg) => contrast(over(c, BASE_ALPHA, bg), bg)))
  const mid = band[1]
  let [lo, hi] = [0, 1]
  for (let k = 0; k < 20; k++) {
    const t = (lo + hi) / 2
    if (worst(mixRgb(mid, BLACK, t)) >= MIN_BASE) hi = t
    else lo = t
  }
  return mixRgb(mid, BLACK, hi)
}

/**
 * Çekmecenin zemini ve yazısının iki tonu, her palette. Zemin paletin rampasından ve örneğin
 * parlaklık profilinden kurulur (`STOPS`, `TARGET_Y`): yalnız dikey, köşegen ışık yok. Yazı:
 * zeminin koyu tonu (`BASE_ALPHA` saydam) + beyaz vurgu; ikisi de bandın her noktasında ≥ 3:1.
 * Siyah palette rampa yok: zemin siyah kalır, yazı soluk beyaz + beyaz.
 */
export function welcomeInk(from: Rgb, via: Rgb, to: Rgb, deep: Rgb): WelcomeInk {
  if (luminance(to) < 0.02 && luminance(via) < 0.02) {
    const band = [via, via, from]
    const dim = [0.78, 0.86].find(
      (a) => Math.min(...band.map((bg) => contrast(over(WHITE, a, bg), bg))) >= LARGE_AA,
    )
    return {
      scheme: "light",
      base: css(WHITE, dim ?? 0.86),
      mark: css(WHITE),
      stops: [to, to, via, via, via, from, from].map((c) => css(c)),
      band,
    }
  }
  const path = [WHITE, to, via, from, deep, BLACK]
  const stops = TARGET_Y.map((y) => along(path, y))
  const band = BAND.map((i) => stops[i])
  return {
    scheme: "duo",
    base: css(tonalBase(band), BASE_ALPHA),
    mark: css(WHITE),
    stops: stops.map((c) => css(c)),
    band,
  }
}
