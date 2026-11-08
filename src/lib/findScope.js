/**
 * Bul sekmesinin kapsam şeridi (adreste `fsrc`; `all` varsayılan, yazılmaz). Kişiler ve Ofisler
 * dosya kaynağı değil, kendi görünümleri (`FindVertical`); öbürleri Dosyalarım'ın kaynakları.
 */
export const FIND_SCOPES = [
  "all",
  "people",
  "offices",
  "onedrive",
  "sharepoint",
  "corporate",
  "mail",
  "onenote",
]

export const VERTICALS = ["people", "offices"]

export const verticalOf = (fsrc) => (VERTICALS.includes(fsrc) ? fsrc : null)

/** Kapsamı yazar: klasör konumu ve organizasyon odağı düşer, `all` adresten silinir. */
export function withScope(params, scope) {
  const p = new URLSearchParams(params)
  p.delete("floc")
  p.delete("forg")
  if (scope === "all") p.delete("fsrc")
  else p.set("fsrc", scope)
  return p
}

/**
 * Organizasyon görünümü: Kişiler kapsamında `forg=<kimlik>` (opak kimlik, ad değil). Geçmişe
 * yazılır — geri tuşu bir önceki kişiye döner.
 */
export function withOrg(params, id) {
  const p = withScope(params, "people")
  p.set("forg", id)
  return p
}

/** Uygulamanın her yerinden (kişi kartı) organizasyon görünümünün adresi. */
export const orgPath = (id) => `/feed?sec=docs&fsrc=people&forg=${encodeURIComponent(id)}`

/*
 * Kişiler'in filtresi (departman ya da ofis) — yalnız bellekte: sekmeden çıkıp dönene kalır,
 * adrese yazılmaz (adreste yalnız kapsam). `{ kind: "dept" | "office", id, label }`.
 */
let peopleFilter = null
const listeners = new Set()

export const getPeopleFilter = () => peopleFilter

export function setPeopleFilter(next) {
  peopleFilter = next
  for (const cb of listeners) cb()
}

export function subscribePeopleFilter(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
