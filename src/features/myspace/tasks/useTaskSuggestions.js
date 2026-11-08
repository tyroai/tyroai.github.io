import { useCallback, useMemo, useState } from "react"
import { localDayKey } from "@/lib/todo"
import { suggestTasks } from "@/features/myspace/lib/todoSuggest"

/**
 * Önerilenler ve "Bugüne al" (`features/myspace/lib/todoSuggest`). Alınan iş tepsiden hemen kalkar
 * ve bugünün listesine İYİMSER girer (`focus.adopt`) — tarih To Do'ya yazılırken beklenmez. Yazılamazsa
 * iş listeden çekilir ve tepsiye döner; hatayı panonun `updateTask`i söyler.
 */
export function useTaskSuggestions(board, count, focus) {
  const [moved, setMoved] = useState(() => new Set())
  const today = localDayKey()
  const ready = Boolean(board) && board.status === "ready" && count > 0
  const tasks = board?.tasks
  const picks = useMemo(
    () => (ready ? suggestTasks(tasks, today, moved).slice(0, count) : []),
    [ready, tasks, today, moved, count],
  )

  const take = useCallback(
    (task) => {
      setMoved((s) => new Set(s).add(task.id))
      focus.adopt?.(task)
      board.updateTask(task.id, { dueKey: today }).then((ok) => {
        if (ok) return
        focus.release?.(task.id)
        setMoved((s) => {
          const next = new Set(s)
          next.delete(task.id)
          return next
        })
      })
    },
    [board, focus, today],
  )

  return { picks, take, today }
}
