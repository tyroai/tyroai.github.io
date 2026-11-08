import { useCallback, useMemo, useRef, useState } from "react"
import { notify } from "@/lib/notify"
import { cellOverload, cellTarget, parseHours } from "@/features/rm/lib/edit/cellEdit"
import { loadKit } from "@/features/rm/lib/edit/load"
import { writeCells } from "@/features/rm/lib/edit/rules"
import { isoWeek, toDay } from "@/lib/rm/engine/dates"
import { day, num } from "@/features/rm/lib/format"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { useRmEdit } from "../data/useRmEdit"
import { useRmText } from "../data/useRmText"

/**
 * Matris hücresine yazma: { editing, start, cancel, save }. Aşım varsa onay penceresi açılır
 * (düzenleme evinde "cellOver"); yoksa doğrudan yazılır. Kayıttan sonra odak hücreye döner.
 */
export function useCellEdit({ data, people, openEditor }) {
  const { rt, locale } = useRmText()
  const { commit, editToast } = useRmEdit()
  const [editing, setEditing] = useState(null)
  // Enter ile kayıt ve ardından gelen blur aynı hücreyi iki kez yazmasın.
  const live = useRef(null)
  const kit = useMemo(() => loadKit(data.st, data.plan), [data.st, data.plan])

  const focusCell = (key) =>
    requestAnimationFrame(() =>
      document.querySelector(`[data-cell="${CSS.escape(key)}"]`)?.focus({ preventScroll: true }),
    )

  const start = useCallback((key, init) => {
    live.current = key
    setEditing({ key, init })
  }, [])

  const cancel = useCallback(() => {
    const key = live.current
    live.current = null
    setEditing(null)
    if (key) focusCell(key)
  }, [])

  const save = useCallback(
    async (pid, rid, col, value) => {
      const key = `${pid}|${rid}|${col.key}`
      if (live.current !== key) return
      live.current = null
      setEditing(null)
      focusCell(key)
      const h = parseHours(value)
      if (h == null) {
        notify.error(rt("rm.assign.err.hours"))
        return
      }
      const p = data.st.projects.find((x) => x.id === pid)
      const t = cellTarget(data.plan, p, rid, col)
      if (t.error) {
        notify.error(
          rt("rm.cell.outside", {
            p: p.code,
            a: day(toDay(p.start), locale, { year: true }),
            b: day(toDay(p.end), locale, { year: true }),
          }),
        )
        return
      }
      if (!t.week && h === t.cur) return
      const r = kit.rById.get(rid)
      const n = fullName(people, r?.name ?? rid)
      const label = t.week
        ? rt("rm.cell.savedWeek", { n, p: p.code, w: isoWeek(t.days[0]), h })
        : rt("rm.cell.saved", { n, p: p.code, d: day(t.days[0], locale), h })
      const over = cellOverload(kit, pid, rid, t.days, h)
      if (over) {
        openEditor({
          kind: "cellOver",
          pid,
          rid,
          days: t.days,
          h,
          label,
          text: rt("rm.cell.overBody", {
            n,
            d: t.week ? rt("rm.cell.week", { w: isoWeek(t.days[0]) }) : day(t.days[0], locale),
            a: num(over.peak, locale),
            c: num(over.cap, locale),
            o: num(over.ot, locale),
          }),
        })
        return
      }
      try {
        await commit((S) => writeCells(S, pid, rid, t.days, h), label)
      } catch (err) {
        editToast(err)
      }
    },
    [data, kit, people, openEditor, commit, editToast, rt, locale],
  )

  return { editing, start, cancel, save }
}
