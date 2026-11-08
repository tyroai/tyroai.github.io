// Kişi ata ekranının saf mantığı (şartname v6.2 team62): satırlar, doğrulama, aşım kararı.
// Satır: { k, rid, from, to, days: [0..4], h: "" | "6" } — h metin, boş = saat girilmedi.
import { toDay, toIso } from "@/lib/rm/engine/dates"
import { WD5 } from "./load"
import { rowSig, uid } from "./ops"

/** Atamanın yapılabileceği aralık: plan başlangıcından önce olamaz. */
export function projectWindow(p, plan) {
  const PS = toIso(Math.max(toDay(p.start), plan.start))
  return { PS, PE: p.end < PS ? PS : p.end }
}

export function hasDates(p) {
  const s = toDay(p?.start)
  const e = toDay(p?.end)
  return s != null && e != null && e >= s
}

export function makeRow(rid, h, PS, PE) {
  return { k: uid(), rid, from: PS, to: PE, days: WD5.slice(), h: h == null ? "" : String(h) }
}

/**
 * Açılış satırları: kurallar (proje aralığına kırpılır), yalnız elle günü olanlar (saatsiz satır)
 * ve ekipte olup kuralı olmayanlar. `pend` simülasyondan gelen öneri: { rids, h }.
 */
export function initialRows(st, pid, PS, PE, pend) {
  const has = (rid) => st.resources.some((r) => r.id === rid)
  const p = st.projects.find((x) => x.id === pid)
  const rows = (st.asg || [])
    .filter((a) => a.pid === pid && has(a.rid))
    .map((a) => ({
      k: uid(),
      rid: a.rid,
      from: a.from < PS ? PS : a.from,
      to: a.to > PE ? PE : a.to,
      days: (a.days || WD5).slice(),
      h: String(a.h),
    }))
    .filter((x) => x.from <= x.to)
  const ovOnly = new Set()
  for (const k of Object.keys(st.ov || {})) {
    const [pp, rid] = k.split("|")
    if (pp !== pid || !has(rid) || rows.some((x) => x.rid === rid)) continue
    ovOnly.add(rid)
    rows.push(makeRow(rid, "", PS, PE))
  }
  for (const tm of p?.team || []) {
    if (!has(tm.rid) || rows.some((x) => x.rid === tm.rid)) continue
    rows.push(makeRow(tm.rid, pend?.rids?.includes(tm.rid) ? pend.h : "", PS, PE))
  }
  const sig0 = {}
  for (const x of rows) if (!(x.rid in sig0)) sig0[x.rid] = rowSig(rows, x.rid)
  return { rows, ovOnly, sig0 }
}

/** Kişinin matristen elle girilmiş toplam saati. */
export function manualHours(st, pid, rid) {
  const o = st.ov?.[`${pid}|${rid}`]
  return o ? Object.values(o).reduce((a, b) => a + b, 0) : 0
}

/** Satır saat girildi mi? */
export const hasHours = (x) => x.h !== "" && +x.h > 0

/** Satırların ekip sırasına göre gruplanması. */
export function groupRows(rows, teamOf, order) {
  const g = {}
  for (const x of rows) {
    const tm = teamOf(x.rid) || "—"
    ;(g[tm] = g[tm] || []).push(x)
  }
  const rank = (t) => {
    const i = order.indexOf(t)
    return i < 0 ? 999 : i
  }
  return Object.keys(g)
    .sort((a, b) => rank(a) - rank(b))
    .map((tm) => ({ tm, rows: g[tm] }))
}

/**
 * Projenin kategori ekipleri (v6.0 catTeams): kategori yoksa ya da birinin ekibi tanımsızsa
 * "açık" (tüm ekipler); değilse kategorilerin ekipleri.
 */
export function catTeams(st, cats, order) {
  const all = order.filter((tm) => st.resources.some((r) => r.team === tm))
  if (!cats?.length) return { teams: all, open: true }
  const sets = cats.map((c) => (st.pcats || []).find((x) => x.name === c)?.teams || [])
  if (sets.some((s) => !s.length)) return { teams: all, open: true }
  return { teams: all.filter((tm) => sets.some((s) => s.includes(tm))), open: false }
}

/** İlk hatalı satır: { k, rid, code, a?, b? } ya da null. Kodlar `rm.assign.err.*`. */
export function validateRows(rows, PS, PE) {
  for (const x of rows) {
    const f = toDay(x.from)
    const e = toDay(x.to)
    const h = +x.h
    let code = null
    if (f == null || e == null) code = "date"
    else if (e < f) code = "order"
    else if (x.from < PS || x.to > PE) code = "range"
    else if (!x.days.length) code = "days"
    else if (x.h !== "" && (Number.isNaN(h) || h < 0 || h > 24)) code = "hours"
    if (code) return { k: x.k, rid: x.rid, code }
  }
  return null
}

/** Saat girilen ve değişen kişilerin istenen saat haritası (aşım denetimi için). */
export function needOf(kit, rows, same) {
  const P = {}
  for (const x of rows) {
    const h = +x.h
    if (same.has(x.rid) || !hasHours(x)) continue
    const o = P[x.rid] || (P[x.rid] = { map: {}, start: toDay(x.from), days: [], h: 0 })
    kit.ruleMap(x.from, x.to, x.days, h, o.map)
    o.start = Math.min(o.start, toDay(x.from))
    o.days = [...new Set([...o.days, ...x.days])].sort()
    o.h = Math.max(o.h, h)
  }
  return P
}

/**
 * Kaydetmeden önce kapasite denetimi. Aşım yoksa null; varsa kişi kişi fazla mesai, kırpılınca
 * kaybolan saat ve öteleme önerisi: { items, Y (yeni bitiş ya da null), fits }. `ex` yükten
 * düşülen proje(ler) (taşımada hedef ve eski proje, şartname checkAndApply).
 */
export function overloadCheck(kit, pid, p, P, ex = pid) {
  const items = []
  for (const rid of Object.keys(P)) {
    const L = kit.evalLoad(ex, rid, P[rid].map)
    if (L.ot > 0) {
      const cf = kit.clipFit(ex, rid, P[rid].map)
      items.push({ rid, lost: cf.lost, fit: cf.map, ...L })
    }
  }
  if (!items.length) return null
  let Y = toDay(p.end)
  let ok = true
  const fits = {}
  for (const it of items) {
    const x = P[it.rid]
    const f = kit.fitMap(ex, it.rid, x.start, x.days, Math.max(1, x.h), it.tot)
    if (f.finish == null) ok = false
    else {
      fits[it.rid] = f.map
      Y = Math.max(Y, f.finish)
    }
  }
  return { items, Y: ok && Y > toDay(p.end) ? Y : null, fits }
}
