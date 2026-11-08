import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import StarIcon from "@hugeicons/core-free-icons/StarIcon"
import Sun03Icon from "@hugeicons/core-free-icons/Sun03Icon"
import { useLocale } from "@/hooks/useLocale"
import { localDayKey } from "@/lib/todo"
import { dueLabel } from "@/lib/todoInsights"
import { suggestTasks } from "@/features/myspace/lib/todoSuggest"

/**
 * Bugünün odağının öneri tepsisi (eski "Bugüne al" kartı): bugüne düşmemiş açık işlerden en çok
 * `count` tanesi (`features/myspace/lib/todoSuggest`). Güneş düğmesi işin tarihini bugüne çeker; iş hemen tepsiden
 * kalkar, listeye To Do'dan gelir (`useTodoBoard` › `updateTask`, `lib/todoSync`). "Tümü"
 * planlananları To-Do sayfasında açar.
 */
export function FocusSuggestions({ board, count, canOpenTodo }) {
  const { t, locale } = useLocale()
  const [moved, setMoved] = useState(() => new Set())
  const today = localDayKey()
  const picks = useMemo(
    () => suggestTasks(board.tasks, today, moved).slice(0, count),
    [board.tasks, today, moved, count],
  )
  if (!count || board.status !== "ready" || !picks.length) return null

  function take(task) {
    setMoved((s) => new Set(s).add(task.id))
    board.updateTask(task.id, { dueKey: today })
  }

  return (
    <section
      aria-label={t("myspace.focus.suggestTitle")}
      className="mt-2 rounded-xl bg-muted/40 px-2.5 py-1.5"
    >
      <p className="flex min-h-6 items-center justify-between gap-2 text-[0.6875rem] font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Sun03Icon} className="size-3" strokeWidth={2} aria-hidden="true" />
          {t("myspace.focus.suggestTitle")}
        </span>
        {canOpenTodo && (
          <Link
            to="/todo?view=planned"
            className="rounded-md px-1 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            {t("widgets.suggest.all")}
          </Link>
        )}
      </p>
      <ul className="space-y-0.5">
        {picks.map((task) => {
          const title = task.title || t("todo.untitled")
          const due = task.dueKey
            ? dueLabel(task.dueKey, today, t, locale)
            : t("widgets.suggest.noDue")
          const label = t("myspace.focus.takeTask", { title })
          return (
            <li key={task.id} className="flex min-h-7 items-center gap-2">
              {task.importance === "high" && (
                <HugeiconsIcon
                  icon={StarIcon}
                  className="size-3 shrink-0 fill-current text-brand"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              )}
              <span
                title={`${title} · ${due}`}
                className="min-w-0 flex-1 truncate text-[0.8125rem]"
              >
                {title}
              </span>
              {/* Mini kartta tarih düşer: iş adı kesilmesin (tarih ipucunda). */}
              <span className="shrink-0 text-[0.6875rem] text-muted-foreground @max-[16rem]/widget:hidden">
                {due}
              </span>
              <button
                type="button"
                onClick={() => take(task)}
                aria-label={label}
                title={label}
                className="grid size-7 shrink-0 place-items-center rounded-full bg-brand/[0.08] text-brand transition hover:bg-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-9"
              >
                <HugeiconsIcon icon={Sun03Icon} className="size-3.5" strokeWidth={2} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
