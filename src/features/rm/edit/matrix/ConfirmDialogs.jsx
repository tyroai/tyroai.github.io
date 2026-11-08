import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { removeMember, writeCells } from "@/features/rm/lib/edit/rules"
import { num } from "@/features/rm/lib/format"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { useRmEdit } from "../../data/useRmEdit"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"
import { EditWindow } from "../EditWindow"
import { BTN } from "../ui"

function useRun(onClose) {
  const { commit, editError } = useRmEdit()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const run = async (fn, label) => {
    setBusy(true)
    setErr(null)
    try {
      await commit(fn, label)
      onClose()
    } catch (e) {
      setErr(editError(e))
      setBusy(false)
    }
  }
  return { busy, err, run }
}

function Footer({ err, busy, onClose, children }) {
  const { rt } = useRmText()
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p role="alert" className="min-w-0 flex-1 text-[0.8125rem] text-danger-ink">
        {err}
      </p>
      <Button variant="outline" className={BTN} onClick={onClose} disabled={busy}>
        {rt("rm.action.cancel")}
      </Button>
      {children}
    </div>
  )
}

/** Hücreye yazılan saat kapasiteyi aşıyor: onay kutusuyla fazla mesaiyle yaz (v5.8). */
export function CellOverDialog({ e, onClose }) {
  const { rt } = useRmText()
  const [ok, setOk] = useState(false)
  const { busy, err, run } = useRun(onClose)
  return (
    <EditWindow
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={rt("rm.cell.overTitle")}
      footer={
        <Footer err={err} busy={busy} onClose={onClose}>
          <Button
            variant="destructive"
            className={BTN}
            disabled={!ok || busy}
            onClick={() =>
              run(
                (S) => writeCells(S, e.pid, e.rid, e.days, e.h),
                `${e.label} (${rt("rm.assign.mode.ot")})`,
              )
            }
          >
            {rt("rm.cell.overDo")}
          </Button>
        </Footer>
      }
    >
      <div className="grid gap-4">
        <p className="text-sm">{e.text}</p>
        <label className="flex min-h-11 items-center gap-2 text-[0.8125rem]">
          <Checkbox checked={ok} onCheckedChange={(v) => setOk(v === true)} />
          {rt("rm.over.accept")}
        </label>
      </div>
    </EditWindow>
  )
}

/** Kişiyi projeden çıkar: kuralları, elle günleri ve ekip üyeliği gider (v5.8). */
export function RemoveDialog({ e, onClose }) {
  const { rt, locale } = useRmText()
  const { data, people } = useRm()
  const { busy, err, run } = useRun(onClose)
  const p = data.st.projects.find((x) => x.id === e.pid)
  const r = data.st.resources.find((x) => x.id === e.rid)
  if (!p || !r) return null
  const name = fullName(people, r.name)
  const hours = Object.values(data.plan.PA[p.id]?.[r.id] || {}).reduce((s, h) => s + h, 0)
  return (
    <EditWindow
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={rt("rm.mx.removeTitle")}
      footer={
        <Footer err={err} busy={busy} onClose={onClose}>
          <Button
            variant="destructive"
            className={BTN}
            disabled={busy}
            onClick={() =>
              run((S) => removeMember(S, p.id, r.id), rt("rm.mx.removed", { n: name, p: p.code }))
            }
          >
            {rt("rm.mx.remove")}
          </Button>
        </Footer>
      }
    >
      <div className="grid gap-2">
        <p className="text-sm font-semibold">
          {name} – {p.code} {p.name}
        </p>
        <p className="text-[0.8125rem] text-muted-foreground">
          {rt("rm.mx.removeBody", { h: num(hours, locale) })}
        </p>
      </div>
    </EditWindow>
  )
}
