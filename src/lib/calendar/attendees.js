import { fold } from "@/lib/fold"
import { searchPeople } from "@/lib/peopleIndex"

/**
 * Katılımcı önerileri (saf, testli). Kaynaklar: yazıştığın kişiler (`recent`, posta ve takvimden),
 * şirket rehberi (`directory`: `useCompanyDirectory().index`) ve rehber okunamazsa People araması
 * (`remote`). Yazıştıkların rehberdeki adaşından önce gelir ama en çok `RECENT_MAX`: rehber de görünsün.
 */

const RECENT_MAX = 3
const lower = (s) => String(s ?? "").toLowerCase()

/**
 * Yazılan metne uyan kişiler, adrese göre tekil; seçilenler ve kendin hariç. En az iki harf
 * yazılınca öneri başlar (tek harf her ikinci adı getirirdi).
 */
export function suggestPeople({ query, picked, me, recent, directory, remote, limit = 6 }) {
  const q = fold(query)
  if (q.length < 2) return []
  const seen = new Set([...picked.map((p) => lower(p.address)), lower(me)])
  const out = []
  const add = (p) => {
    const address = lower(p?.address)
    if (!address || seen.has(address)) return false
    seen.add(address)
    out.push(p)
    return true
  }
  let near = 0
  for (const p of recent ?? []) {
    if (near >= RECENT_MAX) break
    if ((fold(p.name).includes(q) || fold(p.address).includes(q)) && add(p)) near += 1
  }
  if (directory) for (const r of searchPeople(directory, query)) add(r.person)
  for (const p of remote ?? []) add(p)
  return out.slice(0, limit)
}

/** Önerinin ikinci satırı: unvan ve departman (rehberden), yoksa adres. */
export const personLine = (p) => [p.title, p.department].filter(Boolean).join(" · ") || p.address

/** Kişinin kısa adı: ilk sözcük; ad yerine adres yazılmışsa "@"tan öncesi. */
export function firstName(p) {
  const name = String(p?.name || p?.address || "").trim()
  return name.includes("@") ? name.split("@")[0] : name.split(/\s+/)[0]
}

/**
 * Anlat'ta söylenen adları kişilere eşler (saf, testli): önerinin kaynaklarında (yazıştıkların +
 * rehber) YALNIZ BİR kişiye uyan ad o kişi olur; uyan yoksa ya da birden çok kişi uyuyorsa ad `rest`te
 * kalır (arama kutusuna gider, kişi listeden seçilir). Birden çok uyanın içinde adı birebir tutan tek
 * kişi varsa o. E-posta adresi uydurulmaz: kişi kaynaktan, adres onun kaydından gelir.
 */
export function resolveSpoken(names, { picked = [], me = "", recent = [], directory = null }) {
  const people = []
  const rest = []
  for (const name of names) {
    const hits = suggestPeople({
      query: name,
      picked: [...picked, ...people],
      me,
      recent,
      directory,
      remote: null,
      limit: 20,
    })
    const exact = hits.filter((p) => fold(p.name) === fold(name))
    const one = hits.length === 1 ? hits[0] : exact.length === 1 ? exact[0] : null
    if (one) people.push({ name: one.name, address: one.address })
    else rest.push(name)
  }
  return { people, rest }
}
