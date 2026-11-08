import { REGION_NORMALS } from "@/data/regionNormals"
import { STATUS } from "@/lib/graph"
import { parseTripForecast } from "@/features/widgets/lib/tripWeather"
import { fetchForecast } from "@/lib/weather"
import { cached } from "@/lib/widgetCache"

/**
 * Bölge havası — üretim bölgelerinde son 30 günün yağışı normale göre, kök bölgesi toprak nemi
 * (NASA POWER saatlik, anahtarsız, ~3 gün gecikmeli) ve önümüzdeki günlerin yağışı (MET Norway).
 * Hepsi herkese açık veri; kişinin konumu gönderilmez. Normaller pakette (`data/regionNormals`).
 */

const POWER = "https://power.larc.nasa.gov/api/temporal/hourly/point"
const CACHE_KEY = "tyro-region-history-v1"
const DAY = 86_400_000
const FILL = -999
const TIMEOUT_MS = 12_000
const FORECAST_TTL = 60 * 60_000
export const WINDOW = 30
export const AHEAD = 7
/** Bu kadarın altındaki günlük yağış "yağmurlu gün" sayılmaz. */
export const RAIN_DAY_MM = 1
// Normal 30 günde bundan azsa oran anlamsız (kurak mevsim): yalnız toplam yazılır.
const DRY_SEASON_MM = 5

const monthOf = (key) => Number(key.slice(5, 7)) - 1
const round1 = (n) => Math.round(n * 10) / 10

/**
 * POWER saatlik yanıtı → günler `[{ key: "YYYY-AA-GG", rain, soil }]`: yağış günün 24 saatinin
 * toplamı (mm), nem günün ortalaması; saati eksik gün (verinin son yarım günü) düşer. Günlük uç
 * bazı noktalarda yağışı 24 katı veriyor (aynı günün saatlik toplamıyla karşılaştırıldı), bu
 * yüzden günler saatlikten toplanıyor.
 */
export function parsePower(json) {
  const p = json?.properties?.parameter ?? {}
  const rain = p.PRECTOTCORR ?? {}
  const soil = p.GWETROOT ?? {}
  const ok = (v) => Number.isFinite(v) && v > FILL
  const days = new Map()
  for (const [k, v] of Object.entries(rain)) {
    if (!/^\d{10}$/.test(k)) continue
    const key = `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`
    const d = days.get(key) ?? { key, rain: 0, hours: 0, soil: 0, soilHours: 0 }
    if (ok(v)) {
      d.rain += v
      d.hours++
    }
    if (ok(soil[k])) {
      d.soil += soil[k]
      d.soilHours++
    }
    days.set(key, d)
  }
  return [...days.values()]
    .filter((d) => d.hours === 24)
    .sort((a, b) => (a.key < b.key ? -1 : 1))
    .map((d) => ({
      key: d.key,
      rain: Math.round(d.rain * 100) / 100,
      soil: d.soilHours ? Math.round((d.soil / d.soilHours) * 1000) / 1000 : null,
    }))
}

/** Son 30 günün toplamı ve aynı günlerin normali (her gün kendi ayının ortalamasıyla). */
export function rainVsNormal(days, normals, window = WINDOW) {
  const last = days.slice(-window)
  // Veri deliği: pencerenin çoğu yoksa oran yanıltır.
  if (!normals || last.length < window - 3) return null
  const total = last.reduce((s, d) => s + d.rain, 0)
  const normal = last.reduce((s, d) => s + normals.rain[monthOf(d.key)], 0)
  return {
    total: round1(total),
    normal: round1(normal),
    ratio: normal >= DRY_SEASON_MM ? total / normal : null,
    from: last[0].key,
    to: last.at(-1).key,
    daily: last.map((d) => ({ key: d.key, rain: d.rain })),
  }
}

/** Yağışın durumu: çok kuru · kuru · olağan · yağışlı; normal çok azsa kurak mevsim. */
export function rainState(r) {
  if (!r) return null
  if (r.ratio == null) return "season"
  if (r.ratio < 0.5) return "veryDry"
  if (r.ratio < 0.8) return "dry"
  if (r.ratio <= 1.25) return "normal"
  return "wet"
}

/** Son ölçülen kök bölgesi nemi ve o ayın normali. */
export function soilVsNormal(days, normals) {
  const last = [...days].reverse().find((d) => d.soil != null)
  if (!last || !normals) return null
  const normal = normals.soil[monthOf(last.key)]
  return { value: last.soil, normal, ratio: normal > 0 ? last.soil / normal : null, key: last.key }
}

/** Önümüzdeki günler (bugün dahil, en çok `AHEAD`): toplam ve ilk yağmurlu gün. */
export function upcomingRain(forecastDays, todayKey, ahead = AHEAD) {
  const days = (forecastDays ?? []).filter((d) => d.key >= todayKey).slice(0, ahead)
  if (!days.length) return null
  return {
    total: round1(days.reduce((s, d) => s + d.precip, 0)),
    first: days.find((d) => d.precip >= RAIN_DAY_MM)?.key ?? null,
    days: days.map((d) => ({ key: d.key, precip: d.precip })),
  }
}

const ymd = (t) => new Date(t).toISOString().slice(0, 10).replaceAll("-", "")

export function powerUrl(region, now) {
  const [lat, lon] = region.at
  const p = new URLSearchParams({
    parameters: "PRECTOTCORR,GWETROOT",
    community: "AG",
    latitude: String(lat),
    longitude: String(lon),
    start: ymd(now - 45 * DAY),
    end: ymd(now - DAY),
    format: "JSON",
    "time-standard": "LST",
  })
  return `${POWER}?${p}`
}

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY))
    return c && typeof c === "object" ? c : {}
  } catch {
    return {}
  }
}

/** Elde olan son okuma (istek yok): kart ilk çizimde boş kalmasın. */
export function peekHistory(id) {
  return readCache()[id]?.days ?? null
}

async function loadHistory(region, now, today, hit) {
  try {
    const res = await fetch(powerUrl(region, now), { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) throw new Error(`POWER ${res.status}`)
    const days = parsePower(await res.json())
    if (!days.length) throw new Error("POWER boş")
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ...readCache(), [region.id]: { day: today, days } }),
      )
    } catch {
      // Depo kapalı ya da dolu: veri yalnız bu açılışta kalır.
    }
    return days
  } catch {
    return hit?.days ?? null
  }
}

// Aynı bölge için yoldaki okuma paylaşılır (kart iki yerde açıkken ya da efekt iki kez koşunca).
const inflight = new Map()

/**
 * Bölgenin son 45 günü. Gün içinde bir kez okunur (veri günde bir güncelleniyor): sonuç bu
 * tarayıcıda saklanır, herkese açık veri. Okunamazsa elde olan son veri, yoksa `null`.
 */
export function fetchRegionHistory(region, now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10)
  const hit = readCache()[region.id]
  if (hit?.day === today && Array.isArray(hit.days)) return Promise.resolve(hit.days)
  let flight = inflight.get(region.id)
  if (!flight) {
    flight = loadHistory(region, now, today, hit).finally(() => inflight.delete(region.id))
    inflight.set(region.id, flight)
  }
  return flight
}

/** Bölgenin günlük tahmini (bölgenin saat diliminde; saatte bir, bellekte) ya da `null`. */
export async function fetchRegionForecast(region) {
  const res = await cached(`region-forecast:${region.id}`, FORECAST_TTL, async () => ({
    status: STATUS.ready,
    data: parseTripForecast(await fetchForecast(region.at[0], region.at[1]), region.tz),
  }))
  return res?.status === STATUS.ready ? res.data : null
}

export const normalsOf = (id) => REGION_NORMALS[id] ?? null
