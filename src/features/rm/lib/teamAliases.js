// Ürün sahibinin kararı: bazı ekipler tyroRM'de tek ekip olarak görünür. Kapasite kuralı
// kişinin asıl ekibinden (`baseTeam`) gelir; plan verisi değişmez, HTML'den yeni içe aktarma da
// birleşmeyi bozmaz.
export const TEAM_ALIASES = { "AI Danışman": "AI", "AI Yazılım": "AI" }

/**
 * Ham ekip adlarını görünen adlara toplar: [{ label, names }] — birleşen ekipler tek seçenek
 * (AI), öteki ekip kendi adıyla. Sıra ilk geçişe göre.
 */
export function teamOptions(names, aliases = TEAM_ALIASES) {
  const out = []
  for (const n of names) {
    const label = aliases[n] ?? n
    const hit = out.find((o) => o.label === label)
    if (hit) hit.names.push(n)
    else out.push({ label, names: [n] })
  }
  return out
}

/** Kişinin kapasite grubunu belirleyen asıl ekibi. */
export function baseTeamOf(r) {
  return r?.baseTeam ?? r?.team
}

/**
 * Görünüm durumu: birleşen ekiplerdeki kişiler ortak adı alır (asıl ekip `baseTeam`te), kurulum
 * tablosunda ortak ekip ilk kaynağın yerine girer (kaynaklar gizli kalır), kategori ekipleri eşlenir.
 */
export function applyTeamAliases(st, aliases = TEAM_ALIASES) {
  if (!st || !st.resources?.some((r) => aliases[r.team])) return st
  const resources = st.resources.map((r) =>
    aliases[r.team] ? { ...r, team: aliases[r.team], baseTeam: r.team } : r,
  )
  const teams = []
  for (const t of st.lk?.teams || []) {
    const a = aliases[t.name]
    if (!a) {
      teams.push(t)
      continue
    }
    if (!teams.some((x) => x.name === a)) {
      const of = Object.keys(aliases).filter((k) => aliases[k] === a)
      teams.push({ name: a, grp: "alias", color: t.color, alias: true, of })
    }
    teams.push({ ...t, hidden: true })
  }
  const pcats = (st.pcats || []).map((c) => ({
    ...c,
    teams: [...new Set((c.teams || []).map((x) => aliases[x] || x))],
  }))
  return { ...st, resources, lk: { ...st.lk, teams }, pcats }
}
