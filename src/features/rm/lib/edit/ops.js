// Plan üzerinde değişiklikler (şartname v5.3 · v6.0 · v6.1 · v6.2 birebir). Hepsi taslağı
// yerinde değiştirir; çağıran taslağı kopyalar (useRmData.mutate). Saatler kurallardan (asg)
// ve matristen elle girilen günlerden (ov, "pid|rid" anahtarlı) gelir.
import { capOf } from "@/lib/rm/engine/capacity"
import { toDay, toIso } from "@/lib/rm/engine/dates"
import { WD5 } from "./load"

export function uid() {
  return Math.random().toString(36).slice(2, 9)
}

const ovKey = (pid, rid) => `${pid}|${rid}`
// Şartname nrm: Türkçe harfler katlanır, harf-rakam dışı boşluk olur.
const FOLD = { ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c", â: "a", î: "i" }
const norm = (s) =>
  String(s || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[’'`´"]/g, " ")
    .replace(/[ışğüöçâî]/g, (c) => FOLD[c])
    .replace(/[^a-z0-9→ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

/** Projede adı geçen herkes: ekip, kural ve elle gün sahipleri (şartname memS). */
export function memberIds(S, pid) {
  const p = S.projects.find((x) => x.id === pid)
  if (!p) return []
  const ids = new Set([
    ...(p.team || []).map((x) => x.rid),
    ...(S.asg || []).filter((a) => a.pid === pid).map((a) => a.rid),
    ...Object.keys(S.ov || {})
      .filter((k) => k.startsWith(`${pid}|`))
      .map((k) => k.split("|")[1]),
  ])
  return [...ids].filter((rid) => S.resources.some((r) => r.id === rid))
}

/** Kişi başına proje özeti: toplam, ilk/son gün, iş günü, aşım günü ve saati, kural saatleri. */
export function snapProject(PL, S, pid) {
  const out = {}
  for (const rid of memberIds(S, pid)) {
    const a = PL.PA[pid]?.[rid] || {}
    const r = S.resources.find((x) => x.id === rid)
    let tot = 0
    let f = null
    let l = null
    let d = 0
    let ov = 0
    let oh = 0
    for (const k in a) {
      const v = a[k]
      if (!v) continue
      const n = +k
      tot += v
      d++
      if (f == null || n < f) f = n
      if (l == null || n > l) l = n
      const c = capOf(S, PL, r, n)
      const all = PL.RD[rid]?.[n] || 0
      if (all > c) {
        ov++
        oh += all - c
      }
    }
    const hs = [
      ...new Set((S.asg || []).filter((x) => x.pid === pid && x.rid === rid).map((x) => x.h)),
    ].sort((x, y) => x - y)
    out[rid] = { tot, f, l, d, ov, oh, hs }
  }
  return out
}

/** Kişinin projedeki günlük saati: tek kural varsa o, yoksa çalışılan gün ortalaması. */
export function dailyOf(x) {
  if (!x || !x.tot) return 0
  if (x.hs && x.hs.length === 1) return x.hs[0]
  return x.d ? Math.round((x.tot / x.d) * 10) / 10 : 0
}

/** Önce/sonra karşılaştırma satırları (yalnız saati olanlar). */
export function diffRows(s0, s1) {
  const ids = [...new Set([...Object.keys(s0 || {}), ...Object.keys(s1 || {})])]
  const empty = { tot: 0, hs: [], d: 0, f: null, l: null, ov: 0, oh: 0 }
  return ids
    .map((rid) => {
      const a = s0?.[rid] || empty
      const b = s1?.[rid] || empty
      return {
        rid,
        h0: dailyOf(a),
        h1: dailyOf(b),
        t0: a.tot || 0,
        t1: b.tot || 0,
        f0: a.f,
        l0: a.l,
        f1: b.f,
        l1: b.l,
        ov: b.ov || 0,
        oh: b.oh || 0,
      }
    })
    .filter((x) => x.t0 || x.t1)
}

/**
 * Proje formunda tarih değişince kurallar kayar (v5.3): iki uç aynı kadar kaydıysa saf
 * kaydırma (elle günler de kayar), değilse uçlar kırpılır. Değişen kural sayısı döner.
 */
export function shiftRules(S, pid, old, nw) {
  const os = toDay(old.s)
  const oe = toDay(old.e)
  const ns = toDay(nw.s)
  const ne = toDay(nw.e)
  if (ns == null) return 0
  const ds = os != null ? ns - os : 0
  const pure = os != null && oe != null && ne != null && ne - oe === ds && ds !== 0
  let c = 0
  for (const a of S.asg || []) {
    if (a.pid !== pid) continue
    let f = toDay(a.from)
    let e = toDay(a.to)
    const f0 = f
    const e0 = e
    if (pure) {
      f += ds
      e += ds
    } else {
      if (f === os) f = ns
      if (oe != null && ne != null && e === oe) e = ne
      if (f < ns) f = ns
      if (ne != null && e > ne) e = ne
    }
    if (f !== f0 || e !== e0) {
      a.from = toIso(f)
      a.to = toIso(e)
      c++
    }
  }
  S.asg = (S.asg || []).filter((a) => toDay(a.to) >= toDay(a.from))
  for (const k of Object.keys(S.ov || {})) {
    if (!k.startsWith(`${pid}|`)) continue
    const o = S.ov[k]
    const n2 = {}
    for (const d of Object.keys(o)) {
      let n = toDay(d)
      if (pure) n += ds
      if (n < ns || (ne != null && n > ne)) continue
      n2[toIso(n)] = o[d]
    }
    if (Object.keys(n2).length) S.ov[k] = n2
    else delete S.ov[k]
  }
  return c
}

/**
 * Tarihleri değiştir (v6.1): her kişinin projedeki toplam işi (`s0`) korunur, günlük saat yeni
 * süreye yayılır (en çok 24). Saati olmayanların kuralları ve elle günler yeni aralığa kırpılır.
 */
export function applyDates(S, pid, ns, ne, s0, workN) {
  S.ov = S.ov || {}
  const p = S.projects.find((x) => x.id === pid)
  p.start = ns
  p.end = ne
  for (const rid of memberIds(S, pid)) {
    const tot = s0?.[rid]?.tot || 0
    if (!tot) continue
    const rs = S.asg.filter((a) => a.pid === pid && a.rid === rid)
    const days = rs.length ? rs[rs.length - 1].days.slice() : WD5.slice()
    const w = workN(ns, ne, days)
    if (!w) continue
    const h = Math.min(24, Math.ceil(tot / w))
    S.asg = S.asg.filter((a) => !(a.pid === pid && a.rid === rid))
    delete S.ov[ovKey(pid, rid)]
    S.asg.push({ id: uid(), pid, rid, from: ns, to: ne, days, h })
  }
  S.asg = S.asg.filter((a) => {
    if (a.pid !== pid) return true
    if (a.from < ns) a.from = ns
    if (a.to > ne) a.to = ne
    return a.from <= a.to
  })
  for (const k of Object.keys(S.ov || {})) {
    if (!k.startsWith(`${pid}|`)) continue
    const o = S.ov[k]
    for (const d of Object.keys(o)) if (d < ns || d > ne) delete o[d]
    if (!Object.keys(o).length) delete S.ov[k]
  }
}

/** Ekibin sistemi (kurulum tablosu `sys`); yoksa ekip adı. */
function sysOf(S, r) {
  const t = (S.lk?.teams || []).find((x) => x.name === r.team)
  return t?.sys || r.team
}

/** ★ ile seçilen proje yöneticilerinden eski "FI/SCM/… yöneticisi" alanları (v6.0 syncLeads). */
export function syncLeads(S, p) {
  const ms = (p.mgrs || []).map((id) => S.resources.find((r) => r.id === id)).filter(Boolean)
  const used = new Set()
  const pick = (f) =>
    ms
      .filter((r) => !used.has(r.id) && f(r))
      .map((r) => {
        used.add(r.id)
        return r.name
      })
      .join(", ")
  p.fiLead = pick((r) => sysOf(S, r) === "FI" || norm(r.team) === "fi")
  p.scmLead = pick((r) => sysOf(S, r) === "SCM" || norm(r.team) === "scm")
  p.biLead = pick((r) => /power ?bi/.test(norm(r.team)))
  p.aiLead = pick((r) => /\bai\b/.test(norm(r.team)))
  p.paLead = pick((r) => /power ?apps/.test(norm(r.team)))
  p.devLead = pick((r) => !/pmo/.test(norm(r.team)))
}

/** Kişi ata satırlarının imzası: değişmeyen kişinin matristen girilmiş günleri korunur (v6.2). */
export function rowSig(rows, rid) {
  return JSON.stringify(
    rows
      .filter((x) => x.rid === rid)
      .map((x) => [x.from, x.to, x.days.slice().sort().join(""), String(x.h)])
      .sort(),
  )
}

/**
 * Kişi ata kaydı (v6.2 `go`). `rows` ekrandaki satırlar, `same` satırı değişmeyen kişiler,
 * `res` aşım kararı: null · { mode: "ot" } · { mode: "ext", Y, fits } · { mode: "fit", fits }.
 */
export function saveTeam(S, pid, { rows, mgrs, same, res }) {
  const p = S.projects.find((x) => x.id === pid)
  if (!p) return
  S.ov = S.ov || {}
  const keep = [...new Set(rows.map((x) => x.rid))]
  p.mgrs = mgrs.filter((r) => keep.includes(r))
  syncLeads(S, p)
  for (const x of p.team || []) if (!keep.includes(x.rid)) delete S.ov[ovKey(pid, x.rid)]
  p.team = keep.map((rid) => ({ rid }))
  S.asg = (S.asg || []).filter((a) => a.pid !== pid || same.has(a.rid))
  for (const rid of keep) if (!same.has(rid)) delete S.ov[ovKey(pid, rid)]
  const fits = res && (res.mode === "ext" || res.mode === "fit") ? res.fits || {} : {}
  if (res?.mode === "ext" && res.Y > toDay(p.end)) p.end = toIso(res.Y)
  for (const x of rows) {
    if (same.has(x.rid) || fits[x.rid] || x.h === "" || !(+x.h > 0)) continue
    S.asg.push({
      id: uid(),
      pid,
      rid: x.rid,
      from: x.from,
      to: x.to,
      days: x.days.slice().sort(),
      h: Math.round(+x.h),
    })
  }
  for (const rid of Object.keys(fits)) {
    const o = {}
    for (const k of Object.keys(fits[rid])) {
      if (fits[rid][k] > 0) o[toIso(+k)] = Math.round(fits[rid][k])
    }
    if (Object.keys(o).length) S.ov[ovKey(pid, rid)] = o
  }
}
