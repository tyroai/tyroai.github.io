// Kapasite ölçüleri (şartname "Kapasite analizi"): kişi × ay kovası. İki ölçü:
// proje doluluğu = (proje + PMO yönetimi) ÷ proje kapasitesi (varsayılan);
// toplam iş yükü = proje + destek + yazılımcıyla çalışma + kapanış + proje dışı iş ÷ çalışma saati.
import { capOf, personHours } from "./engine/capacity"
import { monthEnd, monthKey, monthStart, toDay, todayDay, yearMonth } from "./engine/dates"

const DONE = "Tamamlandı"
const FIELDS = ["wh", "cap", "proj", "sup", "dev", "cl", "cld", "dvf", "pmo", "over"]
const zero = () => ({
  wh: 0,
  cap: 0,
  proj: 0,
  sup: 0,
  dev: 0,
  cl: 0,
  cld: 0,
  dvf: 0,
  pmo: 0,
  over: 0,
  per: {},
})

/** [from, to] aralığındaki aylar: { key, from, to, y, m }. */
export function monthsBetween(from, to) {
  const out = []
  let [y, m] = yearMonth(from)
  for (let g = 0; g < 60; g++) {
    const a = Math.round(Date.UTC(y, m, 1) / 864e5)
    const b = Math.round(Date.UTC(y, m + 1, 0) / 864e5)
    if (a > to) break
    out.push({ key: `${y}-${m}`, from: Math.max(a, from), to: Math.min(b, to), y, m })
    m++
    if (m > 11) {
      m = 0
      y++
    }
  }
  return out
}

/** Dönem: "3" | "6" | "12" ay (bu aydan) ya da "all" (projelerin tamamı). */
export function periodRange(st, plan, period, today = todayDay()) {
  if (["3", "6", "12"].includes(String(period))) {
    let [y, m] = yearMonth(today)
    m += Number(period) - 1
    y += Math.floor(m / 12)
    m %= 12
    return { from: monthStart(today), to: Math.round(Date.UTC(y, m + 1, 0) / 864e5) }
  }
  let a = Infinity
  let b = -Infinity
  for (const p of st.projects) {
    const s = toDay(p.start)
    const e = toDay(p.end)
    if (s != null) a = Math.min(a, s)
    if (e != null) b = Math.max(b, e)
  }
  if (!Number.isFinite(a)) a = plan.start
  if (!Number.isFinite(b)) b = plan.dispEnd
  return { from: monthStart(a), to: monthEnd(Math.max(a, b)) }
}

/** Kaynak türü: PMO/Yönetim projeleri yönetir, yazılım tam gün geliştirir, danışman destek verir. */
export function kindOf(plan, r) {
  if (plan.teams.group(r.baseTeam ?? r.team) === "pmo") return "pmo"
  return plan.teams.isFullDay(r) ? "dev" : "cons"
}

function pmoLinks(st, r) {
  return st.projects
    .filter(
      (p) =>
        p.status !== DONE &&
        toDay(p.start) != null &&
        toDay(p.end) != null &&
        (p.pm === r.name ||
          (p.mgrs || []).includes(r.id) ||
          (p.team || []).some((x) => x.rid === r.id)),
    )
    .map((p) => [toDay(p.start), toDay(p.end)])
}

function finish(b) {
  b.load = b.proj + b.sup + b.dev + b.cl + b.dvf + b.pmo
  b.pj = b.proj + b.pmo
  return b
}

/** Kişinin ay ay saatleri ve dönem toplamı: { M: {ay: kova}, T: toplam, kind }. */
export function personBuckets(st, plan, r, months) {
  const M = {}
  for (const mo of months) M[mo.key] = zero()
  const T = zero()
  if (!months.length) return { M, T: finish(T), kind: kindOf(plan, r) }
  const from = months[0].from
  const to = months[months.length - 1].to
  const kind = kindOf(plan, r)
  const { dh } = personHours(r, st.settings)
  const links = kind === "pmo" ? pmoLinks(st, r) : []
  const RD = plan.RD[r.id] || {}
  const RU = plan.RU[r.id] || {}
  const CL = plan.CL[r.id] || {}
  for (const n of plan.days) {
    if (n < from || n > to || plan.DT[n] === "Tatil") continue
    const b = M[monthKey(n)]
    if (!b) continue
    const half = plan.DT[n] === "Arife"
    const c = capOf(st, plan, r, n)
    const h = RD[n] || 0
    b.wh += half ? dh / 2 : dh
    b.cap += c
    b.proj += h
    if (kind === "cons" && RU[n]) {
      b.sup += RU[n].s
      b.dev += RU[n].d
    }
    if (CL[n]) {
      b.cl += CL[n]
      b.cld++
    }
    if (kind === "dev") b.dvf += Math.max(0, c - h)
    if (kind === "pmo" && links.some(([a, e]) => n >= a && n <= e)) b.pmo += Math.max(0, c - h)
    if (h > c) b.over++
  }
  for (const p of st.projects) {
    const a = plan.PA[p.id]?.[r.id]
    if (!a) continue
    for (const k in a) {
      const n = +k
      if (n < from || n > to || !a[k]) continue
      const b = M[monthKey(n)]
      if (!b) continue
      const o = b.per[p.id] || (b.per[p.id] = { h: 0, d: 0 })
      o.h += a[k]
      o.d++
    }
  }
  for (const mo of months) {
    const b = M[mo.key]
    for (const f of FIELDS) T[f] += b[f]
    for (const [pid, o] of Object.entries(b.per)) {
      const q = T.per[pid] || (T.per[pid] = { h: 0, d: 0 })
      q.h += o.h
      q.d += o.d
    }
    finish(b)
  }
  return { M, T: finish(T), kind }
}

/** Kovaların toplamı (ekip ya da tüm IT). */
export function sumBuckets(list) {
  const out = zero()
  for (const b of list) for (const f of FIELDS) out[f] += b[f] || 0
  return finish(out)
}

/** Doluluk oranı (0–∞); kapasite yoksa null. `measure`: "project" | "load". */
export function ratio(b, measure = "project") {
  if (!b) return null
  if (measure === "load") return b.wh > 0 ? b.load / b.wh : null
  if (b.cap > 0) return b.pj / b.cap
  return b.pj > 0 ? Infinity : null
}

/** Dikkat düzeyi: yalnız dikkat isteyen hücre renk alır. */
export function level(x) {
  if (x == null) return "none"
  if (x > 1.0001) return "over"
  if (x >= 0.85) return "high"
  return "ok"
}

/**
 * Ölçünün payı ve paydası: proje doluluğunda proje saati ÷ proje kapasitesi (rutin işler düşülmüş),
 * toplam iş yükünde proje + rutin iş ÷ mesai. Sayfa, ağaç, panel ve ipuçları aynı sayıyı söyler.
 */
export function partsOf(b, measure = "project") {
  return measure === "load" ? { a: b?.load ?? 0, c: b?.wh ?? 0 } : { a: b?.pj ?? 0, c: b?.cap ?? 0 }
}

/** Aşım: pay paydayı geçer. Paydası 0 olan ay (tatil, kapanış) aşım sayılmaz. */
export function isOver(b, measure = "project") {
  const { a, c } = partsOf(b, measure)
  return c > 0 && a > c + 1e-9
}

/** Açık (+) ya da eksik (−) adam-gün: payda − pay (kapasite − proje ya da mesai − iş), günlük saate bölünmüş. */
export function openManDays(b, dayHours, measure = "project") {
  if (!b || !dayHours) return 0
  const { a, c } = partsOf(b, measure)
  return Math.round((c - a) / dayHours)
}
