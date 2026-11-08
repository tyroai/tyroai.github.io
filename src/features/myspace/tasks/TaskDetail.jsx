import { HugeiconsIcon } from "@hugeicons/react"
import ArrowTurnBackwardIcon from "@hugeicons/core-free-icons/ArrowTurnBackwardIcon"
import CalendarRemove02Icon from "@hugeicons/core-free-icons/CalendarRemove02Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { useLocale } from "@/hooks/useLocale"
import { TaskPreviewCard } from "@/features/myspace/preview/TaskPreviewCard"

/**
 * Görevin ayrıntısı — masaüstünde satırın balonu, telefonda alttan çekmece: To Do'daki tam hâli
 * (`TaskPreviewCard`: teslim, önem, hatırlatma, not, adımlar), Tamamla / Yeniden aç, Bugünden çıkar
 * ve "To-Do'da aç". Panonun bildiği alanlar (`meta`: önem, not) beklemeden görünür; tam hâl gelince
 * tamamlanır. Eylemden sonra pencere kapanır: sonuç listede görünür.
 */
export function TaskDetail({ task, meta, todo, canOpenTodo, onToggle, onRemove, onClose }) {
  const { t } = useLocale()
  const real = todo && !String(task.id).startsWith("tmp-")
  const openTo = real && canOpenTodo ? `/todo?${new URLSearchParams({ task: task.id })}` : null
  // Kartın durumu (bitti mi, teslim) panonun eski kopyasından önce gelir.
  const item = { ...meta, ...task, listId: real ? task.listId : undefined }
  const act = (fn) => () => {
    onClose()
    fn()
  }
  return (
    <TaskPreviewCard
      task={item}
      openTo={openTo}
      actions={
        <>
          <ActionButton size="inline" onClick={act(() => onToggle(task))}>
            <HugeiconsIcon
              icon={task.done ? ArrowTurnBackwardIcon : Tick02Icon}
              strokeWidth={2}
              aria-hidden="true"
            />
            {t(task.done ? "myspace.tasks.reopen" : "myspace.tasks.complete")}
          </ActionButton>
          <ActionButton size="inline" onClick={act(() => onRemove(task.id))}>
            <HugeiconsIcon
              icon={todo ? CalendarRemove02Icon : Delete02Icon}
              strokeWidth={2}
              aria-hidden="true"
            />
            {t(todo ? "myspace.tasks.unplan" : "myspace.tasks.remove")}
          </ActionButton>
        </>
      }
    />
  )
}
