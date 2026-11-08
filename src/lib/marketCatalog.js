/**
 * Piyasa kartının seçilebilir satırları (kişi en çok `MAX_ROWS` seçer; kart katalog sırasıyla
 * gösterir: solda kurlar, sağda altın ve endeks).
 *
 *   key    Truncgil anahtarı (TL karşılığı, gün içinde)
 *   fawaz  yalnız gösterge kaynakta olan kur (fawazahmed0, günlük): Nijerya, Gana, Venezuela
 *   unit   küçük birimli kur kaç birim başına (TL karşılığı dört ondalıkta kayboluyordu)
 *   city   o kurun TYRO ofis şehri (dünya saati kimliği) — düzenleyicide "Ofis kurları"
 *
 * ⚠️ Suriye lirası yalnız Truncgil'den: gösterge kaynak eski lirayı veriyor (100 kat fark).
 */
export const MARKET_CATALOG = [
  { id: "usd", key: "USD", kind: "fx", city: "chicago" },
  { id: "eur", key: "EUR", kind: "fx", city: "amsterdam" },
  { id: "cny", key: "CNY", kind: "fx", city: "shanghai" },
  { id: "aed", key: "AED", kind: "fx", city: "dubai" },
  { id: "ron", key: "RON", kind: "fx", city: "maracineni" },
  { id: "kzt", key: "KZT", kind: "fx", unit: 100, city: "astana" },
  { id: "iqd", key: "IQD", kind: "fx", unit: 1000, city: "baghdad" },
  { id: "syp", key: "SYP", kind: "fx", unit: 100, city: "damascus" },
  { id: "cad", key: "CAD", kind: "fx", city: "saskatoon" },
  { id: "ngn", fawaz: "ngn", kind: "fx", unit: 100, city: "suleja" },
  { id: "ghs", fawaz: "ghs", kind: "fx", city: "accra" },
  { id: "ves", fawaz: "ves", kind: "fx", unit: 100, city: "caracas" },
  { id: "gbp", key: "GBP", kind: "fx" },
  { id: "chf", key: "CHF", kind: "fx" },
  { id: "jpy", key: "JPY", kind: "fx", unit: 100 },
  { id: "sar", key: "SAR", kind: "fx" },
  { id: "rub", key: "RUB", kind: "fx" },
  { id: "silver", key: "GUMUS", kind: "gold" },
  { id: "gram", key: "GRA", kind: "gold" },
  { id: "has", key: "HAS", kind: "gold" },
  { id: "bracelet", key: "YIA", kind: "gold" },
  { id: "quarter", key: "CEYREKALTIN", kind: "gold" },
  { id: "half", key: "YARIMALTIN", kind: "gold" },
  { id: "full", key: "TAMALTIN", kind: "gold" },
  { id: "republic", key: "CUMHURIYETALTINI", kind: "gold" },
  { id: "bist", key: "XU100", kind: "index" },
]

export const MAX_ROWS = 6
/** Varsayılan liste: Sterlin yok, yerinde gram gümüş (ürün sahibinin kararı). */
export const DEFAULT_IDS = ["usd", "eur", "silver", "gram", "quarter", "bist"]
// Kendi adı sözlükte olanlar; öteki kurlar ISO koduyla ("CNY"), tam adı `Intl` ile.
export const NAMED_IDS = new Set([
  "usd",
  "eur",
  "silver",
  "gram",
  "has",
  "bracelet",
  "quarter",
  "half",
  "full",
  "republic",
  "bist",
])

const byId = new Map(MARKET_CATALOG.map((r) => [r.id, r]))
export const catalogRow = (id) => byId.get(id) ?? null

/** Kayıtlı listeyi doğrular: bilinmeyen ve yinelenen kimlik düşer, en çok 6; boşsa varsayılan. */
export function sanitizeList(ids) {
  const list = [...new Set(Array.isArray(ids) ? ids : [])].filter((id) => byId.has(id))
  return list.length ? list.slice(0, MAX_ROWS) : DEFAULT_IDS
}

/** Seçilenler katalog sırasıyla. */
export const orderedList = (ids) => MARKET_CATALOG.filter((r) => ids.includes(r.id))
