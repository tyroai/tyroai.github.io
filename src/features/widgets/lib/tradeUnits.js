/**
 * Ticaret çeviricisi — saf hesap, ağ yok. Bushel hacim ölçüsü: tona çevirmek tahılın USDA libre
 * ağırlığıyla (buğday ve soya 60, mısır 56, arpa 48 lb/bu). Nem indirimi yok: şirketin sözleşme
 * formülü olmadan uydurulmaz.
 */
const LB_KG = 0.45359237

export const GRAINS = [
  { id: "wheat", lb: 60 },
  { id: "soy", lb: 60 },
  { id: "corn", lb: 56 },
  { id: "barley", lb: 48 },
]

/** Girilebilen birimler: bushel, metrik ton, sent/bushel (CBOT fiyatı), dolar/ton. */
export const TRADE_UNITS = ["bu", "t", "cbu", "usdt"]

/** Bir metrik tonda kaç bushel (buğday 36,7437 · mısır 39,3683 · arpa 45,9296). */
export const bushelsPerTonne = (lb) => 1000 / (lb * LB_KG)

/**
 * Değeri öteki birimlere çevirir: bushel ↔ ton; ¢/bu → $/t (ve kur varsa ₺/t); $/t → ¢/bu (ve ₺/t).
 * `usdTry`: Piyasa kartının dolar kuru (gösterge) ya da `null`. Dönüş `[{ unit, value }]`.
 */
export function convertTrade(value, unit, lb, usdTry = null) {
  if (!Number.isFinite(value) || value <= 0) return []
  const bpt = bushelsPerTonne(lb)
  const tl = (usdt) => (usdTry ? [{ unit: "tryt", value: usdt * usdTry }] : [])
  switch (unit) {
    case "bu":
      return [{ unit: "t", value: value / bpt }]
    case "t":
      return [{ unit: "bu", value: value * bpt }]
    case "cbu": {
      const usdt = (value / 100) * bpt
      return [{ unit: "usdt", value: usdt }, ...tl(usdt)]
    }
    case "usdt":
      return [{ unit: "cbu", value: (value * 100) / bpt }, ...tl(value)]
    default:
      return []
  }
}
