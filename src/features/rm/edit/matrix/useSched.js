import { useMemo, useState } from "react"
import { overloadCheck } from "@/features/rm/lib/edit/assign"
import { loadKit, WD5 } from "@/features/rm/lib/edit/load"
import { curRule, rulesOf } from "@/features/rm/lib/edit/rules"
import { toDay, toIso } from "@/lib/rm/engine/dates"

/** Projenin atanabilir aralığı: plan başlangıcından önce değil (şartname pS/pE). */
export function windowOf(plan, p) {
  const s = Math.max(toDay(p.start), plan.start)
  return { s, e: Math.max(s, toDay(p.end)) }
}

/**
 * Tek kişi zamanlama penceresinin durumu (şartname v5.8 schedDlg): proje seçilince aralık
 * proje tarihleri, saat ve günler kişinin o günkü kuralından gelir.
 */
export function useSched({ st, plan, today, pid, rid }) {
  const kit = useMemo(() => loadKit(st, plan), [st, plan])
  const fill = (id) => {
    const p = id && st.projects.find((x) => x.id === id)
    if (!p) return { pid: "", F: "", T: "", H: "", D: WD5.slice() }
    const w = windowOf(plan, p)
    const c = curRule(st, p.id, rid, Math.max(today, w.s))
    return {
      pid: p.id,
      F: toIso(w.s),
      T: toIso(w.e),
      H: c ? String(c.h) : "",
      D: c ? c.days.slice() : WD5.slice(),
    }
  }
  const [f, setF] = useState(() => fill(pid))
  const p = f.pid ? st.projects.find((x) => x.id === f.pid) : null
  const w = p ? windowOf(plan, p) : null

  /** Hata kodu (`rm.sched.err.*`) ya da null. */
  const error = (() => {
    if (!p) return "project"
    const a = toDay(f.F)
    const b = toDay(f.T)
    if (a == null || b == null) return "date"
    if (b < a) return "order"
    if (a < w.s || b > w.e) return "range"
    const h = +f.H
    if (f.H === "" || Number.isNaN(h) || h < 0 || h > 24) return "hours"
    if (!f.D.length) return "days"
    return null
  })()

  const preview = useMemo(() => {
    if (error) return null
    const map = kit.ruleMap(f.F, f.T, f.D, +f.H)
    const L = kit.evalLoad(p.id, rid, map)
    const r = kit.rById.get(rid)
    let n = 0
    let free = 0
    for (let d = toDay(f.F); d <= toDay(f.T); d++) {
      if (!kit.isWork(d, f.D)) continue
      n++
      free += kit.freeN(p.id, r, d)
    }
    return { ...L, n, avg: n ? free / n : 0 }
  }, [error, kit, f, p, rid])

  /** Kaydetmeye hazırlık: aşım varsa karar için `check`, yoksa null. */
  const prepare = () => {
    const h = Math.round(+f.H)
    if (h <= 0) return { h, check: null }
    const P = {
      [rid]: { map: kit.ruleMap(f.F, f.T, f.D, h), start: toDay(f.F), days: f.D, h },
    }
    return { h, check: overloadCheck(kit, p.id, p, P) }
  }

  return {
    f,
    p,
    w,
    error,
    preview,
    rules: p ? rulesOf(st, p.id, rid) : [],
    pick: (id) => setF(fill(id)),
    set: (k, v) => setF((x) => ({ ...x, [k]: v })),
    prepare,
  }
}
