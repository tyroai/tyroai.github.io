// Microsoft dışı herkese açık servisler. Hava (MET Norway) ve yer adı (BigDataCloud) KURGUSALDIR (veri
// setinin havası, hep İstanbul). Kurlar, altın, BIST ve CFTC raporu (Truncgil, Frankfurter, currency-api,
// CFTC) önce CANLI açık kaynaktan gelir; ağ yoksa ya da servis yanıt vermezse aşağıdaki kurgusal
// karşılıklara düşülür. Radyo dizini (Radio Browser) ve akışlar zaten gerçek ağa geçer (null = araya girme).
import { json } from "./util.js"
import { addDays, isoWeekday, seeded, startOfDay, ymd } from "../time.js"

// ───────────────────────── hava: MET Norway ─────────────────────────

const WITH_DAYNIGHT = new Set(["clearsky", "fair", "partlycloudy"])
const MOODS_DEFAULT = ["partlycloudy", "cloudy", "lightrain", "fair", "partlycloudy", "clearsky", "cloudy", "rain", "fair", "partlycloudy"]
const PRECIP = { lightrain: 0.4, rain: 1.4, heavyrain: 4, lightsnow: 0.5, snow: 1.6, fog: 0, cloudy: 0 }

const symbol = (mood, day) => (WITH_DAYNIGHT.has(mood) ? `${mood}_${day ? "day" : "night"}` : mood)

function metForecast(lat, lon, weather = {}) {
  const base = weather.base ?? 15
  const amp = weather.amp ?? 5
  const moods = weather.moods?.length ? weather.moods : MOODS_DEFAULT
  const first = weather.now ?? moods[0]
  const start = new Date()
  start.setMinutes(0, 0, 0)
  const series = []
  const at = (h) => new Date(start.getTime() + h * 3600 * 1000)
  const hours = []
  for (let h = 0; h <= 60; h++) hours.push(h)
  for (let h = 66; h <= 228; h += 6) hours.push(h)
  for (const h of hours) {
    const t = at(h)
    const localHour = (t.getUTCHours() + 3) % 24 // İstanbul (UTC+3)
    const day = localHour >= 7 && localHour < 18
    const dayIndex = Math.floor(h / 24)
    const mood = h < 12 ? first : moods[(dayIndex + (weather.offset ?? 0)) % moods.length]
    const temp = base + amp * Math.sin(((localHour - 9) / 24) * Math.PI * 2) - dayIndex * 0.25
    const data = {
      instant: {
        details: {
          air_temperature: Math.round(temp * 10) / 10,
          relative_humidity: 62 + Math.round(18 * Math.cos((localHour / 24) * Math.PI * 2)),
          wind_speed: 2.4 + (dayIndex % 3) * 0.8,
        },
      },
      next_12_hours: { summary: { symbol_code: symbol(mood, true === day) } },
      next_6_hours: {
        summary: { symbol_code: symbol(mood, day) },
        details: { precipitation_amount: (PRECIP[mood] ?? 0) * 3 },
      },
    }
    if (h <= 60) {
      data.next_1_hours = {
        summary: { symbol_code: symbol(mood, day) },
        details: { precipitation_amount: PRECIP[mood] ?? 0 },
      }
    }
    series.push({ time: t.toISOString().replace(".000", ""), data })
  }
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lon, lat, 40] },
    properties: { meta: { updated_at: new Date().toISOString(), units: { air_temperature: "celsius" } }, timeseries: series },
  }
}

// ───────────────────────── piyasa: kurlar, altın, endeks ─────────────────────────

const FX_BASE = { USD: 44.2, EUR: 51.3, GBP: 58.1, CHF: 54.7, JPY: 0.29, CNY: 6.15, RON: 10.1, CAD: 31.9 }

function truncgil(market = {}) {
  const day = ymd(new Date())
  const rnd = seeded(`truncgil-${day}`)
  const row = (price, spread = 0.002) => {
    const change = Math.round((rnd() * 2 - 1) * 90) / 100
    return {
      Buying: Math.round(price * (1 - spread) * 10000) / 10000,
      Selling: Math.round(price * 10000) / 10000,
      Change: change,
    }
  }
  const m = market.rates ?? {}
  const out = {
    Update_Date: `${day} ${new Date().toTimeString().slice(0, 8)}`,
    USD: row(m.USD ?? FX_BASE.USD),
    EUR: row(m.EUR ?? FX_BASE.EUR),
    CNY: row(6.15),
    AED: row(12.04),
    RON: row(10.1),
    KZT: row(0.085),
    IQD: row(0.0337),
    SYP: row(0.0034),
    CAD: row(31.9),
    GBP: row(m.GBP ?? FX_BASE.GBP),
    CHF: row(m.CHF ?? FX_BASE.CHF),
    JPY: row(0.29),
    SAR: row(11.78),
    RUB: row(0.55),
    GUMUS: row(62.4, 0.01),
    GRA: row(5920, 0.004),
    HAS: row(5950, 0.002),
    YIA: row(5860, 0.004),
    CEYREKALTIN: row(9640, 0.01),
    YARIMALTIN: row(19280, 0.01),
    TAMALTIN: row(38560, 0.01),
    CUMHURIYETALTINI: row(39480, 0.01),
    XU100: row(market.bist ?? 11250, 0),
  }
  return out
}

function frankfurterRange(url) {
  const m = url.pathname.match(/\/v1\/(\d{4}-\d{2}-\d{2})\.\./)
  const base = (url.searchParams.get("base") ?? "USD").toUpperCase()
  const start = m ? new Date(`${m[1]}T00:00:00`) : addDays(startOfDay(), -30)
  const end = startOfDay()
  const rnd = seeded(`fx-${base}`)
  let v = FX_BASE[base] ?? 40
  const rates = {}
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (isoWeekday(d) > 5) continue
    v = v * (1 + (rnd() - 0.46) * 0.006)
    rates[ymd(d)] = { TRY: Math.round(v * 10000) / 10000 }
  }
  return { amount: 1, base, start_date: ymd(start), end_date: ymd(end), rates }
}

function cftc(url) {
  const codes = ["001602", "001612", "002602", "005602", "080732", "033661"]
  const rnd = seeded("cftc")
  const rows = []
  for (const code of codes) {
    let long = 120000 + Math.floor(rnd() * 80000)
    let short = 60000 + Math.floor(rnd() * 50000)
    for (let w = 0; w < 10; w++) {
      const date = addDays(startOfDay(), -((w + 1) * 7 + ((new Date().getDay() + 2) % 7)))
      const dl = Math.floor((rnd() - 0.5) * 12000)
      const ds = Math.floor((rnd() - 0.5) * 9000)
      rows.push({
        cftc_contract_market_code: code,
        report_date_as_yyyy_mm_dd: `${ymd(date)}T00:00:00.000`,
        m_money_positions_long_all: String(long),
        m_money_positions_short_all: String(short),
        change_in_m_money_long_all: String(dl),
        change_in_m_money_short_all: String(ds),
        open_interest_all: String(long + short + 300000),
      })
      long -= dl
      short -= ds
    }
  }
  return rows
}

// ───────────────────────── yönlendirici ─────────────────────────

// Anahtarsız, CORS açık servisler: canlı veri çekilir. Kısa zaman aşımı: yavaş/engelli ağda uygulama
// beklemesin, kurgusal veriye dönsün. Yalnız GET; başarısızlıkta `null` (çağıran kurguyu verir).
const LIVE_TIMEOUT_MS = 5000
async function live({ url, method, ctx }) {
  if (method !== "GET") return null
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), LIVE_TIMEOUT_MS)
  try {
    const res = await ctx.realFetch(url.href, { signal: ctl.signal, headers: { Accept: "application/json" } })
    return res.ok ? res : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function handleExternal(req) {
  const { url, ctx } = req
  const host = url.hostname
  const ds = ctx.dataset

  if (host === "api.met.no") {
    const lat = Number(url.searchParams.get("lat") ?? 41.01)
    const lon = Number(url.searchParams.get("lon") ?? 28.98)
    return json(metForecast(lat, lon, ds.weather))
  }
  if (host === "api.bigdatacloud.net") {
    const lat = Number(url.searchParams.get("latitude") ?? 41.0082)
    const lon = Number(url.searchParams.get("longitude") ?? 28.9784)
    return json({
      latitude: lat,
      longitude: lon,
      locality: "İstanbul",
      city: "İstanbul",
      principalSubdivision: "İstanbul",
      countryCode: "TR",
      countryName: "Türkiye",
    })
  }
  if (host === "finans.truncgil.com") return (await live(req)) ?? json(truncgil(ds.market))
  if (host === "api.frankfurter.dev") {
    const real = await live(req)
    if (real) return real
    if (/\/v1\/latest/.test(url.pathname)) {
      return json({
        amount: 1,
        base: "TRY",
        date: ymd(addDays(startOfDay(), -1)),
        rates: { USD: 1 / FX_BASE.USD, EUR: 1 / FX_BASE.EUR },
      })
    }
    return json(frankfurterRange(url))
  }
  if (host === "cdn.jsdelivr.net" && /currency-api/.test(url.pathname)) {
    const real = await live(req)
    if (real) return real
    return json({ date: ymd(startOfDay()), try: { ngn: 33.4, ghs: 0.262, ves: 0.9 } })
  }
  if (host === "publicreporting.cftc.gov") return (await live(req)) ?? json(cftc(url))
  return null
}
