import { useMemo } from "react"
import { useMsal } from "@azure/msal-react"
import KanbanIcon from "@hugeicons/core-free-icons/KanbanIcon"
import { useLocale } from "@/hooks/useLocale"
import { useWidgetData } from "@/hooks/useWidgetData"
import { localDayKey } from "@/lib/todo"
import { fetchPlannerTasks } from "@/features/widgets/lib/widgetSources"
import { PlannerRow } from "./planner/PlannerRow"
import { usePlannerDone } from "./planner/usePlannerDone"
import { WidgetBody } from "./WidgetBody"
import { WidgetEmpty } from "./WidgetEmpty"
import { WidgetFrame } from "./WidgetFrame"
import { PageBody, Pager } from "./paging/Pager"
import { usePager } from "./paging/usePager"

/**
 * Planner işlerim — ekip panolarında bana atanmış, bitmemiş işler (teslimi en
 * yakın önce): plan adı, teslim, gecikme kehribar. Soldaki kutu işi kartta
 * tamamlar (`usePlannerDone`, geri alınabilir); satır işi Planner'da açar.
 */
export function PlannerWidget({ className }) {
  const { t } = useLocale()
  const { accounts } = useMsal()
  const tenant = accounts[0]?.tenantId ?? ""
  const res = useWidgetData("planner", fetchPlannerTasks)
  const done = usePlannerDone()
  const tasks = useMemo(
    () => (res.data?.tasks ?? []).filter((x) => !done.gone.has(x.id)),
    [res.data, done.gone],
  )
  const total = res.data?.total
    ? res.data.total - ((res.data.tasks?.length ?? 0) - tasks.length)
    : 0
  const today = localDayKey()
  const pager = usePager(tasks, 3)
  return (
    <WidgetFrame
      id="planner"
      title={t("widgets.planner.title")}
      shortTitle={t("widgets.planner.titleShort")}
      icon={KanbanIcon}
      busy={res.status === "loading"}
      className={className}
      pager={<Pager pager={pager} label={t("widgets.planner.title")} />}
      action={
        total && pager.pages < 2 ? (
          <span className="text-[0.71875rem] tabular-nums text-muted-foreground">
            {t("widgets.planner.total", { n: total })}
          </span>
        ) : null
      }
    >
      <WidgetBody status={res.status} rows={4}>
        {tasks.length ? (
          <PageBody pager={pager} className="mt-3">
            {pager.items.map((x) => (
              <PlannerRow
                key={x.id}
                task={x}
                tenant={tenant}
                today={today}
                checked={done.checked.has(x.id)}
                onComplete={done.complete}
              />
            ))}
          </PageBody>
        ) : (
          <WidgetEmpty icon={KanbanIcon}>{t("widgets.planner.empty")}</WidgetEmpty>
        )}
      </WidgetBody>
    </WidgetFrame>
  )
}
