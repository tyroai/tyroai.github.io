// Genel Bakış'ın ikinci bölümü (şartname panosundaki iş kartları): aylık kapasite, proje saat
// dağılımı, kişi yükü (aşımda · boş kapasite), yapılacak işler. Hepsi plandan hesaplanır.
import { monthEnd, monthStart } from "./engine/dates"
import { monthsBetween, personBuckets, ratio, sumBuckets } from "./metrics"

/** Bu aydan başlayan `n` ay: kapasite, atanan ve doluluk (tüm IT). */
export function monthlyCapacity(st, plan, today, n = 6) {
  const months = monthsBetween(monthStart(today), monthEnd(monthStart(today) + 31 * (n - 1)))
  const people = st.resources.map((r) => personBuckets(st, plan, r, months))
  return months.map((mo) => {
    const b = sumBuckets(people.map((pb) => pb.M[mo.key]))
    return { ...mo, cap: b.cap, pj: b.pj, x: ratio(b) }
  })
}

/** Dönemin proje kapasitesi (ayların toplamı): atanan, boş saat ve doluluk. */
export function periodCapacity(months) {
  const cap = months.reduce((s, m) => s + m.cap, 0)
  const pj = months.reduce((s, m) => s + m.pj, 0)
  return { cap, pj, free: Math.max(0, cap - pj), x: cap ? pj / cap : null }
}

/**
 * Bugünden `to`ya (varsayılan: üç ayın sonu) planlı saatin projelere dağılımı: ilk `top` proje +
 * diğerleri.
 */
export function hoursMix(st, plan, today, top = 6, to = monthEnd(monthStart(today) + 62)) {
  const list = st.projects
    .map((p) => {
      let h = 0
      for (const [k, v] of Object.entries(plan.PD[p.id] || {})) if (+k >= today && +k <= to) h += v
      const cat = (st.pcats || []).find((c) => (p.cats || [])[0] === c.name)
      return { id: p.id, code: p.code, name: p.name, color: cat?.color || p.color || null, h }
    })
    .filter((x) => x.h > 0)
    .sort((a, b) => b.h - a.h)
  const total = list.reduce((s, x) => s + x.h, 0)
  const rest = list.slice(top).reduce((s, x) => s + x.h, 0)
  return { to, total, segs: list.slice(0, top), rest }
}

function topProjects(st, plan, r, from, to, n = 3) {
  const per = []
  for (const p of st.projects) {
    const a = plan.PA[p.id]?.[r.id]
    if (!a) continue
    let h = 0
    for (const [k, v] of Object.entries(a)) if (+k >= from && +k <= to) h += v
    if (h) per.push([p.code, h])
  }
  return per
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map((x) => x[0])
}

/**
 * Kişi yükü: bu ay ya da gelecek ay kapasitesi aşılanlar (en yüksek önce) ve bu ay %50'nin
 * altında dolu olanlar (en çok boş saati olan önce; boş adam-gün ile).
 */
export function peopleLoad(st, plan, today) {
  const m0 = monthStart(today)
  const months = monthsBetween(m0, monthEnd(monthEnd(m0) + 1))
  const [a, b] = months
  const dh = +st.settings.dayHours || 8
  const rows = st.resources.map((r) => {
    const pb = personBuckets(st, plan, r, months)
    const x0 = ratio(pb.M[a.key])
    const x1 = b ? ratio(pb.M[b.key]) : null
    return { r, x0, x1, b0: pb.M[a.key], free: Math.max(0, pb.M[a.key].cap - pb.M[a.key].pj) / dh }
  })
  const over = rows
    .filter((o) => (o.x0 ?? 0) > 1.0001 || (o.x1 ?? 0) > 1.0001)
    .sort((p, q) => Math.max(q.x0 ?? 0, q.x1 ?? 0) - Math.max(p.x0 ?? 0, p.x1 ?? 0))
    .map((o) => ({ ...o, top: topProjects(st, plan, o.r, a.from, (b ?? a).to) }))
  const idle = rows
    .filter((o) => o.b0.cap > 0 && o.b0.pj / o.b0.cap < 0.5)
    .sort((p, q) => q.free - p.free)
  return { months, over, idle }
}

/** Açık projelerin yapılacak işleri: kalan işi çok olan önce. */
export function todoProgress(rows) {
  return rows
    .filter((r) => r.phase !== "done" && r.todo.total > 0)
    .sort((a, b) => b.todo.total - b.todo.done - (a.todo.total - a.todo.done))
}
