import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WD5 } from "@/features/rm/lib/edit/load"
import { toDay } from "@/lib/rm/engine/dates"
import { day, num } from "@/features/rm/lib/format"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { useRmEdit } from "../../data/useRmEdit"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"
import { EditStat, EditWindow } from "../EditWindow"
import { BTN } from "../ui"
import { AssignPicker } from "./AssignPicker"
import { AssignRows } from "./AssignRows"
import { OverloadChoice } from "./OverloadChoice"
import { useAssign } from "./useAssign"

/**
 * Kişi ata (şartname v6.2): ekipten kişi seç, satır satır tarih aralığı, çalışma günleri ve
 * günlük saat; ★ proje yöneticisi. Kaydederken kapasite denetlenir; aşım varsa karar adımı.
 */
export default function AssignDialog({ pid, pend = null, onClose, onDates }) {
  const { rt, locale } = useRmText()
  const { data, people: dir } = useRm()
  const { commit, editError } = useRmEdit()
  const a = useAssign({ st: data.st, plan: data.plan, pid, pend })
  const bodyRef = useRef(null)
  const [full, setFull] = useState(false)
  const [decide, setDecide] = useState(null)
  const [accept, setAccept] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [bulk, setBulk] = useState("")
  const [bulkBad, setBulkBad] = useState(false)
  const p = a.p
  const nameOf = (rid) => fullName(dir, a.kit.rById.get(rid)?.name ?? rid)

  async function save(op, res) {
    setBusy(true)
    setErr(null)
    const mode = res
      ? rt(`rm.assign.mode.${res.mode}`, { d: res.Y ? day(res.Y, locale, { year: true }) : "" })
      : ""
    try {
      await commit(op(res), rt("rm.assign.saved", { p: p.code }) + (mode ? ` (${mode})` : ""))
      onClose()
    } catch (e) {
      setErr(editError(e))
      setBusy(false)
    }
  }

  function onSave() {
    const r = a.prepare()
    if (r.bad) {
      requestAnimationFrame(() => {
        const row = bodyRef.current?.querySelector(`[data-row="${r.bad.k}"]`)
        row?.querySelector("[aria-invalid=true], input")?.focus()
      })
      return
    }
    if (!r.check) save(r.op, null)
    else {
      setAccept(false)
      setDecide(r)
      bodyRef.current?.scrollTo({ top: 0 })
    }
  }

  function applyBulk() {
    const v = bulk.trim()
    if (v === "" || Number.isNaN(+v) || +v < 0 || +v > 24) {
      setBulkBad(true)
      return
    }
    setBulkBad(false)
    a.setAllHours(v)
  }

  const mgrNames = [...a.mg].map(nameOf)
  const badText = a.bad
    ? `${nameOf(a.bad.rid)}: ${rt(`rm.assign.err.${a.bad.code}`, {
        a: day(toDay(a.PS), locale, { year: true }),
        b: day(toDay(a.PE), locale, { year: true }),
      })}`
    : null

  const footer = decide ? (
    <div className="flex items-center gap-3">
      <Button variant="ghost" className={BTN} onClick={() => setDecide(null)} disabled={busy}>
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4 rtl:rotate-180" strokeWidth={2} />
        {rt("rm.over.back")}
      </Button>
      {err ? (
        <p role="alert" className="min-w-0 flex-1 text-[0.8125rem] text-danger-ink">
          {err}
        </p>
      ) : null}
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p
        role={err ? "alert" : undefined}
        className={
          err
            ? "min-w-0 flex-1 text-[0.8125rem] text-danger-ink"
            : "min-w-0 flex-1 text-xs text-muted-foreground"
        }
      >
        {err || rt("rm.assign.saveHint")}
      </p>
      <Button variant="outline" className={BTN} onClick={onClose} disabled={busy}>
        {rt("rm.action.cancel")}
      </Button>
      <Button className={BTN} onClick={onSave} disabled={busy}>
        {rt("rm.edit.save")}
      </Button>
    </div>
  )

  return (
    <EditWindow
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={decide ? rt("rm.over.title") : rt("rm.assign.title")}
      context={`${p.code} · ${p.name}`}
      size="xl"
      full={full}
      onToggleFull={() => setFull((f) => !f)}
      bodyRef={bodyRef}
      footer={footer}
    >
      {decide ? (
        <OverloadChoice
          p={p}
          check={decide.check}
          accept={accept}
          onAccept={setAccept}
          busy={busy}
          onPick={(res) => save(decide.op, res)}
        />
      ) : (
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-2.5 @[48rem]/edit:grid-cols-4">
            <EditStat
              label={rt("rm.assign.duration")}
              value={rt("rm.projects.workdays", { n: a.kit.workN(a.PS, a.PE, WD5) })}
              detail={`${day(toDay(a.PS), locale)} – ${day(toDay(a.PE), locale, { year: true })}`}
              action={
                <button
                  type="button"
                  onClick={onDates}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md px-1 font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11 pointer-coarse:px-2"
                >
                  <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" strokeWidth={2} />
                  {rt("rm.assign.change")}
                </button>
              }
            />
            <EditStat
              label={rt("rm.assign.effort")}
              value={rt("rm.assign.manDays", { n: num(a.totals.hours / a.dh, locale, 1) })}
              detail={rt("rm.assign.hoursTotal", { n: num(a.totals.hours, locale) })}
            />
            <EditStat
              label={rt("rm.assign.team")}
              value={rt("rm.assign.people", { n: a.totals.people })}
              detail={rt("rm.assign.withHours", { n: a.totals.withHours })}
            />
            <EditStat
              label={rt("rm.assign.managers")}
              value={mgrNames.length ? mgrNames.join(", ") : "—"}
              detail={rt("rm.assign.managersHint")}
            />
          </div>
          <AssignPicker a={a} />
          <section aria-labelledby="rm-assign-rows" className="grid gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h3 id="rm-assign-rows" className="text-sm font-semibold">
                {rt("rm.assign.rows")}
              </h3>
              {a.rows.length > 0 && (
                <div className="flex items-end gap-2">
                  <label className="grid gap-1 text-[0.6875rem] text-muted-foreground">
                    {rt("rm.assign.bulk")}
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={24}
                      value={bulk}
                      aria-invalid={bulkBad || undefined}
                      onChange={(e) => setBulk(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyBulk()}
                      className="h-9 w-24 sm:h-9 tabular-nums pointer-coarse:h-11 sm:pointer-coarse:h-11"
                    />
                  </label>
                  <Button variant="outline" className={BTN} onClick={applyBulk}>
                    {rt("rm.assign.apply")}
                  </Button>
                </div>
              )}
            </div>
            {a.rows.length ? (
              <AssignRows a={a} />
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center">
                <p className="text-sm font-medium">{rt("rm.assign.empty")}</p>
                <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                  {rt("rm.assign.emptyHint")}
                </p>
              </div>
            )}
            {badText ? (
              <p role="alert" className="text-[0.8125rem] font-medium text-danger-ink">
                {badText}
              </p>
            ) : null}
          </section>
        </div>
      )}
    </EditWindow>
  )
}
