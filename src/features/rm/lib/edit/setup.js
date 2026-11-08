// Kurulum tabloları (şartname rLk + v5.9 kategoriler + v6.0 kategori ekipleri + v6.6 renkler):
// ekipler, unvanlar, öncelikler, durumlar, ülkeler ve proje kategorileri. Ad değişikliği
// kullanıldığı her kayda yansır; kullanılan değer başka değere taşınmadan silinmez.
import { projectColor } from "./project"

export const LK_KINDS = ["teams", "titles", "prios", "statuses", "countries"]
// Sistem kayıtları: adı değişmez, silinmez (şartname LK_LOCK; v5.3 "Müdür" eklendi).
export const LK_LOCK = {
  titles: ["Yönetici", "Müdür"],
  statuses: ["Tamamlandı"],
  countries: ["TR"],
}
export const TEAM_GROUPS = ["cons", "dev", "pmo"]
export const LEVELS = ["L1", "L2", "L3"]

const FOLD = { ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i" }
const nrm = (s) =>
  String(s || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[’'`´"]/g, " ")
    .replace(/[ışğüöçâî]/g, (c) => FOLD[c])
    .replace(/[^a-z0-9→ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

export const lkKey = (kind, x) => (kind === "countries" ? x.code : x.name)
export const lkLocked = (kind, x) => (LK_LOCK[kind] || []).includes(lkKey(kind, x))

/** Değerin kullanıldığı yerler: [{ where, items }] (`rm.setup.use.*`). */
export function lkUse(S, kind, v) {
  const out = []
  const add = (where, items) => items.length && out.push({ where, items })
  const pName = (p) => `${p.code} – ${p.name}`
  if (kind === "teams")
    add(
      "resTeam",
      S.resources.filter((r) => r.team === v).map((r) => r.name),
    )
  if (kind === "titles")
    add(
      "resRole",
      S.resources.filter((r) => r.role === v).map((r) => r.name),
    )
  if (kind === "prios") add("projPrio", S.projects.filter((p) => p.prio === v).map(pName))
  if (kind === "statuses") {
    add("projStatus", S.projects.filter((p) => p.status === v).map(pName))
    add(
      "opsStatus",
      (S.ops || []).filter((o) => o.status === v).map((o) => o.task || "—"),
    )
  }
  if (kind === "countries") {
    add("projCountry", S.projects.filter((p) => (p.country || "TR") === v).map(pName))
    add(
      "holCountry",
      (S.holidays || [])
        .filter((h) => (h.country || "TR") === v)
        .map((h) => h.name || h.date || "—"),
    )
  }
  return out
}

export const countUses = (u) => u.reduce((a, x) => a + x.items.length, 0)

/** Aynı ad (ülkede kod) tabloda var mı? Türkçe harf ve noktalama duyarsız. */
export function lkDup(S, kind, v, skip = -1) {
  const k = nrm(v)
  return (S.lk?.[kind] || []).some((x, i) => i !== skip && nrm(lkKey(kind, x)) === k)
}

/** Değeri kullanan her kaydı yeni değere geçirir (şartname lkRename/lkReplace). */
export function lkRewrite(S, kind, from, to) {
  if (kind === "teams") for (const r of S.resources) if (r.team === from) r.team = to
  if (kind === "titles") for (const r of S.resources) if (r.role === from) r.role = to
  if (kind === "prios") for (const p of S.projects) if (p.prio === from) p.prio = to
  if (kind === "statuses") {
    for (const p of S.projects) if (p.status === from) p.status = to
    for (const o of S.ops || []) if (o.status === from) o.status = to
  }
  if (kind === "countries") {
    for (const p of S.projects) if ((p.country || "TR") === from) p.country = to
    for (const h of S.holidays || []) if ((h.country || "TR") === from) h.country = to
  }
}

/** Satırın bir alanını yazar; ad değişince (ülke hariç) kullanıldığı her kayıt da değişir. */
export function lkSet(S, kind, i, field, value) {
  const x = S.lk[kind][i]
  if (!x) return
  if (field === "name" && kind !== "countries" && value !== x.name)
    lkRewrite(S, kind, x.name, value)
  x[field] = value
}

export function lkAdd(S, kind, o) {
  S.lk[kind] = [...(S.lk[kind] || []), o]
}

/** Siler; kullanılıyorsa önce kayıtlar `replaceWith` değerine taşınır (şartname "Taşı ve sil"). */
export function lkDelete(S, kind, key, replaceWith = null) {
  if (replaceWith != null) lkRewrite(S, kind, key, replaceWith)
  S.lk[kind] = S.lk[kind].filter((x) => lkKey(kind, x) !== key)
}

export function lkMove(S, kind, i, d) {
  const a = S.lk[kind]
  const j = i + d
  if (j < 0 || j >= a.length) return
  ;[a[i], a[j]] = [a[j], a[i]]
}

// Kategori renkleri göz yormasın: koyu renk açık tona çevrilir (v6.6 soften).
const hex = (c) => /^#[0-9a-f]{6}$/i.test(c || "")
const lumi = (c) => {
  const v = [1, 3, 5]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
}
export function soften(c) {
  if (!hex(c)) return "#EEEED3"
  let [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
  const out = () => `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}`
  for (let k = 0; lumi(out()) < 0.5 && k < 20; k++) {
    r += (255 - r) * 0.18
    g += (255 - g) * 0.18
    b += (255 - b) * 0.18
  }
  return out().toUpperCase()
}

/** Proje renkleri ilk kategoriden (v6.6 syncColors); eski renk `color0`da kalır. */
export function syncColors(S) {
  for (const p of S.projects) {
    const c = projectColor(S, p.cats)
    if (p.color !== c) {
      if (p.color0 == null) p.color0 = p.color
      p.color = c
    }
  }
}

/** Kategori adı hatası: "required" · "taken" ya da null. */
export function catError(S, name, skip = -1) {
  const n = String(name || "").trim()
  if (!n) return "required"
  if ((S.pcats || []).some((c, i) => i !== skip && nrm(c.name) === nrm(n))) return "taken"
  return null
}

export function catAdd(S, { name, color, teams }) {
  S.pcats = [...(S.pcats || []), { name: name.trim(), color: soften(color), teams: teams || [] }]
  syncColors(S)
}

/** Kategoriyi günceller; ad değişince projelerdeki kategori adı da değişir. */
export function catSet(S, i, patch) {
  const c = S.pcats[i]
  if (!c) return
  if (patch.name != null && patch.name.trim() !== c.name) {
    const old = c.name
    const nv = patch.name.trim()
    for (const p of S.projects) p.cats = (p.cats || []).map((z) => (z === old ? nv : z))
    c.name = nv
  }
  if (patch.color != null) c.color = soften(patch.color)
  if (patch.teams != null) c.teams = patch.teams.slice()
  syncColors(S)
}

export function catDelete(S, i) {
  const c = S.pcats[i]
  if (!c) return
  S.pcats = S.pcats.filter((_, k) => k !== i)
  for (const p of S.projects) p.cats = (p.cats || []).filter((z) => z !== c.name)
  syncColors(S)
}

export function catMove(S, i, d) {
  const a = S.pcats
  const j = i + d
  if (j < 0 || j >= a.length) return
  ;[a[i], a[j]] = [a[j], a[i]]
  syncColors(S)
}

/**
 * Kategori taslağını uygular: silinenler projelerden düşer, ad değişiklikleri iki adımda (takas
 * güvenli) projelere yansır, renkler yumuşar, proje renkleri ilk kategoriden eşitlenir.
 * `rows`: [{ k, orig, name, color, teams, … }], `gone`: silinen kategori adları.
 */
export function applyCatDraft(S, rows, gone) {
  const cats = (fn) => {
    for (const p of S.projects) p.cats = fn(p.cats || [])
  }
  for (const g of gone) cats((l) => l.filter((z) => z !== g))
  const renamed = rows.filter((x) => x.orig != null && x.name.trim() !== x.orig)
  for (const x of renamed) cats((l) => l.map((z) => (z === x.orig ? `\u0000${x.k}` : z)))
  for (const x of renamed) cats((l) => l.map((z) => (z === `\u0000${x.k}` ? x.name.trim() : z)))
  S.pcats = rows.map((x) => {
    const c = Object.fromEntries(Object.entries(x).filter(([f]) => f !== "k" && f !== "orig"))
    return { ...c, name: x.name.trim(), color: soften(x.color), teams: (x.teams || []).slice() }
  })
  syncColors(S)
}
