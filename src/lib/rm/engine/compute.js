// tyroRM plan motoru: şartnamedeki compute() (TyroRM HTML v6.7) ve iki yamasının birebir
// taşıması. Yalnız kurallar kipi: saatleri atama kuralları ve elle günler üretir, motor
// kapasiteyi kısmaz (aşım uyarıdır). Otomatik dağıtım veride kullanılmadığı için alınmadı.
// Davranış tests/unit/rmEngine.test.js'te şartname koduyla hücre hücre karşılaştırılır.
import { monthKey, toDay, toIso, todayDay, weekday, yearMonth } from "./dates"
import { makeTeamIndex } from "./teams"

const num = (v, fallback) => (v != null && Number.isFinite(+v) ? +v : fallback)

function holidayMaps(holidays) {
  const hol = {}
  const holC = {}
  for (const h of holidays || []) {
    if (!h.date) continue
    const c = h.country || "TR"
    if (c === "TR") hol[h.date] = h.type
    else (holC[c] = holC[c] || {})[h.date] = h.type
  }
  return { hol, holC }
}

/** Her ayın ilk CD iş günü (hafta içi, TR tatili değil) kapanış desteği günüdür. */
function closingDays(CD, hol) {
  const closeSet = new Set()
  const done = new Set()
  return {
    closeSet,
    ensure(n) {
      const [y, m] = yearMonth(n)
      const k = `${y}-${m}`
      if (done.has(k)) return
      done.add(k)
      let x = Math.round(Date.UTC(y, m, 1) / 864e5)
      let c = 0
      let guard = 0
      while (c < CD && guard++ < 40) {
        if (weekday(x) < 5 && hol[toIso(x)] !== "Tatil") {
          closeSet.add(x)
          c++
        }
        x++
      }
    },
  }
}

function projectStats(projects, start, DH) {
  const P = {}
  for (const p of projects) {
    const effort = +p.effort > 0 ? Math.round(+p.effort * DH) : null
    P[p.id] = {
      p,
      s: toDay(p.start) || start,
      e: toDay(p.end),
      rem: !p.locked && effort != null ? effort : null,
      need: effort,
      planned: 0,
      fin: null,
      first: null,
      last: null,
      lateH: 0,
      lateLast: null,
      ovH: 0,
      ruleH: 0,
      mode: p.locked ? "L" : effort != null ? "E" : "W",
    }
  }
  return P
}

/** Kurallar ve elle günler → OV[kişi][gün][proje] = {h, src}; elle gün (o) kuralı (r) ezer. */
function fixedHours(st, P, rById, start, hardCap) {
  const OV = {}
  let ovCount = 0
  let maxEnd = -Infinity
  const put = (rid, n, pid, h, src) => {
    ;((OV[rid] = OV[rid] || {})[n] = OV[rid][n] || {})[pid] = { h, src }
  }
  for (const a of st.asg || []) {
    if (!P[a.pid] || !rById[a.rid]) continue
    const f = toDay(a.from)
    const e = toDay(a.to)
    if (f == null || e == null || e < f) continue
    const h = Math.max(0, Math.round(+a.h || 0))
    const dset = new Set(a.days && a.days.length ? a.days : [0, 1, 2, 3, 4])
    for (let n = Math.max(f, start); n <= Math.min(e, hardCap); n++) {
      if (!dset.has(weekday(n))) continue
      put(a.rid, n, a.pid, h, "r")
      if (h > 0) maxEnd = Math.max(maxEnd, n)
    }
  }
  for (const [k, days] of Object.entries(st.ov || {})) {
    const [pid, rid] = k.split("|")
    if (!P[pid] || !rById[rid]) continue
    for (const [ds, raw] of Object.entries(days)) {
      const n = toDay(ds)
      if (n == null || n < start || n > hardCap) continue
      const h = Math.max(0, Math.round(+raw || 0))
      put(rid, n, pid, h, "o")
      ovCount++
      if (h > 0) maxEnd = Math.max(maxEnd, n)
    }
  }
  return { OV, ovCount, maxEnd }
}

export function computePlan(st) {
  const S = st.settings || {}
  const DH = Math.max(1, +S.dayHours || 8)
  const SUP = Math.max(0, +S.support || 0)
  const DEV = Math.max(0, +S.dev || 0)
  const CD = Math.max(0, +S.closingDays || 0)
  const teams = makeTeamIndex(st)
  const projects = st.projects || []
  const resources = st.resources || []
  const { hol, holC } = holidayMaps(st.holidays)
  const pCountry = {}
  for (const p of projects) pCountry[p.id] = p.country || "TR"
  const cHol = (pid, ds) => {
    const c = pCountry[pid]
    return c !== "TR" && holC[c] ? holC[c][ds] : undefined
  }
  const start = toDay(S.planStart) || todayDay()
  let maxEnd = start
  for (const p of projects) {
    const e = toDay(p.end)
    if (e != null) maxEnd = Math.max(maxEnd, e)
  }
  const hardCap = start + Math.round((+S.horizonMonths || 36) * 30.44)
  const P = projectStats(projects, start, DH)
  const rById = {}
  for (const r of resources) rById[r.id] = r
  const fx = fixedHours(st, P, rById, start, hardCap)
  const { OV } = fx
  maxEnd = Math.max(maxEnd, fx.maxEnd)

  const PA = {}
  const PD = {}
  const RD = {}
  const CL = {}
  const RU = {}
  const DT = {}
  const MD = {}
  for (const p of projects) {
    PA[p.id] = {}
    PD[p.id] = {}
  }
  for (const r of resources) {
    RD[r.id] = {}
    CL[r.id] = {}
    RU[r.id] = {}
  }
  const closing = closingDays(CD, hol)
  const days = []
  for (let n = start; n <= hardCap; n++) {
    if (n > maxEnd) break
    if (weekday(n) > 4) continue
    const ds = toIso(n)
    const t = hol[ds] || "Normal"
    DT[n] = t
    days.push(n)
    ;(MD[monthKey(n)] = MD[monthKey(n)] || []).push(n)
    if (t === "Tatil") continue
    closing.ensure(n)
    const half = t === "Arife"
    for (const r of resources) {
      const give = (q, h) => {
        if (h <= 0) return
        const pa = PA[q.p.id][r.id] || (PA[q.p.id][r.id] = {})
        pa[n] = (pa[n] || 0) + h
        PD[q.p.id][n] = (PD[q.p.id][n] || 0) + h
        RD[r.id][n] = (RD[r.id][n] || 0) + h
        q.planned += h
        if (q.first == null || n < q.first) q.first = n
        if (q.last == null || n > q.last) q.last = n
        if (q.rem !== null) {
          q.rem -= h
          if (q.rem <= 0 && q.fin == null) q.fin = n
        }
      }
      const fullDay = teams.isFullDay(r)
      const isClose = !fullDay && r.closing && closing.closeSet.has(n)
      if (!fullDay && isClose) CL[r.id][n] = half ? DH / 2 : DH
      else if (!fullDay) {
        RU[r.id][n] = { s: half ? Math.round(SUP / 2) : SUP, d: DEV }
      }
      const cell = OV[r.id] && OV[r.id][n]
      if (!cell) continue
      for (const pid in cell) {
        const e = cell[pid]
        const q = P[pid]
        let h = e.h
        if (e.src === "r") {
          if (isClose) continue
          const ch = cHol(pid, ds)
          if (ch === "Tatil") continue
          if (half || ch === "Arife") h = Math.round(h / 2)
        }
        give(q, h)
        if (e.src === "o") q.ovH += h
        else q.ruleH += h
      }
    }
  }
  for (const q of Object.values(P)) {
    q.finish = q.mode === "E" ? (q.rem != null && q.rem <= 0 ? q.fin : null) : q.e
    if (q.e == null) continue
    for (const n of days) {
      if (n > q.e && PD[q.p.id][n]) {
        q.lateH += PD[q.p.id][n]
        q.lateLast = n
      }
    }
  }
  let dispEnd = maxEnd
  for (const q of Object.values(P)) {
    if (q.finish != null) dispEnd = Math.max(dispEnd, q.finish)
    if (q.last != null) dispEnd = Math.max(dispEnd, q.last)
  }
  if (days.length) dispEnd = Math.min(dispEnd, days[days.length - 1])
  applyPersonalRows(st, { DT, RU, CL }, teams)
  return {
    days,
    DT,
    PA,
    PD,
    RD,
    CL,
    RU,
    P,
    closeSet: closing.closeSet,
    start,
    dispEnd,
    hol,
    holC,
    pCountry,
    MD,
    ovCount: fx.ovCount,
    OV,
    rulesMode: true,
    teams,
  }
}

/**
 * Şartname yamaları (v5.3, v6.6): danışmanın destek satırı kişiye özel destek/yazılımcı
 * değeriyle yeniden yazılır; kapanış günü kişinin kendi günlük saatidir ve destek satırı düşer.
 */
function applyPersonalRows(st, plan, teams) {
  const S = st.settings || {}
  for (const r of st.resources || []) {
    if (teams.isFullDay(r) || (r.sup == null && r.dev == null)) continue
    const sup = num(r.sup, +S.support)
    const dv = num(r.dev, +S.dev)
    const ru = plan.RU[r.id] || {}
    for (const k of Object.keys(ru)) {
      const half = plan.DT[+k] === "Arife"
      ru[k] = { s: half ? Math.round(sup / 2) : sup, d: dv }
    }
  }
  for (const r of st.resources || []) {
    const cl = plan.CL[r.id]
    if (!cl) continue
    const dh = num(r.dh, +S.dayHours)
    for (const k of Object.keys(cl)) {
      if (!cl[k]) continue
      cl[k] = plan.DT[+k] === "Arife" ? dh / 2 : dh
      if (plan.RU[r.id]) delete plan.RU[r.id][k]
    }
  }
}
