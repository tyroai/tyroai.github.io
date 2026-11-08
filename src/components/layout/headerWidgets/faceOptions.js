import { MARKET_CATALOG } from "@/lib/marketCatalog"
import { headerOf } from "@/features/widgets/registry"

/**
 * Tepsideki yüzün seçenekleri ("header'da ne görünsün"): her widget'ta simge + bilgi (varsayılan)
 * ya da yalnız simge; havada ayrıca en yüksek / en düşük; To-Do'da gecikenler, postada
 * okunmamışlar; piyasada hangi kur (en çok iki); dünya saatinde hangi şehir. Kayıtta yalnız
 * varsayılandan farklı olan (`tyro-header-widgets-v1` › `faces`). Saf, testli.
 */

// Canlı bilgisi olan widget'lar (yüzü sayı taşıyanlar) kayıtta (`header.shows`); ötekilerde yüz
// seçeneği yok. Seçeneğin adı genelde ortak ("Simge ve bilgi"); widget'a özel ad `header.labels`.
export const faceLabelKey = (id, show) =>
  headerOf(id).labels?.[show] ?? `headerWidgets.face.${show}`

export const MARKET_FACE_MAX = 2
export const MARKET_FACE_DEFAULT = ["usd"]
const MARKET_IDS = new Set(MARKET_CATALOG.map((r) => r.id))

/** Widget'ın yüz seçenekleri: `shows` (ne görünür), `codes` (piyasa), `city` (dünya saati). */
export function faceOptionsOf(id) {
  return { shows: headerOf(id).shows ?? [], codes: id === "market", city: id === "world-clock" }
}

/** Kayıttaki yüz → geçerli ve varsayılandan farklı alanlar; hepsi varsayılansa `null`. */
export function sanitizeFace(id, raw) {
  const opts = faceOptionsOf(id)
  if (!raw || typeof raw !== "object" || !opts.shows.length) return null
  const out = {}
  if (opts.shows.includes(raw.show) && raw.show !== opts.shows[0]) out.show = raw.show
  if (opts.codes && Array.isArray(raw.codes)) {
    const codes = [...new Set(raw.codes.filter((c) => MARKET_IDS.has(c)))].slice(0, MARKET_FACE_MAX)
    if (codes.length && codes.join() !== MARKET_FACE_DEFAULT.join()) out.codes = codes
  }
  if (opts.city && typeof raw.city === "string" && /^[a-z-]{2,40}$/.test(raw.city))
    out.city = raw.city
  return Object.keys(out).length ? out : null
}

/** Yüzün tamamı (varsayılanlarla): çizenler için. */
export function faceOf(id, saved) {
  const opts = faceOptionsOf(id)
  return {
    show: saved?.show ?? opts.shows[0] ?? "icon",
    codes: saved?.codes ?? (opts.codes ? MARKET_FACE_DEFAULT : []),
    city: saved?.city ?? null,
  }
}

/** Piyasada kur seç/bırak: en çok iki, en az bir (son kalan bırakılamaz). */
export function toggleCode(codes, id) {
  if (codes.includes(id)) return codes.length > 1 ? codes.filter((c) => c !== id) : codes
  return codes.length < MARKET_FACE_MAX ? [...codes, id] : codes
}
