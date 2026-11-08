// Genel Bakış filtresi: dönem, ekip ve proje alanları (kategori, öncelik, durum, ülke).
// Ekip kişileri daraltır (ve o ekibin çalıştığı projeleri); proje alanları projeleri daraltır,
// kişi kartlarında yalnız o projelerde saati olanlar kalır. Kişinin yükü her zaman tüm işidir:
// kategori seçmek kimsenin doluluğunu küçültmez.
import { openManDays, periodRange, ratio } from "@/lib/rm/metrics"
import { hoursMix, monthlyCapacity, peopleLoad, todoProgress } from "@/lib/rm/overviewDetails"
import { overview, teamGrid } from "@/lib/rm/portfolio"

export const OV_PERIODS = ["3", "6", "12"]
export const OV_LISTS = ["teams", "cats", "prios", "statuses", "countries"]
const PROJECT_LISTS = ["cats", "prios", "statuses", "countries"]

const split = (v) => (v ? String(v).split(",").filter(Boolean) : [])

/** Adresten filtre: `period` ve virgüllü listeler (`teams`, `cats`, …). */
export function readOvFilter(get) {
  const f = { period: OV_PERIODS.includes(get("period")) ? get("period") : "6" }
  for (const k of OV_LISTS) f[k] = split(get(k))
  return f
}

/** Filtrenin adres parçaları (boşlar ve varsayılan dönem yok): sayfalar arası taşınır. */
export function ovParams(f) {
  const out = f.period && f.period !== "6" ? { period: f.period } : {}
  for (const k of OV_LISTS) if (f[k]?.length) out[k] = f[k].join(",")
  return out
}

/** Seçili değer sayısı (dönem hariç). */
export function ovCount(f) {
  return OV_LISTS.reduce((s, k) => s + f[k].length, 0)
}

/** Seçenekler: kurulum listelerinin sırası, listede olmayan ama kullanılan değerler sonda. */
export function ovOptions(st, teamOrder) {
  const used = (pick) => [...new Set(st.projects.map(pick).filter(Boolean))]
  const merge = (list, extra) => [...list, ...extra.filter((x) => !list.includes(x))]
  const lk = st.lk || {}
  return {
    teams: merge(
      teamOrder,
      st.resources.map((r) => r.team),
    ).filter((t, i, a) => a.indexOf(t) === i),
    cats: merge(
      (st.pcats || []).map((c) => c.name),
      used((p) => (p.cats || [])[0]),
    ),
    prios: merge(
      (lk.prios || []).map((x) => x.name),
      used((p) => p.prio),
    ),
    statuses: merge(
      (lk.statuses || []).map((x) => x.name),
      used((p) => p.status),
    ),
    countries: merge(
      (lk.countries || []).map((x) => x.code),
      used((p) => p.country || "TR"),
    ),
  }
}

function matches(r, f) {
  return (
    (!f.cats.length || r.cats.some((c) => f.cats.includes(c))) &&
    (!f.prios.length || f.prios.includes(r.prio)) &&
    (!f.statuses.length || f.statuses.includes(r.status)) &&
    (!f.countries.length || f.countries.includes(r.country))
  )
}

/**
 * Filtrelenmiş Genel Bakış: projeler, kişiler, ekip × ay ızgarası, sayılar ve kartların verisi.
 * Filtre boşsa sonuç filtresiz hesapla aynıdır.
 */
export function overviewSlice(st, plan, today, rows, f) {
  let projects = rows.filter((r) => matches(r, f))
  let people = f.teams.length ? st.resources.filter((r) => f.teams.includes(r.team)) : st.resources
  if (f.teams.length) {
    const ids = new Set(people.map((r) => r.id))
    projects = projects.filter((r) => r.members.some((m) => ids.has(m.rid)))
  }
  if (PROJECT_LISTS.some((k) => f[k].length)) {
    const ids = new Set(projects.flatMap((r) => r.members.map((m) => m.rid)))
    people = people.filter((r) => ids.has(r.id))
  }
  const pids = new Set(projects.map((r) => r.id))
  const stPeople = { ...st, resources: people }
  const { from, to } = periodRange(st, plan, f.period, today)
  const grid = teamGrid(stPeople, plan, from, to, "project")
  const n = Number(f.period)
  const load = peopleLoad(stPeople, plan, today)
  const ov = overview(stPeople, plan, today, projects, grid)
  // Aşımdakiler Aşırı yüklenen kartıyla aynı sırada (en yüksek yük önce): göstergenin ilk adı
  // kartın ilk satırı olsun.
  const rank = new Map(load.over.map((o, i) => [o.r.id, i]))
  const at = (r) => rank.get(r.id) ?? rank.size
  return {
    filter: f,
    rows: projects,
    people,
    grid,
    ov: { ...ov, overPeople: [...ov.overPeople].sort((a, b) => at(a) - at(b)) },
    months: monthlyCapacity(stPeople, plan, today, n),
    mix: hoursMix(
      { ...st, projects: st.projects.filter((p) => pids.has(p.id)) },
      plan,
      today,
      6,
      to,
    ),
    load,
    todo: todoProgress(projects),
    teams: teamCapacity(grid, +st.settings.dayHours || 8),
  }
}

/** Ekip kapasitesi (dönem): kapasite, atanan, doluluk, boş/eksik adam-gün; en dolu önce. */
export function teamCapacity(grid, dayHours) {
  return grid.rows
    .map((row) => ({
      team: row.team,
      n: row.people.length,
      cap: row.total.cap,
      pj: row.total.pj,
      x: ratio(row.total),
      open: openManDays(row.total, dayHours),
      cells: row.cells,
    }))
    .sort((a, b) => (b.x ?? -1) - (a.x ?? -1))
}
