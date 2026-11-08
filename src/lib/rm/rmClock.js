// tyroRM'de dünya saatinin varsayılanı açık projelerin ülkeleri (sahibin kararı): tyroAI'daki gibi
// bütün ofisler değil. Bölüm planı okuyunca yazar; çentikteki pencere (bölümün dışında) buradan
// okur. Çıkışta temizlenir (`rmCache`).
import { EXTRA_CITIES, HOME_CITY, OFFICE_CITIES } from "@/data/worldCities"
import { onRmClear } from "./rmCache"

let ids = []
const subs = new Set()

export const rmClockDefaults = () => ids

export function subscribeRmClock(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

export function setRmClockDefaults(next) {
  if (next.join() === ids.join()) return
  ids = next
  for (const fn of subs) fn()
}
onRmClear(() => setRmClockDefaults([]))

// Saat dilimine ve ülkeye göre şehir: önce ofis, sonra katalog; aynı anahtarda ilk geçen.
const BY_TZ = new Map()
const BY_CC = new Map()
for (const c of [...OFFICE_CITIES, ...EXTRA_CITIES]) {
  if (!BY_TZ.has(c.tz)) BY_TZ.set(c.tz, c.id)
  if (c.cc && !BY_CC.has(c.cc)) BY_CC.set(c.cc, c.id)
}

/**
 * Açık projelerin ülkeleri → saat şehirleri, ana şehir (İstanbul) başta. Kurulum'da ülkenin saat
 * dilimi varsa o dilimin şehri (katalogda yoksa `tz:…`), yoksa katalogda o ülkenin şehri; ikisi de
 * yoksa ülke atlanır.
 * @param {{ phase: string, country: string }[]} rows proje satırları (`projectRows`)
 * @param {{ code: string, tz?: string }[]} countries Kurulum'daki ülkeler
 */
export function projectClockCities(rows, countries = []) {
  const tz = new Map(countries.map((c) => [c.code, c.tz]))
  const out = [HOME_CITY]
  for (const r of rows) {
    if (r.phase === "done" || !r.country) continue
    const zone = tz.get(r.country)
    const id = zone ? (BY_TZ.get(zone) ?? `tz:${zone}`) : (BY_CC.get(r.country) ?? null)
    if (id && !out.includes(id)) out.push(id)
  }
  return out
}
