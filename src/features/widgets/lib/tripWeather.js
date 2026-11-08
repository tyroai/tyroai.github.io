import { CITY_GEO } from "@/data/cityGeo"
import { STATUS } from "@/lib/graph"
import { classifySymbol, fetchForecast, localDayKey } from "@/lib/weather"
import { cached } from "@/lib/widgetCache"

/**
 * Seyahatim'in varış havası — MET Norway (Anasayfa'nın kaynağı, anahtarsız) şehrin merkez
 * koordinatıyla (`data/cityGeo`); kişinin konumu gönderilmez. Günler varış şehrinin SAAT
 * DİLİMİNDE (`parseForecast` tarayıcının gününü kullanıyor: Şanghay'da gün 5 saat önce başlar).
 */

/** Ayrıntıda en çok bu kadar gün; MET'in ufku ~9 gün, ötesi için tahmin yok. */
export const TRIP_DAYS = 5
export const FORECAST_HORIZON_DAYS = 9
const TTL = 60 * 60_000
const DAY = 86_400_000

const formats = new Map()
function partsIn(tz) {
  let f = formats.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
    formats.set(tz, f)
  }
  return (date) => {
    const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]))
    return { key: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) }
  }
}

/** Anahtar ("YYYY-AA-GG") → o günün öğlesi (UTC) — gün adını saat diliminden bağımsız yazmak için. */
export const keyNoon = (key) => new Date(`${key}T12:00:00Z`)

/**
 * MET yanıtı → varış saat diliminde günler `{ key, min, max, kind, precip }`. Sembol öğlene en
 * yakın 6 saatlik dilimden; yağış üst üste binmeyen 6 saatlik dilimlerden (UTC 00 · 06 · 12 · 18).
 * Ufkun yarım kalan son günü (öğle dilimi yok) atılır.
 */
export function parseTripForecast(json, tz) {
  const at = partsIn(tz)
  const days = new Map()
  for (const e of json?.properties?.timeseries ?? []) {
    const date = new Date(e.time)
    if (Number.isNaN(date.getTime())) continue
    const { key, hour } = at(date)
    const day = days.get(key) ?? { key, min: Infinity, max: -Infinity, precip: 0, noon: null }
    const temp = e.data?.instant?.details?.air_temperature
    if (Number.isFinite(temp)) {
      day.min = Math.min(day.min, temp)
      day.max = Math.max(day.max, temp)
    }
    const six = e.data?.next_6_hours
    if (six && date.getUTCHours() % 6 === 0) {
      day.precip += six.details?.precipitation_amount ?? 0
      const dist = Math.abs(hour + 3 - 12)
      if (six.summary?.symbol_code && (!day.noon || dist < day.noon.dist))
        day.noon = { dist, code: six.summary.symbol_code }
    }
    days.set(key, day)
  }
  return [...days.values()]
    .filter((d) => d.noon && Number.isFinite(d.min))
    .map((d) => ({
      key: d.key,
      min: Math.round(d.min),
      max: Math.round(d.max),
      kind: classifySymbol(d.noon.code).kind,
      precip: Math.round(d.precip * 10) / 10,
    }))
}

/**
 * Yolculuğun günleri (anahtar) — bugünden önceki günler düşer, en çok `TRIP_DAYS`. Tüm gün
 * etkinlik bir TAKVİM tarihidir (kişinin günü); saatli etkinlik anlardır, gün varışın diliminde.
 */
export function tripDayKeys(trip, tz, now) {
  const keys = []
  if (trip.isAllDay) {
    const today = localDayKey(new Date(now))
    for (
      let t = trip.start.getTime();
      t < trip.end.getTime() && keys.length < TRIP_DAYS;
      t += DAY
    ) {
      const key = localDayKey(new Date(t + DAY / 2))
      if (key >= today && !keys.includes(key)) keys.push(key)
    }
    return keys
  }
  const at = partsIn(tz)
  const today = at(new Date(now)).key
  const last = at(new Date(trip.end.getTime() - 1)).key
  // Yarım günlük adım: yaz saati geçişindeki 23 saatlik gün atlanmasın.
  for (let t = trip.start.getTime(); keys.length < TRIP_DAYS; t += DAY / 2) {
    const key = at(new Date(t)).key
    if (key > last) break
    if (key >= today && !keys.includes(key)) keys.push(key)
  }
  return keys
}

/** Yolculuk tahmin ufkunda mı (başlangıcı ~9 gün içinde ya da sürüyor). */
export const inForecastRange = (trip, now) =>
  trip.start.getTime() - now < FORECAST_HORIZON_DAYS * DAY

/** Şehrin günlük tahmini (saatte bir; çıkışta silinen widget önbelleğinde) ya da `null`. */
export async function cityForecast(city) {
  const geo = CITY_GEO[city?.id]
  if (!geo) return null
  const res = await cached(`trip-weather:${city.id}`, TTL, async () => ({
    status: STATUS.ready,
    data: parseTripForecast(await fetchForecast(geo[0], geo[1]), city.tz),
  }))
  return res?.status === STATUS.ready ? res.data : null
}
