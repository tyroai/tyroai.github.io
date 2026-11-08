import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { applyDates } from "@/features/rm/lib/edit/ops"
import { toDay } from "@/lib/rm/engine/dates"
import { day } from "@/features/rm/lib/format"
import { useRmEdit } from "../../data/useRmEdit"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"
import { EditWindow } from "../EditWindow"
import { BTN } from "../ui"
import { ChangeTable } from "./ChangeTable"
import { DatesSummary } from "./DatesSummary"
import { datesError, useDatesPreview } from "./useDatesPreview"

function DateField({ id, label, value, onChange, invalid, inputRef }) {
  return (
    <label htmlFor={id} className="grid gap-1.5 text-[0.8125rem] font-medium">
      <span>
        {label} <span className="text-danger-ink">*</span>
      </span>
      <Input
        ref={inputRef}
        id={id}
        type="date"
        required
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 sm:h-10 sm:text-sm tabular-nums pointer-coarse:h-11 sm:pointer-coarse:h-11"
      />
    </label>
  )
}

/**
 * Tarihleri değiştir (şartname v6.1): her kişinin bu projedeki toplam işi korunur, günlük saat
 * yeni süreye göre yeniden hesaplanır; önce/sonra canlı ön izlenir, kayıttan sonra özet çıkar.
 * `after="assign"`: Kişi ata'dan gelindi, bitince oraya dönülür.
 */
export default function DatesDialog({ pid, after = null, onClose, onAssign }) {
  const { rt, locale } = useRmText()
  const { data } = useRm()
  const { commit, editError } = useRmEdit()
  const p = data.st.projects.find((x) => x.id === pid)
  const [S, setS] = useState(p.start || "")
  const [E, setE] = useState(p.end || "")
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [done, setDone] = useState(null)
  const startRef = useRef(null)
  const endRef = useRef(null)
  const { s0, kit, work, preview } = useDatesPreview({
    raw: data.raw,
    st: data.st,
    plan: data.plan,
    pid,
    S,
    E,
  })
  const ve = datesError(S, E)
  const same = S === p.start && E === p.end

  async function onSave(e) {
    e.preventDefault()
    if (ve) {
      setShown(true)
      ;(ve === "start" ? startRef : endRef).current?.focus()
      return
    }
    if (same) {
      if (after === "assign") onAssign()
      else onClose()
      return
    }
    const old = { s: p.start, e: p.end }
    setBusy(true)
    setErr(null)
    const label = rt("rm.dates.saved", {
      p: p.code,
      a: day(toDay(S), locale, { year: true }),
      b: day(toDay(E), locale, { year: true }),
    })
    try {
      await commit((draft) => applyDates(draft, pid, S, E, s0, kit.workN), label)
      setDone({ old, nw: { s: S, e: E } })
    } catch (er) {
      setErr(editError(er))
    }
    setBusy(false)
  }

  if (done) {
    return (
      <DatesSummary
        pid={pid}
        s0={s0}
        done={done}
        after={after}
        onClose={onClose}
        onAssign={onAssign}
      />
    )
  }

  return (
    <EditWindow
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={rt("rm.dates.title")}
      context={`${p.code} · ${p.name}`}
      initialFocus="#rm-dates-end"
      footer={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p role="alert" className="min-w-0 flex-1 text-[0.8125rem] text-danger-ink">
            {err || (shown && ve ? rt(`rm.dates.err.${ve}`) : "")}
          </p>
          <Button variant="outline" className={BTN} onClick={onClose} disabled={busy}>
            {rt("rm.action.cancel")}
          </Button>
          <Button type="submit" form="rm-dates" className={BTN} disabled={busy}>
            {rt("rm.edit.save")}
          </Button>
        </div>
      }
    >
      <form id="rm-dates" noValidate onSubmit={onSave} className="grid gap-5">
        <div className="grid gap-3 @[30rem]/edit:grid-cols-2">
          <DateField
            id="rm-dates-start"
            label={rt("rm.dates.start")}
            value={S}
            onChange={setS}
            invalid={shown && ve === "start"}
            inputRef={startRef}
          />
          <DateField
            id="rm-dates-end"
            label={rt("rm.dates.end")}
            value={E}
            onChange={setE}
            invalid={shown && (ve === "end" || ve === "order")}
            inputRef={endRef}
          />
        </div>
        <p className="text-[0.8125rem] text-muted-foreground">
          {rt(work ? "rm.dates.keepHint" : "rm.dates.noWork")}
        </p>
        {work ? (
          <div aria-live="polite" className="grid gap-2">
            {ve ? (
              <p className="text-[0.8125rem] text-danger-ink">{rt(`rm.dates.err.${ve}`)}</p>
            ) : same ? (
              <p className="text-[0.8125rem] text-muted-foreground">{rt("rm.dates.unchanged")}</p>
            ) : preview ? (
              <ChangeTable s0={s0} s1={preview} />
            ) : null}
          </div>
        ) : null}
      </form>
    </EditWindow>
  )
}
