import { onSessionClear } from "@/lib/sessionCache"
/**
 * Spotlight'ta son açılanlar. Sayfa, eylem ve ofis kimlikleri tarayıcıda kalır (kişisel değil);
 * kişiler yalnız bellekte (başkasının adı ve unvanı diske yazılmaz) ve çıkışta silinir
 * (`clearSpotlightPeople`, `lib/sessionCache`).
 */
const KEY = "tyro-spotlight-recent"
const MAX = 6

let people = [] // [{ kind: "person", key, person }]

function readStored() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]")
    return Array.isArray(v) ? v.filter((x) => x && typeof x.key === "string") : []
  } catch {
    return []
  }
}

/** Son açılanlar, en yenisi başta: `{ kind, key, at, person? }`. */
export function recentItems() {
  return [...people, ...readStored()].sort((a, b) => b.at - a.at).slice(0, MAX)
}

/** Seçileni hatırla; aynı öğe başa taşınır. */
export function rememberRecent(item) {
  const entry = { kind: item.kind, key: item.key, at: Date.now() }
  if (item.kind === "person") {
    people = [{ ...entry, person: item.person }, ...people.filter((x) => x.key !== item.key)].slice(
      0,
      MAX,
    )
    return
  }
  try {
    const next = [entry, ...readStored().filter((x) => x.key !== item.key)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Depo kapalı: son açılanlar bu oturumda tutulmaz.
  }
}

export function clearSpotlightPeople() {
  people = []
}
onSessionClear(clearSpotlightPeople)
