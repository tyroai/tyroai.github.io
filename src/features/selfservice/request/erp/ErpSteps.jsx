import { HugeiconsIcon } from "@hugeicons/react"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { number } from "../../kinds"

const TICK = "M4.5 8.5l2.2 2.2L11.5 5.5"

function Mark({ status }) {
  if (status === "done")
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success text-white dark:text-background">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3" fill="none">
          <path
            d={TICK}
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  if (status === "active")
    return (
      <HugeiconsIcon
        icon={Loading03Icon}
        aria-hidden="true"
        strokeWidth={2.2}
        className="size-5 shrink-0 animate-spin text-brand-ink motion-reduce:animate-none"
      />
    )
  return <span className="size-5 shrink-0 rounded-full border-[1.5px] border-foreground/20" />
}

/**
 * Yazım sürerken iş listesi (`erpProgress`): biten adım ✓, süren dönen simge, sıradaki boş
 * halka; çok parçalı adımda (kalemler, fişler) "2 / 3" ve ince çubuk. Ekran okuyucuya adım
 * cümlesi (`live`) duyurulur, liste süs.
 */
export function ErpTaskList({ progress, live }) {
  const { t, locale } = useLocale()
  return (
    <div className="rounded-2xl bg-muted/55 p-1.5 ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]">
      <p role="status" className="sr-only">
        {live}
      </p>
      <ul aria-hidden="true">
        {progress.tasks.map((task) => (
          <li
            key={task.id}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
              task.status === "active" && "bg-background shadow-xs",
            )}
          >
            <Mark status={task.status} />
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block text-[0.875rem] font-medium",
                  task.status === "pending" && "text-muted-foreground",
                )}
              >
                {t(`selfService.erp.task.${task.id}`)}
              </span>
              {task.total > 1 && task.status === "active" && (
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-foreground/10">
                  <span
                    className="block h-full rounded-full bg-brand transition-[width] duration-300"
                    style={{ width: `${(task.count / task.total) * 100}%` }}
                  />
                </span>
              )}
            </span>
            {task.total > 1 && (
              <span className="shrink-0 text-[0.8125rem] tabular-nums text-muted-foreground">
                {number(task.status === "active" ? task.count + 1 : task.count, locale)} /{" "}
                {number(task.total, locale)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
