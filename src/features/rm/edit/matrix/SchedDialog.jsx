import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { scheduleOne } from "@/features/rm/lib/edit/rules"
import { resCap } from "@/lib/rm/engine/capacity"
import { toDay } from "@/lib/rm/engine/dates"
import { day, num } from "@/features/rm/lib/format"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { useRmEdit } from "../../data/useRmEdit"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"
import { OverloadChoice } from "../assign/OverloadChoice"
import { DayChips } from "../DayChips"
import { EditWindow } from "../EditWindow"
import { BTN } from "../ui"
import { FIELD, HoursField, Labeled, LoadLine, ProjectSelect } from "./fields"
import { useSched } from "./useSched"

/**
 * Tek kişinin bir projedeki zamanlaması ya da projeye atanması (şartname v5.8 schedDlg):
 * aralık, çalışma günleri, günlük saat; kapasite ön izlenir, aşımda üç yol. Saat 0 aralığı boşaltır.
 */
export default function SchedDialog({ pid = null, rid, onClose }) {
  const { rt, locale } = useRmText()
  const { data, today, people } = useRm()
  const { commit, editError } = useRmEdit()
  const s = useSched({ st: data.st, plan: data.plan, today, pid, rid })
  const [decide, setDecide] = useState(null)
  const [accept, setAccept] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const r = data.st.resources.find((x) => x.id === rid)
  if (!r) return null
  const name = fullName(people, r.name)
  const isAdd = !pid
  const ds = (iso) => day(toDay(iso), locale, { year: true })

  async function save(h, res) {
    const { f, p } = s
    setBusy(true)
    setErr(null)
    const label = h
      ? rt("rm.sched.saved", { n: name, p: p.code, a: ds(f.F), b: ds(f.T), h }) +
        (res?.mode
          ? ` (${rt(`rm.assign.mode.${res.mode}`, { d: res.Y ? day(res.Y, locale) : "" })})`
          : "")
      : rt("rm.sched.cleared", { n: name, p: p.code, a: ds(f.F), b: ds(f.T) })
    try {
      await commit(
        (S) => scheduleOne(S, { pid: p.id, rid, from: f.F, to: f.T, days: f.D, h, res }),
        label,
      )
      onClose()
    } catch (e) {
      setErr(editError(e))
      setBusy(false)
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    if (s.error) return
    const { h, check } = s.prepare()
    if (check) {
      setAccept(false)
      setDecide(check)
    } else save(h, null)
  }

  const title = decide
    ? rt("rm.over.title")
    : rt(isAdd ? "rm.sched.addTitle" : "rm.sched.title", { n: name })
  const footer = decide ? (
    <div className="flex items-center gap-3">
      <Button variant="ghost" className={BTN} onClick={() => setDecide(null)} disabled={busy}>
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
        {rt("rm.over.back")}
      </Button>
      <p role="alert" className="min-w-0 flex-1 text-[0.8125rem] text-danger-ink">
        {err}
      </p>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-3">
      <p role="alert" className="min-w-0 flex-1 text-[0.8125rem] text-danger-ink">
        {err ||
          (s.error && s.error !== "project"
            ? rt(`rm.sched.err.${s.error}`, {
                a: s.p ? ds(s.p.start) : "",
                b: s.p ? ds(s.p.end) : "",
              })
            : "")}
      </p>
      <Button variant="outline" className={BTN} onClick={onClose} disabled={busy}>
        {rt("rm.action.cancel")}
      </Button>
      <Button type="submit" form="rm-sched" className={BTN} disabled={busy || Boolean(s.error)}>
        {rt("rm.edit.save")}
      </Button>
    </div>
  )

  return (
    <EditWindow
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={title}
      context={s.p ? `${s.p.code} · ${s.p.name}` : name}
      initialFocus={isAdd ? "#rm-sched-p" : "#rm-sched-h"}
      footer={footer}
    >
      {decide ? (
        <OverloadChoice
          p={s.p}
          check={decide}
          accept={accept}
          onAccept={setAccept}
          busy={busy}
          onPick={(res) => save(Math.round(+s.f.H), res)}
        />
      ) : (
        <form id="rm-sched" noValidate onSubmit={onSubmit} className="grid gap-4">
          {isAdd && (
            <Labeled id="rm-sched-p" label={rt("rm.sched.project")}>
              <ProjectSelect id="rm-sched-p" value={s.f.pid} onChange={s.pick} rid={rid} />
            </Labeled>
          )}
          {s.p && (
            <p className="text-[0.8125rem] text-muted-foreground">
              {rt("rm.sched.info", {
                a: ds(s.p.start),
                b: ds(s.p.end),
                n: name,
                h: num(resCap(data.st, data.plan, r), locale),
              })}
            </p>
          )}
          {s.rules.length > 0 && (
            <ul className="grid gap-1 text-[0.8125rem]">
              {s.rules.map((a) => (
                <li key={a.id} className="tabular-nums">
                  <b>{rt("rm.assign.perDayN", { n: a.h })}</b> · {ds(a.from)} – {ds(a.to)}
                </li>
              ))}
            </ul>
          )}
          <div className="grid gap-4 @[30rem]/edit:grid-cols-2">
            <Labeled id="rm-sched-f" label={rt("rm.dates.start")}>
              <Input
                id="rm-sched-f"
                type="date"
                value={s.f.F}
                disabled={!s.p}
                onChange={(e) => s.set("F", e.target.value)}
                className={FIELD}
              />
            </Labeled>
            <Labeled id="rm-sched-t" label={rt("rm.dates.end")}>
              <Input
                id="rm-sched-t"
                type="date"
                value={s.f.T}
                disabled={!s.p}
                onChange={(e) => s.set("T", e.target.value)}
                className={FIELD}
              />
            </Labeled>
          </div>
          <div className="grid gap-1.5">
            <span className="text-[0.8125rem] font-medium">{rt("rm.assign.days")}</span>
            <DayChips
              value={s.f.D}
              onChange={(D) => s.set("D", D)}
              label={rt("rm.assign.days")}
              invalid={s.error === "days"}
            />
          </div>
          <Labeled id="rm-sched-h" label={rt("rm.dates.daily")}>
            <HoursField id="rm-sched-h" value={s.f.H} onChange={(v) => s.set("H", v)} />
          </Labeled>
          {s.preview && (
            <LoadLine
              text={rt("rm.sched.total", {
                n: s.preview.n,
                h: +s.f.H,
                t: num(s.preview.tot, locale),
                a: num(s.preview.avg, locale, 1),
              })}
              ot={s.preview.ot}
              dd={s.preview.dd}
              peak={s.preview.peak}
              suggest={Math.floor(s.preview.avg)}
              onSuggest={() => s.set("H", String(Math.floor(s.preview.avg)))}
            />
          )}
        </form>
      )}
    </EditWindow>
  )
}
