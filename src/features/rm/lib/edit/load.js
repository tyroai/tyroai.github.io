// Düzenlemenin hesap çekirdeği: şartname v5.8 › "HESAP ÇEKİRDEĞİ" birebir. Kişi ata ve tarih
// değiştirme bununla boş kapasiteyi, aşımı, sığdırmayı ve ötelemeyi hesaplar.
// `ex` hariç tutulan proje(ler): kişinin o projedeki saati "başka iş" sayılmaz.
import { capOf } from "@/lib/rm/engine/capacity"
import { toDay, toIso, weekday } from "@/lib/rm/engine/dates"

export const WD5 = [0, 1, 2, 3, 4]
// fitMap ve ötelemede sonsuz döngü bekçisi (şartnamede 900 gün).
const GUARD = 900

/** Planın üzerine kurulu hesap takımı; `st` ve `plan` aynı hesaplamadan gelmeli. */
export function loadKit(st, plan) {
  const rById = new Map((st.resources || []).map((r) => [r.id, r]))
  const dType = (n) => plan.DT?.[n] || plan.hol?.[toIso(n)] || "Normal"
  const isWork = (n, days) => {
    const w = weekday(n)
    return w <= 4 && days.includes(w) && dType(n) !== "Tatil"
  }
  const projH = (ex, rid, n) =>
    (Array.isArray(ex) ? ex : [ex]).reduce((s, pid) => s + (plan.PA[pid]?.[rid]?.[n] || 0), 0)
  const otherL = (ex, rid, n) => Math.max(0, (plan.RD[rid]?.[n] || 0) - projH(ex, rid, n))
  const capN = (r, n) => capOf(st, plan, r, n)
  const freeN = (ex, r, n) => Math.max(0, capN(r, n) - otherL(ex, r.id, n))

  /** Kural → { gün: saat }; arifede yarım. `into` verilirse üstüne toplar. */
  function ruleMap(F, T, days, h, into = {}) {
    const f = toDay(F)
    const e = toDay(T)
    if (f == null || e == null) return into
    for (let n = f; n <= e; n++) {
      if (!isWork(n, days)) continue
      const v = dType(n) === "Arife" ? Math.round(h / 2) : h
      if (v > 0) into[n] = (into[n] || 0) + v
    }
    return into
  }

  function workN(F, T, days) {
    const f = toDay(F)
    const e = toDay(T)
    if (f == null || e == null) return 0
    let c = 0
    for (let n = f; n <= e; n++) if (isWork(n, days)) c++
    return c
  }

  /** Haritanın yükü: fazla mesai (ot), aşım günü (dd), en yoğun gün, toplam. */
  function evalLoad(ex, rid, map) {
    const r = rById.get(rid)
    let ot = 0
    let dd = 0
    let peak = 0
    let tot = 0
    let first = null
    let last = null
    let capT = 0
    for (const k in map) {
      const n = +k
      const h = map[k]
      tot += h
      const c = capN(r, n)
      capT += c
      const all = otherL(ex, rid, n) + h
      if (all > c) {
        ot += all - c
        dd++
        if (first == null || n < first) first = n
        if (last == null || n > last) last = n
      }
      if (all > peak) peak = all
    }
    return { ot, dd, peak, tot, first, last, capT }
  }

  /** `need` saati, günde en çok `h` ve boş kapasite kadar, başlangıçtan ileri doğru yerleştirir. */
  function fitMap(ex, rid, startN, days, h, need) {
    const r = rById.get(rid)
    const map = {}
    let left = need
    let n = startN
    let g = 0
    let fin = null
    while (left > 0 && g++ < GUARD) {
      if (isWork(n, days)) {
        const v = Math.min(h, freeN(ex, r, n), left)
        if (v > 0) {
          map[n] = v
          left -= v
          fin = n
        }
      }
      n++
    }
    return { map, finish: left > 0 ? null : fin, left }
  }

  /** Aynı tarihlerde kapasiteye kırpar; sığmayan saat `lost`. */
  function clipFit(ex, rid, map) {
    const r = rById.get(rid)
    const out = {}
    let lost = 0
    for (const k in map) {
      const n = +k
      const v = Math.min(map[k], freeN(ex, r, n))
      if (v > 0) out[n] = v
      lost += map[k] - Math.max(0, v)
    }
    return { map: out, lost }
  }

  /** Proje tarihlerinde kişilerin boş saati: en boştan doluya. */
  function suggest(pid, F, T, excl, team) {
    const out = []
    const f = toDay(F)
    const e = toDay(T)
    if (f == null || e == null || e < f) return out
    for (const r of st.resources || []) {
      if (excl?.has(r.id)) continue
      if (team && r.team !== team) continue
      let fr = 0
      let cap = 0
      let ld = 0
      let w = 0
      for (let n = f; n <= e; n++) {
        if (!isWork(n, WD5)) continue
        w++
        const c = capN(r, n)
        cap += c
        const o = otherL(pid, r.id, n)
        ld += o
        fr += Math.max(0, c - o)
      }
      if (!w) continue
      out.push({ r, avg: fr / w, fr, w, pct: cap ? ld / cap : ld ? 9.99 : 0 })
    }
    return out.sort((a, b) => b.avg - a.avg || a.pct - b.pct)
  }

  return {
    rById,
    dType,
    isWork,
    projH,
    otherL,
    capN,
    freeN,
    ruleMap,
    workN,
    evalLoad,
    fitMap,
    clipFit,
    suggest,
  }
}
