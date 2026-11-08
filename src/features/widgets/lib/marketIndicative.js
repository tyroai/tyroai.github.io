import { MARKET_CATALOG } from "@/lib/marketCatalog"

/**
 * Gösterge kurlar — Truncgil'de olmayan ofis kurları (Nijerya, Gana, Venezuela) fawazahmed0'dan
 * (`currency-api`, CC0, anahtarsız, CORS açık, GÜNLÜK): TRY tabanlı oranın tersi. İşlem kuru değil;
 * kart "≈" ve tarihle gösterir. Yalnız listede ya da düzenleyicide gerekince okunur.
 */
const URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/try.json"
const TTL = 60 * 60_000
const TIMEOUT_MS = 6000

export const INDICATIVE_IDS = new Set(MARKET_CATALOG.filter((r) => r.fawaz).map((r) => r.id))

/** Yanıt → `{ rows, date }`; satır `value` = TL karşılığı (`unit` başına), `indicative: true`. */
export function parseIndicative(data) {
  const rates = data?.try ?? {}
  const rows = MARKET_CATALOG.filter((r) => r.fawaz && rates[r.fawaz] > 0).map((r) => ({
    ...r,
    value: (r.unit ?? 1) / rates[r.fawaz],
    change: null,
    indicative: true,
  }))
  return { rows, date: typeof data?.date === "string" ? data.date : null }
}

let cache = null // { value, at }
let inflight = null

/** Gösterge satırlar (saatte bir) ya da `null`. */
export function fetchIndicative() {
  if (cache && Date.now() - cache.at < TTL) return Promise.resolve(cache.value)
  if (inflight) return inflight
  inflight = (async () => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      // CDN yanıtı bir hafta önbellekte tutulabiliyor (max-age=604800): tarayıcı önbelleği atlanır.
      const res = await fetch(URL, { cache: "no-store", signal: ctrl.signal })
      if (!res.ok) return null
      const value = parseIndicative(await res.json())
      if (!value.rows.length) return null
      cache = { value, at: Date.now() }
      return value
    } catch {
      return null
    } finally {
      clearTimeout(timer)
      inflight = null
    }
  })()
  return inflight
}

/** Testler için: önbelleği boşaltır. */
export function resetIndicativeCache() {
  cache = null
  inflight = null
}
