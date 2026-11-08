// Ekip grubu kapasite kuralını seçer: "cons" danışman (gün − destek − yazılımcıyla çalışma),
// "dev" ve "pmo" tam gün. Kurulum tablosu (lk.teams) yoksa şartnamenin varsayılan ekipleri.
const DEFAULT_TEAMS = [
  ["FI", "cons"],
  ["SCM", "cons"],
  ["AI Danışman", "cons"],
  ["Diğer", "cons"],
  ["Yazılım", "dev"],
  ["AI Yazılım", "dev"],
  ["Power BI", "dev"],
  ["PowerApps", "dev"],
  ["PMO", "pmo"],
]

export const TEAM_GROUPS = ["cons", "dev", "pmo"]

function teamList(st) {
  const teams = st?.lk?.teams
  if (Array.isArray(teams) && teams.length) return teams
  return DEFAULT_TEAMS.map(([name, grp]) => ({ name, grp }))
}

/**
 * Belgeye göre ekip dizini. Şartnamede tam gün ekipleri (DEV_TEAMS) kurulum tablosunda
 * grubu dev ya da pmo olanlardır; tabloda olmayan ekip danışman sayılır.
 */
export function makeTeamIndex(st) {
  const list = teamList(st)
  const byName = new Map(list.map((t) => [t.name, t]))
  const fullDay = new Set(list.filter((t) => t.grp === "dev" || t.grp === "pmo").map((t) => t.name))
  return {
    list,
    group(team) {
      const x = byName.get(team)
      if (x) return x.grp
      const d = DEFAULT_TEAMS.find((t) => t[0] === team)
      return d ? d[1] : "cons"
    },
    color(team) {
      return byName.get(team)?.color || null
    },
    /** Tam gün ekipte mi (yazılım, BI, PMO, yönetim)? */
    isFullDay(r) {
      // Görünümde birleşen ekipte kural kişinin asıl ekibinden (`features/rm/lib/teamAliases.js`).
      return !!r && fullDay.has(r.baseTeam ?? r.team)
    },
  }
}
