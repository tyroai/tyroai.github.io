import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { localDayKey } from "@/lib/todo"
import { dueLabel } from "@/lib/todoInsights"
import { cn } from "@/lib/utils"
import { isolate } from "@/lib/bidi"

/**
 * Planner satırı: solda tamamla kutusu (Bugünün odağı'nın yuvarlak kutusu; başlamış işte içinde
 * mavi nokta), satırın kalanı işi Planner'da açar. İşaretliyken yazılıyor: kutu kilitli, başlık
 * çizili.
 */
export function PlannerRow({ task, tenant, today, checked, onComplete }) {
  const { t, locale } = useLocale()
  const key = task.due ? localDayKey(task.due) : null
  const late = key && key < today
  return (
    <li className="-mx-2 flex min-h-11 items-center gap-2 rounded-xl px-2 transition hover:bg-accent/60">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={checked}
        onClick={() => onComplete(task)}
        title={t("widgets.planner.complete")}
        className={cn(
          "relative grid size-4 shrink-0 place-items-center rounded-full border transition pointer-coarse:size-5 pointer-coarse:after:absolute pointer-coarse:after:-inset-3",
          checked
            ? "border-transparent bg-gradient-to-br from-brand-from via-brand-via to-brand-to text-brand-on-ramp"
            : late
              ? "border-amber-500/80 hover:border-brand"
              : "border-foreground/25 hover:border-brand",
        )}
      >
        {checked ? (
          <HugeiconsIcon icon={Tick02Icon} className="size-2.5" strokeWidth={3} />
        ) : (
          task.started && <span aria-hidden="true" className="size-1.5 rounded-full bg-sky-500" />
        )}
        <span className="sr-only">{task.title}</span>
      </button>
      <a
        href={`https://tasks.office.com/${tenant}/Home/Task/${task.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 rounded-lg py-1 outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <span
          dir="auto"
          title={task.title}
          className={cn(
            "line-clamp-2 text-[0.8125rem] font-medium break-words",
            checked && "text-muted-foreground line-through decoration-foreground/30",
          )}
        >
          {task.urgent && <span className="me-1 font-bold text-red-600 dark:text-red-400">!</span>}
          {task.title}
        </span>
        <span className="block truncate text-[0.6875rem] text-muted-foreground">
          {isolate(task.plan)}
          {task.plan && key ? " · " : ""}
          {key && (
            <span className={cn(late && "font-medium text-amber-700 dark:text-amber-400")}>
              {dueLabel(key, today, t, locale)}
            </span>
          )}
        </span>
      </a>
    </li>
  )
}
