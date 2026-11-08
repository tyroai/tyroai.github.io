import { useDeferredValue, useMemo, useState } from "react"
import { loadKit } from "@/features/rm/lib/edit/load"
import { applyDates, snapProject } from "@/features/rm/lib/edit/ops"
import { computePlan } from "@/lib/rm/engine/compute"
import { toDay } from "@/lib/rm/engine/dates"
import { applyTeamAliases } from "@/features/rm/lib/teamAliases"

/** Tarih alanlarının hatası: "start" · "end" · "order" ya da null (`rm.dates.err.*`). */
export function datesError(S, E) {
  if (toDay(S) == null) return "start"
  if (toDay(E) == null) return "end"
  if (toDay(E) < toDay(S)) return "order"
  return null
}

/**
 * Tarih değiştirmenin ön izlemesi: planın kopyasına yeni tarihler uygulanır (toplam iş korunur)
 * ve yeniden hesaplanır. `s0` pencere açılırkenki özet; kaydetme de onu kullanır.
 */
export function useDatesPreview({ raw, st, plan, pid, S, E }) {
  const [s0] = useState(() => snapProject(plan, st, pid))
  const kit = useMemo(() => loadKit(st, plan), [st, plan])
  const dS = useDeferredValue(S)
  const dE = useDeferredValue(E)
  const p = st.projects.find((x) => x.id === pid)
  const work = Object.values(s0).some((x) => x.tot > 0)
  const preview = useMemo(() => {
    if (!work || datesError(dS, dE) || (dS === p.start && dE === p.end)) return null
    const tmp = structuredClone(raw)
    applyDates(tmp, pid, dS, dE, s0, kit.workN)
    const st1 = applyTeamAliases(tmp)
    return snapProject(computePlan(st1), st1, pid)
  }, [work, dS, dE, p.start, p.end, raw, pid, s0, kit])
  return { s0, kit, work, preview }
}
