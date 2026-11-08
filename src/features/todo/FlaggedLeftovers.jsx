import { useId, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import FlagOffIcon from "@hugeicons/core-free-icons/FlagOffIcon"
import { DestructiveDialog } from "@/features/security/dialogs"
import { useLocale } from "@/hooks/useLocale"
import { tasksForView } from "@/lib/todoInsights"
import { cn } from "@/lib/utils"
import { TaskTitles } from "./TaskTitles"

const BUTTON =
  "inline-flex h-7 items-center gap-1 rounded-lg px-2 font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.06] hover:text-foreground disabled:opacity-50 [@media(pointer:coarse)]:min-h-11"

/**
 * Postası artık bayraklı olmayan işaretli e-posta görevlerinin notu: görevler
 * tabloda yok (`useFlaggedLeftovers`); burada sayısı, adları ve To Do'dan
 * silme yolu duruyor. Yalnız kalan görevlerden birinin görüneceği görünümde —
 * gizlenen şey, gizlendiği yerde söylenir.
 */
export function FlaggedLeftovers({ flagged, view, today }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const listDomId = useId()
  const { leftovers, clean, cleaning } = flagged
  if (!tasksForView(leftovers, view, today).length) return null
  const n = leftovers.length

  return (
    <div className="mb-5 rounded-xl bg-muted/60 px-3.5 py-2.5 text-[0.75rem] leading-snug text-muted-foreground">
      {/* Dar ekranda düğmeler alt satıra iner; metin sütuna sıkışmasın. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <div className="flex min-w-0 flex-[1_1_16rem] items-start gap-2.5">
          <HugeiconsIcon
            icon={FlagOffIcon}
            aria-hidden="true"
            className="mt-px size-4 shrink-0"
            strokeWidth={1.8}
          />
          <p className="min-w-0">{t("todo.flagged.leftover", { n })}</p>
        </div>
        <div className="-my-1 ms-auto flex items-center gap-1">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listDomId}
            onClick={() => setOpen((v) => !v)}
            className={BUTTON}
          >
            {t("todo.flagged.which")}
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              aria-hidden="true"
              className={cn("size-3.5 transition-transform", open && "rotate-180")}
              strokeWidth={2}
            />
          </button>
          <button
            type="button"
            disabled={cleaning}
            onClick={() => setConfirm(true)}
            className={BUTTON}
          >
            {t("todo.flagged.clean")}
          </button>
        </div>
      </div>

      <ul
        id={listDomId}
        hidden={!open}
        className="mt-2 max-h-48 space-y-1 overflow-y-auto border-t border-border/60 pt-2"
      >
        {leftovers.map((task) => (
          <li key={task.id} className="truncate text-foreground/80">
            {task.title || t("todo.untitled")}
          </li>
        ))}
      </ul>

      <DestructiveDialog
        open={confirm}
        onOpenChange={setConfirm}
        icon={Delete02Icon}
        title={t("todo.flagged.cleanTitle")}
        description={t("todo.flagged.cleanBody")}
        subject={<TaskTitles tasks={leftovers} />}
        consequences={[
          { kind: "gone", text: t("todo.flagged.cleanGone") },
          { kind: "keep", text: t("todo.flagged.cleanKeep") },
        ]}
        confirmLabel={t("todo.flagged.cleanConfirm")}
        cancelLabel={t("todo.cancel")}
        onConfirm={() => {
          setConfirm(false)
          clean()
        }}
      />
    </div>
  )
}
