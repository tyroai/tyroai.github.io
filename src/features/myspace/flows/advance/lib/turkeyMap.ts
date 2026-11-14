/**
 * TÜRKİYE NOKTA HARİTASI — iş avansı akışının kubbesi için. Sınır elle sadeleştirilmiş iki çokgen
 * (Anadolu, Trakya; boylam, enlem): stilize nokta deseni için yeterli, kartografik değil. Noktalar
 * çokgenin içine düşen ızgara düğümleri (satırlar yarım adım kaydırılmış). Şehirler ERP'nin lokasyon
 * kodlarıyla (`lib/advanceLocations`): koordinatlar il/ilçe merkezleri.
 */
type LonLat = readonly [number, number]

const ANATOLIA: LonLat[] = [
  [29.1, 41.22],
  [30.2, 41.15],
  [31.4, 41.32],
  [32.3, 41.75],
  [33.3, 42.02],
  [34.2, 41.95],
  [35.15, 42.05],
  [35.2, 41.65],
  [36.0, 41.7],
  [36.4, 41.25],
  [37.1, 41.15],
  [37.6, 41.05],
  [38.4, 40.95],
  [39.75, 41.02],
  [40.5, 41.05],
  [41.4, 41.45],
  [41.55, 41.52],
  [42.5, 41.45],
  [42.85, 41.58],
  [43.45, 41.12],
  [43.75, 40.75],
  [43.6, 40.45],
  [43.7, 40.1],
  [44.4, 40.0],
  [44.8, 39.7],
  [44.45, 39.4],
  [44.1, 39.4],
  [44.3, 38.85],
  [44.45, 38.35],
  [44.25, 38.0],
  [44.6, 37.7],
  [44.8, 37.3],
  [44.79, 37.15],
  [44.2, 37.25],
  [43.6, 37.25],
  [42.8, 37.35],
  [42.36, 37.11],
  [41.6, 37.1],
  [41.2, 37.07],
  [40.7, 37.1],
  [40.0, 36.85],
  [39.2, 36.68],
  [38.95, 36.71],
  [38.0, 36.83],
  [37.1, 36.65],
  [36.65, 36.6],
  [36.57, 36.27],
  [36.37, 36.2],
  [36.06, 35.9],
  [35.92, 35.93],
  [35.88, 36.4],
  [36.17, 36.58],
  [36.2, 36.9],
  [35.8, 36.75],
  [35.38, 36.55],
  [34.6, 36.76],
  [33.95, 36.3],
  [32.83, 36.02],
  [32.3, 36.25],
  [32.0, 36.52],
  [31.4, 36.75],
  [30.7, 36.86],
  [30.55, 36.6],
  [30.4, 36.2],
  [29.98, 36.22],
  [29.6, 36.18],
  [29.4, 36.25],
  [29.1, 36.62],
  [28.75, 36.7],
  [28.25, 36.8],
  [27.4, 36.68],
  [28.2, 37.03],
  [27.25, 37.0],
  [27.2, 37.4],
  [27.25, 37.85],
  [26.75, 38.2],
  [26.3, 38.28],
  [26.5, 38.65],
  [26.95, 38.4],
  [26.85, 38.75],
  [26.9, 39.05],
  [26.65, 39.3],
  [26.95, 39.55],
  [26.07, 39.47],
  [26.15, 40.0],
  [26.4, 40.2],
  [26.75, 40.4],
  [27.3, 40.4],
  [27.8, 40.5],
  [28.0, 40.33],
  [28.9, 40.38],
  [29.15, 40.65],
  [29.9, 40.72],
  [29.35, 40.8],
  [29.05, 41.02],
]

const THRACE: LonLat[] = [
  [28.98, 41.0],
  [29.08, 41.24],
  [28.15, 41.6],
  [28.03, 41.98],
  [27.3, 42.1],
  [26.6, 41.95],
  [26.35, 41.72],
  [26.6, 41.35],
  [26.32, 41.25],
  [26.36, 40.95],
  [26.05, 40.73],
  [26.8, 40.6],
  [26.2, 40.05],
  [26.7, 40.42],
  [27.3, 40.72],
  [27.5, 40.98],
  [28.25, 41.07],
  [28.6, 40.97],
]

/** ERP lokasyon kodu → [boylam, enlem]. "DİĞER"in yeri yok. */
export const CITY_COORDS: Record<string, LonLat> = {
  ADANA: [35.32, 37.0],
  ANKARA: [32.86, 39.93],
  BALIKESİR: [27.88, 39.65],
  EDİRNE: [26.56, 41.68],
  GAZİANTEP: [37.38, 37.07],
  İSTANBUL: [28.98, 41.01],
  İZMİR: [27.14, 38.42],
  MARDİN: [40.74, 37.31],
  MERSİN: [34.64, 36.8],
  ŞANLIURFA: [38.8, 37.16],
  TRABZON: [39.72, 41.0],
}

// Düz izdüşüm: boylam 39° enleminin kosinüsüyle daralır (Türkiye'nin ortası).
const LON0 = 25.6
const LAT0 = 42.4
const KX = Math.cos((39 * Math.PI) / 180)
/** Haritanın birim ölçüsü (izdüşümden sonra): genişlik × yükseklik. */
export const MAP_W = (45 - LON0) * KX
export const MAP_H = LAT0 - 35.7

/** [boylam, enlem] → harita birimi (sol üst köşe 0,0; y aşağı). */
export function project([lon, lat]: LonLat): [number, number] {
  return [(lon - LON0) * KX, LAT0 - lat]
}

function inside(poly: LonLat[], lon: number, lat: number): boolean {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

/** Nokta Türkiye'nin (sadeleştirilmiş) sınırı içinde mi. */
export const inTurkey = (lon: number, lat: number): boolean =>
  inside(ANATOLIA, lon, lat) || inside(THRACE, lon, lat)

let cached: [number, number][] | null = null

/** Kara noktaları (harita biriminde), bir kez hesaplanır. `step`: enlem adımı (derece). */
export function landDots(step = 0.27): [number, number][] {
  if (cached && step === 0.27) return cached
  const out: [number, number][] = []
  const lonStep = step / KX
  let row = 0
  for (let lat = 42.2; lat >= 35.8; lat -= step, row += 1) {
    const shift = row % 2 ? lonStep / 2 : 0
    for (let lon = 25.8 + shift; lon <= 45; lon += lonStep) {
      if (inTurkey(lon, lat)) out.push(project([lon, lat]))
    }
  }
  if (step === 0.27) cached = out
  return out
}

/** Noktaları tek SVG yoluna çevirir (yuvarlak uçlu sıfır boylu çizgiler): tek öğe, ucuz çizim. */
export function dotsPath(dots: [number, number][], scale: number): string {
  let d = ""
  for (const [x, y] of dots) d += `M${(x * scale).toFixed(1)} ${(y * scale).toFixed(1)}h0`
  return d
}

/** Koordinat yazısı: "41.01° K · 28.98° D". */
export function coordText(code: string, north: string, east: string): string {
  const c = CITY_COORDS[code]
  return c ? `${c[1].toFixed(2)}° ${north} · ${c[0].toFixed(2)}° ${east}` : ""
}

/** Türkiye'nin kabaca kutusu içinde mi (kişinin konumu rota başlangıcı olabilir mi). */
export const nearTurkey = (lon: number, lat: number): boolean =>
  lon >= 25.6 && lon <= 45 && lat >= 35.7 && lat <= 42.3

/** İki nokta arası kuş uçuşu mesafe (km, haversine). */
export function distanceKm(a: LonLat, b: LonLat): number {
  const rad = Math.PI / 180
  const dLat = (b[1] - a[1]) * rad
  const dLon = (b[0] - a[0]) * rad
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}
