// Simülasyon (şartname rSim/simCalc): yeni bir proje hangi tarihte başlarsa kategorinin
// ekiplerinde günde `h` saat ayırabilecek kimse var? Plan değişmez; mevcut atamalara göre.
import { capOf } from "@/lib/rm/engine/capacity"
import { toDay, toIso, weekday } from "@/lib/rm/engine/dates"

/** En yakın pazartesi (bugün pazartesiyse bugün). */
export function nextMonday(today) {
  return weekday(today) === 0 ? today : today - weekday(today) + 7
}

/** Kategorilerin ekipleri; ekibi tanımsız kategori varsa tüm ekipler (`partial`). */
export function categoryTeams(st, cats, order = []) {
  const used = [...new Set(st.resources.map((r) => r.team))]
  const all = order.length
    ? order.filter((t) => used.includes(t)).concat(used.filter((t) => !order.includes(t)))
    : used
  if (!cats?.length) return { teams: all, open: true, partial: [] }
  const sets = cats.map((c) => (st.pcats || []).find((x) => x.name === c)?.teams || [])
  if (sets.some((s) => !s.length)) {
    return { teams: all, open: true, partial: cats.filter((_, i) => !sets[i].length) }
  }
  return { teams: all.filter((t) => sets.some((s) => s.includes(t))), open: false, partial: [] }
}

/**
 * @param {{ cats: string[], weeks: number, h: number, from: string, hor: number }} v
 * @returns aday başlangıçlar, her aday için ekip ekip uygun kişiler, önerilen aday, kişilerin
 *   ilk uygun olduğu aday (boşa çıkma).
 */
export function simulate(st, plan, v, today) {
  const CT = categoryTeams(
    st,
    v.cats,
    (plan.teams.list || []).map((t) => t.name),
  )
  const teams = CT.teams
  const people = st.resources.filter((r) => teams.includes(r.team))
  const D = Math.max(1, Math.round((+v.weeks || 1) * 5))
  const h = Math.max(1, +v.h || 1)
  const isWork = (n) => weekday(n) < 5 && plan.hol[toIso(n)] !== "Tatil"
  let f0 = toDay(v.from)
  if (f0 == null) f0 = nextMonday(today)
  while (!isWork(f0) && weekday(f0) > 4) f0++
  const starts = [f0]
  const lim = f0 + Math.round((+v.hor || 6) * 30.5)
  for (let m = f0 - weekday(f0) + 7; m <= lim; m += 7) starts.push(m)
  const windows = starts.map((s) => {
    const d = []
    let n = s
    let g = 0
    while (d.length < D && g++ < D * 3) {
      if (isWork(n)) d.push(n)
      n++
    }
    return d
  })
  const good = []
  const free = windows.map((ds, i) => {
    const o = {}
    const ok = {}
    for (const r of people) {
      let fr = 0
      let hits = 0
      for (const n of ds) {
        const x = Math.max(0, capOf(st, plan, r, n) - (plan.RD[r.id]?.[n] || 0))
        fr += x
        if (x >= h - 1e-9) hits++
      }
      o[r.id] = ds.length ? fr / ds.length : 0
      ok[r.id] = ds.length ? hits / ds.length >= 0.9 : false
    }
    good[i] = ok
    return o
  })
  const fits = free.map((o, i) =>
    Object.fromEntries(
      teams.map((t) => [
        t,
        people
          .filter((r) => r.team === t && good[i][r.id])
          .sort((a, b) => o[b.id] - o[a.id])
          .map((r) => r.id),
      ]),
    ),
  )
  const cov = fits.map((x) => teams.filter((t) => x[t].length).length)
  let best = cov.findIndex((c) => c === teams.length && teams.length > 0)
  if (best < 0) best = cov.indexOf(Math.max(...cov))
  const release = {}
  for (const r of people) {
    const i = windows.findIndex((_, k) => good[k][r.id])
    release[r.id] = i < 0 ? null : i
  }
  return { CT, teams, people, starts, windows, free, good, fits, cov, best, release, h, D }
}
