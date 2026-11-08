/**
 * Kurun son 30 günü — Avrupa Merkez Bankası (Frankfurter: Piyasa'nın yedek kaynağı, CORS açık,
 * anahtar yok). Piyasa penceresindeki canlı çizgi grafiğin geçmişi. Yalnız ECB'nin yayınladığı
 * kurlar (USD, EUR, GBP …); altın, BIST ve listede olmayan para birimi için yok. Kişisel veri
 * değil: bellekte, gün içinde bir kez (yayın günde bir).
 */
const BASE = "https://api.frankfurter.dev/v1"
const ECB_CODES = new Set(["USD", "EUR", "GBP", "CHF", "JPY", "CNY", "RON", "CAD"])
const DAY_MS = 86_400_000
const TIMEOUT_MS = 8_000
export const FX_DAYS = 30

/** Bu satırın ECB geçmişi var mı (döviz ve ECB'nin listesinde). */
export const hasFxHistory = (row) => row?.kind === "fx" && ECB_CODES.has(row.key)

/** Başlangıç günü (YYYY-MM-DD, UTC): bugünden `days` gün önce. */
export const fxStart = (now, days = FX_DAYS) =>
  new Date(now - days * DAY_MS).toISOString().slice(0, 10)

/**
 * Frankfurter'in dönem cevabı → `{ time (unix sn), value }` noktaları, tarih sırasıyla. Değer
 * satırın birimiyle (100 JPY gibi) çarpılır: kartın gösterdiği sayıyla aynı ölçekte olsun.
 * Yayın saati 16.00 CET civarı: nokta o günün 15.00 UTC'sine konur.
 */
export function parseFxHistory(data, unit = 1) {
  const rates = data?.rates ?? {}
  return Object.keys(rates)
    .sort()
    .map((date) => ({
      time: Date.parse(`${date}T15:00:00Z`) / 1000,
      value: rates[date]?.TRY * unit,
    }))
    .filter((p) => Number.isFinite(p.time) && Number.isFinite(p.value) && p.value > 0)
}

const cache = new Map() // kod → { day, points }

/** Satırın son 30 günü; aynı gün ikinci istek bellekten. Kaynak cevap vermezse fırlatır. */
export async function fetchFxHistory(row, now = Date.now()) {
  if (!hasFxHistory(row)) return []
  const day = new Date(now).toISOString().slice(0, 10)
  const hit = cache.get(row.key)
  if (hit?.day === day) return hit.points
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE}/${fxStart(now)}..?base=${row.key}&symbols=TRY`, {
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`fx ${res.status}`)
    const points = parseFxHistory(await res.json(), row.unit ?? 1)
    cache.set(row.key, { day, points })
    return points
  } finally {
    clearTimeout(timer)
  }
}
