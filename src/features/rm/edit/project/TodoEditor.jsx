import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUp01Icon from "@hugeicons/core-free-icons/ArrowUp01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRmText } from "../../data/useRmText"
import { BTN } from "../ui"

const ICON_BTN =
  "grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-40 pointer-coarse:size-11"
const FIELD = "h-9 sm:h-9 pointer-coarse:h-11 sm:pointer-coarse:h-11"

/** Formdaki yapılacak işler: satır satır metin, bitti işareti, yukarı taşı, sil; Enter ekler. */
export function TodoEditor({ items, todo, labelId }) {
  const { rt } = useRmText()
  const [draft, setDraft] = useState("")
  const add = () => {
    if (!draft.trim()) return
    todo.add(draft)
    setDraft("")
  }
  const done = items.filter((x) => x.d).length
  return (
    <div role="group" aria-labelledby={labelId} className="grid gap-1.5">
      {items.map((x, i) => (
        <div key={x.id} className="flex items-center gap-1.5">
          <label className="grid size-9 shrink-0 place-items-center pointer-coarse:size-11">
            <Checkbox
              checked={x.d}
              onCheckedChange={(v) => todo.edit(x.id, { d: v === true })}
              aria-label={rt("rm.todo.doneOf", { t: x.t || i + 1 })}
            />
          </label>
          <Input
            value={x.t}
            onChange={(e) => todo.edit(x.id, { t: e.target.value })}
            aria-label={rt("rm.todo.item", { n: i + 1 })}
            className={cn(FIELD, x.d && "text-muted-foreground line-through")}
          />
          <button
            type="button"
            className={ICON_BTN}
            disabled={i === 0}
            onClick={() => todo.up(x.id)}
            aria-label={rt("rm.todo.up")}
            title={rt("rm.todo.up")}
          >
            <HugeiconsIcon icon={ArrowUp01Icon} className="size-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            className={cn(ICON_BTN, "hover:bg-danger/10 hover:text-danger-ink")}
            onClick={() => todo.remove(x.id)}
            aria-label={rt("rm.todo.removeOf", { t: x.t || i + 1 })}
            title={rt("rm.todo.remove")}
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
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
          className={FIELD}
        />
        <Button type="button" variant="outline" className={BTN} onClick={add}>
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" strokeWidth={2} />
          {rt("rm.todo.add")}
        </Button>
      </div>
      {items.length > 0 && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {rt("rm.todo.progress", { d: done, n: items.length })}
        </p>
      )}
    </div>
  )
}
