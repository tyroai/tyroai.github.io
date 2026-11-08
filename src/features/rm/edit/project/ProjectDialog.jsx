import { useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import { Button } from "@/components/ui/button"
import { loadKit } from "@/features/rm/lib/edit/load"
import { snapProject, uid } from "@/features/rm/lib/edit/ops"
import { deleteProject, saveProject } from "@/features/rm/lib/edit/project"
import { useRmEdit } from "../../data/useRmEdit"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"
import { DatesSummary } from "../dates/DatesSummary"
import { EditWindow } from "../EditWindow"
import { BTN } from "../ui"
import { ProjectFields } from "./ProjectFields"
import { useProjectForm } from "./useProjectForm"

/**
 * Yeni proje ya da projeyi düzenle (şartname proje formu, son yamalarıyla). Yeni projeden sonra
 * Kişi ata açılır; tarih değişen ve saati olan projede "yapılan değişiklikler" özeti çıkar.
 */
export default function ProjectDialog({ pid = null, pre = null, onClose, onAssign }) {
  const { rt } = useRmText()
  const { data, params } = useRm()
  const { commit, editError } = useRmEdit()
  const form = useProjectForm({ st: data.st, plan: data.plan, pid, pre })
  const kit = useMemo(() => loadKit(data.st, data.plan), [data.st, data.plan])
  const bodyRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const [done, setDone] = useState(null)
  const isNew = !pid
  const p = form.p

  async function run(fn, label, after) {
    setBusy(true)
    setErr(null)
    try {
      await commit(fn, label)
      after()
    } catch (er) {
      setErr(editError(er))
      setBusy(false)
    }
  }

  function onSave(e) {
    e.preventDefault()
    if (!form.valid) {
      form.show()
      requestAnimationFrame(() => bodyRef.current?.querySelector("[aria-invalid=true]")?.focus())
      return
    }
    const f = form.f
    const id = isNew ? `p_${uid()}` : pid
    const s0 = isNew ? null : snapProject(data.plan, data.st, pid)
    const old = isNew ? null : { s: p.start, e: p.end }
    const moved = !isNew && (old.s !== f.start || old.e !== f.end)
    const label = rt(isNew ? "rm.pform.added" : "rm.pform.saved", { p: f.code.toUpperCase() })
    run(
      (S) => saveProject(S, id, f, { isNew, s0, workN: kit.workN }),
      label,
      () => {
        if (isNew) onAssign(id)
        else if (moved && Object.values(s0).some((x) => x.tot > 0))
          setDone({ s0, old, nw: { s: f.start, e: f.end } })
        else onClose()
      },
    )
  }

  function onDelete() {
    run(
      (S) => deleteProject(S, pid),
      rt("rm.pform.deleted", { p: p.code }),
      () => {
        params.update({ p: null })
        onClose()
      },
    )
  }

  if (done) {
    return (
      <DatesSummary
        pid={pid}
        s0={done.s0}
        done={done}
        onClose={onClose}
        onAssign={() => onAssign(pid)}
      />
    )
  }

  const errLine = err ? (
    <p role="alert" className="min-w-0 flex-1 text-[0.8125rem] text-danger-ink">
      {err}
    </p>
  ) : (
    <span className="flex-1" />
  )

  const footer = confirmDel ? (
    <div className="flex flex-wrap items-center gap-3">
      {errLine}
      <Button
        variant="outline"
        className={BTN}
        onClick={() => setConfirmDel(false)}
        disabled={busy}
      >
        {rt("rm.action.cancel")}
      </Button>
      <Button variant="destructive" className={BTN} onClick={onDelete} disabled={busy}>
        {rt("rm.pform.deleteDo")}
      </Button>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-3">
      {!isNew && (
        <Button
          variant="ghost"
          className={`${BTN} text-danger-ink hover:bg-danger/10 hover:text-danger-ink`}
          onClick={() => setConfirmDel(true)}
          disabled={busy}
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />
          {rt("rm.pform.delete")}
        </Button>
      )}
      {errLine}
      <Button variant="outline" className={BTN} onClick={onClose} disabled={busy}>
        {rt("rm.action.cancel")}
      </Button>
      <Button type="submit" form="rm-pform" className={BTN} disabled={busy}>
        {rt(isNew ? "rm.pform.add" : "rm.edit.save")}
      </Button>
    </div>
  )

  return (
    <EditWindow
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={rt(
        confirmDel ? "rm.pform.deleteTitle" : isNew ? "rm.pform.newTitle" : "rm.pform.editTitle",
      )}
      context={isNew ? undefined : `${p.code} · ${p.name}`}
      initialFocus="#rm-pf-name"
      bodyRef={bodyRef}
      footer={footer}
    >
      {confirmDel ? (
        <div className="grid gap-2">
          <p className="text-sm font-semibold">
            {p.code} – {p.name}
          </p>
          <p className="text-[0.8125rem] text-muted-foreground">{rt("rm.pform.deleteBody")}</p>
        </div>
      ) : (
        <form id="rm-pform" noValidate onSubmit={onSave}>
          <ProjectFields form={form} />
        </form>
      )}
    </EditWindow>
  )
}
