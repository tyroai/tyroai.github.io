import { MARKET_REPORTS } from "@/data/marketReports"
import { releasesOf } from "@/lib/reportDay"

/**
 * CFTC Commitments of Traders (Disaggregated, Futures Only) — fonların (managed money) uzun/kısa
 * pozisyonu, Socrata'dan (`publicreporting.cftc.gov`, ABD kamu verisi, anahtarsız, CORS açık).
 * Kurumun tek IP'si Socrata kotasını paylaşıyor: kişi başına haftada bir okuma, son veri tarayıcıda
 * (herkese açık veri — çıkışta silinmesi gerekmez). Anahtar kullanılmaz (`VITE_*` herkese açık).
 */
const URL = "https://publicreporting.cftc.gov/resource/72hh-3qpy.json"
const KEY = "tyro-cot-v1"
const TIMEOUT_MS = 8000
// Yayın saatinde veri henüz yoksa (tatil, gecikme) en çok bu sıklıkla yeniden denenir.
const RETRY_MS = 30 * 60_000
const DAY = 86_400_000

export const COT_MARKETS = [
  { id: "srw", code: "001602" },
  { id: "hrw", code: "001612" },
  { id: "corn", code: "002602" },
  { id: "soy", code: "005602" },
  { id: "sugar", code: "080732" },
  { id: "cotton", code: "033661" },
]

const num = (v) => {
  const n = Number(v)
  return v != null && Number.isFinite(n) ? n : null
}

/**
 * Socrata satırları → her pazarın en son raporu: uzun, kısa, net, haftalık net değişim, açık
 * pozisyon; `asOf` verinin tarihi (salı). Değerler metin gelir.
 */
export function parseCot(rows) {
  const latest = new Map()
  for (const r of rows ?? []) {
    const date = String(r?.report_date_as_yyyy_mm_dd ?? "").slice(0, 10)
    if (!date || (latest.get(r.cftc_contract_market_code)?.date ?? "") >= date) continue
    latest.set(r.cftc_contract_market_code, { date, r })
  }
  const markets = COT_MARKETS.map((m) => {
    const hit = latest.get(m.code)
    const long = num(hit?.r.m_money_positions_long_all)
    const short = num(hit?.r.m_money_positions_short_all)
    if (long == null || short == null) return null
    const dl = num(hit.r.change_in_m_money_long_all)
    const ds = num(hit.r.change_in_m_money_short_all)
    return {
      ...m,
      date: hit.date,
      long,
      short,
      net: long - short,
      netChange: dl != null && ds != null ? dl - ds : null,
      oi: num(hit.r.open_interest_all),
    }
  }).filter(Boolean)
  if (!markets.length) return null
  return { asOf: markets.reduce((a, m) => (m.date > a ? m.date : a), ""), markets }
}

/** Sorgu: altı pazar, son sekiz hafta — aynı kodlar 2014 öncesinin eski adlarını da taşıyor. */
export function cotUrl(now) {
  const since = new Date(now - 56 * DAY).toISOString().slice(0, 10)
  const codes = COT_MARKETS.map((m) => `'${m.code}'`).join(",")
  const p = new URLSearchParams({
    $select:
      "cftc_contract_market_code,report_date_as_yyyy_mm_dd,m_money_positions_long_all,m_money_positions_short_all,change_in_m_money_long_all,change_in_m_money_short_all,open_interest_all",
    $where: `cftc_contract_market_code in(${codes}) AND report_date_as_yyyy_mm_dd >= '${since}T00:00:00.000'`,
    $order: "report_date_as_yyyy_mm_dd DESC",
    $limit: "60",
  })
  return `${URL}?${p}`
}

/** Son yayının (şu andan önce) taşıması gereken veri tarihi: yayından önceki salı. */
export function expectedAsOf(now) {
  const cot = MARKET_REPORTS.find((r) => r.id === "cot")
  const release = releasesOf(cot)
    .filter((r) => r.at.getTime() <= now)
    .at(-1)
  if (!release) return null
  const day = new Date(`${release.key}T12:00:00Z`)
  const back = (day.getUTCDay() - 2 + 7) % 7 || 7
  return new Date(day.getTime() - back * DAY).toISOString().slice(0, 10)
}

/**
 * Okumak gerekir mi: veri yoksa ya da son yayının verisinden eskiyse — son denemeden
 * `RETRY_MS` geçtiyse. Takvim bittiyse haftada bir.
 */
export function cotStale(cache, now) {
  if (!cache?.data) return true
  if (now - (cache.triedAt ?? 0) < RETRY_MS) return false
  const want = expectedAsOf(now)
  return want ? cache.data.asOf < want : now - cache.triedAt > 7 * DAY
}

function readCache() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null")
    return v?.v === 1 && v.data?.markets?.length ? v : null
  } catch {
    return null
  }
}

function saveCache(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, ...value }))
  } catch {
    // Depo kapalı: veri bu oturumda kalır.
  }
}

let memory = null
let inflight = null

/** Elde ne varsa (istek yok). */
export const peekCot = () => (memory ?? readCache())?.data ?? null

/** COT verisi: gerekiyorsa okur, yoksa elde olanı verir; hiçbiri yoksa `null`. */
export function fetchCot({ now = Date.now() } = {}) {
  const cache = memory ?? readCache()
  if (!cotStale(cache, now)) return Promise.resolve(cache.data)
  if (inflight) return inflight
  inflight = (async () => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(cotUrl(now), { signal: ctrl.signal })
      const data = res.ok ? parseCot(await res.json()) : null
      if (data) {
        memory = { data, triedAt: now }
        saveCache(memory)
        return data
      }
    } catch {
      // Ağ ya da kota (429): elde olan kalır, yarım saat sonra yeniden denenir.
    } finally {
      clearTimeout(timer)
      inflight = null
    }
    memory = cache ? { ...cache, triedAt: now } : null
    if (memory) saveCache(memory)
    return cache?.data ?? null
  })()
  return inflight
}

/** Testler için. */
export function resetCot() {
  memory = null
  inflight = null
}
