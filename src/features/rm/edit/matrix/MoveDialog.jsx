import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { overloadCheck } from "@/features/rm/lib/edit/assign"
import { loadKit, WD5 } from "@/features/rm/lib/edit/load"
import { curRule, moveTo } from "@/features/rm/lib/edit/rules"
import { toDay, toIso, weekday } from "@/lib/rm/engine/dates"
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
import { windowOf } from "./useSched"

/**
 * Başka projeye taşı (şartname v5.8 moveDlg): seçilen günden sonrası eski projeden silinir,
 * hedef projede (tarihleriyle kırpılmış) kural açılır; yük iki projeden bağımsız ölçülür.
 */
export default function MoveDialog({ pid, rid, onClose }) {
  const { rt, locale } = useRmText()
  const { data, today, people } = useRm()
  const { commit, editError } = useRmEdit()
  const { st, plan } = data
  const kit = useMemo(() => loadKit(st, plan), [st, plan])
  const P = st.projects.find((x) => x.id === pid)
  const r = st.resources.find((x) => x.id === rid)
  const [f, setF] = useState(() => {
    const w = P ? windowOf(plan, P) : { s: plan.start }
    const c = P ? curRule(st, pid, rid, Math.max(today, w.s)) : null
    return {
      F: toIso(Math.max(today - weekday(today), w.s)),
      TP: "",
      H: c ? String(c.h) : "",
      D: c ? c.days.slice() : WD5.slice(),
    }
  })
  const [decide, setDecide] = useState(null)
  const [accept, setAccept] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const tp = f.TP ? st.projects.find((x) => x.id === f.TP) : null
  const span = tp
    ? { f: Math.max(toDay(f.F), windowOf(plan, tp).s), e: windowOf(plan, tp).e }
    : null
  const sf = span?.f
  const se = span?.e

  const error = (() => {
    const a = toDay(f.F)
    if (a == null) return "date"
    if (a < plan.start) return "beforePlan"
    if (!tp) return "target"
    const h = +f.H
    if (f.H === "" || Number.isNaN(h) || h < 1 || h > 24) return "hours1"
    if (!f.D.length) return "days"
    if (span.e < span.f) return "targetEnded"
    return null
  })()
  // Ucuz hesap (yüz günlük harita): her çizimde yeniden.
  const preview = error
    ? null
    : kit.evalLoad([tp.id, pid], rid, kit.ruleMap(toIso(sf), toIso(se), f.D, +f.H))

  if (!P || !r) return null
  const name = fullName(people, r.name)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const cur = curRule(st, pid, rid, Math.max(today, windowOf(plan, P).s))

  async function save(res) {
    const h = Math.round(+f.H)
    setBusy(true)
    setErr(null)
    const label = rt("rm.move.saved", {
      n: name,
      a: P.code,
      b: tp.code,
      d: day(toDay(f.F), locale),
      h,
    })
    try {
      await commit(
        (S) => moveTo(S, { pid, rid, from: f.F, toPid: tp.id, span, days: f.D, h, res }),
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
    if (error) return
    const h = Math.round(+f.H)
    const need = {
      [rid]: {
        map: kit.ruleMap(toIso(span.f), toIso(span.e), f.D, h),
        start: span.f,
        days: f.D,
        h,
      },
    }
    const check = overloadCheck(kit, tp.id, tp, need, [tp.id, pid])
    if (check) {
      setAccept(false)
      setDecide(check)
    } else save(null)
  }

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
          (error && error !== "target"
            ? rt(`rm.move.err.${error}`, { d: day(plan.start, locale), p: tp?.code ?? "" })
            : "")}
      </p>
      <Button variant="outline" className={BTN} onClick={onClose} disabled={busy}>
        {rt("rm.action.cancel")}
      </Button>
      <Button type="submit" form="rm-move" className={BTN} disabled={busy || Boolean(error)}>
        {rt("rm.move.do")}
      </Button>
    </div>
  )

  return (
    <EditWindow
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={decide ? rt("rm.over.title") : rt("rm.move.title", { n: name })}
      context={`${P.code} · ${P.name}`}
      initialFocus="#rm-move-p"
      footer={footer}
    >
      {decide ? (
        <OverloadChoice
          p={tp}
          check={decide}
          accept={accept}
          onAccept={setAccept}
          busy={busy}
          onPick={save}
        />
      ) : (
        <form id="rm-move" noValidate onSubmit={onSubmit} className="grid gap-4">
          <p className="text-[0.8125rem] text-muted-foreground">
            {rt("rm.move.now", { p: `${P.code} ${P.name}` })}
            {cur ? ` · ${rt("rm.assign.perDayN", { n: cur.h })}` : ""}
          </p>
          <div className="grid gap-4 @[30rem]/edit:grid-cols-2">
            <Labeled id="rm-move-f" label={rt("rm.move.from")}>
              <Input
                id="rm-move-f"
                type="date"
                value={f.F}
                onChange={(e) => set("F", e.target.value)}
                className={FIELD}
              />
            </Labeled>
            <Labeled id="rm-move-p" label={rt("rm.move.target")}>
              <ProjectSelect
                id="rm-move-p"
                value={f.TP}
                onChange={(v) => set("TP", v)}
                exclude={pid}
              />
            </Labeled>
          </div>
          <div className="grid gap-1.5">
            <span className="text-[0.8125rem] font-medium">{rt("rm.assign.days")}</span>
            <DayChips
              value={f.D}
              onChange={(D) => set("D", D)}
              label={rt("rm.assign.days")}
              invalid={error === "days"}
            />
          </div>
          <Labeled id="rm-move-h" label={rt("rm.move.hours")}>
            <HoursField
              id="rm-move-h"
              value={f.H}
              onChange={(v) => set("H", v)}
              quick={[1, 2, 3, 4, 5, 6, 8]}
              min={1}
            />
          </Labeled>
          {preview && (
            <LoadLine
              text={rt("rm.move.total", {
                p: tp.code,
                a: day(span.f, locale),
                b: day(span.e, locale, { year: true }),
                t: num(preview.tot, locale),
              })}
              ot={preview.ot}
              dd={preview.dd}
            />
          )}
        </form>
      )}
    </EditWindow>
  )
}
