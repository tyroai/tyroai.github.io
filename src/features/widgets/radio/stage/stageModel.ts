/**
 * Tyrofy sahnesinin saf hesapları (testli): halkaların yeri, döngüsel sıra, başlığın iki
 * satırı ve ses kadranı. Ölçüler kartın 360 birimlik eninde (kart her boyda aynı oranda
 * büyür; yerleşim yüzdeyle).
 */

export const CARD_W = 360
export const CARD_H = 396

/** Halka yuvası: merkezden uzaklık (birim), çap ve görünürlük. */
export interface Slot {
  x: number
  y: number
  d: number
  opacity: number
}

// Ortada büyük (çalan), iki yanında orta boy (önceki · sonraki), kenarlarda üst üste iki küçük
// (kartın kenarında kesilir); dışarıdakiler görünmez, girip çıkarken oradan süzülür.
const BIG = 124
const MID = 76
const SMALL = 29
const GAP = 12
const PAIR_X = BIG / 2 + GAP + MID + GAP + SMALL / 2
const PAIR_Y = SMALL / 2 + 4.25

export const BIG_D = BIG

/**
 * Düzen: `pairs` dikey kart (header penceresi, mini kart, telefon) — kenarlarda üst üste ikişer
 * küçük; `row` yatay kart (panonun büyük kartı) — iki yanda giderek küçülen tek sıra.
 */
export type StageLayout = "pairs" | "row"

// Yatay sahnenin sırası: her adımda çap küçülür, aralık daralır; beşincisi görünmez.
const ROW_D = [BIG, MID, 52, 36, 24]
const ROW_GAP = [GAP, GAP, 10, 8]

/** Görünen en uzak sıra (bir ötesi görünmez yuvada bekler). */
export const reachOf = (layout: StageLayout) => (layout === "row" ? 4 : 3)

/** Yuvanın yeri: `offset` çalana göre sıra. */
export function slotFor(offset: number, layout: StageLayout = "pairs"): Slot {
  const side = Math.sign(offset)
  const n = Math.abs(offset)
  if (layout === "row") {
    if (n > reachOf("row")) return { x: side * 310, y: 0, d: 16, opacity: 0 }
    let x = 0
    for (let k = 1; k <= n; k++) x += ROW_D[k - 1] / 2 + ROW_GAP[k - 1] + ROW_D[k] / 2
    return { x: side * x, y: 0, d: ROW_D[n], opacity: 1 }
  }
  if (n === 0) return { x: 0, y: 0, d: BIG, opacity: 1 }
  if (n === 1) return { x: side * (BIG / 2 + GAP + MID / 2), y: 0, d: MID, opacity: 1 }
  if (n === 2) return { x: side * PAIR_X, y: -PAIR_Y, d: SMALL, opacity: 1 }
  if (n === 3) return { x: side * PAIR_X, y: PAIR_Y, d: SMALL, opacity: 1 }
  return { x: side * (PAIR_X + 36), y: 0, d: SMALL * 0.7, opacity: 0 }
}

/** Dairesel listede `j`nin `i`ye göre yeri: en kısa yön, −n/2 … n/2. */
export function ringOffset(j: number, i: number, n: number): number {
  if (n <= 0) return 0
  let d = (j - i) % n
  if (d < 0) d += n
  if (d > n / 2) d -= n
  return d
}

/**
 * Sahnede görünen istasyonlar: çalanın iki yanından en çok dördü (liste kısaysa yinelenmez).
 * `{ index, offset }` — `index` listedeki yeri.
 */
export function visibleRing(i: number, n: number, reach = 4): { index: number; offset: number }[] {
  if (n <= 0 || i < 0) return []
  const out: { index: number; offset: number }[] = []
  const half = Math.min(reach, Math.floor((n - 1) / 2))
  for (let off = 0 - half; off <= half; off++) out.push({ index: (i + off + n) % n, offset: off })
  // Çift sayılı kısa listede karşı uçtaki tek istasyon sağda.
  if (n % 2 === 0 && half < reach && n > 1)
    out.push({ index: (i + half + 1) % n, offset: half + 1 })
  return out
}

// İngilizce marka sözcükleri Türkçe büyük harfe çevrilmez ("VİRGİN RADİO" değil).
const LATIN = new Set([
  "radio",
  "virgin",
  "mix",
  "hits",
  "hit",
  "kiss",
  "chill",
  "classic",
  "city",
  "live",
  "lite",
  "vibe",
  "indie",
  "music",
  "jazz",
  "smile",
  "time",
  "fit",
])

/** Ad büyük harfle: Türkiye istasyonunda Türkçe kuralıyla, Latin marka sözcükleri hariç. */
export function stageUpper(name: string, cc?: string | null): string {
  const tr = String(cc ?? "").toUpperCase() === "TR"
  return String(name ?? "")
    .split(/(\s+)/)
    .map((w) =>
      tr && !LATIN.has(w.toLocaleLowerCase("en")) ? w.toLocaleUpperCase("tr") : w.toUpperCase(),
    )
    .join("")
}

/**
 * Başlığın iki satırı (tasarımın "ENDLESS / VIBES"i): sözcükler en uzun satırı en kısa yapan
 * yerden bölünür; tek sözcük tek satır.
 */
export function stageLines(name: string): [string] | [string, string] {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length < 2) return [words[0] ?? ""]
  let best = 1
  let bestLen = Infinity
  for (let k = 1; k < words.length; k++) {
    const len = Math.max(words.slice(0, k).join(" ").length, words.slice(k).join(" ").length)
    if (len < bestLen) {
      bestLen = len
      best = k
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")]
}

/** Başlığın yazı boyu (kart eninin yüzdesi): uzun satır sığsın diye küçülür. */
export function titleSize(lines: string[]): number {
  const longest = Math.max(1, ...lines.map((l) => l.length))
  return Math.max(6.2, Math.min(10.6, 92 / longest))
}

/** Yatay sahnede tek satırlık başlığın boyu (kart eninin yüzdesi): satırın tamamı sığsın. */
export function titleLineSize(text: string): number {
  return Math.min(9, 138 / Math.max(1, String(text ?? "").length))
}

/** Kartın düzeni en/boy oranından: belirgin yatay kart yatay sahne. */
export const layoutFor = (width: number, height: number): StageLayout =>
  height > 0 && width / height > 1.32 ? "row" : "pairs"

/** Anahtara göre sabit sıra (0…n−1): aynı istasyon her yerde aynı yedek kapağı alır. */
export function hashIndex(key: string | null | undefined, n: number): number {
  if (!n) return 0
  let h = 7
  for (const c of String(key ?? "")) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % n
}

/**
 * Arka plan görselleri için karışık torba: hepsi bir kez çıkmadan hiçbiri tekrar gelmez, yeni
 * turun ilki bir önceki turun sonuncusu olamaz (art arda aynı görsel yok). `rand` testte sabitlenir.
 */
export function createArtBag<T>(list: readonly T[], rand: () => number = Math.random) {
  let bag: T[] = []
  let last: T | undefined
  const refill = () => {
    bag = [...list]
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[bag[i], bag[j]] = [bag[j], bag[i]]
    }
    // Torbanın sonundan çekilir: sıradaki son gelenle aynıysa başa al.
    if (bag.length > 1 && bag[bag.length - 1] === last) {
      ;[bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]]
    }
  }
  return {
    /** Sıradaki görsel (torba bitince yeniden karılır). */
    next(): T | undefined {
      if (!bag.length) refill()
      last = bag.pop()
      return last
    },
    /** Sıradakine bakar, çekmez (önceden indirmek için). */
    peek(): T | undefined {
      if (!bag.length) refill()
      return bag[bag.length - 1]
    },
  }
}

/**
 * SES KADRANI — iOS kamerasının yakınlaştırma kadranı gibi: çentikler kartın altında büyük bir
 * yayda, ortadaki beyaz gösterge sabit, kadran döner. Kadranın ucu sıfır, öteki ucu en yüksek ses.
 */
export const DIAL = {
  cx: CARD_W / 2,
  cy: 551,
  r: 211,
  tick: 18,
  ticks: 41,
  step: 3.2,
}
export const DIAL_SPAN = (DIAL.ticks - 1) * DIAL.step

/** Kadranın dönüşü (derece): değerin çentiği göstergenin altına gelir. */
export const dialRotation = (value: number) => -clamp01(value) * DIAL_SPAN

/** Çentiğin değeri (0–1). */
export const tickValue = (i: number) => i / (DIAL.ticks - 1)

/**
 * Sürükleme: yatay `dx` birim yay boyunca açıya çevrilir (bir kat hızlı); kadranı sola çekmek
 * sesi açar (çentikler parmakla gider).
 */
export function dragValue(start: number, dx: number, gain = 1.4): number {
  const deg = ((dx / DIAL.r) * 180) / Math.PI
  return clamp01(start - (deg * gain) / DIAL_SPAN)
}

/** Dokunma: göstergeden `dx` birim uzaktaki çentiğin değeri. */
export function tapValue(current: number, dx: number): number {
  const ratio = Math.max(-1, Math.min(1, dx / DIAL.r))
  const deg = (Math.asin(ratio) * 180) / Math.PI
  return clamp01(current + deg / DIAL_SPAN)
}

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0))
}
