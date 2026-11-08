// Projeler sayfasının filtreleri adreste durur: sekme (evre), dikkat, kategori, arama.
const RISK = ["overdue", "late", "unstaffed"]

export const PROJECT_TABS = ["open", "active", "upcoming", "done"]

export function tabMatch(row, tab) {
  if (tab === "done") return row.phase === "done"
  if (tab === "active" || tab === "upcoming") return row.phase === tab
  return row.phase !== "done"
}

export function signalMatch(row, sig) {
  if (!sig) return true
  if (sig === "risk") return row.signals.some((s) => RISK.includes(s))
  if (sig === "any") return row.signals.length > 0
  return row.signals.includes(sig)
}

const norm = (s) =>
  String(s || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")

/** Kod, ad, PMO, sponsor ve ekip adlarında arar (aksan ve büyük harf duyarsız). */
export function textMatch(row, q, nameOf) {
  if (!q) return true
  const hay = norm(
    [row.code, row.name, row.pm, row.sponsor, ...row.members.map((m) => nameOf(m.rid))].join(" "),
  )
  return norm(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w))
}

export function filterProjects(rows, { tab = "open", sig = "", cat = "", q = "" }, nameOf) {
  return rows.filter(
    (r) =>
      tabMatch(r, tab) &&
      signalMatch(r, sig) &&
      (!cat || r.cats.includes(cat)) &&
      textMatch(r, q, nameOf),
  )
}

/** Sıra: dikkat isteyen önce, sonra öncelik, sonra bitiş. */
export function sortProjects(rows) {
  const prio = (p) => (/^P(\d)$/.exec(p)?.[1] ? Number(/^P(\d)$/.exec(p)[1]) : 9)
  return [...rows].sort(
    (a, b) =>
      Number(b.signals.some((s) => RISK.includes(s))) -
        Number(a.signals.some((s) => RISK.includes(s))) ||
      prio(a.prio) - prio(b.prio) ||
      (a.end ?? Infinity) - (b.end ?? Infinity),
  )
}
