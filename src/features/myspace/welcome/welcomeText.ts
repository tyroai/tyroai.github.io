/** Karşılama cümlesinin parçası: `mark` vurgulu (kartın tam mürekkebi), öteki soluk. */
export interface TextPart {
  text: string
  mark?: boolean
}

/** İkinci yarıya giren cümlenin ilk harfi küçük, dilin kuralıyla ("Yağmur …" → "yağmur …"). */
export const lowerFirst = (s: string, locale: string): string =>
  s ? s.charAt(0).toLocaleLowerCase(locale) + s.slice(1) : s

// Saat (15.00 · 3:00 PM · Arapça rakamlar) ve derece (12° · −2°): cümlenin değer kısmı.
const VALUE = /([−-]?\p{Nd}+°|\p{Nd}{1,2}[.:٫]\p{Nd}{2}(?:\s?(?:AM|PM|am|pm|ص|م))?)/gu

/** Düz cümleyi değerleri vurgulu parçalara böler: "yağmur 15.00 sularında" → […, "15.00", …]. */
export function markValues(text: string): TextPart[] {
  const out: TextPart[] = []
  let last = 0
  for (const m of text.matchAll(VALUE)) {
    const at = m.index ?? 0
    if (at > last) out.push({ text: text.slice(last, at) })
    out.push({ text: m[0], mark: true })
    last = at + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}

/** Havadan çekmecenin hafif dokusu: gece yıldız, açık günde güneş ışığı; öteki havada yok (sade). */
export function skyOf(
  current: { kind?: string; night?: boolean } | null | undefined,
): "night" | "sun" | null {
  if (!current?.kind) return null
  if (current.night) return "night"
  if (current.kind === "clear" || current.kind === "partly") return "sun"
  return null
}

/** Toplantı sahibinin baş harfleri (pul): "Ayşe Demir" → "PK", tek kelime → ilk harf. */
export function initialsOf(name: string | null | undefined, locale: string): string {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return ""
  const first = words[0][0] ?? ""
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : ""
  return (first + last).toLocaleUpperCase(locale)
}

/** Derecenin işareti ve saatin dakikası küçük yazılır (12,480.36'nın kuruşu gibi): [büyük, küçük]. */
export function splitMinor(value: string): [string, string] {
  const deg = value.match(/^(.*?)(°)$/)
  if (deg) return [deg[1], deg[2]]
  const time = value.match(/^(\p{Nd}{1,2})([.:٫]\p{Nd}{2}.*)$/u)
  if (time) return [time[1], time[2]]
  return [value, ""]
}

/** Havanın okumasından (`lib/weatherInsight`) çekmecenin kısa önerisi; söylenecek yoksa `null`. */
export type WeatherTip =
  | "thunder"
  | "rain"
  | "snow"
  | "rainEnds"
  | "snowEnds"
  | "wind"
  | "freeze"
  | "cold"
  | "heat"
  | "fog"
  | "clearing"
  | "fair"
  | "fairNight"

/**
 * Kartın uzun cümlesi yerine iki-üç sözlük öneri ("kat kat giyin", "şemsiyeni unutma"): hava kartından
 * bağımsız, karşılamanın kendi dili. Saat ve ikinci sıcaklık yok — değer zaten "Dışarıda 6°"de.
 */
export function weatherTip(
  w: { id: string; what?: string; night?: boolean } | null,
): WeatherTip | null {
  if (!w) return null
  switch (w.id) {
    case "thunder":
      return "thunder"
    case "soon":
    case "long":
      return w.what === "snow" ? "snow" : "rain"
    case "until":
      return w.what === "snow" ? "snowEnds" : "rainEnds"
    case "wind":
    case "freeze":
    case "heat":
    case "fog":
    case "clearing":
      return w.id
    case "drop":
    case "cold":
      return "cold"
    case "fair":
      return w.night ? "fairNight" : "fair"
    default:
      return null
  }
}

/** Çekmecede yer kazandıran kısaltmalar (dil başına; Anasayfa'daki cümle uzun kalır). */
const SHORT: Record<string, [RegExp, string][]> = {
  tr: [[/\bortalama(nın|sının|sı|ya)?(?=\s)/gu, "ort."]],
}

/** Günün okumasının parçalarını kısaltır (ürün sahibi: "ortalamanın derken ort. yazabilirsin"). */
export function shortenParts(parts: readonly TextPart[], locale: string): TextPart[] {
  const rules = SHORT[String(locale).slice(0, 2)]
  if (!rules) return [...parts]
  return parts.map((p) => ({
    ...p,
    text: rules.reduce((s, [re, to]) => s.replace(re, to), p.text),
  }))
}
