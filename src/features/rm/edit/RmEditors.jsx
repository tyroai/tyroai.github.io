import { hasDates } from "@/features/rm/lib/edit/assign"
import { useRm } from "../shell/RmContext"
import AssignDialog from "./assign/AssignDialog"
import DatesDialog from "./dates/DatesDialog"
import { CellOverDialog, RemoveDialog } from "./matrix/ConfirmDialogs"
import MoveDialog from "./matrix/MoveDialog"
import SchedDialog from "./matrix/SchedDialog"
import PersonDialog from "./people/PersonDialog"
import AssumptionsDialog from "./settings/AssumptionsDialog"
import CategoryDialog from "./setup/CategoryDialog"
import ListDialog from "./setup/ListDialog"
import HolidayDialog from "./settings/HolidayDialog"
import ProjectDialog from "./project/ProjectDialog"

/**
 * Düzenleme pencerelerinin tek evi (düzenleyiciye ayrı paket olarak iner). `editor`:
 * { kind: "assign" | "dates" | "project" | "sched" | "move" | "remove" | "cellOver" | "person" | "settings" | "holiday" | "list" | "cats" | "action" | "risk" | "op", … };
 * "project"te `pid` yoksa yeni proje, "sched"de yoksa "projeye ata".
 * Tarihi eksik projede Kişi ata önce tarih ister.
 */
export default function RmEditors({ editor, onChange }) {
  const { data } = useRm()
  const close = () => onChange(null)
  const toAssign = (pid) => onChange({ kind: "assign", pid })
  if (editor.kind === "project") {
    return (
      <ProjectDialog
        key={`p-${editor.pid ?? "new"}`}
        pid={editor.pid ?? null}
        pre={editor.pre ?? null}
        onClose={close}
        onAssign={(pid) => onChange({ kind: "assign", pid, pend: editor.pend ?? null })}
      />
    )
  }
  if (editor.kind === "settings") return <AssumptionsDialog onClose={close} />
  if (editor.kind === "list")
    return <ListDialog key={editor.list} kind={editor.list} onClose={close} />
  if (editor.kind === "cats") return <CategoryDialog onClose={close} />
  if (editor.kind === "holiday") {
    return (
      <HolidayDialog
        key={`h-${editor.id ?? "new"}`}
        id={editor.id ?? null}
        country={editor.country ?? "TR"}
        onClose={close}
      />
    )
  }
  if (editor.kind === "person") {
    return (
      <PersonDialog key={`r-${editor.rid ?? "new"}`} rid={editor.rid ?? null} onClose={close} />
    )
  }
  if (editor.kind === "sched") {
    return (
      <SchedDialog
        key={`s-${editor.pid}-${editor.rid}`}
        pid={editor.pid}
        rid={editor.rid}
        onClose={close}
      />
    )
  }
  if (editor.kind === "move")
    return <MoveDialog pid={editor.pid} rid={editor.rid} onClose={close} />
  if (editor.kind === "remove") return <RemoveDialog e={editor} onClose={close} />
  if (editor.kind === "cellOver") return <CellOverDialog e={editor} onClose={close} />
  const p = data.st?.projects.find((x) => x.id === editor.pid)
  if (!p) return null
  if (editor.kind === "assign" && hasDates(p)) {
    return (
      <AssignDialog
        key={`a-${p.id}`}
        pid={p.id}
        pend={editor.pend ?? null}
        onClose={close}
        onDates={() => onChange({ kind: "dates", pid: p.id, after: "assign" })}
      />
    )
  }
  return (
    <DatesDialog
      key={`d-${p.id}`}
      pid={p.id}
      after={editor.kind === "assign" ? "assign" : (editor.after ?? null)}
      onClose={close}
      onAssign={() => toAssign(p.id)}
    />
  )
}
