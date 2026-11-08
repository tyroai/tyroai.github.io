import { folderOfUrl } from "@/lib/filesResults"
import { typeFamily } from "@/lib/filesTypes"

/**
 * Kayıtlı arama — iğnelenen 1–2 dosya araması ve her birinin son bakış anı. Kayıtta yalnız arama
 * metni ve zaman (`tyro-saved-searches-v1`); sonuçlar Dosyalarım'ın arama önbelleğinde (bellekte,
 * çıkışta silinir). Saf, testli.
 */

export const SAVED_KEY = "tyro-saved-searches-v1"
export const MAX_SAVED = 2
export const MIN_QUERY = 2
export const SHOWN = 3
// Yeni sayısı ilk sayfadan: sıralama son değişikliğe göre, sayfa bu kadar dosya getirir.
export const SEARCH_PAGE = 25
const MAX_LEN = 80
const KIND = { word: "Word", excel: "Excel", powerpoint: "PowerPoint", pdf: "Pdf" }

export const cleanQuery = (q) =>
  String(q ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LEN)

const sameQuery = (a, b) => cleanQuery(a).toLocaleLowerCase() === cleanQuery(b).toLocaleLowerCase()

/** Kayıt → liste; bozuk, boş ya da fazla kayıt düşer. */
export function parseSaved(raw) {
  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return []
  }
  if (data?.v !== 1 || !Array.isArray(data.items)) return []
  const out = []
  for (const it of data.items) {
    const q = cleanQuery(it?.q)
    if (typeof it?.id !== "string" || q.length < MIN_QUERY) continue
    if (out.some((x) => x.id === it.id || sameQuery(x.q, q))) continue
    out.push({ id: it.id, q, seen: Number(it.seen) || 0 })
    if (out.length === MAX_SAVED) break
  }
  return out
}

export const serializeSaved = (list) => JSON.stringify({ v: 1, items: list })

/** İğnele: en çok iki, aynı arama ikinci kez girmez; yeni aramanın sonuçları "yeni" sayılmaz. */
export function addSaved(list, q, now) {
  const text = cleanQuery(q)
  if (text.length < MIN_QUERY || list.length >= MAX_SAVED) return list
  if (list.some((x) => sameQuery(x.q, text))) return list
  return [...list, { id: `s${now.toString(36)}`, q: text, seen: now }]
}

export const removeSaved = (list, id) => list.filter((x) => x.id !== id)

export function markSeen(list, id, at) {
  return list.some((x) => x.id === id && at > x.seen)
    ? list.map((x) => (x.id === id ? { ...x, seen: at } : x))
    : list
}

/** Dosyalarım'ın arama isteği: yalnız dosyalar, son değişen önce. */
export const searchParams = (q) => ({ text: q, kind: "files", sort: "modified" })

const timeOf = (v) => {
  const t = typeof v === "string" ? Date.parse(v) : NaN
  return Number.isNaN(t) ? 0 : t
}

/** Son bakıştan sonra değişmiş ve son değiştiren sen değilsin: kendi kaydettiğin dosya haber değil. */
function isFresh(it, seen, me) {
  const by = String(it.modifiedByEmail ?? "").toLowerCase()
  return timeOf(it.modified) > seen && !(me && by === me)
}

function files(items) {
  return (items ?? [])
    .filter((it) => it?.kind === "file" && it.name && it.webUrl)
    .sort((a, b) => timeOf(b.modified) - timeOf(a.modified))
}

/** Kartın satırları: en yeni üç dosya, her biri "yeni" işaretiyle. */
export function savedRows(items, { seen = 0, me = "", limit = SHOWN } = {}) {
  return files(items)
    .slice(0, limit)
    .map((it) => ({
      id: it.id,
      title: it.name,
      type: KIND[typeFamily(it)] ?? "Other",
      container: folderOfUrl(it.webUrl)?.name ?? "",
      webUrl: it.webUrl,
      at: timeOf(it.modified) ? new Date(timeOf(it.modified)) : null,
      fresh: isFresh(it, seen, me),
    }))
}

/** Gelen sayfadaki yeni dosya sayısı (sekmedeki nokta için). */
export function freshCount(items, seen, me) {
  return files(items).filter((it) => isFresh(it, seen, me)).length
}
