import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { changeTodo } from "@/features/rm/lib/edit/project"
import { uid } from "@/features/rm/lib/edit/ops"
import { cn } from "@/lib/utils"
import { useRmEdit } from "../data/useRmEdit"
import { useRmText } from "../data/useRmText"
import { DetailSection } from "../common/RmDetailFrame"
import { useRm } from "../shell/RmContext"

/**
 * Ayrıntı panelindeki yapılacak işler. Düzenleyici işaretler (anında görünür, arkada yazılır),
 * siler ve Enter'la ekler; okuyana salt liste. İşler sırayla tanınır (eski planlarda kimlik yok).
 */
export function ProjectTodo({ row }) {
  const { rt } = useRmText()
  const { edit } = useRm()
  const { commit, editToast } = useRmEdit()
  const [pending, setPending] = useState({})
  const [draft, setDraft] = useState("")
  const items = row.todo.items
  if (!edit && !items.length) return null

  const write = async (fn, label, quiet) => {
    try {
      await commit((S) => changeTodo(S, row.id, fn), label, { quiet })
    } catch (err) {
      editToast(err)
    }
  }
  const toggle = async (i, d) => {
    setPending((p) => ({ ...p, [i]: d }))
    await write(
      (L) => {
        if (L[i]) L[i].d = d
      },
      rt("rm.todo.changed", { p: row.code }),
      true,
    )
    setPending((p) => {
      const n = { ...p }
      delete n[i]
      return n
    })
  }
  const add = () => {
    const text = draft.trim()
    if (!text) return
    setDraft("")
    write(
      (L) => {
        for (const t of text
          .split(/;/)
          .map((x) => x.trim())
          .filter(Boolean))
          L.push({ id: uid(), t, d: false })
      },
      rt("rm.todo.added", { p: row.code }),
      true,
    )
  }

  return (
    <DetailSection
      title={rt("rm.panel.todo")}
      aside={
        items.length ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {row.todo.done}/{row.todo.total}
          </span>
        ) : null
      }
    >
      {items.length > 0 && (
        <ul className="grid gap-0.5 text-sm">
          {items.map((it, i) => {
            const d = pending[i] ?? !!it?.d
            const text = it?.t ?? ""
            return (
              <li key={it?.id ?? i} className="group flex min-h-9 items-center gap-2">
                {edit ? (
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-1 pointer-coarse:min-h-11">
                    <Checkbox
                      checked={d}
                      onCheckedChange={(v) => toggle(i, v === true)}
                      aria-label={rt("rm.todo.doneOf", { t: text })}
                    />
                    <span
                      className={cn("min-w-0 flex-1", d && "text-muted-foreground line-through")}
                    >
                      {text}
                    </span>
                  </label>
                ) : (
                  <span
                    className={cn(
                      "flex min-w-0 flex-1 gap-2",
                      d && "text-muted-foreground line-through",
                    )}
                  >
                    <span aria-hidden="true">{d ? "☑" : "☐"}</span>
                    <span className="min-w-0 flex-1">{text}</span>
                  </span>
                )}
                {edit && (
                  <button
                    type="button"
                    onClick={() =>
                      write((L) => L.splice(i, 1), rt("rm.todo.removed", { t: text }), false)
                    }
                    aria-label={rt("rm.todo.removeOf", { t: text })}
                    className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground opacity-60 hover:bg-danger/10 hover:text-danger-ink hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 group-hover:opacity-100 pointer-coarse:size-11 pointer-coarse:opacity-100"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" strokeWidth={2} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {edit && (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add()
            }
          }}
          placeholder={rt("rm.todo.placeholder")}
          aria-label={rt("rm.todo.new")}
          className="mt-2 h-9 sm:h-9 sm:text-sm pointer-coarse:h-11 sm:pointer-coarse:h-11"
        />
      )}
    </DetailSection>
  )
}
