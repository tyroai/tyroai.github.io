import { useCallback, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import { notify } from "@/lib/notify"
import {
  dropPlannerTask,
  restorePlannerTask,
  setPlannerPercent,
} from "@/features/widgets/lib/plannerTask"
import { updateWidget } from "@/lib/widgetCache"

// İşaret görülsün diye satır en az bu kadar işaretli kalır, sonra listeden çekilir.
const SETTLE_MS = 700
const UNDO_MS = 8000

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const withId = (id) => (set) => new Set(set).add(id)
const withoutId = (id) => (set) => {
  const next = new Set(set)
  next.delete(id)
  return next
}

/**
 * Planner işini kartta tamamlama: satır anında işaretlenir, Planner'a yazılınca listeden çekilir ve
 * "Geri al"lı bildirim çıkar; yazılamazsa işaret kalkar. Bellekteki okuma da güncellenir — kart
 * yeniden açılınca iş eski okumadan geri gelmesin (`updateWidget`).
 */
export function usePlannerDone() {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const { t } = useLocale()
  const [checked, setChecked] = useState(() => new Set())
  const [gone, setGone] = useState(() => new Set())
  const prefix = account ? `${account.homeAccountId}:planner:` : null

  const undo = useCallback(
    async (task, etag) => {
      const res = await setPlannerPercent(
        instance,
        account,
        { id: task.id, etag },
        task.percent ?? 0,
      )
      if (res.status !== STATUS.ready) return notify.error(t("widgets.planner.undoFailed"))
      setGone(withoutId(task.id))
      if (prefix) updateWidget(prefix, restorePlannerTask({ ...task, etag: res.etag }))
    },
    [instance, account, prefix, t],
  )

  const complete = useCallback(
    async (task) => {
      setChecked(withId(task.id))
      const [res] = await Promise.all([
        setPlannerPercent(instance, account, task, 100),
        wait(SETTLE_MS),
      ])
      setChecked(withoutId(task.id))
      if (res.status !== STATUS.ready && res.status !== "gone")
        return notify.error(t("widgets.planner.doneFailed"))
      setGone(withId(task.id))
      if (prefix) updateWidget(prefix, dropPlannerTask(task.id))
      // Silinmiş işte geri alınacak bir şey yok.
      if (res.status === "gone") return
      notify.success(t("widgets.planner.done", { title: task.title }), {
        duration: UNDO_MS,
        action: { label: t("widgets.undo"), onClick: () => undo(task, res.etag) },
      })
    },
    [instance, account, prefix, t, undo],
  )

  return { checked, gone, complete }
}
