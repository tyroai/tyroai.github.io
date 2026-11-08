/**
 * Piyasa verisi — Türkiye bazlı, ücretsiz ve tarayıcıdan okunabilen (CORS)
 * kaynaklardan; hava durumu gibi kişisel veri taşımaz.
 *
 * - Birincil: Truncgil Finans (`finans.truncgil.com/v4/today.json`) — döviz
 *   (alış · satış · % değişim), gram/çeyrek altın, gümüş, BIST 100; gün içinde
 *   güncellenir.
 * - Yedek: Frankfurter (Avrupa Merkez Bankası, günlük) — yalnız döviz.
 *
 * CBOT vadelileri (buğday, mısır, soya) tarayıcıdan ücretsiz okunamıyor (CME
 * engelliyor, diğer kaynaklar CORS vermiyor); kart onlar için bağlantı verir.
 */

import { MARKET_CATALOG } from "@/lib/marketCatalog"

const TRUNCGIL = "https://finans.truncgil.com/v4/today.json"
const ECB = "https://api.frankfurter.dev/v1/latest?base=TRY&symbols=USD,EUR"
const TTL = 5 * 60_000
// Veri eskiyse (birincil düştü) ya da yedekteysek birincil dakikada bir yeniden denenir: kart
// Truncgil döner dönmez kendini toparlar.
const RETRY_TTL = 60_000
// Bir istek takılırsa (kopan bağlantıda tarayıcı dakikalarca bekleyebiliyor) "Yenile" aynı bekleyen
// isteğe bağlanıp hiçbir şey yapmıyordu: her deneme bu sürede kesilir.
const TIMEOUT_MS = 5000
// Birincilin son verisi bu süreden tazeyse yedeğe düşülmez (yedek yalnız iki kur gösterir); hafta
// sonunu kapsar. Kart saatin yanında günü de yazar, "Güncellenemedi" der.
const KEEP_PRIMARY = 3 * 24 * 60 * 60_000
// Son birincil veri tarayıcıda (herkese açık piyasa verisi, kişisel değil): sayfa Truncgil'in kopuk
// olduğu bir anda açılsa da kart altı satırla gelir.
const KEY = "tyro-market-v1"

// Truncgil'in okunan satırları: kişinin seçebileceği her şey (`lib/marketCatalog`).
const TRUNCGIL_ROWS = MARKET_CATALOG.filter((r) => r.key)

/** CBOT için dış bağlantılar (veri çekilmez; yeni sekmede açılır). */
export const CBOT_LINKS = [
  { id: "wheat", href: "https://www.tradingview.com/symbols/CBOT-ZW1!/" },
  { id: "corn", href: "https://www.tradingview.com/symbols/CBOT-ZC1!/" },
  { id: "soy", href: "https://www.tradingview.com/symbols/CBOT-ZS1!/" },
]

const num = (v) => {
  const n = typeof v === "string" ? Number(v.replace(/\./g, "").replace(",", ".")) : Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Truncgil yanıtı → katalogdaki bütün satırlar (küçük birimli kur `unit` başına). Fiyatı olmayan
 * (0) satır düşer. `Update_Date` Türkiye saatiyle gelir ("YYYY-AA-GG SS:DD:ss"): tarayıcının saat
 * dilimi sanılırsa yurt dışında kayar.
 */
export function parseTruncgil(data) {
  const rows = TRUNCGIL_ROWS.map((r) => {
    const raw = data?.[r.key]
    const value = num(raw?.Selling) || num(raw?.Buying)
    return value ? { ...r, value: value * (r.unit ?? 1), change: num(raw?.Change) } : null
  }).filter(Boolean)
  const at =
    typeof data?.Update_Date === "string"
      ? new Date(`${data.Update_Date.trim().replace(" ", "T")}+03:00`)
      : null
  return { rows, at: at && !Number.isNaN(at.getTime()) ? at : null, source: "truncgil" }
}

/** Frankfurter (TRY tabanlı) → döviz satırları (değişim bilinmiyor). */
export function parseEcb(data) {
  const rates = data?.rates ?? {}
  const rows = TRUNCGIL_ROWS.filter((r) => r.kind === "fx")
    .map((r) => (rates[r.key] ? { ...r, value: (r.unit ?? 1) / rates[r.key], change: null } : null))
    .filter(Boolean)
  const at = data?.date ? new Date(`${data.date}T16:00:00Z`) : null
  return { rows, at, source: "ecb" }
}

let cache = null // { value, fetchedAt } — fetchedAt: son denemenin anı
let inflight = null

async function getJson(url) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

// Truncgil today.json'u on yıllık önbellek süresiyle sunuyor (max-age=315360000): araya giren bir
// önbellek (kurum vekil sunucusu) eski kopyayı verebilir. Adres dakikada bir değişir.
const fresh = () => `${TRUNCGIL}?t=${Math.floor(Date.now() / 60_000)}`

// Truncgil ara ara kısa sürelerle bağlantıyı kesiyor (ölçüldü: bir dakika içinde dört istekten
// dördü düştü, sonraki altısı geldi): iki kez, artan aralıkla yeniden denenir. Zaman aşımında
// denenmez — takılan sunucu iki saniyede toparlanmıyor, Yenile boşuna 18 sn bekliyordu.
const RETRY_MS = [600, 2000]
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function readPrimary() {
  for (let i = 0; ; i++) {
    let got = null
    let timedOut = false
    try {
      got = parseTruncgil(await getJson(fresh()))
    } catch (e) {
      timedOut = e?.name === "AbortError"
    }
    if (got?.rows.length) return { ...got, okAt: Date.now() }
    if (timedOut || i === RETRY_MS.length) return null
    await wait(RETRY_MS[i])
  }
}

const readBackup = () =>
  getJson(ECB).then(
    (data) => {
      const out = parseEcb(data)
      return out.rows.length ? out : null
    },
    () => null,
  )

function loadLast() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null")
    if (v?.source !== "truncgil" || !v.rows?.length || !Number.isFinite(v.okAt)) return null
    return { ...v, at: v.at ? new Date(v.at) : null }
  } catch {
    return null
  }
}

function saveLast(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // Depo kapalı: son veri yalnız bu oturumda kalır.
  }
}

/** Elde ne varsa — ağa çıkmadan (kartın ilk boyaması): bellekteki ya da saklanan son veri. */
export function peekMarket() {
  return cache?.value ?? loadLast()
}

/**
 * Satırlar + güncelleme anı. Birincil (Truncgil) düşerse son birincil veri kalır ve `stale` ile
 * işaretlenir — "Yenile" tek bir kopuşta kartı iki dövizlik günlük yedeğe indirmesin; son veri de
 * yoksa (ya da üç günden eskiyse) yedek (Avrupa Merkez Bankası). Hiçbiri yoksa `null`.
 */
export function fetchMarket({ force = false } = {}) {
  const ttl = cache && (cache.value.stale || cache.value.source === "ecb") ? RETRY_TTL : TTL
  if (!force && cache && Date.now() - cache.fetchedAt < ttl) return Promise.resolve(cache.value)
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const primary = await readPrimary()
      if (primary) {
        saveLast(primary)
        cache = { value: primary, fetchedAt: Date.now() }
        return primary
      }
      const last = cache?.value.source === "truncgil" ? cache.value : loadLast()
      const keep = last && Date.now() - last.okAt < KEEP_PRIMARY
      const backup = keep ? null : await readBackup()
      const value = backup ?? (last ? { ...last, stale: true } : null)
      if (value) cache = { value, fetchedAt: Date.now() }
      return value
    } finally {
      inflight = null
    }
  })()
  return inflight
}

/** Testler için: önbelleği boşaltır. */
export function resetMarketCache() {
  cache = null
  inflight = null
}
