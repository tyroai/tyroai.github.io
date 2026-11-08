import { HugeiconsIcon } from "@hugeicons/react"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { Button } from "@/components/ui/button"
import { diffRows, snapProject } from "@/features/rm/lib/edit/ops"
import { toDay } from "@/lib/rm/engine/dates"
import { day, num } from "@/features/rm/lib/format"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"
import { EditStat, EditWindow } from "../EditWindow"
import { BTN } from "../ui"
import { ChangeTable } from "./ChangeTable"

/** Kayıttan sonra "yaptığım değişiklikler": yeni tarihler, günlük saati değişenler, kapasite. */
export function DatesSummary({ pid, s0, done, after, onClose, onAssign }) {
  const { rt, locale } = useRmText()
  const { data } = useRm()
  const s1 = snapProject(data.plan, data.st, pid)
  const rows = diffRows(s0, s1)
  const over = rows.some((x) => x.ov)
  const T0 = rows.reduce((s, x) => s + x.t0, 0)
  const T1 = rows.reduce((s, x) => s + x.t1, 0)
  const changed = rows.filter((x) => x.h0 !== x.h1).length
  const dh = Math.max(1, +data.st.settings?.dayHours || 8)
  const p = data.st.projects.find((x) => x.id === pid)
  const span = (a, b) => `${day(toDay(a), locale)} – ${day(toDay(b), locale, { year: true })}`

  return (
    <EditWindow
      open
      onOpenChange={(o) => !o && onClose()}
      title={rt("rm.dates.doneTitle")}
      context={`${p.code} · ${p.name}`}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-3">
          {over || after ? (
            <Button variant="outline" className={BTN} onClick={onAssign}>
              <HugeiconsIcon icon={UserGroupIcon} className="size-4" strokeWidth={1.8} />
              {rt("rm.assign.title")}
            </Button>
          ) : null}
          <Button className={BTN} onClick={onClose} autoFocus>
            {rt("rm.edit.ok")}
          </Button>
        </div>
      }
    >
      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-2.5 @[48rem]/edit:grid-cols-4">
          <EditStat
            label={rt("rm.dates.newDates")}
            value={span(done.nw.s, done.nw.e)}
            detail={rt("rm.dates.before", {
              d: done.old.s && done.old.e ? span(done.old.s, done.old.e) : "—",
            })}
          />
          <EditStat
            label={rt("rm.dates.changed")}
            value={rt("rm.assign.people", { n: changed })}
            detail={
              // Günlük saat tam sayıya yukarı yuvarlanır (şartname): toplam artabilir, gizlenmez.
              T1 === T0
                ? rt("rm.dates.kept")
                : rt("rm.dates.rounded", { a: num(T0, locale), b: num(T1, locale) })
            }
          />
          <EditStat
            label={rt("rm.assign.effort")}
            value={rt("rm.assign.manDays", { n: num(T1 / dh, locale, 1) })}
            detail={rt("rm.assign.hoursTotal", { n: num(T1, locale) })}
          />
          <EditStat
            label={rt("rm.assign.capacity")}
            value={rt(over ? "rm.dates.overYes" : "rm.assign.fits")}
            tone={over ? "danger" : "ok"}
            detail={rt(over ? "rm.dates.overFix" : "rm.dates.noOvertime")}
          />
        </div>
        <ChangeTable s0={s0} s1={s1} />
      </div>
    </EditWindow>
  )
}
