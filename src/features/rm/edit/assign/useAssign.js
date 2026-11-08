import { useCallback, useMemo, useState } from "react"
import {
  catTeams,
  hasHours,
  initialRows,
  makeRow,
  manualHours,
  needOf,
  overloadCheck,
  projectWindow,
  validateRows,
} from "@/features/rm/lib/edit/assign"
import { loadKit } from "@/features/rm/lib/edit/load"
import { rowSig, saveTeam } from "@/features/rm/lib/edit/ops"

const sum = (m) => Object.values(m).reduce((a, b) => a + b, 0)

/**
 * Kişi ata penceresinin durumu (şartname v6.2): satırlar, ★ yöneticiler, ekip sekmesi; satır
 * toplamı ve kapasite durumu; kaydetmeye hazırlık (doğrulama + aşım denetimi + yazma işlemi).
 */
export function useAssign({ st, plan, pid, pend = null }) {
  const p = st.projects.find((x) => x.id === pid)
  const kit = useMemo(() => loadKit(st, plan), [st, plan])
  const { PS, PE } = useMemo(() => projectWindow(p, plan), [p, plan])
  const [init] = useState(() => initialRows(st, pid, PS, PE, pend))
  const [rows, setRows] = useState(init.rows)
  const [mg, setMg] = useState(
    () => new Set((p.mgrs || []).filter((id) => st.resources.some((r) => r.id === id))),
  )
  const order = useMemo(() => plan.teams.list.filter((t) => !t.hidden).map((t) => t.name), [plan])
  const allTeams = useMemo(
    () => order.filter((tm) => st.resources.some((r) => r.team === tm)),
    [order, st],
  )
  const cats = useMemo(() => catTeams(st, p.cats, order), [st, p.cats, order])
  const [tab, setTab] = useState(() => (!cats.open && cats.teams[0]) || allTeams[0])
  const [bad, setBad] = useState(null)

  // Proje tarihlerinde boş saat ve doluluk: seçicide sıralama ve "… s öner".
  const free = useMemo(() => {
    const out = new Map()
    for (const o of kit.suggest(pid, PS, PE, null, "")) out.set(o.r.id, { avg: o.avg, pct: o.pct })
    return out
  }, [kit, pid, PS, PE])

  const dh = Math.max(1, +st.settings?.dayHours || 8)
  const teamOf = useCallback((rid) => kit.rById.get(rid)?.team, [kit])
  const unchangedManual = useCallback(
    (rid) => init.ovOnly.has(rid) && rowSig(rows, rid) === init.sig0[rid],
    [init, rows],
  )

  const rowTotal = useCallback(
    (x) => {
      if (hasHours(x)) return sum(kit.ruleMap(x.from, x.to, x.days, +x.h))
      return unchangedManual(x.rid) ? manualHours(st, pid, x.rid) : 0
    },
    [kit, unchangedManual, st, pid],
  )

  /** Satırın kapasite durumu: none · manual · suggest {h, free} · ot {ot} · ok. */
  const rowLoad = useCallback(
    (x) => {
      if (!x.from || !x.to || x.to < x.from) return { kind: "none" }
      if (!hasHours(x)) {
        if (unchangedManual(x.rid)) return { kind: "manual" }
        const f = free.get(x.rid)?.avg || 0
        return { kind: "suggest", h: Math.max(0, Math.min(dh, Math.floor(f))), free: f }
      }
      const L = kit.evalLoad(pid, x.rid, kit.ruleMap(x.from, x.to, x.days, +x.h))
      return L.ot ? { kind: "ot", ot: L.ot } : { kind: "ok" }
    },
    [kit, pid, free, dh, unchangedManual],
  )

  const totals = useMemo(() => {
    let hours = 0
    const withHours = new Set()
    for (const x of rows) {
      const h = rowTotal(x)
      if (h) {
        hours += h
        withHours.add(x.rid)
      }
    }
    return { hours, people: new Set(rows.map((x) => x.rid)).size, withHours: withHours.size }
  }, [rows, rowTotal])

  const toggle = useCallback(
    (rid) => {
      setBad(null)
      if (rows.some((x) => x.rid === rid)) {
        setRows(rows.filter((x) => x.rid !== rid))
        setMg((m) => {
          const n = new Set(m)
          n.delete(rid)
          return n
        })
      } else setRows([...rows, makeRow(rid, "", PS, PE)])
    },
    [rows, PS, PE],
  )

  const update = useCallback((k, patch) => {
    setBad(null)
    setRows((rs) => rs.map((x) => (x.k === k ? { ...x, ...patch } : x)))
  }, [])

  const remove = useCallback(
    (k) => {
      const x = rows.find((y) => y.k === k)
      const rest = rows.filter((y) => y.k !== k)
      setRows(rest)
      if (x && !rest.some((y) => y.rid === x.rid)) {
        setMg((m) => {
          const n = new Set(m)
          n.delete(x.rid)
          return n
        })
      }
    },
    [rows],
  )

  const setAllHours = useCallback((v) => {
    setRows((rs) => rs.map((x) => ({ ...x, h: String(Math.round(+v)) })))
  }, [])

  const toggleMgr = useCallback((rid) => {
    setMg((m) => {
      const n = new Set(m)
      if (n.has(rid)) n.delete(rid)
      else n.add(rid)
      return n
    })
  }, [])

  /** Kaydetmeye hazırlık: { bad } ya da { check (aşım ya da null), op(res) → yazma işlemi }. */
  const prepare = useCallback(() => {
    const err = validateRows(rows, PS, PE)
    if (err) {
      setBad(err)
      return { bad: err }
    }
    const keep = [...new Set(rows.map((x) => x.rid))]
    const same = new Set(
      keep.filter((rid) => init.sig0[rid] != null && rowSig(rows, rid) === init.sig0[rid]),
    )
    const check = overloadCheck(kit, pid, p, needOf(kit, rows, same))
    const mgrs = [...mg]
    const op = (res) => (S) => saveTeam(S, pid, { rows, mgrs, same, res })
    return { check, op }
  }, [rows, PS, PE, init, kit, pid, p, mg])

  return {
    p,
    PS,
    PE,
    kit,
    dh,
    rows,
    mg,
    tab,
    setTab,
    order,
    allTeams,
    cats,
    free,
    bad,
    teamOf,
    rowTotal,
    rowLoad,
    totals,
    toggle,
    update,
    remove,
    setAllHours,
    toggleMgr,
    prepare,
  }
}
