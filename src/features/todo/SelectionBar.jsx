import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { DestructiveDialog } from "@/features/security/dialogs"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { TaskTitles } from "./TaskTitles"

const BUTTON =
  "inline-flex h-control shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-callout outline-none transition focus-visible:ring-2 focus-visible:ring-brand/30 disabled:pointer-events-none disabled:opacity-40"

/**
 * Çoklu seçimin alt çubuğu: sayı, tümünü seç, tamamla ve sil. Listenin dibine yapışır
 * (telefonda başparmağın altında). İşler sırayla yürür — posta kutusunun eşzamanlılık
 * sınırı — ve ilk retle durur: `useTodoBoard` reddi geri alıp tek bildirim çıkarır,
 * kalanlar seçili kalır ve yeniden denenebilir.
 */
export function SelectionBar({ selection, board, listById, onCompleted }) {
  const { t } = useLocale()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(null)
  const { chosen } = selection
  const n = chosen.length
  const open = chosen.filter((x) => !x.done)
  const linked = chosen.some((x) => listById.get(x.listId)?.kind === "flagged")

  async function run(kind, tasks, step) {
    setBusy(kind)
    let ok = true
    for (const task of tasks) {
      if (!(await step(task))) {
        ok = false
        break
      }
    }
    setBusy(null)
    if (ok) selection.stop()
    return ok
  }

  async function complete() {
    if (await run("complete", open, (x) => board.updateTask(x.id, { done: true }))) {
      onCompleted?.()
    }
  }

  return (
    <div className="pointer-events-none sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 mt-4 flex justify-center">
      <div
        role="toolbar"
        aria-label={t("todo.select.bar")}
        className="pointer-events-auto flex w-full max-w-xl items-center gap-1 rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg shadow-black/10"
      >
        <button
          type="button"
          onClick={selection.stop}
          aria-label={t("todo.select.exit")}
          title={t("todo.select.exit")}
          className={cn(
            BUTTON,
            "w-control px-0 text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
        </button>
        <p
          aria-live="polite"
          className="min-w-0 flex-1 truncate px-1 text-[0.8125rem] font-semibold tabular-nums"
        >
          {busy
            ? t(busy === "delete" ? "todo.select.deleting" : "todo.select.completing")
            : t("todo.select.count", { n })}
        </p>
        <button
          type="button"
          onClick={selection.toggleAll}
          disabled={Boolean(busy)}
          className={cn(BUTTON, "text-muted-foreground hover:bg-accent hover:text-foreground")}
        >
          {selection.all ? t("todo.select.none") : t("todo.select.all")}
        </button>
        {open.length > 0 && (
          <button
            type="button"
            onClick={complete}
            disabled={Boolean(busy)}
            title={t("todo.select.complete")}
            className={cn(BUTTON, "hover:bg-accent")}
          >
            <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2} />
            <span className="sr-only @[30rem]/board:not-sr-only">{t("todo.select.complete")}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setConfirm(true)}
          disabled={!n || Boolean(busy)}
          className={cn(BUTTON, "text-destructive hover:bg-destructive/10")}
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.9} />
          {t("todo.select.delete")}
        </button>
      </div>

      <DestructiveDialog
        open={confirm}
        onOpenChange={setConfirm}
        icon={Delete02Icon}
        title={t("todo.select.deleteTitle")}
        description={t("todo.select.deleteBody")}
        subject={<TaskTitles tasks={chosen} />}
        consequences={[
          { kind: "gone", text: t("todo.select.deleteGone") },
          ...(linked ? [{ kind: "keep", text: t("todo.select.deleteKeepMail") }] : []),
        ]}
        confirmLabel={t("todo.select.deleteConfirm", { n })}
        cancelLabel={t("todo.cancel")}
        onConfirm={() => {
          setConfirm(false)
          run("delete", chosen, (x) => board.removeTask(x.id))
        }}
      />
    </div>
  )
}
