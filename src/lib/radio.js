/**
 * Radyo — istasyon kataloğu Radio Browser (radio-browser.info): topluluk veritabanı,
 * ücretsiz, anahtarsız, CORS açık. Sunucuya yalnız ÜLKE KODU gider; kişinin şehri ve
 * koordinatı tarayıcıdan çıkmaz — yakınlık sıralaması burada, istemcide (`rankStations`).
 *
 * Çalınabilirlik: sayfa HTTPS, yani yalnız `https://` akışlar (HTTP akışı karışık içerik
 * diye engellenir). HLS (`.m3u8`) yalnız tarayıcı kendisi çalabiliyorsa (Safari, güncel
 * Chrome/Edge) — hls.js paketi eklenmez.
 */

import { RADIO_EXTRA, RADIO_HIDDEN, RADIO_LOGOS, RADIO_NAMES } from "@/data/radioStations"
import { prettyName } from "@/lib/radioName"

const BASE = (server) => `https://${server}.api.radio-browser.info`
// Kendi barındırdığımız logolar (Vite `base`ine göre; Node'da `/`).
const LOGO_BASE = `${import.meta.env?.BASE_URL ?? "/"}radio-logos/`
// Aynalar: de1/de2 doğrudan, `all` DNS döngüsü (nl1, at1, fi1 yanıt vermiyordu).
const MIRRORS = ["de1", "de2"]
export const RADIO_LIMIT = 150
// Her tarayıcıda çalan biçimler; HLS ayrıca `canHls` ile.
const CODECS = new Set(["MP3", "AAC", "AAC+"])
// Görüntü akışı (TV kanalının 720p/1080p HLS'i): radyo değil, sesi için yüzlerce kat veri iner.
const VIDEO = /(?:^|[_\-/.])(?:360|480|540|576|720|1080|2160)p?(?=[_\-/.]|$)/i
// Akışı karşılaştırırken sayılmayan sorgu alanları: dinleyici ve reklam izleri.
const VOLATILE = /^(listenerid|awparams|aw_\w+|zs|ttag|dist|cb|nocache)$/i
// Tür yerine ülkeyi söyleyen etiketler.
const NOT_GENRE = new Set(["turkey", "turkiye"])
// Koordinatı olan istasyon bu yarıçap içindeyse "yakında".
export const LOCAL_KM = 80
// Yakındaki en çok dinlenen bu kadar istasyon listenin başına çıkar; gerisi dinlenme sırasında.
export const LOCAL_BOOST = 3

/** Yük aynalara dağılsın (API'nin isteği): de1/de2 rastgele sırada, en sonda `all`. */
export function serverOrder(rand = Math.random) {
  return rand() < 0.5 ? [MIRRORS[0], MIRRORS[1], "all"] : [MIRRORS[1], MIRRORS[0], "all"]
}

export function stationsUrl(server, countryCode) {
  const p = new URLSearchParams({
    countrycode: countryCode,
    hidebroken: "true",
    order: "clickcount",
    reverse: "true",
    limit: String(RADIO_LIMIT),
  })
  return `${BASE(server)}/json/stations/search?${p.toString()}`
}

/** Ülkenin istasyonları (ham) — ayna düşerse sıradakine geçer. */
export async function fetchStations(countryCode, { signal, servers = serverOrder() } = {}) {
  let last = null
  for (const server of servers) {
    try {
      const res = await fetch(stationsUrl(server, countryCode), {
        signal,
        headers: { Accept: "application/json" },
      })
      if (!res.ok) throw Object.assign(new Error(`radio ${res.status}`), { http: res.status })
      const data = await res.json()
      if (Array.isArray(data)) return data
    } catch (e) {
      if (signal?.aborted) throw e
      last = e
    }
  }
  throw last ?? new Error("radio")
}

/** API'nin isteği: istasyon çalınmaya başlayınca bir "tık" (popülerlik sırası bundan). */
export function countClick(id) {
  // Kendi eklediğimiz istasyonlar (`tyro:`) kaynakta yok: sayılacak bir şey yok.
  if (!id || String(id).startsWith("tyro:")) return
  fetch(`${BASE("all")}/json/url/${encodeURIComponent(id)}`).catch(() => {})
}

const https = (u) => (typeof u === "string" && u.startsWith("https://") ? u : "")

/** Shoutcast sunucusunun kökü tarayıcıya HTML durum sayfası verir; akış `/;` yolunda. */
export function streamUrl(u) {
  if (!u) return ""
  try {
    const x = new URL(u)
    return x.pathname === "/" && !x.search && !x.hash ? `${x.origin}/;` : u
  } catch {
    return ""
  }
}
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v))

/** Ham kayıt → istasyon; adı ya da HTTPS akışı yoksa `null`. */
export function toStation(raw) {
  if (!raw?.stationuuid) return null
  const given = String(raw.name ?? "")
    .replace(/\s+/g, " ")
    .trim()
  const name = RADIO_NAMES[brandKey(given)] ?? given
  const url = streamUrl(https(raw.url_resolved) || https(raw.url))
  if (!name || !url) return null
  const lat = num(raw.geo_lat)
  const lon = num(raw.geo_long)
  const geo = Number.isFinite(lat) && Number.isFinite(lon)
  // Kaynağın görseli yok/bozuk olan istasyona kendi logomuz: hazır kare, kapağı tam kaplar.
  const own = RADIO_LOGOS.has(brandKey(name)) ? `${LOGO_BASE}${brandKey(name)}.png` : ""
  return {
    id: raw.stationuuid,
    // Kaynağın yazımı karışık ("DAMAR TURK FM", "baba radyo"): tek kurala (`radioName.js`).
    name: prettyName(name, raw.countrycode),
    url,
    hls: Number(raw.hls) === 1 || /\.m3u8(\?|$)/i.test(url),
    codec: String(raw.codec ?? "").toUpperCase(),
    bitrate: Number(raw.bitrate) > 0 ? Number(raw.bitrate) : null,
    favicon: own || https(raw.favicon),
    art: own ? "cover" : "contain",
    tags: String(raw.tags ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !NOT_GENRE.has(foldText(s)))
      .slice(0, 3),
    state: String(raw.state ?? "").trim(),
    cc: String(raw.countrycode ?? "").toUpperCase(),
    lat: geo ? lat : null,
    lon: geo ? lon : null,
    clicks: Number(raw.clickcount) || 0,
  }
}

const isVideo = (st) => st.hls && VIDEO.test(pathOf(st.url))

export function isPlayable(st, { hls = false } = {}) {
  if (!st) return false
  return st.hls ? hls && !isVideo(st) : CODECS.has(st.codec)
}

function pathOf(u) {
  try {
    return new URL(u).pathname
  } catch {
    return ""
  }
}

/**
 * Akışın kimliği: sunucu + yol (Shoutcast kökü `/;` sayılmaz) + istasyonu seçen sorgu alanları.
 * Dinleyici/reklam izleri (`VOLATILE`) atılır: aynı akış iki kayıtta farklı izle duruyor.
 */
export function streamKey(u) {
  try {
    const x = new URL(u)
    const q = [...x.searchParams]
      .filter(([k]) => /^\w+$/.test(k) && !VOLATILE.test(k))
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join("&")
    const path = x.pathname.replace(/\/?;?$/, "")
    return `${x.host.replace(/^www\./, "")}${path}${q ? `?${q}` : ""}`.toLowerCase()
  } catch {
    return String(u ?? "")
  }
}

const FOLD = { ı: "i", ğ: "g", ü: "u", ş: "s", ö: "o", ç: "c", â: "a", î: "i", û: "u" }

/** Karşılaştırma için: küçük harf, Türkçe harfler ve aksanlar sade ("İstanbul" = "istanbul"). */
export function foldText(s) {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .replace(/[ığüşöçâîû]/g, (c) => FOLD[c])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

// Adın gürültüsü (Kiril ve Arapça karşılıklarıyla); sınır her dilin harfi ve rakamı.
const NOISE =
  /(^|[^\p{L}\p{N}])(fm|radyo|radio|turkey|turkiye|online|canli|live|stream|hd|радио|фм|راديو|إذاعة)(?=[^\p{L}\p{N}]|$)/gu
const NOT_KEY = /[^\p{L}\p{N}]+/gu

/**
 * Aynı istasyonun kopyaları tek anahtarda: "DAMAR TURK FM" = "DamarTurk FM". ⚠️ Her dilin harfi
 * anahtarda kalır: eskiden yalnız a-z kalıyordu, Kiril/Arapça/Çince adlar boş anahtara düşüp
 * birbirinin "kopyası" sayılıyordu (Şanghay ve Astana listesinin yarısı atılıyordu). Yalnız
 * gürültüden oluşan ad ("Radyo FM") sırasından ve ülke adından bağımsız anahtar alır.
 */
export function brandKey(name) {
  const plain = foldText(name)
  const key = plain.replace(NOISE, "$1 ").replace(NOT_KEY, "")
  if (key) return key
  return plain
    .split(NOT_KEY)
    .filter((w) => w && w !== "turkey" && w !== "turkiye")
    .sort()
    .join("")
}

/**
 * Ham liste → çalınabilir, kopyasız, gizlenmemiş istasyonlar (gelen dinlenme sırası korunur).
 * Kopya iki yoldan: aynı ad (`brandKey`) ya da aynı akış (`streamKey` — kaynakta başka adla
 * duran aynı yayın, ör. Kral FM'i çalan "KRAL POP"); ilki, yani en çok dinlenen kalır. Görüntü
 * akışı olduğu için atlanan kaydın sırası aynı adın radyo kaydına geçer (dinleyen onu aramıştı).
 */
export function playableStations(rawList, { hls = false } = {}) {
  const seen = new Set()
  const streams = new Set()
  const slots = new Map()
  const out = []
  for (const raw of rawList ?? []) {
    const st = toStation(raw)
    if (!st) continue
    const key = brandKey(st.name)
    if (!isPlayable(st, { hls })) {
      if (hls && isVideo(st) && !slots.has(key)) slots.set(key, out.length)
      continue
    }
    const stream = streamKey(st.url)
    if (seen.has(key) || streams.has(stream) || RADIO_HIDDEN.has(key)) continue
    seen.add(key)
    streams.add(stream)
    out.splice(slots.get(key) ?? out.length, 0, st)
  }
  return out
}

/**
 * Öne çıkan istasyonlar (`RADIO_EXTRA`, ürün sahibinin seçtiği büyük markalar) listenin BAŞINA,
 * verilen sırayla. Resmî adresini doğruladığımız istasyonda BİZİM kaydımız (kaynaktaki kopyası
 * — ör. Virgin'in yan adresi — listeden çıkar); adres vermediğimizde kaynaktaki kayıt yukarı
 * taşınır, adı bizim yazdığımız gibi ("Metro fm turkey" değil "Metro FM"). Çalınamayan (ör.
 * HLS desteklenmiyor) ya da gizlenen atlanır.
 */
export function withFeatured(stations, cc, { hls = false } = {}) {
  const list = stations ?? []
  const byKey = new Map(list.map((st) => [brandKey(st.name), st]))
  const picked = []
  for (const x of RADIO_EXTRA[cc] ?? []) {
    const key = brandKey(x.name)
    if (RADIO_HIDDEN.has(key) || picked.some((st) => brandKey(st.name) === key)) continue
    const api = byKey.get(key)
    const st = x.url
      ? toStation({
          stationuuid: `tyro:${key}`,
          name: x.name,
          url: x.url,
          url_resolved: x.url,
          hls: x.hls ? 1 : 0,
          codec: x.codec,
          bitrate: x.bitrate,
          favicon: x.favicon ?? "",
          tags: (x.tags ?? []).join(","),
          state: x.state ?? "",
          countrycode: cc,
          clickcount: 0,
        })
      : api
        ? { ...api, name: x.name }
        : null
    if (st && isPlayable(st, { hls })) picked.push(st)
  }
  const keys = new Set(picked.map((st) => brandKey(st.name)))
  return [...picked, ...list.filter((st) => !keys.has(brandKey(st.name)))]
}

/** İki nokta arası (km, büyük daire). */
export function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Yakında mı: koordinatı varsa 80 km içinde, yoksa il/eyalet adı kişinin şehrine ya da iline uyuyor. */
export function isLocal(st, place) {
  if (!st || !place) return false
  if (st.lat != null && Number.isFinite(place.lat) && Number.isFinite(place.lon))
    if (distanceKm(st, place) <= LOCAL_KM) return true
  const state = foldText(st.state)
  if (state.length < 3) return false
  return [place.city, place.region].some((n) => {
    const f = foldText(n)
    return f.length >= 3 && (state.includes(f) || f.includes(state))
  })
}

/**
 * Sıra: favoriler (eklendiği sırayla; listede güncel kaydı varsa o) · yakındaki en çok
 * dinlenen `LOCAL_BOOST` istasyon · geri kalanı dinlenme sırasıyla. Her istasyon `near`
 * (yakında) ve `fav` bayrağını taşır.
 */
export function rankStations(stations, { place, favorites = [], max = 40 } = {}) {
  const byId = new Map((stations ?? []).map((st) => [st.id, st]))
  // Sonradan gizlenen istasyon favorilerden de düşer.
  const favs = favorites.filter((f) => !RADIO_HIDDEN.has(brandKey(f.name)))
  const favIds = new Set(favs.map((f) => f.id))
  // Listede olmayan favori eski yazımla kaydedilmiş olabilir: adı da aynı kurala.
  const head = favs.map((f) => ({
    ...(byId.get(f.id) ?? { ...f, name: prettyName(f.name, f.cc) }),
    fav: true,
  }))
  const local = []
  const rest = []
  for (const st of stations ?? []) {
    if (favIds.has(st.id)) continue
    if (local.length < LOCAL_BOOST && isLocal(st, place)) local.push(st)
    else rest.push(st)
  }
  return [...head, ...local, ...rest]
    .slice(0, max)
    .map((st) => ({ ...st, fav: favIds.has(st.id), near: isLocal(st, place) }))
}

/** Logosu olmayan istasyonun monogramı: iki harf ("Kral Türk FM" → "KT"). */
export function initials(name) {
  const words = String(name ?? "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(fm|am|radyo|radio)$/i.test(w))
  const pick = words.length ? words : String(name ?? "").split(/\s+/)
  return pick
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toLocaleUpperCase("tr")
}
