import { firstName } from "./attendees"

/**
 * Paylaşılan takvimin kişileri (saf, testli): katman anahtarı ve ekranda kısa ad.
 */

/** Kişinin açma-kapama katmanı: "p:<adres>" (`tyro-calendar-v1` katmanlarında). */
export const personLayer = (address) => `p:${String(address ?? "").toLowerCase()}`

const lower = (v) => String(v ?? "").toLocaleLowerCase("tr")
const clip = (word, n) => Array.from(word).slice(0, n).join("")

// Soyad: son sözcük; tek sözcüklü ya da adres olan adda yok.
function lastWord(p) {
  const words = String(p?.name ?? "")
    .trim()
    .split(/\s+/)
  return words.length > 1 && !words[0].includes("@") ? words.at(-1) : ""
}

const fullOf = (r) => String(r.p.name || r.p.address).trim()
const prefixName = (r, n) =>
  r.last ? `${r.first} ${clip(r.last, n)}${Array.from(r.last).length > n ? "." : ""}` : r.first

/**
 * Aynı ilk ada sahip bir grubun ayırt edici adları: soyadın önekini ("Mehmet Y." → "Mehmet Yılm." ·
 * "Mehmet Yıld.") birbirinden FARKLI kişiler ayrışana dek uzatır; önek yetmezse tam ad. Tam adı da
 * aynı olan iki kişi aynı adı alır (ayırt edecek tek şey adres: çipin ipucunda), uzun adres yazılmaz.
 */
function distinct(group) {
  const people = [...new Map(group.map((r) => [lower(fullOf(r)), r])).values()]
  const longest = Math.max(...people.map((r) => Array.from(r.last).length), 1)
  for (let n = 1; n <= longest; n++) {
    const names = people.map((r) => lower(prefixName(r, n)))
    if (new Set(names).size === people.length) return group.map((r) => prefixName(r, n))
  }
  return group.map(fullOf)
}

/**
 * Listedeki herkesin kısa adı (`Map<adres, ad>`): ilk sözcük; aynı ilk ad birden çok kişide varsa
 * soyadın öneki eklenir ("Mehmet D." · "Mehmet K."; "Mehmet Yılm." · "Mehmet Yıld." baş harf de
 * aynıysa), çipte, etkinlik başlığında ve ekip özetinde kim olduğu karışmasın.
 */
export function shortNames(people) {
  const rows = (people ?? []).map((p) => ({
    key: String(p.address).toLowerCase(),
    p,
    first: firstName(p),
    last: lastWord(p),
  }))
  const groups = new Map()
  for (const r of rows) groups.set(lower(r.first), [...(groups.get(lower(r.first)) ?? []), r])
  const out = new Map()
  for (const group of groups.values()) {
    if (group.length === 1) out.set(group[0].key, group[0].first)
    else distinct(group).forEach((name, i) => out.set(group[i].key, name))
  }
  return out
}
