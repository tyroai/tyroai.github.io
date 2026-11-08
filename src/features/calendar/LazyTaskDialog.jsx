import { lazy, Suspense, useState } from "react"
import { loadTask } from "./taskLoader"

const TaskDialog = lazy(() => loadTask().then((m) => ({ default: m.TaskDialog })))

/**
 * Yeni görev penceresi ayrı parçada (form, adımlar, tarih menüsü): takvim onsuz açılır. İlk
 * açılıştan sonra hep çizilir (kapanış animasyonu). `target`: `{ day, seq, initial? }` ya da null,
 * `board`: To-Do panosu (`useTodoBoard`).
 */
export function LazyTaskDialog({ target, board, onClose }) {
  const [used, setUsed] = useState(Boolean(target))
  if (target && !used) setUsed(true)
  if (!used) return null
  return (
    <Suspense fallback={null}>
      <TaskDialog target={target} board={board} onClose={onClose} />
    </Suspense>
  )
}
