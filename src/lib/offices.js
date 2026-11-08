import { OFFICES } from "@/data/offices"
import { bcp47, getDateTimeFormat } from "@/lib/intl-cache"
import { foldAll } from "@/lib/peopleIndex"
import { cityById, cityName, offsetMinutes } from "@/lib/worldClock"

/**
 * Bul › Ofisler — ofis verisinin saf yardımcıları: arama, harita bağlantıları, yerel saat ve
 * rehberdeki kişinin hangi ofiste olduğu (`officeOfPerson`).
 */

export const OFFICE_KINDS = ["hq", "office", "facility", "port"]

const SPLIT = /[\s,.;:/\\|()"'’+_–—-]+/
const words = (s) => s.split(SPLIT).filter(Boolean)

export const officeCity = (o) => cityById(o.city)
export const officeCountry = (o) => officeCity(o)?.cc ?? null
export const isDomestic = (o) => officeCountry(o) === "TR"
export const officeTz = (o) => officeCity(o)?.tz ?? "Europe/Istanbul"

export function officeCityName(o, locale) {
  const c = officeCity(o)
  return c ? cityName(c, locale) : ""
}

const regionNames = new Map()
/** Ülke adı dile göre (`Intl.DisplayNames`), dil başına bir kez kurulur. */
export function countryName(cc, locale) {
  if (!cc) return ""
  if (!regionNames.has(locale)) {
    let dn = null
    try {
      dn = new Intl.DisplayNames([bcp47(locale)], { type: "region" })
    } catch {
      // Eski tarayıcı: kod yazılır.
    }
    regionNames.set(locale, dn)
  }
  return regionNames.get(locale)?.of(cc) ?? cc
}

/** Haritada aç: sitenin kendi bağlantısı (yerin kartı açılır), yoksa adres araması. */
export function mapsUrl(o) {
  if (o.maps) return `https://maps.app.goo.gl/${o.maps}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`
}

/** Yol tarifi: kesin koordinat varsa ona, yoksa adrese. */
export function directionsUrl(o) {
  const to = o.geo && !o.approx ? o.geo.join(",") : o.address
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(to)}`
}

export const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`

/** Ofisin yerel saati ve kullanıcının saatine göre farkı (dakika). */
export function officeClock(o, date, locale, homeTz) {
  const tz = officeTz(o)
  const time = getDateTimeFormat(locale, {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
  return { tz, time, diff: offsetMinutes(tz, date) - offsetMinutes(homeTz, date) }
}

/* ── Arama ── */

const ALL_LOCALES = ["tr", "en", "ru", "ar"]
const searchIndex = new Map() // locale → girdiler

function indexFor(locale, kindLabel) {
  if (searchIndex.has(locale)) return searchIndex.get(locale)
  const entries = OFFICES.map((o) => {
    const city = officeCity(o)
    const cityNames = city ? Object.values(city.names) : []
    const cc = officeCountry(o)
    const countries = [...new Set([locale, ...ALL_LOCALES].map((l) => countryName(cc, l)))]
    const group = (list) => {
      const text = foldAll(list.filter(Boolean).join(" "))
      return { text, words: words(text) }
    }
    return {
      office: o,
      name: group([o.name]),
      city: group(cityNames),
      country: group(countries),
      company: group([o.company]),
      kind: group([kindLabel(o.kind)]),
      rest: group([o.address, o.terms]),
    }
  })
  searchIndex.set(locale, entries)
  return entries
}

const WEIGHTS = [
  ["name", 80],
  ["city", 70],
  ["country", 60],
  ["company", 50],
  ["kind", 40],
  ["rest", 30],
]

function tokenScore(e, token) {
  if (e.name.text.startsWith(token)) return 100
  for (const [key, weight] of WEIGHTS) {
    if (e[key].words.some((w) => w.startsWith(token))) return weight
  }
  if (token.length < 3) return 0
  return WEIGHTS.some(([key]) => e[key].text.includes(token)) ? 10 : 0
}

/** Sorguya uyan ofisler, en iyisi başta. `kindLabel(kind)`: türün o dildeki adı. */
export function searchOffices(query, { locale, kindLabel }) {
  const tokens = words(foldAll(query))
  if (!tokens.length) return []
  const out = []
  for (const e of indexFor(locale, kindLabel)) {
    let score = 0
    for (const token of tokens) {
      const s = tokenScore(e, token)
      if (!s) {
        score = 0
        break
      }
      score += s
    }
    if (score) out.push({ office: e.office, score })
  }
  return out.sort((a, b) => b.score - a.score).map((r) => r.office)
}

/** Sınama: dil değişince dizin yeniden kurulsun. */
export function resetOfficeIndex() {
  searchIndex.clear()
}

/* ── Rehberdeki kişi → ofis ── */

// Çok kelimeli ad önce ("çorum yem" "çorum"dan, "b blok" "beylerbeyi"nden önce bakılır).
const ALIASES = OFFICES.flatMap((o) =>
  (o.match ?? []).map((a) => ({ id: o.id, words: words(foldAll(a)) })),
).sort(
  (a, b) => b.words.length - a.words.length || b.words.join(" ").length - a.words.join(" ").length,
)

function hasRun(hay, run) {
  for (let i = 0; i + run.length <= hay.length; i += 1) {
    if (run.every((w, j) => hay[i + j] === w)) return true
  }
  return false
}

/** Kişinin ofis ve şehir alanı bilinen bir yeri gösteriyorsa o yerin kimliği, yoksa `null`. */
export function officeOfPerson(person) {
  const hay = words(foldAll(`${person?.office ?? ""} ${person?.city ?? ""}`))
  if (!hay.length) return null
  return ALIASES.find((a) => hasRun(hay, a.words))?.id ?? null
}

/** Ofis kimliği → o ofisteki kişiler (rehber sırasıyla). */
export function peopleByOffice(people) {
  const map = new Map()
  for (const p of people ?? []) {
    const id = officeOfPerson(p)
    if (!id) continue
    if (!map.has(id)) map.set(id, [])
    map.get(id).push(p)
  }
  return map
}

export { OFFICES }
