// Portföy görünümü: proje satırları ve hesaplanan dikkat sinyalleri, Genel Bakış'ın sayıları,
// ekip × ay doluluk ızgarası. Sinyaller girilmez, plandan hesaplanır.
import { capOf } from "./engine/capacity"
import { toDay } from "./engine/dates"
import { monthsBetween, personBuckets, ratio, sumBuckets } from "./metrics"

export const DONE = "Tamamlandı"
// Aşım kişi düzeyinde (Kapasite); projede sinyal olsaydı neredeyse her satırda yanardı.
export const SIGNALS = ["overdue", "late", "unstaffed", "endingSoon", "startingSoon"]

/** Evre tarihten: başlangıcı gelmemiş "upcoming"; bitiş durumu kayıttan ("Tamamlandı"). */
export function phaseOf(p, today) {
  if (p.status === DONE) return "done"
  const s = toDay(p.start)
  return s != null && s > today ? "upcoming" : "active"
}

function catColor(st, p) {
  const c = (st.pcats || []).find((x) => (p.cats || [])[0] === x.name)
  return c?.color || p.color || null
}

function futureHours(plan, pid, today) {
  let s = 0
  for (const [n, h] of Object.entries(plan.PD[pid] || {})) if (+n >= today) s += h
  return s
}

function overloadedMembers(st, plan, p, today) {
  const end = toDay(p.end)
  const out = []
  for (const [rid, days] of Object.entries(plan.PA[p.id] || {})) {
    const r = st.resources.find((x) => x.id === rid)
    if (!r) continue
    const hit = Object.keys(days).some((k) => {
      const n = +k
      if (n < today || (end != null && n > end) || !days[k]) return false
      return (plan.RD[rid]?.[n] || 0) > capOf(st, plan, r, n)
    })
    if (hit) out.push(rid)
  }
  return out
}

/** Proje satırları: tablo, panel ve sunum aynı satırı okur. */
export function projectRows(st, plan, today) {
  return st.projects.map((p) => {
    const q = plan.P[p.id]
    const start = toDay(p.start)
    const end = toDay(p.end)
    const phase = phaseOf(p, today)
    const open = phase !== "done"
    const members = Object.entries(plan.PA[p.id] || {})
      .map(([rid, days]) => ({ rid, hours: Object.values(days).reduce((a, h) => a + h, 0) }))
      .filter((m) => m.hours > 0)
      .sort((a, b) => b.hours - a.hours)
    const over = open ? overloadedMembers(st, plan, p, today) : []
    const future = futureHours(plan, p.id, today)
    const signals = []
    if (open && end != null && end < today) signals.push("overdue")
    if (open && q?.lateH > 0) signals.push("late")
    if (open && (end == null || end >= today) && future === 0) signals.push("unstaffed")
    if (open && end != null && end >= today && end - today <= 30) signals.push("endingSoon")
    if (phase === "upcoming" && start != null && start > today && start - today <= 60) {
      signals.push("startingSoon")
    }
    const todo = Array.isArray(p.todo) ? p.todo : []
    return {
      id: p.id,
      code: p.code || "",
      name: p.name || "",
      prio: p.prio || "",
      status: p.status || "",
      country: p.country || "TR",
      cats: p.cats || [],
      color: catColor(st, p),
      sponsor: p.sponsor || "",
      pm: p.pm || "",
      desc: p.desc || "",
      scope: p.scope || "",
      milestone: p.milestone || "",
      mgrs: p.mgrs || [],
      start,
      end,
      phase,
      hours: q?.planned || 0,
      future,
      lateH: q?.lateH || 0,
      lateLast: q?.lateLast ?? null,
      members,
      over,
      todo: { done: todo.filter((x) => x?.d).length, total: todo.length, items: todo },
      signals,
    }
  })
}

/** Ekip × ay ızgarası: satır ekip, sütun ay; hücre oranı ve ham kova. */
export function teamGrid(st, plan, from, to, measure = "project") {
  const months = monthsBetween(from, to)
  const byTeam = new Map()
  for (const r of st.resources) {
    const pb = personBuckets(st, plan, r, months)
    if (!byTeam.has(r.team)) byTeam.set(r.team, [])
    byTeam.get(r.team).push({ r, pb })
  }
  const order = (plan.teams.list || []).map((t) => t.name)
  const teams = [...byTeam.keys()].sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })
  const rows = teams.map((team) => {
    const people = byTeam.get(team)
    const cells = months.map((mo) => {
      const b = sumBuckets(people.map((x) => x.pb.M[mo.key]))
      return { key: mo.key, b, x: ratio(b, measure) }
    })
    const total = sumBuckets(people.map((x) => x.pb.T))
    return { team, people, cells, total, x: ratio(total, measure) }
  })
  return { months, rows }
}

/** Genel Bakış'ın sayıları ve cevap cümlesinin olguları. */
export function overview(st, plan, today, rows, grid) {
  const open = rows.filter((r) => r.phase !== "done")
  const active = rows.filter((r) => r.phase === "active")
  const count = (sig) => open.filter((r) => r.signals.includes(sig)).length
  const thisMonth = grid.months[0]?.key
  const nextMonth = grid.months[1]?.key
  const allNow = sumBuckets(grid.rows.map((row) => row.cells[0]?.b).filter(Boolean))
  const allNext = sumBuckets(grid.rows.map((row) => row.cells[1]?.b).filter(Boolean))
  const overPeople = grid.rows.flatMap((row) =>
    row.people.filter(({ pb }) => {
      const b = thisMonth && pb.M[thisMonth]
      return b && b.cap > 0 && b.pj > b.cap
    }),
  )
  let peak = null
  for (const row of grid.rows) {
    row.cells.slice(0, 3).forEach((c, i) => {
      if (c.x != null && Number.isFinite(c.x) && (!peak || c.x > peak.x)) {
        peak = { team: row.team, month: grid.months[i], x: c.x }
      }
    })
  }
  return {
    active: active.length,
    upcoming: rows.filter((r) => r.phase === "upcoming").length,
    done: rows.filter((r) => r.phase === "done").length,
    utilNow: ratio(allNow),
    utilNext: ratio(allNext),
    thisMonth,
    nextMonth,
    overPeople: overPeople.map(({ r }) => r),
    overdue: count("overdue"),
    late: count("late"),
    unstaffed: count("unstaffed"),
    endingSoon: count("endingSoon"),
    startingSoon: count("startingSoon"),
    peak,
  }
}
