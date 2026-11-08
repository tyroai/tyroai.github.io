// Kural ve elle gün işlemleri (şartname çekirdek clearRange/addRule, v5.8 matris: hücreye yazma,
// tek kişi zamanlama, başka projeye taşı, projeden çıkar). Hepsi taslağı yerinde değiştirir.
import { toDay, toIso } from "@/lib/rm/engine/dates"
import { WD5 } from "./load"
import { uid } from "./ops"

const ovKey = (pid, rid) => `${pid}|${rid}`

/** Aralıktaki kuralları böler ve elle günleri siler; `rid`/`pid` verilmezse hepsi. */
export function clearRange(S, o = {}) {
  const f = o.from ? toDay(o.from) : -Infinity
  const e = o.to ? toDay(o.to) : Infinity
  let nr = 0
  let no = 0
  const match = (x) => (!o.rid || x.rid === o.rid) && (!o.pid || x.pid === o.pid)
  if (o.rules !== false) {
    const out = []
    for (const a of S.asg || []) {
      if (!match(a)) {
        out.push(a)
        continue
      }
      const af = toDay(a.from)
      const ae = toDay(a.to)
      if (ae < f || af > e) {
        out.push(a)
        continue
      }
      nr++
      if (af < f) out.push({ ...a, id: uid(), to: toIso(f - 1) })
      if (ae > e) out.push({ ...a, id: uid(), from: toIso(e + 1) })
    }
    S.asg = out
  }
  if (o.ov !== false) {
    for (const k of Object.keys(S.ov || {})) {
      const [pid, rid] = k.split("|")
      if (!match({ pid, rid })) continue
      const d = S.ov[k]
      for (const ds of Object.keys(d)) {
        const n = toDay(ds)
        if (n >= f && n <= e) {
          delete d[ds]
          no++
        }
      }
      if (!Object.keys(d).length) delete S.ov[k]
    }
  }
  return { nr, no }
}

export function ensureTeam(S, pid, rid) {
  const p = S.projects.find((x) => x.id === pid)
  if (p && !(p.team || []).some((x) => x.rid === rid)) p.team = [...(p.team || []), { rid }]
}

/** Kural ekler; aynı kişi+projede çakışan aralık önce temizlenir (son girilen geçerli). */
export function addRule(S, a) {
  clearRange(S, { rid: a.rid, pid: a.pid, from: a.from, to: a.to })
  const p = S.projects.find((x) => x.id === a.pid)
  if (p && !(p.team || []).some((t) => t.rid === a.rid)) {
    p.team = [
      ...(p.team || []),
      S.planMode === "auto" ? { rid: a.rid, start: a.from, end: a.to } : { rid: a.rid },
    ]
  }
  const r = {
    id: uid(),
    pid: a.pid,
    rid: a.rid,
    from: a.from,
    to: a.to,
    days: (a.days?.length ? a.days : WD5).slice().sort(),
    h: Math.max(0, Math.round(+a.h || 0)),
  }
  S.asg.push(r)
  return r
}

export function rulesOf(S, pid, rid) {
  return (S.asg || [])
    .filter((a) => a.pid === pid && a.rid === rid)
    .sort((a, b) => (a.from < b.from ? -1 : 1))
}

/** O gün geçerli kural; yoksa ilk gelecek, o da yoksa son kural. */
export function curRule(S, pid, rid, n) {
  const rs = rulesOf(S, pid, rid)
  if (!rs.length) return null
  const c = rs.filter((a) => toDay(a.from) <= n && toDay(a.to) >= n).pop()
  if (c) return c
  const fu = rs.filter((a) => toDay(a.from) > n)
  return fu.length ? fu[0] : rs[rs.length - 1]
}

/** Matris hücresi: günlere elle saat yazılır (0 da yazılır: o gün kuralı ezer). */
export function writeCells(S, pid, rid, days, h) {
  S.ov = S.ov || {}
  const k = ovKey(pid, rid)
  const o = (S.ov[k] = S.ov[k] || {})
  for (const n of days) o[toIso(n)] = h
  ensureTeam(S, pid, rid)
}

const addFits = (S, pid, rid, fits) => {
  S.ov = S.ov || {}
  const k = ovKey(pid, rid)
  const o = { ...(S.ov[k] || {}) }
  for (const n of Object.keys(fits || {})) if (fits[n] > 0) o[toIso(+n)] = Math.round(fits[n])
  if (Object.keys(o).length) S.ov[k] = o
}

/**
 * Tek kişinin zamanlaması (v5.8 schedDlg): aralık temizlenir, kişi ekibe girer; aşım kararı
 * ötele/sığdır ise saatler elle gün olarak yazılır, değilse (saat > 0) yeni kural.
 */
export function scheduleOne(S, { pid, rid, from, to, days, h, res }) {
  clearRange(S, { rid, pid, from, to })
  ensureTeam(S, pid, rid)
  const p = S.projects.find((x) => x.id === pid)
  if (res && (res.mode === "ext" || res.mode === "fit")) {
    if (res.mode === "ext" && res.Y > toDay(p.end)) p.end = toIso(res.Y)
    addFits(S, pid, rid, res.fits?.[rid])
  } else if (h > 0) addRule(S, { rid, pid, from, to, days, h })
}

/**
 * Başka projeye taşı (v5.8 moveDlg): eski projede `from`dan sonrası temizlenir, hedefte kural
 * (ya da aşım kararına göre elle günler); eskide hiç saat kalmadıysa ekipten çıkar.
 */
export function moveTo(S, { pid, rid, from, toPid, span, days, h, res }) {
  clearRange(S, { rid, pid, from, to: null })
  ensureTeam(S, toPid, rid)
  const tp = S.projects.find((x) => x.id === toPid)
  if (res && (res.mode === "ext" || res.mode === "fit")) {
    if (res.mode === "ext" && res.Y > toDay(tp.end)) tp.end = toIso(res.Y)
    addFits(S, toPid, rid, res.fits?.[rid])
  } else addRule(S, { rid, pid: toPid, from: toIso(span.f), to: toIso(span.e), days, h })
  if (!rulesOf(S, pid, rid).length && !S.ov?.[ovKey(pid, rid)]) {
    const p = S.projects.find((x) => x.id === pid)
    if (p) p.team = (p.team || []).filter((x) => x.rid !== rid)
  }
}

/** Kişiyi projeden çıkarır: kuralları, elle günleri ve ekip üyeliği. */
export function removeMember(S, pid, rid) {
  S.asg = (S.asg || []).filter((a) => !(a.pid === pid && a.rid === rid))
  if (S.ov) delete S.ov[ovKey(pid, rid)]
  const p = S.projects.find((x) => x.id === pid)
  if (p) p.team = (p.team || []).filter((x) => x.rid !== rid)
}
